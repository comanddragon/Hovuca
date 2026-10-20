type WorldMapProps = { className?: string; showCameroon?: boolean };

export function WorldMap({ showCameroon = true, ...props }: WorldMapProps) {
  return (
    <div className={`relative ${props.className ?? ""}`} aria-hidden="true">
      <img src="/illustrations/world-map-robinson.svg" alt="" className="h-full w-full object-contain" />
      {showCameroon && (
        <div className="absolute left-[51.8%] top-[29.4%] flex items-center gap-2 text-white">
          <span className="size-3 rounded-full bg-brand-white ring-8 ring-brand-white/20" />
          <span className="text-[10px] font-bold tracking-[0.16em]">CAMEROON</span>
        </div>
      )}
    </div>
  );
}
