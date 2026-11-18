import * as T from 'three';
// Each ghost follows its own curve in gate-local space, crossing the open centre at z=0.
export function raceReplays(gate: T.Group) {
  const swarm = new T.Group();
  gate.add(swarm);
  const runs = ['#ef7d77', '#ad86eb', '#79c89d'].map((color, i) => {
    const d = i - 1;
    const curve = new T.CatmullRomCurve3(
      [
        [2.5 + d * 0.45, 0.92 + d * 0.34, 3.7],
        [0.85 + d * 0.36, 0.53 - d * 0.24, 1.8],
        [d * 0.31, d * 0.34, 0],
        [-1.25 - d * 0.15, -0.21 + d * 0.29, -1.9],
        [-4.2 + d * 0.36, -0.8 - d * 0.3, -3.9],
      ].map(([x, y, z]) => new T.Vector3(x, y, z)),
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
    const tube = new T.TubeGeometry(curve, 60, 0.014, 4, false);
    group.add(hull, new T.Mesh(tube, material));
    group.visible = false;
    return { curve, hull, tube, group, material };
  });
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
    if (progress < 0.18) reset();
    if (!crossed && progress >= 0.79) {
      crossed = true;
      if (progress < 1.36) start = now;
    }
    swarm.visible = start >= 0 && progress < 1.6;
    reflected.intensity = 0;
    if (!swarm.visible) return false;
    let active = false;
    runs.forEach(({ curve, hull, tube, group, material }, i) => {
      const age = (now - start) / 1000 - 0.5 - i * 0.43;
      group.visible = age >= 0 && age < 2.03;
      if (age < 2.03) active = true;
      if (!group.visible) return;
      const t = Math.min(1, age / 0.94);
      hull.position.copy(curve.getPoint(t));
      hull.lookAt(curve.getPoint(Math.min(1, t + 0.015)));
      hull.visible = t < 1;
      const fade = Math.max(0, age - 0.94) / 1.09;
      const reflection =
        (1 - day) * Math.max(0, 1 - Math.abs(t - 0.51) * 4) * 0.85;
      if (reflection > reflected.intensity) {
        reflected.position.copy(hull.position);
        reflected.color.copy(material.color);
        reflected.intensity = reflection;
      }
      tube.setDrawRange(0, Math.floor(t * 60) * 4 * 6);
      material.opacity =
        (1 - fade) * (0.75 - 0.22 * day) * (0.94 + 0.06 * Math.sin(age * 7));
    });
    return active;
  }
  return { reset, update };
}
