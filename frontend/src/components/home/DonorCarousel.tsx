"use client";

import Image from "next/image";
import { motion } from "framer-motion";
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
        <motion.div
            aria-hidden={duplicate || undefined}
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex-shrink-0 w-[180px] flex flex-col items-center mx-6 select-none"
        >
            <Wrapper
                {...wrapperProps}
                className={`flex flex-col items-center gap-3 group ${donor.website ? "cursor-pointer" : "cursor-default"}`}
            >
                {/* Logo / initials */}
                <div className="relative h-14 w-[140px] flex items-center justify-center">
                    {donor.logo ? (
                        <Image
                            src={donor.logo}
                            alt={donor.name}
                            fill
                            sizes="140px"
                            className="object-contain opacity-60 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                        />
                    ) : (
                        <span className="flex items-center justify-center h-14 w-[140px] rounded-lg text-sm font-light tracking-widest text-muted-foreground opacity-60 transition duration-300 group-hover:opacity-100 border border-border">
              {abbr}
            </span>
                    )}
                </div>

                {/* Name */}
                <span className="text-xs font-light tracking-wide text-muted-foreground whitespace-nowrap opacity-60 transition duration-300 group-hover:opacity-100">
          {donor.name}
        </span>
            </Wrapper>
        </motion.div>
    );
}

interface DonorCarouselProps {
    label?:    string;
    heading?:  string;
    duration?: string;
}

export default function DonorCarousel({
                                          duration = "32s",
                                      }: DonorCarouselProps) {
    const { data: donors, isLoading, isError, refetch } = useActiveDonors();

    if (isLoading) {
        return (
            <section className="flex h-[120px] items-center overflow-hidden bg-transparent">
                <div className="flex">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonPill key={i} />
                    ))}
                </div>
            </section>
        );
    }

    if (isError) {
        return (
            <div className="flex h-[120px] items-center justify-center gap-4 px-6 text-center text-sm text-[#53645f]" role="alert">
                <span>Partners could not be loaded.</span>
                <button type="button" onClick={() => void refetch()} className="min-h-11 rounded-full border border-[#183b35] px-5 font-semibold text-[#183b35]">
                    Try again
                </button>
            </div>
        );
    }

    if (!donors?.length) {
        return <p className="flex h-[120px] items-center justify-center px-6 text-sm text-[#53645f]">Partner information will be added soon.</p>;
    }

    return (
            <section className="py-4 bg-transparent overflow-hidden" style={{ height: "120px" }}>

            {/* ── Header ─────────────────────────────────────────── */}
            {/*<div className="max-w-7xl mx-auto px-8">*/}
            {/*    <motion.div*/}
            {/*        initial={{ opacity: 0, y: 20 }}*/}
            {/*        whileInView={{ opacity: 1, y: 0 }}*/}
            {/*        viewport={{ once: false }}*/}
            {/*        transition={{ duration: 0.5 }}*/}
            {/*        className="text-center mb-16"*/}
            {/*    >*/}
            {/*        <p className="mb-4 text-muted-foreground text-sm font-light tracking-widest uppercase">*/}
            {/*            {label}*/}
            {/*        </p>*/}
            {/*        <h2 className="text-4xl md:text-5xl font-light text-foreground tracking-tight">*/}
            {/*            {heading}*/}
            {/*        </h2>*/}
            {/*    </motion.div>*/}
            {/*</div>*/}

            {/* ── Scrolling strip ─────────────────────────────────── */}
            <div className="relative">
                <div
                    className="pointer-events-none absolute left-0 top-0 bottom-0 w-32 z-10"
                    style={{
                        background:
                            "linear-gradient(to right, #f7f5f0, transparent)",
                    }}
                />
                <div
                    className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 z-10"
                    style={{
                        background:
                            "linear-gradient(to left, #f7f5f0, transparent)",
                    }}
                />

                {/* marquee-track + hover-pause defined in globals.css */}
                <div
                    className="marquee-track"
                    style={{ animationDuration: duration }}
                >
                    {donors.map((donor) => (
                        <DonorPill key={donor.id} donor={donor} />
                    ))}
                    {donors.map((donor) => (
                        <DonorPill key={`${donor.id}-duplicate`} donor={donor} duplicate />
                    ))}
                </div>
            </div>
        </section>
    );
}
