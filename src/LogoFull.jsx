import LogoIcon from "./LogoIcon";

const SIZES = {
  sm: { icon: 40,  font: 16, tagline: 0,  gap: 8  },
  md: { icon: 60,  font: 24, tagline: 0,  gap: 12 },
  lg: { icon: 90,  font: 34, tagline: 11, gap: 14 },
  xl: { icon: 130, font: 48, tagline: 15, gap: 18 },
};

export default function LogoFull({ size = "md", className = "" }) {
  const { icon, font, tagline, gap } = SIZES[size] || SIZES.md;

  return (
    <div
      className={`logo-full${className ? ` ${className}` : ""}`}
      style={{ gap }}
    >
      <LogoIcon size={icon} />
      <div className="logo-wordmark" style={{ fontSize: font }}>
        TilbudsKokken
      </div>
      {tagline > 0 && (
        <p className="logo-tagline" style={{ fontSize: tagline }}>
          BEDRE TILBUD. BEDRE MAD.
        </p>
      )}
    </div>
  );
}
