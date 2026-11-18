import { radioControls } from '../data/radio-controls';
import { currentAircraft } from '../lib/aircraft';
import * as T from 'three';
import { raceReplays } from './race-replays';
import { parts } from '../data/airframe';
import {
  makeWhoop,
  makeGate,
  makeRadio,
  studioLights,
  disposeScene,
} from './specimen';

const clamp = T.MathUtils.clamp,
  mix = T.MathUtils.lerp;
const ease = (a: number, b: number, p: number) =>
  T.MathUtils.smoothstep(p, a, b);
function sample(keys: number[][], p: number) {
  let i = 1;
  while (i < keys.length - 1 && keys[i][0] < p) i++;
  const a = keys[i - 1],
    b = keys[i];
  // Monotone cubic interpolation keeps velocity continuous through the gate.
  const span = b[0] - a[0],
    t = clamp((p - a[0]) / span, 0, 1),
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
function fadeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(48, 48, 1, 48, 48, 47);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.38, 'rgba(255,255,255,.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 96, 96);
  return new T.CanvasTexture(canvas);
}
// A brief exposure of three blades keeps a resting render legible as a spinning rotor.
function rotorExposure() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(64, 64);
  for (let j = 0; j < 3; j++) {
    ctx.save();
    ctx.rotate((j * Math.PI * 2) / 3);
    for (let i = 0; i < 15; i++) {
      ctx.rotate(0.036);
      ctx.fillStyle = 'rgba(219,231,236,' + (0.007 + i * 0.0018) + ')';
      ctx.beginPath();
      ctx.moveTo(5, -2);
      ctx.bezierCurveTo(22, -7, 47, -1, 58, 6);
      ctx.quadraticCurveTo(65, 14, 53, 15);
      ctx.quadraticCurveTo(31, 15, 5, 2);
      ctx.fill();
    }
    ctx.restore();
  }
  return new T.CanvasTexture(canvas);
}
// Positions are composed for the page in fractions of the viewport. They are
// animation keyframes, not flight dynamics or a transmitter configuration.
const path = [
  [0, 0.704, 0.439, 0.66, 0.32, -0.38, 0, 3.5],
  [0.2, 0.738, 0.38, 0.84, 0.43, -0.52, -0.16, 3.3],
  [0.48, 0.78, 0.32, 0.47, 0.34, -0.92, 0.22, 2.7],
  [0.78, 0.69, 0.435, 0.22, 0.25, -1.18, 0.27, 0],
  [1.08, 0.31, 0.54, 0.61, 0.43, -0.65, 0.16, -2.8],
  [1.34, 0.266, 0.51, 0.63, 0.56, -0.3, -0.115, -3.2],
  [1.65, 0.49, 0.49, 0.72, 0.67, -0.23, -0.025, 0],
  [2, 0.5, 0.5, 0.58, 0.54, -0.32, 0, 0],
  [2.31, 0.5, 0.5, 0.58, 0.54, -0.32, 0, 0],
  [2.84, 0.37, 0.485, 0.7, 0.55, -0.31, -0.06, 0],
  [3, 0.726, 0.465, 0.7, 0.43, -0.16, 0, 0],
  [4, 0.726, 0.465, 0.7, 0.43, -0.16, 0, 0],
];
export function mountFlight(host: HTMLElement, story: HTMLElement) {
  const renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new T.Scene(),
    camera = new T.OrthographicCamera(-8, 8, 5, -5, 0.1, 60);
  camera.position.z = 16;
  studioLights(scene);
  const openFrame = currentAircraft() === 'seven';
  const quad = makeWhoop(openFrame),
    gate = makeGate(),
    radio = makeRadio();
  scene.add(quad.root, gate.root, radio.root);
  const ghosts = raceReplays(gate.root);
  const texture = fadeTexture(),
    smear = rotorExposure();
  const exposure = new T.MeshBasicMaterial({
    map: smear,
    side: T.DoubleSide,
    transparent: true,
    depthWrite: false,
  });
  for (const rotor of quad.rotors) {
    const fan = new T.Mesh(new T.PlaneGeometry(1.92, 1.92), exposure);
    fan.rotation.x = -Math.PI / 2;
    fan.position.y = 0.04;
    rotor.add(fan);
  }
  function sprite(parent: T.Object3D, color: string) {
    const mat = new T.SpriteMaterial({
      map: texture,
      color,
      transparent: true,
      depthWrite: false,
    });
    const node = new T.Sprite(mat);
    parent.add(node);
    return node;
  }
  const shadow = sprite(scene, '#000000'),
    gateShade = sprite(scene, '#000000');
  const lamps = [sprite(quad.parts['light-strip'], '#bff7dd')];
  lamps[0].position.set(0, 0.072, 0.685);
  lamps[0].scale.set(0.55, 0.17, 1);
  lamps[0].material.blending = T.AdditiveBlending;
  const bounce = new T.PointLight(0xffffff, 0.4, 1.1);
  bounce.position.set(0, 0.073, 0.74);
  quad.parts['light-strip'].add(bounce);
  const spill = sprite(scene, '#bff7dd');
  const controlNodes = radioControls.map(
    (c) => (c.kind === 'switch' ? radio.switches : radio.sticks)[c.slot],
  );
  const gimbalLights = controlNodes.map((node, i) => {
    const lamp = sprite(node, '#90d7eb');
    if (radioControls[i].kind === 'stick') lamp.position.set(0, 0.05, 0.29);
    else lamp.position.set(Math.sign(node.position.x) * 0.12, 0.24, 0.08);
    lamp.scale.setScalar(0.42);
    return lamp;
  });
  const haloMaterial = new T.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: T.AdditiveBlending,
  });
  const halo = new T.Mesh(
    new T.TorusGeometry(1.72, 0.155, 8, 80),
    haloMaterial,
  );
  // A narrow luminous insert sits on the inner, front-facing lip of the hoop.
  const insertMaterial = new T.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
  });
  const insert = new T.Mesh(
    new T.TorusGeometry(1.664, 0.019, 6, 80),
    insertMaterial,
  );
  insert.position.z = 0.085;
  gate.root.add(halo, insert);
  const solids = new Set<T.MeshStandardMaterial>();
  quad.root.traverse((n) => {
    if (
      n instanceof T.Mesh &&
      n.material instanceof T.MeshStandardMaterial &&
      n.material !== quad.blade
    )
      solids.add(n.material);
  });
  let oldDiagram = 0;
  const units = parts.map((part) => {
    const node = quad.parts[part.id];
    const first = node.children[0];
    const representative = ['motor', 'propeller'].includes(part.id);
    const bounds = new T.Box3().setFromObject(representative ? first : node);
    const centre = bounds.getCenter(new T.Vector3());
    const ink = new T.LineBasicMaterial({
      color: 0x99c3cc,
      transparent: true,
      depthWrite: false,
    });
    const edges: T.LineSegments[] = [];
    node.traverse((child) => {
      if (child instanceof T.Mesh && child.material !== exposure) {
        const wire = new T.LineSegments(
          new T.EdgesGeometry(child.geometry, 42),
          ink,
        );
        edges.push(wire);
        child.add(wire);
      }
    });
    return { part, node, centre, ink, edges, emphasis: 0 };
  });
  const abort = new AbortController(),
    signal = abort.signal;
  const chapters = ['hero', 'motion', 'anatomy', 'radio', 'display'].map((id) =>
    document.getElementById(id)!,
  );
  let anchors: number[] = [],
    w = 16,
    p = 0,
    goal = 0,
    raf = 0,
    previous = 0,
    disposed = false,
    visible = true;
  let introStart = Number(story.dataset.takeoff ?? performance.now());
  let slowFrames = 0;
  let lastCaption = '';
  let radioPitch = 0,
    radioYaw = 0;
  let elapsed = 0,
    lastMove = 0,
    hoverX = 0,
    hoverY = 0,
    tx = 0,
    ty = 0,
    focus = '',
    pose = Number(story.dataset.radioPose ?? 0),
    lift = 0,
    bank = 0,
    radioSettling = false,
    scrollMotion = 0;
  let day = document.documentElement.dataset.theme === 'light' ? 1 : 0,
    dayGoal = day;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);
  const inv = new T.Quaternion(),
    target = new T.Vector3();

  const leaves = story.querySelector<HTMLElement>('.scatter');
  function invalidate() {
    if (!disposed && visible && !document.hidden && !raf)
      raf = requestAnimationFrame(draw);
  }
  function measure() {
    const h = host.clientHeight || innerHeight,
      wpx = host.clientWidth;
    w = (10 * wpx) / h;
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(wpx, h, false);
    anchors = chapters.map((el) => el.getBoundingClientRect().top + scrollY);
    scroll();
  }
  function scroll() {
    let i = 0;
    while (i < anchors.length - 2 && scrollY >= anchors[i + 1]) i++;
    goal = clamp(
      i + (scrollY - anchors[i]) / Math.max(1, anchors[i + 1] - anchors[i]),
      0,
      4,
    );
    if (goal > 0.008) {
      tx = 0;
      ty = 0;
    }
    invalidate();
  }
  function positionPart(
    unit: (typeof units)[number],
    spread: number,
    dt: number,
  ) {
    const { part, node, centre } = unit;
    const destX = (part.x - 0.5) * w,
      destY = (0.5 - part.y) * 10;
    const emphasis = focus === part.id ? 1 : 0;
    unit.emphasis = mix(unit.emphasis, emphasis, dt);
    const size = mix(
      1,
      ((part.scale * Math.min(1, w / 16)) / quad.root.scale.x) *
        (1 + 0.085 * unit.emphasis),
      spread,
    );
    node.scale.setScalar(size);
    target
      .set(destX, destY, 0.2)
      .sub(quad.root.position)
      .applyQuaternion(inv)
      .divideScalar(quad.root.scale.x);
    node.position
      .copy(target)
      .multiplyScalar(spread)
      .addScaledVector(centre, -size * spread);
  }
  function draw(now: number) {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    const frameMs = now - previous;
    if (
      frameMs < 1000 / 32 &&
      p === goal &&
      now - lastMove > 550 &&
      day === dayGoal
    ) {
      invalidate();
      return;
    }
    slowFrames = frameMs > 35 && frameMs < 180 ? slowFrames + 1 : 0;
    if (slowFrames === 10 && renderer.getPixelRatio() > 1)
      renderer.setPixelRatio(1);
    const delta = Math.min(frameMs / 1000, 0.055);
    previous = now;
    const follow = 1 - Math.exp(-delta * 13);
    elapsed = story.dataset.bookPaused
      ? 0
      : Math.max(0, (now - introStart) / 1000);
    scrollMotion = mix(
      scrollMotion,
      Math.min(1, Math.abs(goal - p) * 9),
      follow,
    );
    p = Math.abs(goal - p) > 0.65 ? goal : mix(p, goal, follow);
    if (Math.abs(goal - p) < 0.0005) p = goal;
    day = mix(day, dayGoal, follow * 0.62);
    if (Math.abs(day - dayGoal) < 0.002) day = dayGoal;
    hoverX = mix(hoverX, tx, follow * 0.67);
    hoverY = mix(hoverY, ty, follow * 0.67);
    const take = ease(1.82, 3.56, elapsed),
      hero = 1 - ease(0.03, 0.46, p);

    const [x, y, k, rx, ry, rz, z] = sample(path, p);
    const spread = ease(1.77, 1.99, p) * (1 - ease(2.5, 2.84, p));
    const boardReady = String(spread > 0.995);
    if (story.dataset.boardReady !== boardReady)
      story.dataset.boardReady = boardReady;
    story.style.setProperty(
      '--mat-opacity',
      String(ease(1.69, 1.95, p) * (1 - ease(2.54, 2.85, p))),
    );
    story.style.setProperty(
      '--intro-opacity',
      String(p > 0.02 ? 1 : ease(0.64, 1.14, elapsed)),
    );
    const drawing =
      ease(1.38, 1.65, p) * (1 - ease(1.88, 2.08, p)) + 0.16 * spread;
    const diagram = ease(1.49, 1.73, p) * (1 - ease(1.79, 1.96, p));
    if (diagram !== oldDiagram) {
      for (const material of solids) {
        const translucent = diagram > 0.003;
        if (material.transparent !== translucent) {
          material.transparent = translucent;
          material.depthWrite = !translucent;
          material.needsUpdate = true;
        }
        material.opacity = 1 - 0.9 * diagram;
      }
      oldDiagram = diagram;
    }
    const inRadio = ease(2.77, 2.99, p);
    const ax = Number(story.dataset.radioX ?? 0),
      ay = Number(story.dataset.radioY ?? 0);
    const targetLift =
      story.dataset.radioLanded === 'true'
        ? 0
        : story.dataset.radioIdle === 'true'
          ? 0.05
          : pose === 2
            ? 0.74 + ay * 0.25
            : pose === 1
              ? 0.09
              : 1;
    const targetBank = pose === 3 ? ax : 0;
    radioPitch = mix(radioPitch, pose === 3 ? ay : 0, follow * 0.6);
    radioYaw = mix(radioYaw, pose === 2 ? ax : 0, follow * 0.6);
    lift = mix(lift, targetLift, follow * 0.65);
    bank = mix(bank, targetBank, follow * 0.65);
    if (leaves && !leaves.hidden)
      leaves.style.opacity = String(1 - ease(0.15, 0.35, p));
    const exitLanding = 1 - ease(3.16, 3.72, p);
    radioSettling =
      Math.abs(targetLift - lift) + Math.abs(targetBank - bank) > 0.002;
    const bob =
      hero *
      take *
      (elapsed < 7
        ? Math.sin(elapsed * 1.5) * 0.035 * (1 - ease(5.5, 7, elapsed))
        : 0);
    quad.root.position.set(
      (x - 0.5) * w + hoverX * 0.14 * hero,
      (0.5 - y) * 10 -
        1.2 * (1 - take) * hero +
        bob +
        (0.92 * lift * exitLanding - 0.42) * inRadio,
      z,
    );
    quad.root.rotation.order = 'ZXY';
    quad.root.rotation.set(
      rx + hoverY * 0.1 * hero + radioPitch * 0.27 * inRadio,
      ry + hoverX * 0.13 * hero + radioYaw * 0.35 * inRadio,
      rz - hoverX * 0.095 * hero + bank * 0.33 * inRadio,
      'ZXY',
    );
    quad.root.scale.setScalar(
      Math.min(w * 0.117, 2.15) * k * (openFrame ? 0.86 : 1),
    );
    quad.theme(day);
    inv.copy(quad.root.quaternion).invert();
    for (const unit of units) {
      positionPart(unit, spread, follow);
      const pinned = focus === unit.part.id;
      unit.ink.color.set(
        pinned ? haloMaterial.color : day > 0.5 ? '#357483' : '#b3dce4',
      );
      unit.ink.opacity = clamp(
        drawing * (focus && !pinned ? 0.3 : 1) + (pinned ? 0.46 : 0),
        0,
        0.84,
      );
      for (const wire of unit.edges) wire.visible = unit.ink.opacity > 0.035;
    }
    for (const repeat of quad.repeats) {
      repeat.scale.setScalar(1 - ease(0, 0.65, spread));
      repeat.visible = spread < 0.64;
    }
    const departure =
      Math.max(1 - hero, ease(1.38, 2.05, elapsed)) * (1 - ease(1.46, 1.69, p));
    const arrival =
      ease(2.84, 2.95, p) * (1 - inRadio + inRadio * lift * exitLanding);
    const speed = Math.max(departure, arrival);
    const spinning = speed > 0.005;
    exposure.opacity = speed * (0.88 + 0.12 * scrollMotion);
    quad.blade.opacity =
      0.68 * (1 - speed) + (0.055 - 0.045 * scrollMotion) * speed;
    quad.rotors.forEach((r, i) => {
      if (spinning)
        r.rotation.y +=
          delta *
          speed *
          (78 + 58 * scrollMotion) *
          (i === 0 || i === 3 ? 1 : -1) *
          (1 - spread);
    });
    for (const lamp of lamps)
      lamp.material.opacity = 0.84 * (1 - day) * (1 - spread);
    gate.root.visible = p > 0.16 && p < 1.69;
    gate.root.position.set(
      0.19 * w,
      (0.5 - 0.435) * 10 -
        (1 - ease(0.15, 0.6, p)) * 6 +
        ease(1.14, 1.69, p) * 6,
      0,
    );
    gate.root.rotation.set(0.045, 0.76, 0.018);
    gate.root.scale.setScalar(Math.min(w / 16, 1.15));
    const replaying = ghosts.update(p, now, day);
    insert.visible = halo.visible = day < 0.98;
    insertMaterial.opacity = (1 - day) * (0.8 + 0.1 * Math.sin(now * 0.0019));
    haloMaterial.opacity = (1 - day) * (0.16 + 0.04 * Math.sin(now * 0.0019));
    gate.accent.emissiveIntensity =
      (1 - day) * (1.6 + 0.28 * Math.sin(now * 0.0019));
    const caption = (ease(0.9, 1.04, p) * (1 - ease(1.35, 1.58, p))).toFixed(3);
    if (lastCaption !== caption) {
      story.style.setProperty('--caption-opacity', caption);
      lastCaption = caption;
    }
    gateShade.visible = gate.root.visible;
    gateShade.position.copy(gate.root.position);
    gateShade.position.y -= 2.8 * gate.root.scale.x;
    gateShade.position.z = -2;
    gateShade.scale.set(2.6, 0.32, 1);
    gateShade.material.opacity = 0.41;
    shadow.position.set(
      quad.root.position.x,
      mix(
        (0.5 - y) * 10 - quad.root.scale.x * 1.05,
        (0.5 - y) * 10 - 1.2 - quad.root.scale.x * 0.84,
        hero,
      ),
      -3,
    );
    shadow.scale.set(
      5 * quad.root.scale.x * (1 + 0.12 * take),
      0.46 * quad.root.scale.x,
      1,
    );
    shadow.material.opacity = (0.5 - 0.18 * take) * (1 - spread);
    bounce.intensity = (1 - day) * 0.65;
    spill.position.copy(shadow.position);
    spill.position.y += 0.01;
    spill.position.z += 0.04;
    spill.scale.set(
      quad.root.scale.x * (1.28 + 0.45 * take),
      quad.root.scale.x * 0.21,
      1,
    );
    spill.material.opacity = (1 - day) * (1 - spread) * (0.53 - 0.19 * take);
    radio.root.visible = p > 2.59;
    radio.root.position.set((-0.21 - (1 - inRadio) * 0.49) * w, -0.27, 0);
    radio.root.rotation.set(-0.24 * inRadio, 0.32 * inRadio, -0.035 * inRadio);
    radio.root.scale.setScalar(Math.min(w * 0.112, 1.61));
    radio.sticks[0].rotation.x = mix(
      radio.sticks[0].rotation.x,
      pose === 2 ? -ay * 0.7 : 0,
      follow,
    );
    radio.sticks[0].rotation.y = mix(
      radio.sticks[0].rotation.y,
      pose === 2 ? ax * 0.7 : 0,
      follow,
    );
    radio.sticks[1].rotation.x = mix(
      radio.sticks[1].rotation.x,
      pose === 3 ? -ay * 0.65 : 0,
      follow,
    );
    radio.sticks[1].rotation.y = 0.68 * bank;
    for (const [index, control] of radioControls.entries()) {
      if (control.kind !== 'switch') continue;
      const toggle = radio.switches[control.slot];
      const angle =
        pose === index + 1 ? (pose === 4 ? ay * 0.54 : 0.55) : -0.45;
      toggle.rotation.x = mix(toggle.rotation.x, angle, follow * 0.8);
      if (Math.abs(toggle.rotation.x - angle) > 0.002) radioSettling = true;
    }
    // The active control has a small indicator on the transmitter itself.
    for (const [i, lamp] of gimbalLights.entries())
      lamp.material.opacity = inRadio * (i === pose - 1 ? 0.78 : 0);
    if (radio.root.visible) {
      radio.root.updateWorldMatrix(true, false);
      camera.updateMatrixWorld();
      radio.root.localToWorld(target.set(0, -0.95, 0.38)).project(camera);
      const panel = chapters[3].firstElementChild as HTMLElement;
      panel.style.setProperty('--screen-x', (1 + target.x) * 50 + '%');
      panel.style.setProperty('--screen-y', (1 - target.y) * 50 + '%');
      for (const [index, control] of gimbalLights.entries()) {
        control.getWorldPosition(target).project(camera);
        const pin = chapters[3].firstElementChild as HTMLElement;
        pin.style.setProperty(
          '--control-' + index + '-x',
          ((target.x + 1) * 50).toFixed(2) + '%',
        );
        pin.style.setProperty(
          '--control-' + index + '-y',
          ((1 - target.y) * 50).toFixed(2) + '%',
        );
      }
    }
    renderer.render(scene, camera);
    if (!story.dataset.live) {
      story.dataset.live = 'true';
      story.dispatchEvent(new Event('scene-painted'));
    }
    if (
      replaying ||
      spinning ||
      (!story.dataset.bookPaused && elapsed < 3.72 && p < 0.45) ||
      p !== goal ||
      day !== dayGoal ||
      Math.abs(hoverX - tx) + Math.abs(hoverY - ty) > 0.002 ||
      radioSettling ||
      now - lastMove < 550
    )
      invalidate();
  }
  function pointer(ev: PointerEvent) {
    if (!story.dataset.airborne || goal > 0.008 || ev.pointerType !== 'mouse')
      return;
    tx = clamp((ev.clientX / innerWidth - 0.7) * 3.0, -1, 1);
    ty = clamp((ev.clientY / innerHeight - 0.45) * 2, -1, 1);
    lastMove = performance.now();
    invalidate();
  }
  function highlight(ev: Event) {
    focus = (ev as CustomEvent<string>).detail;
    lastMove = performance.now();
    invalidate();
  }
  story.addEventListener('pointermove', pointer, { signal });
  story.addEventListener(
    'pointerleave',
    () => {
      tx = 0;
      ty = 0;
      invalidate();
    },
    { signal },
  );
  story.addEventListener(
    'restart-intro',
    () => {
      introStart = Number(story.dataset.takeoff);
      ghosts.reset();
      hoverX = hoverY = tx = ty = 0;
      invalidate();
    },
    { signal },
  );
  story.addEventListener('part-focus', highlight, { signal });
  story.addEventListener(
    'radio-pose',
    (ev) => {
      pose = (ev as CustomEvent<number>).detail;
      invalidate();
    },
    { signal },
  );
  function lighting() {
    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent')
      .trim();
    for (const lamp of [...lamps, ...gimbalLights])
      lamp.material.color.set(accent);
    spill.material.color.set(accent);
    bounce.color.set(accent);
    haloMaterial.color.set(accent);
    insertMaterial.color.set(accent).lerp(new T.Color(0xfffaf2), 0.24);
    quad.led.emissive.set(accent);
    gate.accent.color.set(accent);
    gate.accent.emissive.set(accent);
  }
  lighting();
  const mo = new MutationObserver(() => {
    lighting();
    dayGoal = document.documentElement.dataset.theme === 'light' ? 1 : 0;
    invalidate();
  });
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-season'],
  });
  const ro = new ResizeObserver(measure);
  ro.observe(host);
  ro.observe(story);
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) invalidate();
  });
  io.observe(host);
  window.addEventListener('scroll', scroll, { passive: true, signal });
  document.addEventListener('visibilitychange', invalidate, { signal });
  function dispose() {
    if (disposed) return;
    disposed = true;
    delete story.dataset.live;
    const pin = chapters[3].firstElementChild as HTMLElement;
    for (const i of radioControls.keys())
      for (const axis of ['x', 'y'])
        pin.style.removeProperty('--control-' + i + '-' + axis);
    cancelAnimationFrame(raf);
    abort.abort();
    io.disconnect();
    mo.disconnect();
    ro.disconnect();
    disposeScene(scene);
    [shadow, gateShade, spill, ...lamps, ...gimbalLights].forEach((s) =>
      s.material.dispose(),
    );
    texture.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }
  canvas.addEventListener(
    'webglcontextlost',
    (e) => {
      e.preventDefault();
      dispose();
    },
    { signal },
  );
  measure();
  p = goal;
  invalidate();
  return dispose;
}
