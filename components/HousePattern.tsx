export function HousePattern() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none text-foreground/[0.065]"
      aria-hidden="true"
    >
      <svg width="100%" height="100%">
        <defs>
          <pattern
            id="house-pattern"
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            {/* Walls */}
            <rect x="18" y="38" width="44" height="30" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
            {/* Roof */}
            <polyline points="11,38 40,13 69,38" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
            {/* Door */}
            <rect x="30" y="51" width="20" height="17" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
            {/* Window left */}
            <rect x="20" y="42" width="10" height="8" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
            {/* Window right */}
            <rect x="50" y="42" width="10" height="8" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#house-pattern)" />
      </svg>
    </div>
  )
}
