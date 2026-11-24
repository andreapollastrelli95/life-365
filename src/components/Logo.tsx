/** Marchio LIFE 365: scritta arcobaleno dentro una freccia circolare. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="l365-arc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e5484d" />
          <stop offset="0.2" stopColor="#f5a524" />
          <stop offset="0.4" stopColor="#f2d024" />
          <stop offset="0.6" stopColor="#30a46c" />
          <stop offset="0.8" stopColor="#2f6fed" />
          <stop offset="1" stopColor="#8e4ec6" />
        </linearGradient>
      </defs>
      <path d="M53 22 A24 24 0 1 0 55 36" fill="none" stroke="url(#l365-arc)" strokeWidth="5" strokeLinecap="round" />
      <path d="M46 19 L55 21 L55 11 Z" fill="#8e4ec6" />
      <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="800" fill="url(#l365-arc)" fontFamily="Segoe UI, system-ui, sans-serif">365</text>
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={36} />
      <span className={`text-2xl font-extrabold tracking-tight ${light ? "text-white" : "text-night-900"}`}>
        LIFE <span className="bg-gradient-to-r from-[#e5484d] via-[#30a46c] to-[#8e4ec6] bg-clip-text text-transparent">365</span>
      </span>
    </span>
  );
}
