import { useId, useMemo } from "react"
import { type DisplayMode } from "@/lib/settings"
import {
  buildUsageTrend,
  type UsageHistoryEntry,
} from "@/lib/usage-history"
import { cn } from "@/lib/utils"

interface UsageTrendChartProps {
  history: UsageHistoryEntry[]
  displayMode: DisplayMode
  brandColor?: string
  compact?: boolean
}

type ChartPoint = {
  x: number
  y: number
  labelX: number
  value: number | null
  day: string
  shortLabel: string
}

function buildLinePath(points: ChartPoint[]): string {
  const segments: string[] = []
  let drawing = false

  for (const point of points) {
    if (point.value == null) {
      drawing = false
      continue
    }

    if (!drawing) {
      segments.push(`M ${point.x} ${point.y}`)
      drawing = true
      continue
    }

    segments.push(`L ${point.x} ${point.y}`)
  }

  return segments.join(" ")
}

export function UsageTrendChart({
  history,
  displayMode,
  brandColor,
  compact = false,
}: UsageTrendChartProps) {
  const gradientId = useId().replace(/:/g, "")
  const trend = useMemo(
    () => buildUsageTrend({ entries: history, displayMode }),
    [displayMode, history]
  )

  const hasAnyPoint = trend.some((point) => point.fraction != null)
  if (!hasAnyPoint) return null

  const width = 252
  const height = compact ? 58 : 74
  const left = 8
  const top = 8
  const plotWidth = width - left * 2
  const plotHeight = compact ? 28 : 40
  const bottom = top + plotHeight

  const points = trend.map((point, index): ChartPoint => ({
    x: left + (plotWidth / Math.max(trend.length - 1, 1)) * index,
    y: point.fraction == null
      ? bottom
      : top + (1 - point.fraction) * plotHeight,
    labelX: left + (plotWidth / Math.max(trend.length - 1, 1)) * index,
    value: point.fraction,
    day: point.day,
    shortLabel: point.shortLabel,
  }))

  const currentPoint = [...trend].reverse().find((point) => point.entry)
  const currentPercent = currentPoint?.fraction == null
    ? null
    : Math.round(currentPoint.fraction * 100)
  const modeLabel = displayMode === "used" ? "used" : "left"
  const stroke = brandColor || "var(--color-chart-2)"
  const fill = `${stroke}22`
  const linePath = buildLinePath(points)

  return (
    <div className="rounded-xl border border-border/70 bg-muted/35 px-2.5 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            7d trend
          </span>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stroke }} />
        </div>
        {currentPercent != null && (
          <span className="text-[11px] text-muted-foreground">
            {currentPercent}% {modeLabel}
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`7 day ${modeLabel} trend`}
        className="block h-auto w-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={fill} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((fraction) => {
          const y = top + fraction * plotHeight
          return (
            <line
              key={fraction}
              x1={left}
              x2={width - left}
              y1={y}
              y2={y}
              stroke="var(--color-border)"
              strokeDasharray="2 4"
            />
          )
        })}

        {linePath && (
          <path
            d={`${linePath} L ${points[points.length - 1]?.x ?? width - left} ${bottom} L ${points.find((point) => point.value != null)?.x ?? left} ${bottom} Z`}
            fill={`url(#${gradientId})`}
          />
        )}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {points.map((point) =>
          point.value == null ? (
            <circle
              key={point.day}
              cx={point.x}
              cy={bottom}
              r="1.5"
              fill="var(--color-border)"
            />
          ) : (
            <circle
              key={point.day}
              cx={point.x}
              cy={point.y}
              r="3"
              fill="var(--color-card)"
              stroke={stroke}
              strokeWidth="1.5"
            />
          )
        )}

        {points.map((point) => (
          <text
            key={`${point.day}-label`}
            x={point.labelX}
            y={height - 6}
            textAnchor="middle"
            fontSize="10"
            fill="var(--color-muted-foreground)"
            className={cn(compact && "opacity-80")}
          >
            {compact ? point.shortLabel.slice(0, 1) : point.shortLabel}
          </text>
        ))}
      </svg>
    </div>
  )
}
