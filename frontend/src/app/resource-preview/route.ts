import { NextRequest, NextResponse } from "next/server";

function allowedOrigins() {
    const origins = new Set<string>();
    for (const value of [process.env.NEXT_PUBLIC_MEDIA_URL || "https://media.hovuca.org", process.env.API_URL]) {
        if (!value) continue;
        try { origins.add(new URL(value).origin); } catch { /* Ignore an invalid optional URL. */ }
    }
    return origins;
}

export async function GET(request: NextRequest) {
    const source = request.nextUrl.searchParams.get("url");
    if (!source) return NextResponse.json({ detail: "A resource URL is required." }, { status: 400 });

    let upstream: URL;
    try { upstream = new URL(source); } catch { return NextResponse.json({ detail: "Invalid resource URL." }, { status: 400 }); }
    if (!allowedOrigins().has(upstream.origin)) {
        return NextResponse.json({ detail: "Resource origin is not allowed." }, { status: 400 });
    }

    const range = request.headers.get("range");
    let response: Response;
    try {
        // Let the worker runtime use its native fetch semantics. In particular,
        // OpenNext's Cloudflare runtime does not support every Node cache mode.
        response = await fetch(upstream, {
            headers: range ? { range } : undefined,
            redirect: "follow",
        });
    } catch {
        return NextResponse.json(
            { detail: "The document preview could not be retrieved." },
            { status: 502 },
        );
    }
    const headers = new Headers();
    for (const name of ["accept-ranges", "content-length", "content-range", "content-type", "etag", "last-modified"]) {
        const value = response.headers.get(name);
        if (value) headers.set(name, value);
    }
    headers.set("cache-control", "public, max-age=86400");
    return new NextResponse(response.body, { status: response.status, headers });
}
