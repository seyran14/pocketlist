export function HousePattern() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="sq-grid"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </pattern>

          {/* Radial mask: opaque at edges, transparent in center */}
          <radialGradient id="fade-mask" cx="50%" cy="50%" r="55%" fx="50%" fy="50%">
            <stop offset="0%"   stopColor="black" stopOpacity="0" />
            <stop offset="45%"  stopColor="black" stopOpacity="0.3" />
            <stop offset="100%" stopColor="black" stopOpacity="1" />
          </radialGradient>

          <mask id="grid-mask">
            <rect width="100%" height="100%" fill="url(#fade-mask)" />
          </mask>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="url(#sq-grid)"
          mask="url(#grid-mask)"
          className="text-foreground/[0.12]"
        />
      </svg>
    </div>
  )
}
