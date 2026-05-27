export function HousePattern() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none text-foreground"
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
              strokeOpacity="0.13"
              strokeWidth="0.6"
            />
          </pattern>

          {/* In SVG masks: white = visible, black = hidden */}
          <radialGradient id="fade-mask-grad" cx="50%" cy="50%" r="60%">
            <stop offset="0%"   stopColor="black" stopOpacity="1" />
            <stop offset="40%"  stopColor="black" stopOpacity="0.6" />
            <stop offset="75%"  stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </radialGradient>

          <mask id="grid-mask">
            <rect width="100%" height="100%" fill="url(#fade-mask-grad)" />
          </mask>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="url(#sq-grid)"
          mask="url(#grid-mask)"
        />
      </svg>
    </div>
  )
}
