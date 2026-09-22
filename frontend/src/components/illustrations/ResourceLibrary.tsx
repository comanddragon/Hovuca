import type { SVGProps } from "react";

export function ResourceLibrary(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 320 220" fill="none" aria-hidden="true" {...props}>
      <rect x="32" y="72" width="130" height="112" rx="8" stroke="currentColor" strokeWidth="3" />
      <path d="M58 104h77M58 126h77M58 148h48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <rect x="119" y="38" width="137" height="119" rx="8" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="3" />
      <path d="M148 74h79M148 98h79M148 122h52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="m249 30 6 14 14 6-14 6-6 14-6-14-14-6 14-6 6-14Z" fill="currentColor" />
      <circle cx="274" cy="164" r="13" fill="currentColor" fillOpacity="0.2" />
      <circle cx="43" cy="42" r="7" fill="currentColor" />
    </svg>
  );
}
