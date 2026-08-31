export type TrendTone = "blue" | "green" | "yellow" | "purple";

const STROKE: Record<TrendTone, string> = {
  blue: "#063CCB",
  green: "#23B64B",
  yellow: "#FFB800",
  purple: "#9747FF",
};

const LINE =
  "M0,56 C24,53 36,41 64,44 S104,31 132,34 S172,15 202,20 S232,9 240,12";
const AREA = `${LINE} L240,70 L0,70 Z`;

/** Gráfico de linha decorativo (SVG puro). Escala com a largura do card. */
export function MiniTrendChart({ tone }: { tone: TrendTone }) {
  const color = STROKE[tone];
  const gid = `trend-fill-${tone}`;

  return (
    <svg
      viewBox="0 0 240 70"
      preserveAspectRatio="none"
      className="h-12 w-full sm:h-14"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={AREA} fill={`url(#${gid})`} />
      <path
        d={LINE}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
