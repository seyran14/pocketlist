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
        </defs>
        <rect width="100%" height="100%" fill="url(#sq-grid)" className="text-foreground/[0.08]" />
      </svg>
    </div>
  )
}
