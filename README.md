# react-radial-gauge-component

A radial gauge component for React. Inspired by [react-gauge-component](https://www.npmjs.com/package/react-gauge-component) but with other features and tradeoffs allowing for more customization.

## Installation

```bash
npm install react-radial-gauge-component
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | - | **Required.** Current value to display on the gauge |
| `max` | `number` | - | **Required.** Maximum value of the gauge |
| `unit` | `string` | - | **Required.** Unit label displayed below the value |
| `min` | `number` | `0` | Minimum value of the gauge |
| `width` | `number` | `140` | Width of the gauge in pixels |
| `height` | `number` | `140` | Height of the gauge in pixels |
| `startAngle` | `number` | `-40` | Starting angle of the gauge arc in degrees |
| `endAngle` | `number` | `220` | Ending angle of the gauge arc in degrees |
| `referenceThresholds` | `SegmentRange[]` | `[{ value: max, color: "silver" }]` | Background threshold segments |
| `thresholds` | `SegmentRange[]` | Auto-generated | Color thresholds for different value ranges |
| `valueFormat` | `(value: unknown) => string` | `(value) => value` | Function to format the displayed value |
| `showThresholdTicks` | `boolean` | `false` | Whether to show tick marks at threshold boundaries |
| `showThresholdLabels` | `boolean` | `false` | Whether to show labels at threshold boundaries |
| `centerTextProps` | `SvgTextProps` | - | Props for the center value text element |
| `unitTextProps` | `SvgTextProps` | - | Props for the unit text element |
| `thresholdTicksProps` | `SVGLineElementAttributes` | - | Props for threshold tick lines |
| `thresholdTextProps` | `SvgTextProps` | - | Props for threshold labels |
| `verticalOffset` | `number` | `10` | Vertical offset for the gauge position |
| `outerRingWidth` | `number` | `3` | Width of the outer ring |
| `outerRingGap` | `number` | `2` | Gap between outer ring and reference ring |
| `referenceRingWidth` | `number` | `14` | Width of the reference ring |
| `indicatorLength` | `number` | `15` | Length of the value indicator line |

## Usage

### Basic Usage

```jsx
import { RadialGauge } from 'react-radial-gauge-component';

function App() {
  const [value, setValue] = useState(25);
  return (
    <RadialGauge 
      value={value} 
      max={100} 
      unit="rpm" 
    />
  );
}
```

### Multiple Thresholds

```jsx
<RadialGauge
  value={25}
  max={100}
  unit="rpm"
  thresholds={[
    { value: 10, color: "tomato" },
    { value: 20, color: "orange" },
    { value: 80, color: "limegreen" },
    { value: 90, color: "orange" },
    { value: 100, color: "tomato" },
  ]}
/>
```

### Half-Moon Style

```jsx
<RadialGauge
  value={25}
  max={100}
  unit="rpm"
  startAngle={0}
  endAngle={180}
  centerTextProps={{
    fontSize: "1.25rem",
    y: -20,
  }}
  unitTextProps={{
    y: -2,
  }}
  verticalOffset={25}
/>
```

### With Threshold Ticks and Labels

```jsx
<RadialGauge
  value={25}
  max={100}
  unit="rpm"
  showThresholdTicks={true}
  showThresholdLabels={true}
  thresholdTextProps={{
    color: "gray",
  }}
  thresholdTicksProps={{
    stroke: "gray",
  }}
/>
```

### Custom Sizing

```jsx
<RadialGauge
  value={25}
  max={100}
  unit="rpm"
  outerRingWidth={5}
  outerRingGap={0}
  referenceRingWidth={20}
  indicatorLength={20}
/>
```
