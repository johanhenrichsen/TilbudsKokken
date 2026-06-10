export default function LogoIcon({ size = 40, className = "" }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.08)}
      viewBox="0 0 100 108"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`logo-icon${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      {/* Chef's hat — open arc, stroke only, no fill */}
      <path
        d="M12 57 C12 48 4 38 12 30 C18 22 28 16 34 20 C38 12 44 7 50 5 C56 7 62 12 66 20 C72 16 82 22 88 30 C96 38 88 48 88 57"
        fill="none"
        stroke="var(--logo-main, #1a2e1a)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Groceries — drawn before basket so basket covers their lower portions */}

      {/* Green leafy vegetable — left */}
      <path
        d="M22 57 C20 47 16 37 20 29 C22 21 28 17 32 21 C34 15 40 13 44 19 C46 27 42 41 38 55 C40 45 44 39 46 43 C46 51 40 57 36 57 Z"
        fill="var(--logo-leaf, #3d6b2a)"
      />

      {/* Red tomato — center */}
      <circle cx="54" cy="43" r="14" fill="var(--logo-tomato, #d94a28)" />
      <path
        d="M52 29 C51 24 53 21 54 21 C55 21 57 24 56 29"
        fill="none"
        stroke="var(--logo-cap, #2d5222)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Amber bottle — right */}
      <rect x="70" y="40" width="14" height="17" rx="4" fill="var(--logo-bottle, #f0a030)" />
      <rect x="73" y="32" width="8" height="10" rx="2" fill="var(--logo-bottle, #f0a030)" />
      <rect x="73" y="25" width="8" height="8"  rx="2" fill="var(--logo-cap, #2d5222)" />

      {/* Shopping basket — solid fill, covers bottoms of groceries */}
      <path
        d="M12 57 L88 57 L84 102 Q84 108 76 108 L24 108 Q16 108 16 102 Z"
        fill="var(--logo-main, #1a2e1a)"
      />

      {/* Basket slot cutouts (3) */}
      <rect x="24" y="67" width="12" height="27" rx="4" fill="var(--logo-bg, #f5f0e8)" />
      <rect x="44" y="67" width="12" height="27" rx="4" fill="var(--logo-bg, #f5f0e8)" />
      <rect x="64" y="67" width="12" height="27" rx="4" fill="var(--logo-bg, #f5f0e8)" />
    </svg>
  );
}
