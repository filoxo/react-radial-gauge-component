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
    thresholdSegments: [
      { start: 0, end: 0.1, color: "tomato" }, // Green zone
      { start: 0.1, end: 0.2, color: "orange" }, // Orange zone
      { start: 0.2, end: 0.8, color: "limegreen" }, // Green zone
      { start: 0.8, end: 0.9, color: "orange" }, // Orange zone
      { start: 0.9, end: 1, color: "tomato" }, // Red zone
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
  },
};
