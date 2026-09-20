export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900" />

      {/* Purple vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--brand-auth-glow)_0%,var(--brand-auth-glow-deep)_40%,var(--brand-black-60)_100%)]" />

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}
