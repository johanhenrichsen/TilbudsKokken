import logoIconSrc from "./assets/logo-icon.svg";

export default function LogoIcon({ size = 40, className = "" }) {
  return (
    <img
      src={logoIconSrc}
      width={size}
      height="auto"
      className={`logo-icon${className ? ` ${className}` : ""}`}
      alt=""
      aria-hidden="true"
      style={{ display: "block" }}
    />
  );
}
