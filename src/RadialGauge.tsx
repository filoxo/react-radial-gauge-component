import React from "react";
import { arc as d3Arc } from "d3-shape";

interface ThresholdRange {
  value: number;
  color: string;
}

interface ReferenceRingSegment {
  start: number;
  end: number;
  color: string;
}

type SvgTextProps = React.SVGTextElementAttributes<SVGTextElement>;

interface GaugeProps {
  value: number;
  min?: number;
  max: number;
  unit: string;
  width?: number;
  height?: number;
  startAngle?: number;
  endAngle?: number;

  referenceRingSegements?: Array<ReferenceRingSegment>;
  thresholds?: Array<ThresholdRange>;
  valueFormat?: (value: unknown) => string;

  centerTextProps?: SvgTextProps;
  unitTextProps?: SvgTextProps;
}

function degreesToRadians(degrees: number): number {
  return (degrees - 90) * (Math.PI / 180);
}

function createArcPath(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const arc = d3Arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .startAngle(startAngle)
    .endAngle(endAngle)
    .cornerRadius(0);

  return (
    arc({
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
    }) || ""
  );
}

function createSegmentedArcPath(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  segments: Array<{ start: number; end: number; color: string }>
): Array<{ path: string; color: string }> {
  const totalAngle = endAngle - startAngle;

  return segments.map((segment) => {
    const segmentStartAngle = startAngle + segment.start * totalAngle;
    const segmentEndAngle = startAngle + segment.end * totalAngle;

    return {
      path: createArcPath(
        innerRadius,
        outerRadius,
        segmentStartAngle,
        segmentEndAngle
      ),
      color: segment.color,
    };
  });
}

function convertThresholdsToSegments(
  thresholds: Array<ThresholdRange>,
  min: number,
  max: number
): Array<ReferenceRingSegment> {
  if (!Array.isArray(thresholds))
    throw new Error(
      "thresholds must be an array of objects { value: number, color: string }"
    );
  if (thresholds.length === 0) {
    return [{ start: 0, end: 1, color: "var(--mui-palette-success-main)" }];
  }

  // Sort thresholds by value
  const sortedThresholds = [...thresholds].sort((a, b) => a.value - b.value);
  const segments: Array<ReferenceRingSegment> = [];

  let currentStart = 0;

  for (let i = 0; i < sortedThresholds.length; i++) {
    const threshold = sortedThresholds[i];
    const normalizedEnd = Math.max(
      0,
      Math.min(1, (threshold.value - min) / (max - min))
    );

    if (normalizedEnd > currentStart) {
      segments.push({
        start: currentStart,
        end: normalizedEnd,
        color: threshold.color,
      });
      currentStart = normalizedEnd;
    }
  }

  // Add final segment if needed
  if (currentStart < 1) {
    const lastColor =
      sortedThresholds[sortedThresholds.length - 1]?.color ||
      "var(--mui-palette-success-main)";
    segments.push({
      start: currentStart,
      end: 1,
      color: lastColor,
    });
  }

  return segments;
}

export function RadialGauge({
  value,
  min = 0,
  max,
  unit,
  width = 140,
  height = 140,
  startAngle = -40,
  endAngle = 220,
  referenceRingSegements = [{ start: 0, end: 1, color: "silver" }],
  thresholds = [
    { value: max * 0.6, color: "limegreen" },
    { value: max * 0.8, color: "orange" },
    { value: max, color: "tomato" },
  ],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  valueFormat = (value: any) => value,
  centerTextProps,
  unitTextProps,
}: GaugeProps) {
  const svgId = React.useId();
  const VERTICAL_OFFSET = 10;

  const radius = Math.min(width, height) / 2;
  const centerX = width / 2;
  const centerY = height / 2 + VERTICAL_OFFSET;

  // Convert angles to radians
  const startRad = degreesToRadians(startAngle);
  const endRad = degreesToRadians(endAngle);

  // Arc dimensions
  const OUTER_RING_WIDTH = 3;
  const OUTER_RING_GAP = 2;
  const REFERENCE_RING_WIDTH = 14;

  const outerRingInner = radius - OUTER_RING_WIDTH;
  const outerRingOuter = radius;
  const referenceRingInner = radius - REFERENCE_RING_WIDTH;
  const referenceRingOuter = radius - OUTER_RING_WIDTH - OUTER_RING_GAP;
  const valueRingInner = radius - REFERENCE_RING_WIDTH;
  const valueRingOuter = radius - OUTER_RING_WIDTH - OUTER_RING_GAP;

  // Calculate value angle
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const valueAngle = startRad + normalizedValue * (endRad - startRad);

  // Convert thresholds to segments
  const thresholdSegments = convertThresholdsToSegments(thresholds, min, max);

  // Outer ring segments (min/max indicators)
  const outerSegments = thresholdSegments;
  const outerRingPaths = createSegmentedArcPath(
    outerRingInner,
    outerRingOuter,
    startRad,
    endRad,
    outerSegments
  );
  const referenceRingPaths = createSegmentedArcPath(
    referenceRingInner,
    referenceRingOuter,
    startRad,
    endRad,
    referenceRingSegements
  );

  // Value arc
  const valueColor =
    thresholdSegments.find(
      (segment) =>
        normalizedValue >= segment.start && normalizedValue <= segment.end
    )?.color || "#999";
  const valueArcPath = createArcPath(
    valueRingInner,
    valueRingOuter,
    startRad,
    valueAngle
  );

  // indicator
  const INDICATOR_LENGTH = 15;
  const indicatorInner = valueRingOuter - INDICATOR_LENGTH;

  const indicatorTarget = {
    x: valueRingOuter * Math.sin(valueAngle),
    y: -valueRingOuter * Math.cos(valueAngle),
    cx: indicatorInner * Math.sin(valueAngle),
    cy: -indicatorInner * Math.cos(valueAngle),
  };

  // center text

  const getCenterTextProps = () => {
    return {
      y: -4,
      textAnchor: "middle",
      dominantBaseline: "middle",
      fontSize: "1.5rem",
      fontWeight: "bold",
      fill: "currentColor",
      ...centerTextProps,
    } satisfies SvgTextProps;
  };

  const getUnitTextProps = () => {
    return {
      y: 16,
      textAnchor: "middle",
      dominantBaseline: "middle",
      fontSize: ".75rem",
      fontWeight: "bold",
      fill: "currentColor",
      ...unitTextProps,
    } satisfies SvgTextProps;
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <svg
        width={width}
        height={height}
        style={{ overflow: "visible" }}
        id={svgId}
        className="radial-gauge"
      >
        <g transform={`translate(${centerX}, ${centerY + 5})`}>
          {/* Outer ring with min/max indicators */}
          {outerRingPaths.map((segment, index) => (
            <path
              key={`outer-${index}`}
              d={segment.path}
              fill={segment.color}
            />
          ))}

          {/* Reference ring (lighter background zones) */}
          {referenceRingPaths.map((segment, index) => (
            <path
              key={`reference-${index}`}
              d={segment.path}
              fill={segment.color}
            />
          ))}

          {/* Value arc */}
          <path d={valueArcPath} fill={valueColor} opacity={1} />

          <path
            d={`M ${indicatorTarget.cx} ${indicatorTarget.cy} L ${indicatorTarget.x} ${indicatorTarget.y}`}
            stroke={valueColor}
            strokeWidth={3}
          />

          {/* Center text */}
          <text {...getCenterTextProps()}>
            {value ? valueFormat(value) : "--"}
          </text>
          {unit && <text {...getUnitTextProps()}>{unit}</text>}
        </g>
      </svg>
    </div>
  );
}
