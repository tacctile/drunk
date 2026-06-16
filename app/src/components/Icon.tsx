interface IconProps {
  name: string;
  filled?: boolean;
  size?: number;
  className?: string;
}

/** Material Symbols Outlined glyph — the app's only icon primitive. */
export function Icon({ name, filled = false, size = 24, className = "" }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`ms ${filled ? "ms-fill" : ""} ${className}`}
      style={{ fontSize: size }}
    >
      {name}
    </span>
  );
}
