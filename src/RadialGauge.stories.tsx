import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadialGauge } from "./RadialGauge";

const meta = {
  title: "RadialGauge",
  component: RadialGauge,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RadialGauge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 25,
    max: 100,
    unit: "rpm",
  },
};

export const MutlipleThresholds: Story = {
  args: {
    value: 25,
    max: 100,
    unit: "rpm",
    thresholds: [
      { value: 10, color: "tomato" },
      { value: 20, color: "orange" },
      { value: 80, color: "limegreen" },
      { value: 90, color: "orange" },
      { value: 100, color: "tomato" },
    ],
  },
};

export const HalfMoon: Story = {
  args: {
    value: 25,
    max: 100,
    unit: "rpm",
    startAngle: 0,
    endAngle: 180,
    centerTextProps: {
      fontSize: "1.25rem",
      y: -20,
    },
    unitTextProps: {
      y: -2,
    },
    verticalOffset: 25,
  },
};

export const SingleThreshold: Story = {
  args: {
    value: 75,
    max: 100,
    unit: "%",
    thresholds: [{ value: 100, color: "mediumseagreen" }],
  },
};

export const WithTicks: Story = {
  args: {
    value: 25,
    max: 100,
    unit: "rpm",
    showThresholdTicks: true,
    showThresholdLabels: true,
    thresholdTextProps: {
      color: "gray",
    },
    thresholdTicksProps: {
      stroke: "gray",
    },
  },
};

export const CustomSizing: Story = {
  args: {
    value: 25,
    max: 100,
    unit: "rpm",
    outerRingWidth: 5,
    outerRingGap: 0,
    referenceRingWidth: 20,
    indicatorLength: 20,
  },
};