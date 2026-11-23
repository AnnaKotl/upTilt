import * as T from 'three';
import { gateCrossing, gateExitEnd, gatePoint } from '../data/flight-path';
import {
  laps,
  lapPoint,
  ringDiameter,
  type LapBend,
} from '../data/gate-replays';

const trailLifetime = 2.2;
export const replayExit = 1.32;

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
  const runs = laps.map(({ color, lightColor }, i) => {
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
      nightInk: new T.Color(color),
      dayInk: new T.Color(lightColor),
      curve: new ReplayCurve(i, 16),
      lengths: [] as number[],
      launchedAt: undefined as number | undefined,
    };
  });
  let worldWidth = 0;
  const direction = new T.Vector3();
  let inVisit = false;
  let nearLastFrame = false;
  let previousFrame: number | undefined;
  let elapsed = 0;
  let launchClock = 0;
  let lastLanding: number | undefined;
  let survey = 0;
  let settled = false;
  let moving = false;
  let followed = 0;
  let followedAge = 0;

  function pause() {
    previousFrame = undefined;
  }
  function reset() {
    inVisit = nearLastFrame = moving = settled = false;
    pause();
    elapsed = launchClock = survey = followed = followedAge = 0;
    lastLanding = undefined;
    for (const run of runs) run.launchedAt = undefined;
    swarm.visible = false;
  }
  function resize(width: number) {
    if (width === worldWidth) return;
    worldWidth = width;
    if (inVisit) swarm.position.set(...gatePoint(gateCrossing, width));
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
    const parked = progress >= 0.979 && progress <= replayExit;
    if (progress < 0.9 || progress >= gateExitEnd) {
      if (inVisit) reset();
      return 'pass';
    }
    if (!inVisit) {
      if (!parked) return 'pass';
      inVisit = true;
      swarm.position.copy(gate.position);
    }
    // Small scroll reversals stay in the same visit. Beyond that margin,
    // active aircraft coast while the clock for new launches waits.
    const near =
      parked || (nearLastFrame && progress >= 0.958 && progress < 1.34);
    const step = previousFrame === undefined ? 0 : (now - previousFrame) / 1000;
    elapsed += step;
    if (nearLastFrame) launchClock += step;

    if ((near || nearLastFrame) && lastLanding === undefined) {
      runs.forEach((run, i) => {
        const { launch } = laps[i];
        if (run.launchedAt === undefined && launchClock >= launch)
          run.launchedAt = elapsed - (launchClock - launch);
      });
      if (runs.every((run) => run.launchedAt !== undefined))
        lastLanding = Math.max(
          ...runs.map((run, i) => run.launchedAt! + laps[i].duration),
        );
    }
    previousFrame = now;
    nearLastFrame = near;
    survey =
      lastLanding === undefined
        ? 0
        : T.MathUtils.smoothstep(elapsed - lastLanding, 0.04, 1.55);
    if (
      near &&
      lastLanding !== undefined &&
      elapsed >= lastLanding + trailLifetime &&
      now - lastScroll >= 600
    )
      settled = true;
    const phase = near ? (settled ? 'study' : 'replays') : 'pass';

    moving = false;
    let airborneIndex = -1;
    const visibility =
      (1 - T.MathUtils.smoothstep(progress, 1.355, gateExitEnd)) *
      T.MathUtils.smoothstep(progress, 0.9, 0.979);
    runs.forEach(
      (
        {
          hull,
          clock,
          layers,
          ink,
          nightInk,
          dayInk,
          curve,
          lengths,
          launchedAt,
        },
        i,
      ) => {
        const age = launchedAt === undefined ? -1 : elapsed - launchedAt;
        const duration = laps[i].duration;
        const visible = age >= 0 && age < duration + trailLifetime;
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
        ink.color.lerpColors(nightInk, dayInk, day);
        const station = (fraction: number) => {
          const s = Math.round(fraction * (lengths.length - 1));
          return (
            Math.round((segments * lengths[s]) / lengths[lengths.length - 1]) *
            sides *
            6
          );
        };
        const head = station(t);

        for (const [index, { mesh, strength }] of layers.entries()) {
          mesh.geometry.setDrawRange(0, head);
          mesh.material.color.copy(ink.color);
          mesh.material.blending =
            index > 0 && day < 0.5 ? T.AdditiveBlending : T.NormalBlending;
          const daylightWeight = index === 0 ? 1 + 0.28 * day : 1 - 0.25 * day;
          mesh.material.opacity =
            strength * visibility * daylightWeight * (1 - 0.4 * survey);
        }
      },
    );
    if (airborneIndex >= 0) followed = airborneIndex;
    const launchedAt = runs[followed].launchedAt;
    followedAge =
      launchedAt === undefined
        ? 0
        : Math.min(elapsed - launchedAt, laps[followed].duration);
    swarm.visible = moving;
    return phase;
  }
  reset();
  return {
    reset,
    pause,
    reshape,
    resize,
    update,
    get followed() {
      return followed;
    },
    get elapsed() {
      return elapsed;
    },
    get followedAge() {
      return followedAge;
    },
    get survey() {
      return survey;
    },
    get awaitingArrival() {
      return lastLanding === undefined || elapsed < lastLanding;
    },
    get moving() {
      return moving;
    },
  };
}
