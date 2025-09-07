import React, { useState, useEffect, useRef } from "react";
import { arc as d3Arc } from "d3-shape";
import { interpolate } from "d3-interpolate";
import { easeQuadOut } from "d3-ease";

interface SegmentRange {
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

  referenceThresholds?: Array<SegmentRange>;
  thresholds?: Array<SegmentRange>;
  valueFormat?: (value: unknown) => string;
  showThresholdTicks?: boolean;
  showThresholdLabels?: boolean;

  centerTextProps?: SvgTextProps;
  unitTextProps?: SvgTextProps;
  thresholdTicksProps?: React.SVGLineElementAttributes<SVGLineElement>;
  thresholdTextProps?: SvgTextProps;
  transitionDuration?: number;
  easingFn?: (t: number) => number;

  verticalOffset?: number;
  outerRingWidth?: number;
  outerRingGap?: number;
  referenceRingWidth?: number;
  indicatorLength?: number;
  indicatorColor?: string;
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
  thresholds: Array<SegmentRange>,
  min: number,
  max: number
): Array<ReferenceRingSegment> {
  if (!Array.isArray(thresholds))
    throw new Error(
      "thresholds must be an array of objects { value: number, color: string }"
    );
  if (thresholds.length === 0) {
    return [{ start: 0, end: 1, color: "limegreen" }];
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
      sortedThresholds[sortedThresholds.length - 1]?.color || "limegreen";
    segments.push({
      start: currentStart,
      end: 1,
      color: lastColor,
    });
  }

  return segments;
}

function createThresholdTicks(
  radius: number,
  startAngle: number,
  endAngle: number,
  segments: Array<{ start: number; end: number; color: string }>,
  min: number,
  max: number
): Array<{ x1: number; y1: number; x2: number; y2: number; value: number }> {
  const totalAngle = endAngle - startAngle;
  const tickLength = 8;
  const ticks: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    value: number;
  }> = [];

  // Get unique threshold boundaries
  const boundaries = new Set<number>();
  segments.forEach((segment) => {
    boundaries.add(segment.start);
    boundaries.add(segment.end);
  });

  Array.from(boundaries).forEach((boundary) => {
    const angle = startAngle + boundary * totalAngle;
    const outerX = radius * Math.sin(angle);
    const outerY = -radius * Math.cos(angle);
    const innerX = (radius - tickLength) * Math.sin(angle);
    const innerY = -(radius - tickLength) * Math.cos(angle);
    const value = min + boundary * (max - min);

    ticks.push({
      x1: innerX,
      y1: innerY,
      x2: outerX,
      y2: outerY,
      value,
    });
  });

  return ticks;
}

/**
 * @property {number} transitionDuration - length of valueArc animation in ms. Set to 0 to disable animation.
 * @property {string} indicatorColor - custom color for indicator + valueArc. Leave undefined to match threshold.
 */
export function RadialGauge({
  value,
  min = 0,
  max,
  unit,
  width = 140,
  height = 140,
  startAngle = -40,
  endAngle = 220,
  referenceThresholds = [{ value: max, color: "silver" }],
  thresholds = [
    { value: max * 0.6, color: "limegreen" },
    { value: max * 0.8, color: "orange" },
    { value: max, color: "tomato" },
  ],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  valueFormat = (value: any) => value,
  showThresholdTicks = false,
  showThresholdLabels = false,
  centerTextProps,
  unitTextProps,
  thresholdTicksProps,
  thresholdTextProps,
  transitionDuration = 250,
  easingFn = easeQuadOut,

  // Arc dimensions
  verticalOffset = 10,
  outerRingWidth = 3,
  outerRingGap = 2,
  referenceRingWidth = 14,
  indicatorLength = 15,
  indicatorColor,
}: GaugeProps) {
  const svgId = React.useId();
  const [tweenValue, setTweenValue] = useState(value);
  const animationRef = useRef<number>(0);
  const animationValue = transitionDuration > 0 ? tweenValue : value;

  useEffect(() => {
    if (!transitionDuration) return;

    const startValue = tweenValue;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / transitionDuration, 1);
      const easedProgress = easingFn(progress);

      const currentValue = interpolate(startValue, value)(easedProgress);
      setTweenValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, tweenValue, transitionDuration, easingFn]);

  const radius = Math.min(width, height) / 2;
  const centerX = width / 2;
  const centerY = height / 2 + verticalOffset;

  // Convert angles to radians
  const startRad = degreesToRadians(startAngle);
  const endRad = degreesToRadians(endAngle);

  const outerRingInner = radius - outerRingWidth;
  const outerRingOuter = radius;
  const referenceRingInner = radius - referenceRingWidth;
  const referenceRingOuter = radius - outerRingWidth - outerRingGap;
  const valueRingInner = radius - referenceRingWidth;
  const valueRingOuter = radius - outerRingWidth - outerRingGap;

  // Calculate value angle using animated value
  const normalizedValue = Math.max(
    0,
    Math.min(1, (animationValue - min) / (max - min))
  );
  const valueAngle = startRad + normalizedValue * (endRad - startRad);

  // Convert thresholds to segments
  const thresholdSegments = convertThresholdsToSegments(thresholds, min, max);

  // Threshold ticks
  const thresholdTicks = showThresholdTicks
    ? createThresholdTicks(
        outerRingOuter,
        startRad,
        endRad,
        thresholdSegments,
        min,
        max
      )
    : [];

  // Outer ring segments (min/max indicators)
  const outerSegments = thresholdSegments;
  const outerRingPaths = createSegmentedArcPath(
    outerRingInner,
    outerRingOuter,
    startRad,
    endRad,
    outerSegments
  );

  const referenceRingSegments = convertThresholdsToSegments(
    referenceThresholds,
    min,
    max
  );

  const referenceRingPaths = createSegmentedArcPath(
    referenceRingInner,
    referenceRingOuter,
    startRad,
    endRad,
    referenceRingSegments
  );

  // Value arc
  const valueColor =
    indicatorColor ||
    thresholdSegments.find(
      (segment) =>
        normalizedValue >= segment.start && normalizedValue <= segment.end
    )?.color ||
    "#999";
  const valueArcPath = createArcPath(
    valueRingInner,
    valueRingOuter,
    startRad,
    valueAngle
  );

  // indicator
  const indicatorInner = valueRingOuter - indicatorLength;

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

  const getThresholdTicksProps = () => {
    return {
      stroke: "currentColor",
      strokeWidth: 2,
      opacity: 1,
      ...thresholdTicksProps,
    } satisfies React.SVGLineElementAttributes<SVGLineElement>;
  };

  const getThresholdTextProps = () => {
    return {
      textAnchor: "middle",
      dominantBaseline: "middle",
      fontSize: "0.6rem",
      fontWeight: "bold",
      fill: "currentColor",
      ...thresholdTextProps,
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

          {/* Threshold ticks */}
          <g className="threshold-elements">
            {thresholdTicks.map((tick, index) => (
              <line
                key={`tick-${index}`}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                {...getThresholdTicksProps()}
              />
            ))}

            {/* Threshold labels */}
            {showThresholdLabels &&
              thresholdTicks.map((tick, index) => (
                <text
                  key={`label-${index}`}
                  x={tick.x2 + (tick.x2 - tick.x1) * 1.5 + 2}
                  y={tick.y2 + (tick.y2 - tick.y1) * 1.5 + 2}
                  {...getThresholdTextProps()}
                >
                  {Number(tick.value.toFixed(1)).toString()}
                </text>
              ))}
          </g>

          {/* Indicator */}
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
