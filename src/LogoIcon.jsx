// Tilbudskokken mark — a brick-red price tag with a fork, per the
// Tilbudskokken style guide. Inline SVG (no raster asset) so it stays
// crisp at every size and adds nothing meaningful to the bundle.
export default function LogoIcon({ size = 40, className = "", holeColor = "#1B1613" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="36 21 38 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`logo-icon${className ? ` ${className}` : ""}`}
      role="img"
      aria-label="Tilbudskokken"
      style={{ display: "block" }}
    >
      {/* Price-tag / folded-ribbon body */}
      <path
        d="M40 26 H58 L70 38 a3 3 0 0 1 0 4 L58 54 a3 3 0 0 1 -4 0 L42 42 a3 3 0 0 1 -1 -2 V27 a1 1 0 0 1 1 -1 Z"
        fill="#C1442E"
      />
      {/* Tag hole */}
      <circle cx="46" cy="32" r="2.4" fill={holeColor} />
      {/* Fork */}
      <g stroke="#EEE6D8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="55" y1="35" x2="55" y2="47" />
        <line x1="52" y1="35" x2="52" y2="40" />
        <line x1="58" y1="35" x2="58" y2="40" />
        <path d="M52 40 H58" />
      </g>
    </svg>
  );
}
