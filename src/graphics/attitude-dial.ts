import * as T from 'three';

// Ring turns with the model, horizon stays level. The angle is the gap between them.
export function attitudeDial(radius: number) {
  const root = new T.Group();
  root.name = 'Attitude reference';
  const scale = new T.Group();
  const level = new T.Group();
  root.add(scale, level);
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

  // Segment pairs, gapped in the middle so the airframe is never crossed.
  const reach = radius * 1.24;
  const gap = radius * 0.46;
  const dash = (reach - gap) / 9;
  const rule: T.Vector3[] = [];
  for (let i = 0; i < 5; i++) {
    const near = gap + i * 2 * dash;
    const far = Math.min(reach, near + dash);
    for (const side of [1, -1])
      rule.push(
        new T.Vector3(side * near, 0, 0),
        new T.Vector3(side * far, 0, 0),
      );
  }
  for (const side of [1, -1])
    rule.push(
      new T.Vector3(side * reach, -0.11, 0),
      new T.Vector3(side * reach, 0.11, 0),
    );
  level.add(
    new T.LineSegments(new T.BufferGeometry().setFromPoints(rule), ink),
  );

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
    // Undo the viewing frame so the rule stays level. Yaw has no horizon to read.
    level.visible = term !== 'Yaw';
    level.rotation.set(-viewTilt, 0, 0, 'ZXY');
    ink.opacity = (0.48 + 0.2 * daylight) * opacity;
    accent.opacity = 0.93 * opacity;
  }
  return { root, ink, accent, update };
}
