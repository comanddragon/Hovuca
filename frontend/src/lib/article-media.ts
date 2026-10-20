export function resolveArticleMedia(content: string) {
    const mediaBase = (process.env.NEXT_PUBLIC_MEDIA_URL || "https://media.hovuca.org").replace(/\/$/, "");
    const resolved = mediaBase
        ? content
            // Current Django media paths.
            .replace(
                /\b(src|href)=(['"])\/media\//gi,
                (_match, attribute: string, quote: string) => `${attribute}=${quote}${mediaBase}/`,
            )
            // Paths retained by articles imported from the former WordPress site.
            .replace(
                /\b(src|href)=(['"])\/?hovuca\.org\/wp-content\//gi,
                (_match, attribute: string, quote: string) => `${attribute}=${quote}${mediaBase}/hovuca.org/wp-content/`,
            )
            // URLs generated while the private R2 S3 endpoint was mistakenly used
            // as a public media host. The bucket segment is not part of custom-domain URLs.
            .replace(
                /\b(src|href)=(['"])https:\/\/[a-f0-9]+\.r2\.cloudflarestorage\.com\/media\//gi,
                (_match, attribute: string, quote: string) => `${attribute}=${quote}${mediaBase}/`,
            )
        : content;

    // Archived WordPress articles often wrapped images in links to the original
    // attachment. Published inline images should display as content, not links.
    return resolved.replace(/<a\b[^>]*>\s*(<img\b[^>]*>)\s*<\/a>/gi, "$1");
}

function escapeAttribute(value: string) {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function videoMarkup(url: string) {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return null;
    }
    if (!/^https?:$/.test(parsed.protocol)) return null;

    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    let embedUrl: string | null = null;
    if (host === "youtu.be") {
        embedUrl = `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    } else if (host.endsWith("youtube.com")) {
        const id = parsed.searchParams.get("v") || parsed.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];
        if (id) embedUrl = `https://www.youtube.com/embed/${id}`;
    } else if (host === "vimeo.com" || host.endsWith("vimeo.com")) {
        const id = parsed.pathname.match(/\/(\d+)(?:$|\/)/)?.[1];
        if (id) embedUrl = `https://player.vimeo.com/video/${id}`;
    }

    if (embedUrl) {
        return `<div class="article-video"><iframe src="${escapeAttribute(embedUrl)}" title="Embedded video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
    }
    if (/\.(?:mp4|m4v|mov|webm|ogv)(?:$|[?#])/i.test(parsed.pathname + parsed.search)) {
        const safeUrl = escapeAttribute(parsed.toString());
        return `<div class="article-video"><video controls preload="metadata"><source src="${safeUrl}">Your browser does not support video playback.</video></div>`;
    }
    return null;
}

function renderEmbeddedVideo(html: string) {
    const oembedPattern = /<oembed\b[^>]*\burl=(['"])(.*?)\1[^>]*>\s*<\/oembed>/gi;
    const withEmbeds = html.replace(oembedPattern, (_match, _quote: string, url: string) => videoMarkup(url) ?? _match);
    return withEmbeds.replace(
        /<p>\s*<a\b[^>]*\bhref=(['"])(.*?)\1[^>]*>.*?<\/a>\s*<\/p>/gi,
        (match, _quote: string, url: string) => videoMarkup(url) ?? match,
    );
}

export function renderArticleMedia(content: string) {
    return renderEmbeddedVideo(resolveArticleMedia(content));
}

export function unresolveArticleMedia(html: string) {
    const mediaBase = (process.env.NEXT_PUBLIC_MEDIA_URL || "https://media.hovuca.org").replace(/\/$/, "");
    return html.replaceAll(mediaBase + "/", "/media/");
}
