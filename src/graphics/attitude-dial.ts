import * as T from 'three';

// A stationary angular scale and one moving index share the model's viewing frame.
export function attitudeDial(radius: number) {
  const root = new T.Group();
  root.name = 'Attitude reference';
  const scale = new T.Group();
  root.add(scale);
  const ink = new T.LineBasicMaterial({ transparent: true, depthWrite: false });
  const accent = new T.LineBasicMaterial({
    transparent: true,
    depthWrite: false,
  });
  const circle = (angle: number, length: number) =>
    new T.Vector3(Math.sin(angle) * length, Math.cos(angle) * length, 0);
  const arc = Array.from({ length: 97 }, (_, i) =>
    circle((i * Math.PI) / 48, radius),
  );
  scale.add(new T.Line(new T.BufferGeometry().setFromPoints(arc), ink));
  const marks: T.Vector3[] = [];
  for (let i = 0; i < 36; i++) {
    const a = (i * Math.PI) / 18;
    marks.push(
      circle(a, radius),
      circle(a, radius + (i % 3 === 0 ? 0.13 : 0.065)),
    );
  }
  scale.add(
    new T.LineSegments(new T.BufferGeometry().setFromPoints(marks), ink),
  );
  const index = new T.Line(
    new T.BufferGeometry().setFromPoints([
      new T.Vector3(-0.08, radius + 0.21),
      new T.Vector3(0, radius + 0.02),
      new T.Vector3(0.08, radius + 0.21),
    ]),
    accent,
  );
  scale.add(index);
  function update(
    quad: T.Group,
    term: string,
    angle: number,
    viewTilt: number,
    viewYaw: number,
    daylight: number,
    opacity: number,
  ) {
    root.visible =
      opacity > 0.01 && (term === 'Yaw' || term === 'Pitch' || term === 'Roll');
    if (!root.visible) return;
    root.position.copy(quad.position);
    // A real ring shares the pivot. The depth buffer hides just its far side.
    root.scale.copy(quad.scale);
    root.rotation.set(viewTilt, viewYaw, 0, 'ZXY');
    // The index starts along the nose (+Z) for yaw/pitch and up (+Y) for roll.
    if (term === 'Yaw') scale.rotation.set(Math.PI / 2, 0, 0, 'XYZ');
    else if (term === 'Pitch')
      scale.rotation.set(0, Math.PI / 2, Math.PI / 2, 'XYZ');
    else scale.rotation.set(0, 0, 0);
    index.rotation.z = term === 'Yaw' ? -angle : angle;
    ink.opacity = (0.48 + 0.2 * daylight) * opacity;
    accent.opacity = 0.93 * opacity;
  }
  return { root, ink, accent, update };
}
