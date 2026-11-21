import * as T from 'three';
import { laps, lapPoint, ringDiameter } from '../data/gate-replays';

class ReplayCurve extends T.Curve<T.Vector3> {
  constructor(
    private index: number,
    private width: number,
  ) {
    super();
  }
  getPoint(t: number, target = new T.Vector3()) {
    return target.set(...lapPoint(this.index, t, this.width));
  }
}

export function raceReplays(scene: T.Scene, gate: T.Group) {
  const swarm = new T.Group();
  swarm.name = 'Previous laps';
  scene.add(swarm);
  const segments = 120;
  const sides = 5;
  const runs = laps.map(({ color }, i) => {
    const ink = new T.MeshBasicMaterial({
      color,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
    });
    const hull = new T.Group();
    hull.name = 'Replay ' + (i + 1);
    const body = new T.Mesh(new T.BoxGeometry(0.048, 0.024, 0.078), ink);
    hull.add(body);
    const armGeometry = new T.BoxGeometry(0.008, 0.008, 0.13);
    for (const yaw of [-Math.PI / 4, Math.PI / 4]) {
      const arm = new T.Mesh(armGeometry, ink);
      arm.rotation.y = yaw;
      hull.add(arm);
    }
    const duct = new T.RingGeometry(0.024, 0.034, 14);
    for (const x of [-0.044, 0.044])
      for (const z of [-0.044, 0.044]) {
        const fan = new T.Mesh(duct, ink);
        fan.rotation.x = -Math.PI / 2;
        fan.position.set(x, 0, z);
        hull.add(fan);
      }
    // Arc-length stations in TubeGeometry differ from our time stations.
    // Build a lookup once per resize so the luminous tip stays at the aircraft.
    const layers = [0.0035, 0.01, 0.022].map((radius, j) => {
      const material = ink.clone();
      if (j) material.blending = T.AdditiveBlending;
      const mesh = new T.Mesh(new T.BufferGeometry(), material);
      swarm.add(mesh);
      return { mesh, radius, strength: [0.56, 0.14, 0.045][j] };
    });
    swarm.add(hull);
    return {
      hull,
      layers,
      ink,
      curve: new ReplayCurve(i, 16),
      lengths: [] as number[],
    };
  });
  let worldWidth = 0;
  const direction = new T.Vector3();
  const fadeSeconds = 0.45;
  const lastArrival = Math.max(...laps.map((lap) => lap.launch + lap.duration));
  let start: number | undefined;
  let phase: 'pass' | 'replays' | 'study' = 'pass';
  function reset() {
    start = undefined;
    swarm.visible = false;
    phase = 'pass';
  }
  function resize(width: number) {
    if (width === worldWidth) return;
    worldWidth = width;
    swarm.scale.setScalar(ringDiameter(width));
    runs.forEach((run, i) => {
      run.curve = new ReplayCurve(i, width);
      run.curve.arcLengthDivisions = segments * 2;
      run.lengths = run.curve.getLengths();
      for (const { mesh, radius } of run.layers) {
        mesh.geometry.dispose();
        mesh.geometry = new T.TubeGeometry(
          run.curve,
          segments,
          radius,
          sides,
          false,
        );
      }
    });
  }
  function update(
    progress: number,
    now: number,
    day: number,
    lastScroll: number,
  ) {
    if (progress < 0.979 || progress > 1.32) {
      reset();
      return phase;
    }
    if (phase === 'study') return phase;
    start ??= now;
    const elapsed = (now - start) / 1000;
    phase =
      elapsed < lastArrival + 1 || now - lastScroll < 900 ? 'replays' : 'study';
    swarm.visible = phase === 'replays';
    if (!swarm.visible) return phase;
    swarm.position.copy(gate.position);
    runs.forEach(({ hull, layers, ink, curve, lengths }, i) => {
      const age = elapsed - laps[i].launch;
      const duration = laps[i].duration;
      const visible = age >= 0 && age < duration + fadeSeconds;
      hull.visible = visible && age < duration;
      for (const { mesh } of layers) mesh.visible = visible;
      if (!visible) return;
      const t = Math.min(1, age / duration);
      curve.getPoint(t, hull.position);
      curve.getTangent(t, direction);
      hull.rotation.set(
        -Math.asin(direction.y) + 0.12,
        Math.atan2(direction.x, direction.z),
        0.06 * laps[i].drift,
        'YXZ',
      );
      ink.opacity = 0.82;
      const station = (fraction: number) => {
        const s = Math.round(fraction * (lengths.length - 1));
        return (
          Math.round((segments * lengths[s]) / lengths[lengths.length - 1]) *
          sides *
          6
        );
      };
      const head = station(t);
      const tail = station(Math.max(0, t - 0.28));
      for (const { mesh, strength } of layers) {
        mesh.geometry.setDrawRange(tail, head - tail);
        mesh.material.opacity =
          strength *
          (1 - T.MathUtils.smoothstep(age, duration, duration + fadeSeconds)) *
          (1 - 0.18 * day);
      }
    });
    return phase;
  }
  reset();
  return { reset, resize, update };
}
