import * as T from 'three';
// Each ghost follows its own curve in screen-aligned space, crossing the open centre at z=0.
export function raceReplays(gate: T.Group) {
  const swarm = new T.Group();
  gate.add(swarm);
  const runs = ['#ff6875', '#ab87ff', '#42e8ac', '#ff64bc', '#ffd349'].map(
    (color, i) => {
      const d = i - 2;
      // The two cubics share a tangent at the hoop centre.
      const v = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
      const tangent = v(3.4, 0.85 + d * 0.16, 2.85);
      const centre = v(0, 0, 0);
      const curve = new T.CurvePath<T.Vector3>();
      curve.add(
        new T.CubicBezierCurve3(
          v(23, 13 + d * 1.7, 4.6),
          v(10, 7.2 + d * 1.55, 3.85),
          tangent,
          centre,
        ),
      );
      curve.add(
        new T.CubicBezierCurve3(
          centre,
          tangent.clone().negate(),
          v(-10, -0.35 + d * 0.6, -9.8),
          v(-23, -1.1 + d * 0.72, -13),
        ),
      );
      const group = new T.Group();
      swarm.add(group);
      const body = new T.MeshBasicMaterial({ color: '#899394' });
      const hull = new T.Mesh(new T.BoxGeometry(0.14, 0.065, 0.22), body);
      for (const x of [-0.12, 0.12])
        for (const z of [-0.12, 0.12]) {
          const fan = new T.Mesh(
            new T.RingGeometry(0.058, 0.087, 10),
            new T.MeshBasicMaterial({ color, side: T.DoubleSide }),
          );
          fan.rotation.x = -Math.PI / 2;
          fan.position.set(x, 0, z);
          hull.add(fan);
        }
      const material = new T.MeshBasicMaterial({
        color,
        transparent: true,
        depthWrite: false,
      });
      const layers = [0.014, 0.039, 0.083].map((radius, layer) => {
        const tube = new T.TubeGeometry(curve, 160, radius, 6, false);
        const ink = layer ? material.clone() : material;
        if (layer) ink.blending = T.AdditiveBlending;
        group.add(new T.Mesh(tube, ink));
        return { tube, ink, strength: [0.83, 0.2, 0.075][layer] };
      });
      group.add(hull);
      group.visible = false;
      return { curve, hull, layers, group, material };
    },
  );
  const forward = new T.Vector3(0, 0, 1);
  const reflected = new T.PointLight(0xffffff, 0, 3.8);
  gate.add(reflected);
  let crossed = false,
    start = -1;
  function reset() {
    crossed = false;
    start = -1;
    swarm.visible = false;
    reflected.intensity = 0;
  }
  function update(progress: number, now: number, day: number) {
    if (progress < 1.04 || progress > 1.32) reset();
    if (!crossed && progress >= 1.045 && progress <= 1.32) {
      crossed = true;
      start = now;
    }
    swarm.visible = start >= 0 && progress <= 1.32;
    reflected.intensity = 0;
    if (!swarm.visible) return false;
    swarm.quaternion.copy(gate.quaternion).invert();
    swarm.scale.z = 1 / gate.scale.z;
    let active = false;
    runs.forEach(({ curve, hull, layers, group, material }, i) => {
      const age = (now - start) / 1000 - 0.5 - i * 1.85;
      group.visible = age >= 0 && age < 4.5;
      if (age < 4.5) active = true;
      if (!group.visible) return;
      const t = Math.min(1, age / 1.8);
      hull.position.copy(curve.getPointAt(t));
      hull.quaternion.setFromUnitVectors(forward, curve.getTangentAt(t));
      hull.visible = t < 1;
      const fade = Math.max(0, age - 1.8) / 2.7;
      const reflection =
        (1 - day) * Math.max(0, 1 - Math.abs(t - 0.51) * 4) * 0.85;
      if (reflection > reflected.intensity) {
        reflected.position
          .copy(hull.position)
          .applyQuaternion(swarm.quaternion);
        reflected.color.copy(material.color);
        reflected.intensity = reflection;
      }
      for (const { tube, ink, strength } of layers) {
        tube.setDrawRange(0, Math.floor(t * 160) * 6 * 6);
        ink.opacity =
          strength *
          (1 - T.MathUtils.smoothstep(fade, 0, 1)) *
          (1 - 0.16 * day);
      }
    });
    return active;
  }
  return { reset, update };
}
