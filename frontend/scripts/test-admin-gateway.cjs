/* Exercise the real gateway handlers without an external backend or tokens. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { NextRequest } = require("next/server");

const source = fs.readFileSync(path.join(__dirname, "../src/app/api/[...path]/route.ts"), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const handlers = {};
new Function("require", "exports", compiled.outputText)(require, handlers);

async function run() {
    const originalFetch = global.fetch;
    const originalEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    let calls = 0;
    const request = (route, headers = {}, method = "POST") => new NextRequest(`https://hovuca.org/api/${route}/`, { method, headers: { "content-type": "application/json", ...headers }, ...(method !== "GET" ? { body: "{}" } : {}) });
    const context = route => ({ params: Promise.resolve({ path: route.split("/") }) });
    try {
        global.fetch = async () => { calls++; return Response.json({ access: "test-only-access", refresh: "test-only-refresh", user: { id: "test-user" } }); };
        const login = await handlers.POST(request("auth/login", { origin: "https://hovuca.org" }), context("auth/login"));
        const body = await login.json();
        assert.equal(body.access, undefined);
        assert.equal(body.refresh, undefined);
        assert.equal(login.cookies.get("hovuca_access").value, "test-only-access");
        assert.equal(login.cookies.get("hovuca_refresh").value, "test-only-refresh");
        const cookies = login.headers.get("set-cookie");
        assert.match(cookies, /HttpOnly/);
        assert.match(cookies, /Secure/);
        assert.match(cookies, /SameSite=lax/i);
        assert.equal(login.headers.get("cache-control"), "no-store");

        const beforeBlocked = calls;
        const blocked = await handlers.POST(request("admin/programs", { origin: "https://untrusted.example", "sec-fetch-site": "cross-site" }), context("admin/programs"));
        assert.equal(blocked.status, 403);
        assert.equal(calls, beforeBlocked);

        global.fetch = async (_url, config) => {
            assert.equal(config.headers.get("authorization"), "Bearer test-only-access");
            assert.equal(config.headers.get("cookie"), null);
            assert.equal(config.headers.get("x-forwarded-for"), null);
            return Response.json({ results: [] }, { headers: { "set-cookie": "upstream-secret=do-not-forward", "cache-control": "no-store" } });
        };
        const records = await handlers.GET(request("admin/programs", { cookie: "hovuca_access=test-only-access", authorization: "Bearer browser-controlled-value", "x-forwarded-for": "203.0.113.10" }, "GET"), context("admin/programs"));
        assert.equal(records.status, 200);
        assert.equal(records.headers.get("set-cookie").includes("upstream-secret"), false);

        global.fetch = async (_url, config) => {
            assert.deepEqual(JSON.parse(config.body), { refresh: "test-only-refresh" });
            return Response.json({ access: "test-only-refreshed" });
        };
        const refresh = await handlers.POST(request("auth/token/refresh", { cookie: "hovuca_refresh=test-only-refresh" }), context("auth/token/refresh"));
        assert.equal(refresh.cookies.get("hovuca_access").value, "test-only-refreshed");
        assert.deepEqual(await refresh.json(), {});

        global.fetch = async () => Response.json({ detail: "Expired token" }, { status: 400 });
        const logout = await handlers.POST(request("auth/logout"), context("auth/logout"));
        assert.equal(logout.cookies.get("hovuca_access").value, "");
        assert.equal(logout.cookies.get("hovuca_refresh").value, "");
        console.log("5 authentication gateway checks passed.");
    } finally {
        global.fetch = originalFetch;
        if (originalEnvironment === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = originalEnvironment;
    }
}

run().catch(error => { console.error(error.message); process.exitCode = 1; });
