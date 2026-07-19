import LogoIcon from "./LogoIcon";

// Full lockup: mark + "Tilbudskokken" wordmark + tagline.
// Inline (no raster asset) so it scales cleanly and stays out of the bundle.
const SIZE_PX = { sm: 22, md: 30, lg: 40, xl: 54, "2xl": 72, "3xl": 104, "4xl": 220 };

export default function LogoFull({ size = "md", className = "", tagline = false }) {
  const px = SIZE_PX[size] ?? SIZE_PX.md;
  return (
    <span
      className={`logo-full${className ? ` ${className}` : ""}`}
      style={{ display: "inline-flex", alignItems: "center", gap: px * 0.32 }}
    >
      <LogoIcon size={px} />
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontWeight: 600,
            fontSize: px * 0.62,
            color: "#EEE6D8",
            letterSpacing: "-0.01em",
          }}
        >
          Tilbudskokken
        </span>
        {tagline && (
          <span
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontWeight: 500,
              fontSize: px * 0.26,
              color: "#A69C8D",
              letterSpacing: "0.02em",
              marginTop: px * 0.12,
            }}
          >
            Bedre tilbud. Bedre mad.
          </span>
        )}
      </span>
    </span>
  );
}
