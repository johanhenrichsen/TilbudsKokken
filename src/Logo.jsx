const MARK_PX  = { sm: 24, md: 36, lg: 56, xl: 88 };
const FONT_PX  = { sm: 13, md: 17, lg: 26, xl: 38 };
const GAP_PX   = { sm:  7, md:  9, lg: 14, xl: 20 };

export function LogoMark({ size = 40, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`logo-mark${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      {/* Plate / circular price-tag — outer rim */}
      <circle cx="30" cy="30" r="25"
        fill="var(--logo-bg, #f0ead6)"
        stroke="var(--logo-main, #1a2e1a)"
        strokeWidth="2.5"
      />
      {/* Inner plate rim (subtle depth line) */}
      <circle cx="30" cy="30" r="20.5"
        fill="none"
        stroke="var(--logo-main, #1a2e1a)"
        strokeWidth="0.8"
        opacity="0.18"
      />
      {/* Price-tag hanging hole at top of circle */}
      <circle cx="30" cy="5" r="2.2"
        fill="var(--logo-bg, #f0ead6)"
        stroke="var(--logo-main, #1a2e1a)"
        strokeWidth="1.8"
      />

      {/* Leek resting diagonally across the plate — 2 strokes */}
      {/* Main body */}
      <path d="M13 47 Q30 36 49 25"
        stroke="var(--logo-accent, #7a9e7e)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Parallel leaf (thinner, fans slightly upward) */}
      <path d="M13 47 Q31 33 50 19"
        stroke="var(--logo-accent, #7a9e7e)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.65"
      />

      {/* Small price-tag label inside the plate */}
      <g transform="rotate(-8, 30, 35)">
        <rect x="25.5" y="29" width="9" height="12" rx="2.5"
          fill="none"
          stroke="var(--logo-main, #1a2e1a)"
          strokeWidth="1.5"
        />
        {/* Tag hanging hole */}
        <circle cx="30" cy="29" r="1.3"
          fill="var(--logo-bg, #f0ead6)"
          stroke="var(--logo-main, #1a2e1a)"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}

export default function Logo({ variant = "horizontal", size = "md", className = "" }) {
  const markPx = MARK_PX[size] || MARK_PX.md;
  const fs     = FONT_PX[size] || FONT_PX.md;
  const gap    = GAP_PX[size]  || GAP_PX.md;

  if (variant === "icon") {
    return <LogoMark size={markPx} className={className} />;
  }

  if (variant === "vertical") {
    return (
      <div className={`logo logo-vertical${className ? ` ${className}` : ""}`} style={{ gap }}>
        <LogoMark size={markPx} />
        <span className="logo-wordmark" style={{ fontSize: fs }}>Tilbudskokken</span>
      </div>
    );
  }

  return (
    <div className={`logo logo-horizontal${className ? ` ${className}` : ""}`} style={{ gap }}>
      <LogoMark size={markPx} />
      <span className="logo-wordmark" style={{ fontSize: fs }}>Tilbudskokken</span>
    </div>
  );
}
