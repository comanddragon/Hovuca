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

// function DonorPill({ donor }: { donor: DonorOrganization }) {
//     const abbr =
//         donor.abbreviation?.trim() ||
//         donor.name
//             .split(/\s+/)
//             .slice(0, 2)
//             .map((w) => w[0]?.toUpperCase() ?? "")
//             .join("");
//
//     return (
//         <motion.div
//             whileHover={{ y: -3 }}
//             transition={{ type: "spring", stiffness: 300, damping: 20 }}
//             className="flex-shrink-0 w-[180px] flex flex-col items-center gap-3 mx-6 cursor-default select-none group"
//         >
//             {/* Logo / initials */}
//             <div className="relative h-14 w-[140px] flex items-center justify-center">
//                 {donor.logo ? (
//                     <Image
//                         src={donor.logo}
//                         alt={donor.name}
//                         fill
//                         sizes="140px"
//                         className="object-contain opacity-60 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
//                     />
//                 ) : (
//                     <span className="flex items-center justify-center h-14 w-[140px] rounded-lg text-sm font-light tracking-widest text-muted-foreground opacity-60 transition duration-300 group-hover:opacity-100 border border-border">
//             {abbr}
//           </span>
//                 )}
//             </div>
//
//             {/* Name */}
//             <span className="text-xs font-light tracking-wide text-muted-foreground whitespace-nowrap opacity-60 transition duration-300 group-hover:opacity-100">
//         {donor.name}
//       </span>
//         </motion.div>
//     );
// }

function DonorPill({ donor }: { donor: DonorOrganization }) {
    const abbr =
        donor.abbreviation?.trim() ||
        donor.name
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? "")
            .join("");

    const Wrapper = donor.website ? "a" : "div";
    const wrapperProps = donor.website
        ? { href: donor.website, target: "_blank", rel: "noopener noreferrer" }
        : {};

    return (
        <motion.div
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
    const { data: donors, isLoading, isError } = useActiveDonors();

    if (isError) return null;

    if (isLoading || !donors?.length) {
        return (
            <section className="py-8 bg-background overflow-hidden">
                <div className="max-w-7xl mx-auto px-8 text-center mb-16">
                    <div className="h-3 w-20 rounded bg-muted mx-auto mb-4 animate-pulse" />
                    <div className="h-10 w-72 rounded bg-muted mx-auto animate-pulse" />
                </div>
                <div className="flex">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonPill key={i} />
                    ))}
                </div>
            </section>
        );
    }

    const items = [...donors, ...donors];

    return (
            <section className="py-4 bg-background overflow-hidden" style={{ height: "120px" }}>

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
                            "linear-gradient(to right, hsl(var(--background)), transparent)",
                    }}
                />
                <div
                    className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 z-10"
                    style={{
                        background:
                            "linear-gradient(to left, hsl(var(--background)), transparent)",
                    }}
                />

                {/* marquee-track + hover-pause defined in globals.css */}
                <div
                    className="marquee-track"
                    style={{ animationDuration: duration }}
                >
                    {items.map((donor, i) => (
                        <DonorPill key={`${donor.id}-${i}`} donor={donor} />
                    ))}
                </div>
            </div>
        </section>
    );
}