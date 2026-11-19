import { radioControls } from '../data/radio-controls';
import { currentAircraft } from '../lib/aircraft';
import * as T from 'three';
import { raceReplays } from './race-replays';
import { parts, matPosition, separateBoards } from '../data/airframe';
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
// Four softened contact patches preserve the footprint as the craft lifts.
function beamTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  for (let row = 0; row < canvas.height; row++) {
    const t = row / canvas.height;
    const radius = 5 + 42 * t;
    const intensity = Math.min(1, t * 20) * Math.pow(1 - t, 1.6);
    const fade = ctx.createLinearGradient(48 - radius, 0, 48 + radius, 0);
    for (const [offset, opacity] of [
      [0, 0],
      [0.22, 0.16],
      [0.5, 0.63],
      [0.78, 0.16],
      [1, 0],
    ])
      fade.addColorStop(
        offset,
        'rgba(255,255,255,' + opacity * intensity + ')',
      );
    ctx.fillStyle = fade;
    ctx.fillRect(0, row, 96, 1);
  }
  return new T.CanvasTexture(canvas);
}
function groundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  const patches = [
    [53, 42, 40],
    [119, 29, 32],
    [76, 67, 35],
    [145, 55, 37],
    [97, 49, 42],
  ];
  for (const [x, y, r] of patches) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.56);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, 'rgba(255,255,255,.77)');
    g.addColorStop(0.46, 'rgba(255,255,255,.40)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }
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
  [0, 0.72, 0.5, 0.66, 0.32, -0.38, 0, 3.5],
  [0.12, 0.72, 0.49, 0.77, 0.08, 0, 0, 3.6],
  [0.26, 0.738, 0.46, 0.89, -0.13, 0.49, -0.12, 3.3],
  [0.48, 0.76, 0.58, 0.49, 0.57, 0.63, 0.22, 2.7],
  [0.78, 0.58, 0.435, 0.22, 0.25, -1.18, 0.27, 0],
  [0.98, 0.205, 0.535, 0.44, 0.32, 0.36, 0.08, -2.8],
  [1.32, 0.205, 0.535, 0.44, 0.32, 0.36, 0.08, -2.8],
  [1.57, 0.5, 0.46, 0.68, 1.03, 0, 0, 0],
  [1.8, 0.5, 0.46, 0.68, 1.03, 0, 0, 0],
  [2, 0.5, 0.5, 0.58, 0.58, -0.15, 0, 0],
  [2.31, 0.5, 0.5, 0.58, 0.58, -0.15, 0, 0],
  [2.4, 0.5, 0.5, 0.58, 0.58, -0.15, 0, 0],
  [2.72, 0.5, 0.46, 0.68, 1.03, 0, 0, 0],
  [2.76, 0.5, 0.46, 0.68, 1.03, 0, 0, 0],
  [2.88, 0.645, 0.39, 0.59, 0.38, 0.55, -0.12, 0],
  [3, 0.77, 0.41, 0.53, 0.23, 0.24, 0, 0],
  [4, 0.77, 0.41, 0.53, 0.23, 0.24, 0, 0],
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
  // Put the readout in the glass plane so its perspective and depth follow the case.
  const lcd = document.createElement('canvas');
  lcd.width = 512;
  lcd.height = 256;
  const lcdContext = lcd.getContext('2d')!;
  const lcdTexture = new T.CanvasTexture(lcd);
  lcdTexture.colorSpace = T.SRGBColorSpace;
  const readout = new T.Mesh(
    new T.PlaneGeometry(1.73, 0.9),
    new T.MeshBasicMaterial({
      map: lcdTexture,
      transparent: true,
      depthWrite: false,
    }),
  );
  readout.position.set(0, -0.95, 0.368);
  radio.root.add(readout);
  let lastReadout: string | undefined;
  function updateReadout() {
    const term = story.dataset.radioTerm ?? '';
    const cue = story.dataset.radioCue ?? '';
    const powered = story.dataset.radioPower !== 'off';
    const level = Number(story.dataset.radioLevel ?? 6);
    radio.power.emissive.copy(accentLight);
    radio.power.emissiveIntensity = powered ? 0.78 : 0;
    radio.indicators.forEach((indicator, i) => {
      indicator.emissive.copy(accentLight);
      indicator.emissiveIntensity = i < level ? 0.7 : 0;
    });
    const key = powered + term + cue;
    if (key === lastReadout) return;
    lastReadout = key;
    radio.screen.color.set(powered ? '#bfd7e1' : '#10161b');
    lcdContext.fillStyle = powered ? '#d1e5eb' : '#10161b';
    lcdContext.fillRect(0, 0, lcd.width, lcd.height);
    if (!powered) {
      lcdTexture.needsUpdate = true;
      return;
    }
    lcdContext.font = 'bold 45px monospace';
    lcdContext.fillStyle = '#263b46';
    lcdContext.textAlign = 'center';
    lcdContext.textBaseline = 'middle';
    lcdContext.fillText(term.toUpperCase(), 256, cue ? 178 : 128);
    if (cue) {
      lcdContext.save();
      lcdContext.translate(256, 86);
      lcdContext.strokeStyle = lcdContext.fillStyle;
      lcdContext.lineWidth = 7;
      lcdContext.lineCap = lcdContext.lineJoin = 'round';
      lcdContext.beginPath();
      if (cue === 'cw' || cue === 'ccw') {
        lcdContext.scale(cue === 'cw' ? 1 : -1, 1);
        lcdContext.arc(0, 0, 30, Math.PI * 0.36, Math.PI * 2);
        lcdContext.moveTo(15, -12);
        lcdContext.lineTo(30, 1);
        lcdContext.lineTo(42, -14);
      } else {
        lcdContext.rotate(
          (({ right: 1, down: 2, left: -1 }[cue] ?? 0) * Math.PI) / 2,
        );
        lcdContext.moveTo(0, 32);
        lcdContext.lineTo(0, -32);
        lcdContext.moveTo(-18, -14);
        lcdContext.lineTo(0, -32);
        lcdContext.lineTo(18, -14);
      }
      lcdContext.stroke();
      lcdContext.restore();
    }
    lcdTexture.needsUpdate = true;
  }
  const ghosts = raceReplays(scene, gate.root);
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
  const footprint = groundTexture();
  shadow.material.map = footprint;
  const lamps = [sprite(quad.parts['light-strip'], '#bff7dd')];
  lamps[0].position.set(0, -0.317, 0.883);
  lamps[0].scale.set(0.27, 0.065, 1);
  lamps[0].material.blending = T.AdditiveBlending;
  const beam = beamTexture();
  const underglow = new T.Mesh(
    new T.PlaneGeometry(1.18, 2.05).translate(0, -1.025, 0),
    new T.MeshBasicMaterial({
      map: beam,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      blending: T.AdditiveBlending,
    }),
  );
  underglow.rotation.x = -1.31;
  underglow.position.set(0, -0.319, 0.887);
  quad.parts['light-strip'].add(underglow);
  const controlNodes = radioControls.map(
    (c) => (c.kind === 'switch' ? radio.switches : radio.sticks)[c.slot],
  );
  const gimbalLights = controlNodes.map((node, i) => {
    const lamp = sprite(node, '#90d7eb');
    if (radioControls[i].kind === 'stick') lamp.position.set(0, 0.05, 0.29);
    else lamp.position.copy(radio.switchTips[radioControls[i].slot]);
    lamp.scale.setScalar(0.42);
    return lamp;
  });
  const accentLight = new T.Color();
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
  const units = parts
    .filter((part) => openFrame || !separateBoards.has(part.id))
    .map((part) => {
      const node = quad.parts[part.id];
      const first = node.children[0];
      const representative = ['motor', 'propeller'].includes(part.id);
      const bounds = new T.Box3();
      node.updateWorldMatrix(true, true);
      (representative ? first : node).traverse((child) => {
        if (
          !(child instanceof T.Mesh) ||
          child.material === exposure ||
          child === underglow
        )
          return;
        child.geometry.computeBoundingBox();
        bounds.union(
          child.geometry.boundingBox!.clone().applyMatrix4(child.matrixWorld),
        );
      });
      const corners: T.Vector3[] = [];
      for (const x of [bounds.min.x, bounds.max.x])
        for (const y of [bounds.min.y, bounds.max.y])
          for (const z of [bounds.min.z, bounds.max.z])
            corners.push(new T.Vector3(x, y, z));
      const centre = bounds.getCenter(new T.Vector3());
      const ink = new T.LineBasicMaterial({
        color: 0x99c3cc,
        transparent: true,
        depthWrite: false,
      });
      const edges: T.LineSegments[] = [];
      node.traverse((child) => {
        if (
          child instanceof T.Mesh &&
          child.material !== exposure &&
          child !== underglow
        ) {
          const wire = new T.LineSegments(
            new T.EdgesGeometry(child.geometry, 42),
            ink,
          );
          edges.push(wire);
          child.add(wire);
        }
      });
      return {
        part,
        corners,
        slot: matPosition(part, openFrame),
        node,
        centre,
        ink,
        edges,
        emphasis: 0,
      };
    });
  // Project just the selected part onto the mat, using its actual silhouette.
  const contact = new T.Group();
  const partLight = new T.PointLight(0xfff6eb, 0, 2);
  scene.add(partLight);
  scene.add(contact);
  const shade = new T.MeshBasicMaterial({
    color: 0x030506,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  const flatten = new T.Matrix4();
  let shadowOwner = '';
  function updateContact() {
    const unit = units.find((u) => u.part.id === focus);
    if (focus !== shadowOwner) {
      contact.clear();
      unit?.node.traverse((child) => {
        if (
          !(child instanceof T.Mesh) ||
          child.material === exposure ||
          child === underglow
        )
          return;
        for (
          let p: T.Object3D | null = child;
          p && p !== unit.node;
          p = p.parent
        )
          if (!p.visible) return;
        const shape = new T.Mesh(child.geometry, shade);
        shape.userData.source = child;
        shape.matrixAutoUpdate = false;
        contact.add(shape);
      });
      shadowOwner = focus;
    }
    partLight.intensity = unit ? 1.45 * unit.emphasis : 0;
    if (!unit) return;
    partLight.position.set(
      (unit.slot.x - 0.5) * w - 0.24,
      (0.5 - unit.slot.y) * 10 + 0.46,
      1.5,
    );
    flatten
      .makeScale(1, 1, 0.001)
      .setPosition(0.025, -0.08 - unit.emphasis * 0.09, -2.2);
    for (const shape of contact.children) {
      shape.matrix.multiplyMatrices(flatten, shape.userData.source.matrixWorld);
      shape.matrixWorldNeedsUpdate = true;
    }
  }
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
    const destX = (unit.slot.x - 0.5) * w,
      destY = (0.5 - unit.slot.y) * 10;
    const emphasis = focus === part.id ? 1 : 0;
    unit.emphasis = mix(unit.emphasis, emphasis, dt);
    const size = mix(
      1,
      ((0.91 * part.scale * (openFrame ? 0.89 : 1) * Math.min(1, w / 16)) /
        quad.root.scale.x) *
        (1 + 0.11 * unit.emphasis),
      spread,
    );
    node.scale.setScalar(size);
    const lift = unit.emphasis * spread;
    node.rotation.set(-0.055 * lift, 0.085 * lift, -0.025 * lift);
    target
      .set(destX, destY + lift * 0.19, 0.2 + 0.31 * lift)
      .sub(quad.root.position)
      .applyQuaternion(inv)
      .divideScalar(quad.root.scale.x);
    node.position
      .copy(target)
      .multiplyScalar(spread)
      .addScaledVector(
        target.copy(centre).applyQuaternion(node.quaternion),
        -size * spread,
      );
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
    elapsed = story.dataset.awaiting
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
    hoverX = mix(hoverX, tx, follow * 0.88);
    hoverY = mix(hoverY, ty, follow * 0.88);
    const take = ease(1.82, 3.56, elapsed),
      hero = 1 - ease(0.03, 0.46, p);

    const departRadio = ease(3.5, 3.83, p);
    const [x, y, k, rx, ry, rz, z] = sample(path, p);
    const spread = ease(1.8, 1.995, p) * (1 - ease(2.4, 2.74, p));
    const boardReady = String(spread >= 1);
    if (spread < 1) focus = '';
    if (story.dataset.boardReady !== boardReady)
      story.dataset.boardReady = boardReady;
    story.style.setProperty(
      '--mat-opacity',
      String(ease(1.69, 1.95, p) * (1 - ease(2.45, 2.75, p))),
    );
    story.style.setProperty(
      '--intro-opacity',
      String(p > 0.02 ? 1 : ease(0.22, 0.75, elapsed)),
    );
    const drawing =
      ease(1.59, 1.75, p) * (1 - ease(1.88, 2.08, p)) + 0.16 * spread;
    const diagram = ease(1.59, 1.75, p) * (1 - ease(1.79, 1.96, p));
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
    story.style.setProperty('--radio-exit', String(1 - departRadio));
    const inRadio = ease(2.82, 2.99, p);
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
      (x - 0.5 + departRadio * 0.62) * w + hoverX * 0.64 * hero * take,
      (0.5 - y) * 10 -
        2.32 * (1 - take) * hero +
        bob -
        hoverY * 0.33 * hero * take +
        (0.92 * lift * exitLanding - 0.42) * inRadio,
      z,
    );
    quad.root.rotation.order = 'ZXY';
    quad.root.rotation.set(
      rx + hoverY * 0.255 * hero + radioPitch * 0.27 * inRadio,
      ry + hoverX * 0.44 * hero + radioYaw * 0.35 * inRadio,
      rz - hoverX * 0.205 * hero + bank * 0.33 * inRadio,
      'ZXY',
    );
    quad.root.scale.setScalar(
      Math.min(w * 0.117, 2.15) * k * (openFrame ? 0.86 : 1),
    );
    quad.theme(day);
    inv.copy(quad.root.quaternion).invert();
    for (const unit of units) {
      positionPart(unit, spread, follow);
      unit.ink.color
        .set(day > 0.5 ? '#357483' : '#b3dce4')
        .lerp(accentLight, unit.emphasis);
      unit.ink.opacity = clamp(drawing + 0.28 * unit.emphasis, 0, 0.84);
      for (const wire of unit.edges) wire.visible = unit.ink.opacity > 0.035;
    }
    if (spread === 1) {
      quad.root.updateWorldMatrix(true, true);
      for (const { node, part, corners, slot } of units) {
        let bottom = slot.y;
        for (const corner of corners) {
          const projected = target
            .copy(corner)
            .applyMatrix4(node.matrixWorld)
            .project(camera);
          bottom = Math.max(bottom, (1 - projected.y) / 2);
        }
        story.style.setProperty(
          '--label-' + part.id,
          (100 * (bottom - slot.y)).toFixed(2) + 'svh',
        );
      }
    }
    for (const repeat of quad.repeats) {
      repeat.scale.setScalar(1 - ease(0, 0.65, spread));
      repeat.visible = spread < 0.64;
    }
    contact.visible = spread === 1;
    if (contact.visible) updateContact();
    else partLight.intensity = 0;
    const departure =
      Math.max(1 - hero, ease(1.38, 2.05, elapsed)) * (1 - ease(1.46, 1.69, p));
    const arrival =
      ease(2.745, 2.85, p) *
      (1 -
        inRadio +
        inRadio *
          Number(story.dataset.radioArmed === 'true') *
          (0.24 + 0.76 * lift) *
          exitLanding);
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
    const ledPower =
      (1 - day) *
      Math.max(departure * (1 - ease(1.52, 1.59, p)), arrival) *
      (0.9 + 0.06 * Math.sin(now * 0.0025));
    for (const lamp of lamps) lamp.material.opacity = ledPower;
    quad.led.emissiveIntensity = ledPower * 2.1;
    underglow.material.opacity = ledPower * 0.9;
    gate.root.visible = p > 0.36 && p < 1.55;
    gate.root.position.set(
      (0.08 + 0.62 * ease(1.32, 1.55, p)) * w,
      (0.5 - 0.435) * 10 -
        (1 - ease(0.35, 0.72, p)) * 6 +
        ease(1.32, 1.55, p) * 8,
      0,
    );
    gate.root.rotation.set(0.045, 0.76, 0.018);
    gate.root.scale.setScalar(Math.min(w / 16, 1.15));
    const replaying = ghosts.update(p, now, day);
    gate.accent.emissiveIntensity =
      (1 - day) * (0.56 + 0.12 * Math.sin(now * 0.0019));
    const caption = (ease(0.98, 1.045, p) * (1 - ease(1.23, 1.315, p))).toFixed(
      3,
    );
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
        (0.5 - y) * 10 - 2.32 - quad.root.scale.x * 0.72,
        hero,
      ),
      -3,
    );
    shadow.scale.set(
      (3.65 + 0.6 * day) * quad.root.scale.x * (1 + 0.29 * take),
      (0.46 + take * 0.32) * quad.root.scale.x,
      1,
    );
    shadow.material.opacity =
      (0.46 + day * 0.22 - 0.22 * take) *
      (1 - spread) *
      (1 - hero + hero * ease(0.72, 1.08, elapsed));
    radio.root.visible = p > 2.59;
    radio.root.position.set(
      (-0.24 - (1 - inRadio) * 0.49 - departRadio * 0.65) * w,
      -0.84,
      0,
    );
    radio.root.rotation.set(0.22 * inRadio, 0.1 * inRadio, 0.28 * inRadio);
    radio.root.scale.setScalar(Math.min(w * 0.116, 1.85));
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
      updateReadout();
      radio.root.localToWorld(target.set(0, 0.37, 0.411)).project(camera);
      const pin = chapters[3].firstElementChild as HTMLElement;
      pin.style.setProperty('--power-x', (target.x + 1) * 50 + '%');
      pin.style.setProperty('--power-y', (1 - target.y) * 50 + '%');
      for (const [index, control] of gimbalLights.entries()) {
        control.getWorldPosition(target).project(camera);
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
      (elapsed < 3.72 && p < 0.45) ||
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
    const hue = new T.Color(accent).getHSL(
      { h: 0, s: 0, l: 0 },
      T.SRGBColorSpace,
    ).h;
    const neon = new T.Color().setHSL(hue, 0.98, 0.49, T.SRGBColorSpace);
    for (const lamp of [...lamps, ...gimbalLights])
      lamp.material.color.copy(neon);
    underglow.material.color.copy(neon);

    accentLight.copy(neon);
    quad.led.emissive.copy(neon);
    gate.accent.color.set(accent);
    gate.accent.emissive.copy(neon);
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
    pin.style.removeProperty('--power-x');
    pin.style.removeProperty('--power-y');
    for (const i of radioControls.keys())
      for (const axis of ['x', 'y'])
        pin.style.removeProperty('--control-' + i + '-' + axis);
    cancelAnimationFrame(raf);
    abort.abort();
    io.disconnect();
    mo.disconnect();
    ro.disconnect();
    disposeScene(scene);
    [shadow, gateShade, underglow, ...lamps, ...gimbalLights].forEach((s) =>
      s.material.dispose(),
    );
    shade.dispose();
    texture.dispose();
    footprint.dispose();
    beam.dispose();
    smear.dispose();
    lcdTexture.dispose();
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
