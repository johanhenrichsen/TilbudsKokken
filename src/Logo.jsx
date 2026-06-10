const SIZE_MAP = {
  sm:  { mark: 24, wordmark: 13, gap: 6 },
  md:  { mark: 32, wordmark: 16, gap: 8 },
  lg:  { mark: 48, wordmark: 22, gap: 12 },
  xl:  { mark: 72, wordmark: 30, gap: 16 },
};

export function LogoMark({ size = 40, className = "" }) {
  const w = size;
  const h = size * 1.2;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 40 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`logo-mark${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      {/* Chef hat dome */}
      <path
        d="M4 33 C3 26 2 18 5 12 C8 6 13 6 20 6 C27 6 32 6 35 12 C38 18 37 26 36 33 Z"
        fill="var(--logo-hat, #1a2e1a)"
      />
      {/* Hat band */}
      <rect
        x="8" y="33" width="24" height="11" rx="5"
        fill="var(--logo-hat, #1a2e1a)"
      />
      {/* Fold crease */}
      <path
        d="M8 33 Q20 36.5 32 33"
        stroke="var(--logo-fold, rgba(255,255,255,0.12))"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Leaf sprouting from top-right */}
      <path
        d="M26 6 C30 0 39 4 34 15 C31 21 26 17 26 17 C26 17 22 10 26 6Z"
        fill="var(--logo-leaf, #7a9e7e)"
      />
      {/* Leaf center vein */}
      <path
        d="M26 6 L24 16"
        stroke="var(--logo-leaf-vein, #4a7050)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({ variant = "horizontal", size = "md", className = "" }) {
  const s = SIZE_MAP[size] || SIZE_MAP.md;

  if (variant === "icon") {
    return <LogoMark size={s.mark} className={className} />;
  }

  if (variant === "vertical") {
    return (
      <div
        className={`logo logo-vertical${className ? ` ${className}` : ""}`}
        style={{ gap: s.gap }}
      >
        <LogoMark size={s.mark} />
        <span className="logo-wordmark" style={{ fontSize: s.wordmark }}>
          Tilbudskokken
        </span>
      </div>
    );
  }

  // horizontal (default)
  return (
    <div
      className={`logo logo-horizontal${className ? ` ${className}` : ""}`}
      style={{ gap: s.gap }}
    >
      <LogoMark size={s.mark} />
      <span className="logo-wordmark" style={{ fontSize: s.wordmark }}>
        Tilbudskokken
      </span>
    </div>
  );
}
