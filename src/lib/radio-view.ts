// Viewing angles for the model during the transmitter demonstration.
//
// Square to the camera and tail-on, so the model's right is the viewer's right
// and a stick pushed right banks right. Nose-on would be just as true and read
// mirrored, which is the one thing this chapter must not do.
export function radioViewAngles(
  pathTilt: number,
  pathYaw: number,
  settled: number,
) {
  const s = Math.min(1, Math.max(0, settled));
  return {
    tilt: pathTilt * (1 - 0.72 * s),
    yaw: pathYaw * (1 - s) + Math.PI * s,
  };
}

/** How far the demonstration has taken over, from the chapter and the hover. */
export function demonstrationHold(inChapter: number, lift: number) {
  return inChapter * Math.min(1, Math.max(0, lift / 0.74));
}
