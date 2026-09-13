import type { NextRequest } from "next/server";

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params;
    const apiBase = (process.env.API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");
    const upstream = new URL(`${apiBase}/${path.map(encodeURIComponent).join("/")}/`);
    upstream.search = request.nextUrl.search;

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("content-length");

    const response = await fetch(upstream, {
        method: request.method,
        headers,
        body: METHODS_WITHOUT_BODY.has(request.method) ? undefined : request.body,
        redirect: "manual",
    });
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
    });
}

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
