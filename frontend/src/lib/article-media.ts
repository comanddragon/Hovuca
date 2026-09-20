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

export function unresolveArticleMedia(html: string) {
    const mediaBase = (process.env.NEXT_PUBLIC_MEDIA_URL || "https://media.hovuca.org").replace(/\/$/, "");
    return html.replaceAll(mediaBase + "/", "/media/");
}