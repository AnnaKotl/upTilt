import * as T from 'three';
import { gateCrossing, gatePoint } from '../data/flight-path';
import {
  laps,
  lapPoint,
  ringDiameter,
  type LapBend,
} from '../data/gate-replays';

const trailLifetime = 2.2;

class ReplayCurve extends T.Curve<T.Vector3> {
  constructor(
    private index: number,
    private width: number,
    readonly edit?: LapBend,
  ) {
    super();
  }
  getPoint(t: number, target = new T.Vector3()) {
    return target.set(...lapPoint(this.index, t, this.width, this.edit));
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
    const clock = { value: 0 };
    const layers = [0.0035, 0.01, 0.022].map((radius, j) => {
      const material = ink.clone();
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uAge = clock;
        shader.vertexShader =
          'attribute float deposited; varying float born;\n' +
          shader.vertexShader.replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\nborn = deposited;',
          );
        shader.fragmentShader =
          'uniform float uAge; varying float born;\n' +
          shader.fragmentShader.replace(
            '#include <color_fragment>',
            `#include <color_fragment>\ndiffuseColor.a *= 1.0 - smoothstep(0.0, ${trailLifetime}, uAge - born);`,
          );
      };
      if (j) material.blending = T.AdditiveBlending;
      const mesh = new T.Mesh(new T.BufferGeometry(), material);
      swarm.add(mesh);
      return { mesh, radius, strength: [0.56, 0.14, 0.045][j] };
    });
    swarm.add(hull);
    return {
      hull,
      clock,
      layers,
      ink,
      curve: new ReplayCurve(i, 16),
      lengths: [] as number[],
    };
  });
  let worldWidth = 0;
  const direction = new T.Vector3();
  const lastArrival = Math.max(...laps.map((lap) => lap.launch + lap.duration));
  let start: number | undefined;
  let elapsed = 0;
  let launchLimit = Infinity;
  let moving = false;
  let followed = 0;
  let phase: 'pass' | 'replays' | 'study' = 'pass';
  function reset() {
    start = undefined;
    launchLimit = Infinity;
    followed = 0;
    elapsed = 0;
    moving = false;
    swarm.visible = false;
    phase = 'pass';
  }
  function resize(width: number) {
    if (width === worldWidth) return;
    worldWidth = width;
    if (start !== undefined)
      swarm.position.set(...gatePoint(gateCrossing, width));
    swarm.scale.setScalar(ringDiameter(width));
    runs.forEach((run, i) => reshape(i, run.curve.edit));
  }
  function reshape(i: number, edit?: LapBend) {
    const run = runs[i];
    run.curve = new ReplayCurve(i, worldWidth, edit);
    run.curve.arcLengthDivisions = segments * 2;
    run.lengths = run.curve.getLengths();
    const stamps = new Float32Array((segments + 1) * (sides + 1));
    for (let j = 0; j <= segments; j++) {
      const time = run.curve.getUtoTmapping(j / segments, 0) * laps[i].duration;
      stamps.fill(time, j * (sides + 1), (j + 1) * (sides + 1));
    }
    const deposited = new T.BufferAttribute(stamps, 1);
    for (const { mesh, radius } of run.layers) {
      mesh.geometry.dispose();
      mesh.geometry = new T.TubeGeometry(
        run.curve,
        segments,
        radius,
        sides,
        false,
      );
      mesh.geometry.setAttribute('deposited', deposited);
    }
  }
  function update(
    progress: number,
    now: number,
    day: number,
    lastScroll: number,
  ) {
    const parked = progress >= 0.979 && progress <= 1.32;
    if (
      !parked &&
      (start === undefined || progress < 0.4 || progress >= 1.72)
    ) {
      reset();
      return phase;
    }
    if (start === undefined) {
      start = now;
      swarm.position.copy(gate.position);
    }
    elapsed = (now - start) / 1000;
    if (!parked) launchLimit = Math.min(elapsed, launchLimit);
    const studying =
      phase === 'study' ||
      (elapsed >= lastArrival + 1 && now - lastScroll >= 900);
    phase = !parked ? 'pass' : studying ? 'study' : 'replays';
    moving = false;
    let airborneIndex = -1;
    const visibility =
      (1 - T.MathUtils.smoothstep(progress, 1.34, 1.7)) *
      T.MathUtils.smoothstep(progress, 0.4, 0.96);
    runs.forEach(({ hull, clock, layers, ink, curve, lengths }, i) => {
      const age = elapsed - laps[i].launch;
      const duration = laps[i].duration;
      const visible =
        laps[i].launch <= launchLimit &&
        age >= 0 &&
        age < duration + trailLifetime;
      moving ||= visible;
      clock.value = age;
      hull.visible = visible && age < duration;
      if (hull.visible && airborneIndex < 0) airborneIndex = i;
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
      ink.opacity = 0.82 * visibility;
      const station = (fraction: number) => {
        const s = Math.round(fraction * (lengths.length - 1));
        return (
          Math.round((segments * lengths[s]) / lengths[lengths.length - 1]) *
          sides *
          6
        );
      };
      const head = station(t);

      for (const { mesh, strength } of layers) {
        mesh.geometry.setDrawRange(0, head);
        mesh.material.opacity = strength * visibility * (1 - 0.18 * day);
      }
    });
    if (airborneIndex >= 0) followed = airborneIndex;
    swarm.visible = moving;
    if (!moving && launchLimit !== Infinity) {
      reset();
      if (parked) phase = 'replays'; // Start a fresh pass after the interrupted group clears.
    }
    return phase;
  }
  reset();
  return {
    reset,
    reshape,
    resize,
    update,
    get followed() {
      return followed;
    },
    get elapsed() {
      return elapsed;
    },
    get moving() {
      return moving;
    },
  };
}
