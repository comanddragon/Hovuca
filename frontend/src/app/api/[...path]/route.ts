import { NextRequest, NextResponse } from "next/server";

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const ACCESS_COOKIE = "hovuca_access";
const REFRESH_COOKIE = "hovuca_refresh";
const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

type JsonObject = Record<string, unknown>;

function isCrossSite(request: NextRequest): boolean {
    if (SAFE_METHODS.has(request.method)) return false;
    if (request.headers.get("sec-fetch-site") === "cross-site") return true;
    const origin = request.headers.get("origin");
    return Boolean(origin && origin !== request.nextUrl.origin);
}

function setAuthCookie(response: NextResponse, name: string, value: string, maxAge: number) {
    response.cookies.set({
        name, value, httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", path: "/", maxAge, priority: "high",
    });
}

function clearAuthCookies(response: NextResponse) {
    response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
}

function clearLegacyJavaScriptCookies(response: NextResponse) {
    response.cookies.set("access_token", "", { path: "/", maxAge: 0 });
    response.cookies.set("refresh_token", "", { path: "/", maxAge: 0 });
}

async function readJson(response: Response): Promise<JsonObject | null> {
    try { return await response.json() as JsonObject; } catch { return null; }
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    if (isCrossSite(request)) {
        return NextResponse.json({ detail: "Cross-site request blocked." }, { status: 403 });
    }

    const { path } = await context.params;
    const route = path.join("/");
    const apiBase = (process.env.API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");
    const upstream = new URL(`${apiBase}/${path.map(encodeURIComponent).join("/")}/`);
    upstream.search = request.nextUrl.search;

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("content-length");
    headers.delete("cookie");
    headers.delete("authorization");
    headers.delete("forwarded");
    headers.delete("x-forwarded-for");
    headers.delete("x-real-ip");
    const cloudflareClientIp = request.headers.get("cf-connecting-ip");
    if (cloudflareClientIp) headers.set("x-forwarded-for", cloudflareClientIp);
    const access = request.cookies.get(ACCESS_COOKIE)?.value;
    if (access) headers.set("authorization", `Bearer ${access}`);

    let body: BodyInit | undefined;
    if (!METHODS_WITHOUT_BODY.has(request.method)) {
        if (route === "auth/token/refresh" || route === "auth/logout") {
            const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
            body = JSON.stringify({ refresh: refresh ?? "" });
            headers.set("content-type", "application/json");
        } else {
            body = await request.arrayBuffer();
        }
    }

    const upstreamResponse = await fetch(upstream, {
        method: request.method, headers, body, redirect: "manual", cache: "no-store",
    });

    const authResponse = route === "auth/login" || route === "auth/register" || route === "auth/token/refresh";
    if (authResponse && upstreamResponse.ok) {
        const data = await readJson(upstreamResponse);
        if (!data) return NextResponse.json({ detail: "Invalid authentication response." }, { status: 502 });

        const tokens = route === "auth/register" ? data.tokens as JsonObject | undefined : data;
        const newAccess = tokens?.access;
        const newRefresh = tokens?.refresh;
        if (typeof newAccess !== "string") {
            return NextResponse.json({ detail: "Invalid authentication response." }, { status: 502 });
        }

        const clientData = { ...data };
        delete clientData.access;
        delete clientData.refresh;
        delete clientData.tokens;
        const response = NextResponse.json(clientData, { status: upstreamResponse.status });
        setAuthCookie(response, ACCESS_COOKIE, newAccess, ACCESS_MAX_AGE);
        if (typeof newRefresh === "string") {
            setAuthCookie(response, REFRESH_COOKIE, newRefresh, REFRESH_MAX_AGE);
        }
        clearLegacyJavaScriptCookies(response);
        response.headers.set("cache-control", "no-store");
        return response;
    }

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");
    responseHeaders.delete("set-cookie");
    const response = new NextResponse(upstreamResponse.body, {
        status: upstreamResponse.status, statusText: upstreamResponse.statusText, headers: responseHeaders,
    });
    if (route === "auth/logout") clearAuthCookies(response);
    clearLegacyJavaScriptCookies(response);
    if (route.startsWith("auth/")) response.headers.set("cache-control", "no-store");
    return response;
}

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
