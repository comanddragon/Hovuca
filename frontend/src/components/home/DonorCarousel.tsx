"use client";

import Image from "next/image";
import { useActiveDonors } from "@/hooks";
import type { DonorOrganization } from "@/types";

function SkeletonPill() {
    return (
        <div className="flex items-center gap-3 px-5 py-3 mx-3 rounded-full border border-border bg-card flex-shrink-0 animate-pulse">
            <div className="h-7 w-7 rounded-full bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-1.5 w-1.5 rounded-full bg-muted" />
        </div>
    );
}

function DonorPill({ donor, duplicate = false }: { donor: DonorOrganization; duplicate?: boolean }) {
    const abbr =
        donor.abbreviation?.trim() ||
        donor.name
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? "")
            .join("");

    const Wrapper = donor.website ? "a" : "div";
    const wrapperProps = donor.website
        ? { href: donor.website, target: "_blank", rel: "noopener noreferrer", tabIndex: duplicate ? -1 : undefined }
        : {};

    return (
        <div
            aria-hidden={duplicate || undefined}
            className="mx-6 flex w-[180px] flex-shrink-0 select-none flex-col items-center motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-[3px]"
        >
            <Wrapper
                {...wrapperProps}
                className={`group flex flex-col items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-gold)] ${donor.website ? "cursor-pointer" : "cursor-default"}`}
            >
                <div className="relative flex h-14 w-[140px] items-center justify-center">
                    {donor.logo ? (
                        <Image
                            src={donor.logo}
                            alt=""
                            fill
                            sizes="140px"
                            className="object-contain opacity-70 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                        />
                    ) : (
                        <span className="flex h-14 w-[140px] items-center justify-center rounded-lg border border-[var(--brand-forest)]/20 text-sm font-normal tracking-widest text-[var(--brand-body-muted)] transition-colors duration-200 group-hover:border-[var(--brand-forest)]/45 group-hover:text-[var(--brand-forest)]">
                            {abbr}
                        </span>
                    )}
                </div>

                <span className="whitespace-nowrap text-xs font-normal tracking-wide text-[var(--brand-body-muted)] transition-colors duration-200 group-hover:text-[var(--brand-forest)]">
                    {donor.name}
                </span>
            </Wrapper>
        </div>
    );
}

interface DonorCarouselProps {
    duration?: string;
}

export default function DonorCarousel({ duration = "32s" }: DonorCarouselProps) {
    const { data: donors, isLoading, isError, refetch } = useActiveDonors();

    if (isLoading) {
        return (
            <div className="flex h-[120px] items-center overflow-hidden bg-transparent">
                <div className="flex">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonPill key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex h-[120px] items-center justify-center gap-4 px-6 text-center text-sm text-[var(--brand-body-muted)]" role="alert">
                <span>Partners could not be loaded.</span>
                <button type="button" onClick={() => void refetch()} className="min-h-11 rounded-full border border-[var(--brand-forest)] px-5 font-semibold text-[var(--brand-forest)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-gold)]">
                    Try again
                </button>
            </div>
        );
    }

    if (!donors?.length) {
        return <p className="flex h-[120px] items-center justify-center px-6 text-sm text-[var(--brand-body-muted)]">Partner information will be added soon.</p>;
    }

    return (
        <div className="overflow-hidden bg-transparent py-4" style={{ height: "120px" }}>
            <div className="relative">
                <div
                    className="pointer-events-none absolute left-0 top-0 bottom-0 w-32 z-10"
                    style={{
                        background:
                            "linear-gradient(to right, var(--brand-white), transparent)",
                    }}
                />
                <div
                    className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 z-10"
                    style={{
                        background:
                            "linear-gradient(to left, var(--brand-white), transparent)",
                    }}
                />

                {/* marquee-track + hover-pause defined in globals.css */}
                <div className="marquee-track" style={{ animationDuration: duration }}>
                    {donors.map((donor) => (
                        <DonorPill key={donor.id} donor={donor} />
                    ))}
                    {donors.map((donor) => (
                        <DonorPill key={`${donor.id}-duplicate`} donor={donor} duplicate />
                    ))}
                </div>
            </div>
        </div>
    );
}
