export const gateApproach = 0.37;
export const gateCrossing = 0.78;
export const gateParked = 0.98;
export const gateYaw = -0.76;
export const gateCentre = { x: 0.58, y: 0.435 };
const crossingScreenX = 0.786;
export const parkedPose = { x: 0.84, y: 0.49 };
export const gateRadius = 1.72;
export const gateExitStart = 1.32;
export const gateExitEnd = 1.48;
export const routesArrival = 0.2;
export const routesDeparture = 0.255;

// Positions are composed for the page in fractions of the viewport. They are
// animation keyframes, not flight dynamics or a transmitter configuration.
const path = [
  [0, 0.72, 0.5, 0.66, 0.32, -0.38, 0, 3.5],
  [0.025, 0.724, 0.51, 0.65, 0.39, -0.32, -0.035, 3.5],
  [0.064, 0.73, 0.555, 0.54, 0.53, -0.19, -0.09, 3.35],
  [routesArrival, 0.738, 0.24, 0.53, 0.59, -0.58, -0.075, 3.1],
  [0.222, 0.738, 0.24, 0.53, 0.59, -0.58, -0.075, 3.1],
  [routesDeparture, 0.74, 0.51, 0.66, 0.46, -0.35, -0.055, 3.1],
  [0.31, 0.744, 0.405, 0.59, 0.35, 0.23, -0.08, 3],
  [gateApproach, 0.748, 0.31, 0.38, 0.29, 0.37, -0.1, 2.9],
  [0.48, 0.755, 0.316, 0.35, 0.46, 0.56, -0.12, 2.7],
  [0.59, 0.763, 0.33, 0.33, 0.49, 0.76, -0.16, 1.8],
  [0.69, 0.773, 0.365, 0.25, 0.35, 0.98, -0.22, 0.88],
  [gateCrossing, crossingScreenX, gateCentre.y, 0.22, 0.25, 1.18, -0.27, 0],
  [0.88, 0.82, 0.465, 0.35, 0.3, 0.73, -0.13, -1.48],
  [gateParked, parkedPose.x, parkedPose.y, 0.44, 0.32, 0.36, 0.08, -2.8],
  [1.34, parkedPose.x, parkedPose.y, 0.44, 0.32, 0.36, 0.08, -2.8],
  [1.65, 0.5, 0.46, 0.68, 1.03, 0, 0, 0],
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

// The camera follows the descent into the gate scene, then locks onto
// the ring. The completed drawing uses this same world-space trajectory.
export function gateCameraLift(p: number) {
  if (p <= routesDeparture || p >= gateCrossing) return 0;
  // One curve defines both the drawn trace and the world-space position.
  // Camera tracking keeps the transition from the reading pose on screen.
  const progress = Math.max(p, gateApproach);
  const [, y] = sampleFlight(progress);
  const remaining = (gateCrossing - progress) / (gateCrossing - gateApproach);
  const descent = 3.9 * remaining ** 2 + 0.8 * remaining;
  const lift = (y - gateCentre.y) * 10 + descent;
  if (p >= gateApproach) return lift;
  const t = (p - routesDeparture) / (gateApproach - routesDeparture);
  return lift * t * t * (3 - 2 * t);
}

// Track the aircraft on entry, then ease the camera to the graph's fixed origin.
// Its screen path keeps advancing right as the gate falls behind it.
export function gateCameraPan(p: number, width: number) {
  if (p <= routesDeparture || p >= gateParked) return 0;
  const t =
    p < gateApproach
      ? (p - routesDeparture) / (gateApproach - routesDeparture)
      : Math.min(1, (gateParked - p) / (gateParked - gateCrossing));
  return (gateCentre.x - crossingScreenX) * width * t * t * (3 - 2 * t);
}

// World coordinates in the orthographic scene, before the radio and hero gestures.
export function gatePoint(p: number, width: number) {
  const [x, y, , , , , z] = sampleFlight(p);
  return [
    (x - 0.5) * width + gateCameraPan(p, width),
    (0.5 - y) * 10 + gateCameraLift(p),
    z,
  ] as const;
}
