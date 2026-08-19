const SIZES = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-[13px]",
  lg: "h-11 w-11 text-[15px]",
} as const;

export function ColorAvatar({
  label,
  color,
  size = "md",
}: {
  label: string;
  color: string | undefined;
  size?: keyof typeof SIZES;
}) {
  const swatch = color ?? "#97a0ac";
  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-bold ${SIZES[size]}`}
      style={{ backgroundColor: `color-mix(in srgb, ${swatch} 16%, transparent)`, color: swatch }}
    >
      {label.slice(0, 1)}
    </span>
  );
}
