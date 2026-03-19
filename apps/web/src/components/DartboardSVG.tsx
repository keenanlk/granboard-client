import { CLOCKWISE_NUMBERS, RING_RADII } from "@nlc-darts/engine";
import type { SegmentID } from "@nlc-darts/engine";

const DEG_PER_SECTOR = 360 / 20; // 18°
const HALF_SECTOR = DEG_PER_SECTOR / 2; // 9°
const NUMBER_RING_RADIUS = RING_RADII.double + 16; // where to place numbers
const BOARD_RADIUS = RING_RADII.double + 28; // total SVG radius including number ring

// Dark arcade theme — zinc-based palette with muted neon multiplier rings
const DARK_A = "#18181b"; // zinc-900 — darker single segments
const DARK_B = "#27272a"; // zinc-800 — lighter single segments
const WIRE = "#3f3f46"; // zinc-700
const MULTIPLIER_A = "#991b1b"; // red-800 — red doubles/trebles
const MULTIPLIER_B = "#166534"; // green-800 — green doubles/trebles
const BULL_OUTER = "#166534"; // green-800
const BULL_INNER = "#991b1b"; // red-800
const NUMBER_RING_BG = "#09090b"; // zinc-950
const NUMBER_COLOR = "#a1a1aa"; // zinc-400
const HIGHLIGHT_DEFAULT = "#fbbf24"; // amber-400

interface DartboardSVGProps {
  size?: number;
  className?: string;
  /** Single segment ID to highlight on the board. */
  highlightSegment?: SegmentID;
  /** Color for the highlighted segment (default: amber-400). */
  highlightColor?: string;
  /** "fill" fills the segment with the highlight color, "outline" keeps the base color and draws a glowing border (default: "fill"). */
  highlightMode?: "fill" | "outline";
}

/**
 * Decode a SegmentID (0–81) into sector index (in CLOCKWISE_NUMBERS order) and ring zone.
 * Returns null for non-renderable segments (MISS, BUST, RESET_BUTTON).
 */
function decodeSegment(
  segmentId: SegmentID,
):
  | { sectorIndex: number; zone: "inner" | "treble" | "outer" | "double" }
  | "bull"
  | "dblBull"
  | null {
  if (segmentId === 80) return "bull";
  if (segmentId === 81) return "dblBull";
  if (segmentId >= 82) return null;

  const zoneCode = segmentId % 4; // 0=inner, 1=treble, 2=outer, 3=double
  const number = Math.ceil((segmentId + 1) / 4); // 1–20
  const sectorIndex = CLOCKWISE_NUMBERS.indexOf(
    number as (typeof CLOCKWISE_NUMBERS)[number],
  );
  const zone = (["inner", "treble", "outer", "double"] as const)[zoneCode];
  return { sectorIndex, zone };
}

/** Convert degrees to radians. */
function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/**
 * Build an SVG arc-slice path from innerR to outerR spanning startDeg to endDeg.
 * Angles are clockwise from 12-o'clock (SVG: -90° offset, y-down).
 */
function arcSlicePath(
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
): string {
  const svgStart = startDeg - 90;
  const svgEnd = endDeg - 90;

  const sr = toRad(svgStart);
  const er = toRad(svgEnd);

  const ox1 = outerR * Math.cos(sr);
  const oy1 = outerR * Math.sin(sr);
  const ox2 = outerR * Math.cos(er);
  const oy2 = outerR * Math.sin(er);

  const ix1 = innerR * Math.cos(er);
  const iy1 = innerR * Math.sin(er);
  const ix2 = innerR * Math.cos(sr);
  const iy2 = innerR * Math.sin(sr);

  return [
    `M ${ox1} ${oy1}`,
    `A ${outerR} ${outerR} 0 0 1 ${ox2} ${oy2}`,
    `L ${ix1} ${iy1}`,
    `A ${innerR} ${innerR} 0 0 0 ${ix2} ${iy2}`,
    "Z",
  ].join(" ");
}

export function DartboardSVG({
  size = 400,
  className,
  highlightSegment,
  highlightColor = HIGHLIGHT_DEFAULT,
  highlightMode = "fill",
}: DartboardSVGProps) {
  // Decode the single highlighted segment
  const decoded =
    highlightSegment != null ? decodeSegment(highlightSegment) : null;
  const hlKey =
    decoded === "bull" || decoded === "dblBull"
      ? decoded
      : decoded
        ? `${decoded.sectorIndex}-${decoded.zone}`
        : null;

  const hasHighlight = hlKey != null;
  let glowPath: string | null = null;

  const segments: React.ReactElement[] = [];

  for (let i = 0; i < 20; i++) {
    const startDeg = i * DEG_PER_SECTOR - HALF_SECTOR;
    const endDeg = i * DEG_PER_SECTOR + HALF_SECTOR;
    const isEven = i % 2 === 0;

    const singleColor = isEven ? DARK_A : DARK_B;
    const multiplierColor = isEven ? MULTIPLIER_A : MULTIPLIER_B;

    const zones = [
      {
        key: "inner",
        innerR: RING_RADII.outerBull,
        outerR: RING_RADII.innerSingle,
        baseColor: singleColor,
      },
      {
        key: "treble",
        innerR: RING_RADII.innerSingle,
        outerR: RING_RADII.treble,
        baseColor: multiplierColor,
      },
      {
        key: "outer",
        innerR: RING_RADII.treble,
        outerR: RING_RADII.outerSingle,
        baseColor: singleColor,
      },
      {
        key: "double",
        innerR: RING_RADII.outerSingle,
        outerR: RING_RADII.double,
        baseColor: multiplierColor,
      },
    ] as const;

    for (const z of zones) {
      const thisKey = `${i}-${z.key}`;
      const lit = hlKey === thisKey;
      const d = arcSlicePath(z.innerR, z.outerR, startDeg, endDeg);

      if (lit) glowPath = d;

      const isFill = lit && highlightMode === "fill";
      const isOutline = lit && highlightMode === "outline";
      segments.push(
        <path
          key={`${z.key}-${i}`}
          d={d}
          fill={isFill ? highlightColor : z.baseColor}
          stroke={isOutline ? highlightColor : WIRE}
          strokeWidth={isOutline ? 2.5 : 0.5}
          opacity={hasHighlight && !lit ? 0.4 : 1}
        >
          {isOutline && (
            <animate
              attributeName="stroke-opacity"
              values="1;0.3;1"
              dur="0.8s"
              repeatCount="indefinite"
            />
          )}
        </path>,
      );
    }
  }

  const bullLit = hlKey === "bull";
  const dblBullLit = hlKey === "dblBull";

  // Number labels
  const numberLabels = CLOCKWISE_NUMBERS.map((num, i) => {
    const angleDeg = i * DEG_PER_SECTOR - 90; // SVG angle
    const rad = toRad(angleDeg);
    const x = NUMBER_RING_RADIUS * Math.cos(rad);
    const y = NUMBER_RING_RADIUS * Math.sin(rad);
    return (
      <text
        key={`num-${num}`}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fill={NUMBER_COLOR}
        fontSize={14}
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {num}
      </text>
    );
  });

  return (
    <svg
      viewBox={`${-BOARD_RADIUS} ${-BOARD_RADIUS} ${BOARD_RADIUS * 2} ${BOARD_RADIUS * 2}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Dartboard"
    >
      {/* Glow filter for highlighted segment */}
      <defs>
        <filter id="dartboard-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Number ring background */}
      <circle r={BOARD_RADIUS} fill={NUMBER_RING_BG} />

      {/* Segments */}
      {segments}

      {/* Outer bull (single bull) */}
      <circle
        r={RING_RADII.outerBull}
        fill={bullLit && highlightMode === "fill" ? highlightColor : BULL_OUTER}
        stroke={bullLit && highlightMode === "outline" ? highlightColor : WIRE}
        strokeWidth={bullLit && highlightMode === "outline" ? 2.5 : 0.5}
        opacity={hasHighlight && !bullLit ? 0.4 : 1}
        filter={bullLit ? "url(#dartboard-glow)" : undefined}
      >
        {bullLit && highlightMode === "outline" && (
          <animate
            attributeName="stroke-opacity"
            values="1;0.3;1"
            dur="0.8s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* Inner bull (double bull) */}
      <circle
        r={RING_RADII.innerBull}
        fill={
          dblBullLit && highlightMode === "fill" ? highlightColor : BULL_INNER
        }
        stroke={
          dblBullLit && highlightMode === "outline" ? highlightColor : WIRE
        }
        strokeWidth={dblBullLit && highlightMode === "outline" ? 2.5 : 0.5}
        opacity={hasHighlight && !dblBullLit ? 0.4 : 1}
        filter={dblBullLit ? "url(#dartboard-glow)" : undefined}
      >
        {dblBullLit && highlightMode === "outline" && (
          <animate
            attributeName="stroke-opacity"
            values="1;0.3;1"
            dur="0.8s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* Wire ring at double boundary */}
      <circle
        r={RING_RADII.double}
        fill="none"
        stroke={WIRE}
        strokeWidth={0.8}
      />

      {/* Number labels */}
      {numberLabels}

      {/* Glow overlay for highlighted path segment */}
      {glowPath && highlightMode === "fill" && (
        <path
          d={glowPath}
          fill={highlightColor}
          opacity={0.3}
          filter="url(#dartboard-glow)"
        />
      )}
      {glowPath && highlightMode === "outline" && (
        <path
          d={glowPath}
          fill="none"
          stroke={highlightColor}
          strokeWidth={3}
          filter="url(#dartboard-glow)"
        >
          <animate
            attributeName="stroke-opacity"
            values="0.6;0.15;0.6"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </path>
      )}
    </svg>
  );
}
