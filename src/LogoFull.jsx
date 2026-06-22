import logoTextSrc from "./assets/logo-text.svg";

// Width in px for each named size (SVG is square so height = width)
const SIZE_PX = { sm: 90, md: 130, lg: 175, xl: 230, "2xl": 320, "3xl": 460, "4xl": 1000 };

export default function LogoFull({ size = "md", className = "" }) {
  const px = SIZE_PX[size] ?? SIZE_PX.md;
  return (
    <img
      src={logoTextSrc}
      width={px}
      height={px}
      className={`logo-full${className ? ` ${className}` : ""}`}
      alt="Spotkokken"
      style={{ display: "block" }}
    />
  );
}
