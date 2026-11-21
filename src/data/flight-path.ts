export const gateApproach = 0.37;
export const gateCrossing = 0.78;
export const gateParked = 0.98;
export const gateYaw = 0.76;
export const gateRadius = 1.72;

// Positions are composed for the page in fractions of the viewport. They are
// animation keyframes, not flight dynamics or a transmitter configuration.
const path = [
  [0, 0.72, 0.5, 0.66, 0.32, -0.38, 0, 3.5],
  [0.12, 0.735, 0.44, 0.69, 0.08, 0, 0, 3.6],
  [0.24, 0.801, 0.11, 0.64, -0.13, 0.49, -0.12, 3.3],
  // The turn above the viewport links the hero lift to the entry arc.
  [gateApproach, 0.85, -0.16, 0.47, 0.26, 0.37, 0.21, 2.9],
  [0.48, 0.822, -0.035, 0.42, 0.57, 0.31, 0.22, 2.7],
  [0.59, 0.785, 0.153, 0.33, 0.49, -0.2, 0.22, 1.8],
  [0.69, 0.718, 0.327, 0.25, 0.35, -0.82, 0.25, 0.88],
  [gateCrossing, 0.58, 0.435, 0.22, 0.25, -1.18, 0.27, 0],
  [0.88, 0.415, 0.499, 0.35, 0.3, -0.3, 0.13, -1.48],
  [gateParked, 0.205, 0.535, 0.44, 0.32, 0.36, 0.08, -2.8],
  [1.32, 0.205, 0.535, 0.44, 0.32, 0.36, 0.08, -2.8],
  [1.57, 0.5, 0.46, 0.68, 1.03, 0, 0, 0],
  [1.8, 0.5, 0.46, 0.68, 1.03, 0, 0, 0],
  [2, 0.5, 0.5, 0.58, 0.58, -0.15, 0, 0],
  [2.31, 0.5, 0.5, 0.58, 0.58, -0.15, 0, 0],
  [2.4, 0.5, 0.5, 0.58, 0.58, -0.15, 0, 0],
  [2.72, 0.5, 0.46, 0.68, 1.03, 0, 0, 0],
  [2.76, 0.5, 0.46, 0.68, 1.03, 0, 0, 0],
  [2.88, 0.645, 0.39, 0.59, 0.38, 0.55, -0.12, 0],
  [3, 0.77, 0.41, 0.53, 0.12, 0, 0, 0],
  [4, 0.77, 0.41, 0.53, 0.12, 0, 0, 0],
];

export function sampleFlight(p: number) {
  const keys = path;
  let i = 1;
  while (i < keys.length - 1 && keys[i][0] < p) i++;
  const a = keys[i - 1],
    b = keys[i];
  // Monotone cubic interpolation keeps velocity continuous through the gate.
  const span = b[0] - a[0],
    t = Math.max(0, Math.min(1, (p - a[0]) / span)),
    t2 = t * t,
    t3 = t2 * t;
  function tangent(index: number, column: number) {
    if (index === 0 || index === keys.length - 1) return 0;
    const l = keys[index - 1],
      m = keys[index],
      r = keys[index + 1];
    const left = (m[column] - l[column]) / (m[0] - l[0]),
      right = (r[column] - m[column]) / (r[0] - m[0]);
    return left * right > 0 ? (2 * left * right) / (left + right) : 0;
  }
  return a
    .slice(1)
    .map(
      (v, j) =>
        (2 * t3 - 3 * t2 + 1) * v +
        (t3 - 2 * t2 + t) * span * tangent(i - 1, j + 1) +
        (3 * t2 - 2 * t3) * b[j + 1] +
        (t3 - t2) * span * tangent(i, j + 1),
    );
}

// World coordinates in the orthographic scene, before the radio and hero gestures.
export function gatePoint(p: number, width: number) {
  const [x, y, , , , , z] = sampleFlight(p);
  return [(x - 0.5) * width, (0.5 - y) * 10, z] as const;
}
