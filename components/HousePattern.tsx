// Tiled square-grid background with minimalist skyscraper silhouettes
export function HousePattern() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* ── Square grid (graph-paper texture) ── */}
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
              className="text-foreground/[0.07]"
            />
          </pattern>

          {/* ── Skyscraper tile (240 × 320 px, buildings from y=0 downward) ── */}
          <pattern
            id="skyline"
            width="240"
            height="320"
            patternUnits="userSpaceOnUse"
          >
            {/* —— Tower A: narrow, very tall (antenna top) —— */}
            <rect x="8"  y="20"  width="28" height="300" fill="none" stroke="currentColor" strokeWidth="0.9" className="text-foreground/[0.09]" />
            {/* floors */}
            {[40,58,76,94,112,130,148,166,184,202,220,238,256,274,292].map(y => (
              <line key={y} x1="8" y1={y} x2="36" y2={y} stroke="currentColor" strokeWidth="0.4" className="text-foreground/[0.06]" />
            ))}
            {/* antenna */}
            <line x1="22" y1="20" x2="22" y2="4" stroke="currentColor" strokeWidth="0.9" className="text-foreground/[0.09]" />

            {/* —— Tower B: wide, medium height —— */}
            <rect x="48" y="90"  width="42" height="230" fill="none" stroke="currentColor" strokeWidth="0.9" className="text-foreground/[0.09]" />
            {/* step setback */}
            <rect x="54" y="70"  width="30" height="22" fill="none" stroke="currentColor" strokeWidth="0.7" className="text-foreground/[0.07]" />
            {[108,126,144,162,180,198,216,234,252,270,288,306].map(y => (
              <line key={y} x1="48" y1={y} x2="90" y2={y} stroke="currentColor" strokeWidth="0.4" className="text-foreground/[0.06]" />
            ))}
            {/* vertical midline */}
            <line x1="69" y1="90" x2="69" y2="320" stroke="currentColor" strokeWidth="0.4" className="text-foreground/[0.05]" />

            {/* —— Tower C: slim, tallest —— */}
            <rect x="104" y="0"   width="22" height="320" fill="none" stroke="currentColor" strokeWidth="0.9" className="text-foreground/[0.09]" />
            {[20,40,60,80,100,120,140,160,180,200,220,240,260,280,300].map(y => (
              <line key={y} x1="104" y1={y} x2="126" y2={y} stroke="currentColor" strokeWidth="0.4" className="text-foreground/[0.06]" />
            ))}

            {/* —— Tower D: wide, shorter —— */}
            <rect x="140" y="120" width="50" height="200" fill="none" stroke="currentColor" strokeWidth="0.9" className="text-foreground/[0.09]" />
            {/* pyramid/tapered top */}
            <polygon points="140,120 165,96 190,120" fill="none" stroke="currentColor" strokeWidth="0.7" className="text-foreground/[0.07]" />
            {[140,158,176,194,212,230,248,266,284,302].map(y => (
              <line key={y} x1="140" y1={y} x2="190" y2={y} stroke="currentColor" strokeWidth="0.4" className="text-foreground/[0.06]" />
            ))}
            <line x1="165" y1="120" x2="165" y2="320" stroke="currentColor" strokeWidth="0.4" className="text-foreground/[0.05]" />

            {/* —— Tower E: slim on right —— */}
            <rect x="204" y="50"  width="30" height="270" fill="none" stroke="currentColor" strokeWidth="0.9" className="text-foreground/[0.09]" />
            {[70,88,106,124,142,160,178,196,214,232,250,268,286,304].map(y => (
              <line key={y} x1="204" y1={y} x2="234" y2={y} stroke="currentColor" strokeWidth="0.4" className="text-foreground/[0.06]" />
            ))}
            {/* antenna */}
            <line x1="219" y1="50" x2="219" y2="32" stroke="currentColor" strokeWidth="0.9" className="text-foreground/[0.09]" />
            <line x1="214" y1="32" x2="224" y2="32" stroke="currentColor" strokeWidth="0.9" className="text-foreground/[0.09]" />
          </pattern>
        </defs>

        {/* Layer 1: square grid */}
        <rect width="100%" height="100%" fill="url(#sq-grid)" />

        {/* Layer 2: skyscrapers */}
        <rect width="100%" height="100%" fill="url(#skyline)" />
      </svg>
    </div>
  )
}
