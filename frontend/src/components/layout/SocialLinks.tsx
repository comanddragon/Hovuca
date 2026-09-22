import type { SVGProps } from "react";

export type Platform = "facebook" | "instagram" | "youtube" | "x";

export const socialLinks: { label: string; href: string; platform: Platform }[] = [
    { label: "Facebook", href: "https://www.facebook.com/hovu.ca", platform: "facebook" },
    { label: "Instagram", href: "https://www.instagram.com/hope_for_vulnerable_children/", platform: "instagram" },
    { label: "YouTube", href: "https://www.youtube.com/@hopeforvulnerablechildren3401", platform: "youtube" },
    { label: "X", href: "https://x.com/hovuca1", platform: "x" },
];

export function BrandIcon({ platform, ...props }: SVGProps<SVGSVGElement> & { platform: Platform }) {
    const paths: Record<Platform, string> = {
        facebook: "M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.099 4.388 23.094 10.125 24v-8.438H7.078v-3.489h3.047V9.412c0-3.025 1.792-4.697 4.532-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.49 0-1.955.931-1.955 1.886v2.267h3.328l-.532 3.489h-2.796V24C19.612 23.094 24 18.099 24 12.073Z",
        instagram: "M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.25-3.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z",
        youtube: "M23.5 6.2a3 3 0 0 0-2.11-2.12C19.52 3.58 12 3.58 12 3.58s-7.52 0-9.39.5A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.11 2.12c1.87.5 9.39.5 9.39.5s7.52 0 9.39-.5a3 3 0 0 0 2.11-2.12A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.55 15.59V8.41L15.83 12l-6.28 3.59Z",
        x: "M18.9 2H22l-6.78 7.75L23.2 22h-6.25l-4.9-7.43L5.55 22H2.4l7.25-8.29L1.8 2h6.41l4.43 6.77L18.9 2Zm-1.1 18h1.73L7.27 3.9H5.41L17.8 20Z",
    };

    return <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" aria-hidden="true" {...props}><path d={paths[platform]} /></svg>;
}

export function SocialLinks({ tone = "light" }: { tone?: "light" | "dark" }) {
    const colors = tone === "light"
        ? "border-primary-foreground/30 text-primary-foreground hover:border-primary-foreground hover:bg-primary-foreground/10 focus-visible:outline-primary-foreground"
        : "border-primary/25 text-primary hover:border-primary hover:bg-primary/5 focus-visible:outline-primary";

    return <ul className="flex flex-wrap gap-2">{socialLinks.map(({ label, href, platform }) => (
        <li key={label}><a href={href} target="_blank" rel="noopener noreferrer" aria-label={`HOVUCA on ${label} (opens in a new tab)`} className={`group inline-flex size-11 items-center justify-center rounded-full border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${colors}`}><BrandIcon platform={platform} className="size-[19px] transition-transform duration-200 motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:scale-110" /></a></li>
    ))}</ul>;
}
