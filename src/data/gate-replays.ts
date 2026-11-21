import { gateRadius } from './flight-path';

// Distances use the ring's centreline diameter D. Each clock starts at launch.
export const laps = [
  { color: '#bd8aff', launch: 0, duration: 2.65, drift: 0.42, pace: 0.19 },
  { color: '#fe767c', launch: 0.44, duration: 2.42, drift: -0.31, pace: -0.08 },
  { color: '#5fd9ab', launch: 1.12, duration: 2.56, drift: 0.18, pace: 0.08 },
  { color: '#75adff', launch: 1.63, duration: 2.84, drift: -0.56, pace: 0.21 },
  { color: '#e9be59', launch: 2.46, duration: 2.38, drift: 0.64, pace: -0.12 },
  { color: '#ed86c6', launch: 2.86, duration: 2.53, drift: -0.05, pace: 0.12 },
] as const;

export const ringDiameter = (width: number) =>
  2 * gateRadius * Math.min(width / 16, 1.15);
export type Point = readonly [number, number, number];
export function lapPoint(
  index: number,
  fraction: number,
  width: number,
): Point {
  const { drift, pace } = laps[index];
  const d = ringDiameter(width);
  const u =
    fraction + (pace * Math.sin(2 * Math.PI * fraction)) / (2 * Math.PI);
  const k = 1 - 2 * u;
  // The shared diagonal passes the aperture at half-time. The small lateral
  // offsets at that station sit well inside its radius of 0.5 D.
  const bend = Math.sin(Math.PI * u);
  return [
    k * ((0.62 * width) / d) + drift * bend * 0.08,
    k * (5.15 / d) + drift * (0.22 + 0.55 * Math.sin(2 * Math.PI * u)) * bend,
    k * 2.4 + drift * bend * 0.12,
  ];
}

export function sampleLap(index: number, width: number) {
  let length = 0;
  let previous = lapPoint(index, 0, width);
  return Array.from({ length: 121 }, (_, i) => {
    const fraction = i / 120;
    const point = lapPoint(index, fraction, width);
    length += Math.hypot(...point.map((value, axis) => value - previous[axis]));
    previous = point;
    return { point, fraction, length };
  });
}
