import type { LapBend } from '../data/gate-replays';
import {
  sampleFlight,
  gateCameraLift,
  gateCentre,
  gateYaw,
  gateExitStart,
  gateExitEnd,
  routesArrival,
  routesDeparture,
} from '../data/flight-path';
import { radioControls } from '../data/radio-controls';
import { currentAircraft } from '../lib/aircraft';
import { demonstrationHold, radioViewAngles } from '../lib/radio-view';
import * as T from 'three';
import { attitudeDial } from './attitude-dial';
import { raceReplays, replayExit } from './race-replays';
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
const diagramStart = 1.68;
const diagramFull = 1.775;
const matStart = 1.9;
const matVisible = 1.975;
const partsSettled = 1.99;

// Ease in over one world unit as the silhouette approaches the framing margin.
function approachPan(excess: number) {
  const ramp = clamp(excess, 0, 1);
  return Math.max(0, excess - 1) + 0.5 * ramp * ramp;
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
function rotorExposure() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(64, 64);
  // Integrated exposure around the full sweep avoids backwards/stationary
  // blades when the display samples a fast rotor at nearly the same angle.
  const sweep = ctx.createRadialGradient(0, 0, 4, 0, 0, 62);
  for (const [stop, alpha] of [
    [0, 0],
    [0.16, 0.075],
    [0.57, 0.24],
    [0.87, 0.34],
    [0.96, 0.265],
    [1, 0],
  ]) {
    sweep.addColorStop(stop, `rgba(216,232,237,${alpha})`);
  }
  ctx.fillStyle = sweep;
  ctx.fillRect(-64, -64, 128, 128);
  return new T.CanvasTexture(canvas);
}
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
  const airframeBounds = new T.Box3().setFromObject(quad.root);
  const approachBounds = new T.Box3();
  const radioBounds = new T.Box3().setFromObject(radio.root);
  const tiltedBounds = new T.Box3();
  const radioRotation = new T.Matrix4();
  // Camera shows ten world units of height; this keeps the ring inside it.
  const dial = attitudeDial(quad.rotorReach * 1.1);
  scene.add(quad.root, gate.root, radio.root, dial.root);
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
  // The smear texture is near white, so daylight needs it tinted to exist.
  const smearNight = new T.Color('#ffffff');
  const smearDay = new T.Color('#43637a');
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
  const startRoutes = document.getElementById('start')!;
  const lastRoute = startRoutes.querySelector('li:last-child')!;
  const radioHeading =
    chapters[3].querySelector<HTMLElement>('.radio-heading')!;
  let headingFloor = 3;
  let gateReveal = 0;
  let routesAnchor = 0;
  let routesExit = 0;
  let routesBottom = 0;
  let lastColumnProgress = -1;
  let lastColumnExit = -1;
  let anchors: number[] = [],
    diagramScrollStart = 0,
    diagramScrollEnd = 0,
    replayScrollStart = 0,
    replayScrollEnd = 0,
    w = 16,
    p = 0,
    goal = 0,
    raf = 0,
    previous = 0,
    disposed = false,
    visible = true;
  let introStart = Number(story.dataset.takeoff ?? performance.now());
  let slowFrames = 0;
  let radioPitch = 0,
    radioYaw = 0,
    yawFrom = 0,
    yawDestination = 0,
    turnStart = 0;
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
    facing = 0,
    radioSettling = false,
    scrollMotion = 0;
  let day = document.documentElement.dataset.theme === 'light' ? 1 : 0,
    dayGoal = day;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);
  const inv = new T.Quaternion(),
    target = new T.Vector3();

  function invalidate() {
    if (!disposed && visible && !document.hidden && !raf)
      raf = requestAnimationFrame(draw);
  }
  function measure() {
    const h = host.clientHeight || innerHeight,
      wpx = host.clientWidth;
    w = (10 * wpx) / h;
    // Convert the measured text block and its gutter to camera coordinates.
    headingFloor =
      5 - (10 * (radioHeading.offsetTop + radioHeading.offsetHeight + 16)) / h;
    ghosts.resize(w);
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(wpx, h, false);
    routesAnchor = startRoutes.getBoundingClientRect().top + scrollY;
    anchors = chapters.map((el) => el.getBoundingClientRect().top + scrollY);
    routesBottom = routesAnchor + startRoutes.offsetHeight;
    routesExit = mix(routesAnchor, routesBottom, 0.46);
    // The gate keeps its original scroll distance until the readouts fade.
    // The extra space at the end of the chapter belongs to the diagram.
    const extraRoom = parseFloat(getComputedStyle(chapters[1]).paddingBottom);
    const gateSpan = anchors[2] - anchors[1] - extraRoom;
    diagramScrollStart = anchors[1] + gateSpan * (diagramStart - 1);
    diagramScrollEnd = mix(
      diagramScrollStart,
      anchors[2],
      (matStart - diagramStart) / (2 - diagramStart),
    );
    replayScrollStart = mix(
      routesExit,
      anchors[1],
      (0.965 - routesDeparture) / (1 - routesDeparture),
    );
    replayScrollEnd = anchors[1] + gateSpan * (replayExit - 1);
    scroll();
  }
  let scrollTime = 0,
    lastWheel = -Infinity,
    lastSample = -Infinity;
  function scroll() {
    scrollTime = performance.now();
    let i = 0;
    while (i < anchors.length - 2 && scrollY >= anchors[i + 1]) i++;
    let start = anchors[i],
      end = anchors[i + 1];
    let from = i,
      to = i + 1;
    // Keep the drone opposite the heading across the sticky reading frame.
    if (i === 0) {
      if (scrollY < routesAnchor) {
        end = routesAnchor;
        to = routesArrival;
      } else if (scrollY < routesExit) {
        start = routesAnchor;
        end = routesExit;
        from = routesArrival;
        to = routesDeparture;
      } else {
        start = routesExit;
        from = routesDeparture;
      }
    }
    if (i === 1) {
      if (scrollY < diagramScrollStart) {
        end = diagramScrollStart;
        to = diagramStart;
      } else {
        start = diagramScrollStart;
        from = diagramStart;
      }
    }
    goal = clamp(
      mix(from, to, (scrollY - start) / Math.max(1, end - start)),
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
    const clearedRoutes =
      scrollY >= routesBottom ||
      (goal >= routesDeparture &&
        lastRoute.getBoundingClientRect().bottom <= 0);
    const revealTarget = Number(clearedRoutes);
    gateReveal = mix(gateReveal, revealTarget, follow);
    if (Math.abs(revealTarget - gateReveal) < 0.002) gateReveal = revealTarget;
    elapsed = story.dataset.awaiting
      ? 0
      : Math.max(0, (now - introStart) / 1000);
    scrollMotion = mix(
      scrollMotion,
      Math.min(1, Math.abs(goal - p) * 9),
      follow,
    );
    const directJump = Math.abs(goal - p) > 0.65 && now - lastWheel > 550;
    p = directJump ? goal : mix(p, goal, follow);
    if (Math.abs(goal - p) < 0.0005) p = goal;
    day = mix(day, dayGoal, follow * 0.62);
    if (Math.abs(day - dayGoal) < 0.002) day = dayGoal;
    hoverX = mix(hoverX, tx, follow * 0.88);
    hoverY = mix(hoverY, ty, follow * 0.88);
    const take = ease(1.82, 3.56, elapsed),
      hero = 1 - ease(0.03, 0.2, p);

    const floorVisibility = 1 - ease(0.018, 0.055, p);
    const heroFloor = floorVisibility * (1 - day);
    story.style.setProperty('--hero-floor', String(heroFloor));

    const columnExit = ease(0.46, 0.77, p);
    if (columnExit !== lastColumnExit) {
      startRoutes.style.setProperty('--column-exit', String(columnExit));
      lastColumnExit = columnExit;
    }
    const fold = ease(routesArrival + 0.022, routesDeparture, p);
    if (fold !== lastColumnProgress) {
      startRoutes.style.setProperty(
        '--column-progress',
        String(ease(0.48, 1, fold)),
      );
      startRoutes.style.setProperty(
        '--row-progress',
        String(ease(0, 0.56, fold)),
      );
      lastColumnProgress = fold;
    }

    const departRadio = ease(3.5, 3.83, p);
    const [x, y, k, rx, ry, rz, z] = sampleFlight(p);
    const spread = ease(1.917, partsSettled, p) * (1 - ease(2.4, 2.74, p));
    const boardReady = String(spread >= 1);
    if (spread < 1) focus = '';
    if (story.dataset.boardReady !== boardReady)
      story.dataset.boardReady = boardReady;
    story.style.setProperty(
      '--mat-opacity',
      String(ease(matStart, matVisible, p) * (1 - ease(2.45, 2.75, p))),
    );
    story.style.setProperty(
      '--intro-opacity',
      String(p > 0.02 ? 1 : ease(0.22, 0.75, elapsed)),
    );
    const diagram =
      ease(diagramStart, diagramFull, p) * (1 - ease(matStart, matVisible, p));
    const drawing = diagram + 0.16 * spread;
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
      story.style.setProperty('--diagram-opacity', String(diagram));
      oldDiagram = diagram;
    }
    story.style.setProperty('--radio-exit', String(1 - departRadio));
    const inRadio = ease(2.82, 2.99, p);
    const ax = Number(story.dataset.radioX ?? 0),
      ay = Number(story.dataset.radioY ?? 0);
    const armed = story.dataset.radioArmed === 'true';
    const targetLift = !armed
      ? 0
      : story.dataset.radioIdle === 'true'
        ? 0.05
        : pose === 2
          ? 0.74 + ay * 0.25
          : pose === 1
            ? 0.09
            : 1;
    const airborne = armed && story.dataset.radioIdle !== 'true';
    const targetBank = airborne && pose === 3 ? ax : 0;
    const targetPitch = airborne && pose === 3 ? ay : 0;
    const targetYaw = airborne ? Number(story.dataset.radioHeading ?? 0) : 0;
    radioPitch = mix(radioPitch, targetPitch, follow * 0.6);
    if (targetYaw !== yawDestination) {
      yawFrom = radioYaw;
      yawDestination = targetYaw;
      turnStart = now;
    }
    radioYaw = mix(yawFrom, yawDestination, ease(0, 1050, now - turnStart));
    lift = mix(lift, targetLift, follow * 0.65);
    bank = mix(bank, targetBank, follow * 0.65);
    // The half turn is its own, slower move: tied to lift it snapped around.
    const facingGoal = demonstrationHold(inRadio, lift);
    facing = mix(facing, facingGoal, follow * 0.21);
    if (Math.abs(facingGoal - facing) < 0.0008) facing = facingGoal;
    const exitLanding = 1 - ease(3.16, 3.72, p);
    radioSettling =
      Math.abs(targetLift - lift) +
        Math.abs(targetBank - bank) +
        Math.abs(radioYaw - targetYaw) +
        Math.abs(radioPitch - targetPitch) +
        Math.abs(facingGoal - facing) >
      0.002;
    const bob =
      hero *
      take *
      (elapsed < 7
        ? Math.sin(elapsed * 1.5) * 0.035 * (1 - ease(5.5, 7, elapsed))
        : 0);
    const cameraLift = gateCameraLift(p);
    quad.root.position.set(
      (x - 0.5 + departRadio * 0.62) * w + hoverX * 0.64 * hero * take,
      (0.5 - y) * 10 +
        cameraLift -
        2.32 * (1 - take) * hero +
        bob -
        hoverY * 0.33 * hero * take +
        (0.92 * lift * exitLanding - 0.42) * inRadio,
      z,
    );
    // Square to the camera while hovering; the angled pose returns once landed.
    const squareOn = facing;
    const { tilt: viewTilt, yaw: viewYaw } = radioViewAngles(rx, ry, squareOn);
    quad.root.rotation.set(
      viewTilt + hoverY * 0.255 * hero,
      viewYaw + hoverX * 0.44 * hero + radioYaw * inRadio,
      rz - hoverX * 0.205 * hero,
      'ZXY',
    );
    quad.root.scale.setScalar(
      Math.min(w * 0.117, 2.15) * k * (openFrame ? 0.86 : 1),
    );
    quad.root.rotateX(radioPitch * 0.27 * inRadio);
    quad.root.rotateZ(bank * 0.33 * inRadio);
    // Hero framing gives way to the descent before the flight drawing appears.
    if (p < routesDeparture) {
      quad.root.updateMatrix();
      approachBounds.copy(airframeBounds).applyMatrix4(quad.root.matrix);
      const framing = 1 - ease(routesArrival, routesDeparture, p);
      camera.position.x =
        approachPan(approachBounds.max.x - (w / 2 - 0.75)) * framing;
      camera.position.y = approachPan(approachBounds.max.y - 3.85) * framing;
    } else {
      camera.position.x = camera.position.y = 0;
    }
    camera.position.y += cameraLift;
    const term = story.dataset.radioTerm ?? '';
    dial.update(
      quad.root,
      term,
      term === 'Yaw'
        ? radioYaw
        : term === 'Pitch'
          ? radioPitch * 0.27
          : bank * 0.33,
      viewTilt,
      viewYaw,
      day,
      airborne ? inRadio * (1 - departRadio) : 0,
    );
    quad.theme(day);
    exposure.color.lerpColors(smearNight, smearDay, day);
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
    exposure.opacity = speed * (0.88 + 0.12 * scrollMotion) * (0.6 + 0.4 * day);
    quad.blade.opacity =
      ((0.68 + 0.16 * day) * (1 - speed) + 0.007 * speed) * (1 - 0.9 * diagram);
    quad.rotors.forEach((r, i) => {
      if (spinning)
        r.rotation.y +=
          delta *
          speed *
          (146 + 64 * scrollMotion) *
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
    const gateOpacity = gateReveal * (1 - ease(gateExitStart, gateExitEnd, p));
    gate.root.visible = gateOpacity > 0;
    gate.root.position.set(
      (gateCentre.x - 0.5) * w,
      (0.5 - gateCentre.y) * 10,
      0,
    );
    if (gate.root.visible) {
      const translucent = gateOpacity < 1;
      for (const material of gate.materials) {
        if (material.transparent !== translucent) {
          material.transparent = translucent;
          material.depthWrite = !translucent;
          material.needsUpdate = true;
        }
        material.opacity = gateOpacity;
      }
    }
    gate.root.rotation.set(0.045, gateYaw, 0.018);
    gate.root.scale.setScalar(Math.min(w / 16, 1.15));
    const gatePhase = ghosts.update(p, now, day, scrollTime);
    const phaseChanged = story.dataset.gatePhase !== gatePhase;
    if (phaseChanged) story.dataset.gatePhase = gatePhase;
    // Limit numerical readouts independently of the frame rate of the 3D scene.
    if (p >= 0.36 && p < 1.7) {
      if (
        phaseChanged ||
        now - lastSample >= 70 ||
        (p === goal && gatePhase !== 'replays' && !ghosts.moving)
      ) {
        const sample = [
          p.toFixed(3),
          Math.min(ghosts.elapsed, 8).toFixed(2),
          ghosts.followed,
          ghosts.followedAge.toFixed(2),
          ghosts.survey.toFixed(3),
        ].join(',');
        if (story.dataset.gateSample !== sample)
          story.dataset.gateSample = sample;
        lastSample = now;
      }
    } else if (story.dataset.gateSample) delete story.dataset.gateSample;
    gate.accent.emissiveIntensity =
      (1 - day) * (0.56 + 0.12 * Math.sin(now * 0.0019));
    gateShade.visible = gate.root.visible;
    gateShade.position.copy(gate.root.position);
    gateShade.position.y -= 2.8 * gate.root.scale.x;
    gateShade.position.z = -2;
    gateShade.scale.set(2.6, 0.32, 1);
    gateShade.material.opacity = 0.41 * gateOpacity;
    shadow.position.set(
      quad.root.position.x,
      mix(
        (0.5 - y) * 10 + cameraLift - quad.root.scale.x * 1.05,
        (0.5 - y) * 10 + cameraLift - 2.32 - quad.root.scale.x * 0.72,
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
      (0.46 + day * 0.22 - 0.22 * take + 0.34 * heroFloor) *
      (1 - spread) *
      (1 - diagram) *
      (floorVisibility * ease(0.72, 1.08, elapsed) + ease(2.72, 2.98, p));
    const headingOpacity = ease(2.8, 2.93, p) * (1 - ease(3.45, 3.64, p));
    radioHeading.style.setProperty(
      '--radio-heading-opacity',
      String(headingOpacity),
    );
    radioHeading.style.setProperty(
      '--radio-heading-visibility',
      headingOpacity > 0 ? 'visible' : 'hidden',
    );
    radio.root.visible = p > 2.59;
    radio.root.position.set(
      (-0.24 - (1 - inRadio) * 0.49 - departRadio * 0.65) * w,
      -0.84,
      0,
    );
    radio.root.rotation.set(0.22 * inRadio, 0.1 * inRadio, 0.28 * inRadio);
    if (radio.root.visible) {
      tiltedBounds
        .copy(radioBounds)
        .applyMatrix4(radioRotation.makeRotationFromEuler(radio.root.rotation));
      const floor = -4.84;
      const scale = Math.min(
        0.95 * Math.min(w * 0.116, 1.85),
        (headingFloor - floor) / (tiltedBounds.max.y - tiltedBounds.min.y),
      );
      radio.root.scale.setScalar(scale);
      radio.root.position.y = clamp(
        -0.84,
        floor - tiltedBounds.min.y * scale,
        headingFloor - tiltedBounds.max.y * scale,
      );
    }
    radio.sticks[0].rotation.x = mix(
      radio.sticks[0].rotation.x,
      pose === 2 ? -ay * 0.7 : !armed || pose === 1 ? 0.7 : 0,
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
    radio.sticks[1].rotation.y = mix(
      radio.sticks[1].rotation.y,
      pose === 3 ? ax * 0.68 : 0,
      follow,
    );
    for (const [index, control] of radioControls.entries()) {
      if (control.kind !== 'switch') continue;
      const toggle = radio.switches[control.slot];
      const angle =
        index === 0 && armed
          ? 0.55
          : index === 3
            ? Number(story.dataset.radioModePosition ?? -1) * 0.54
            : -0.45;
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
      // The live gate adds scroll space. Keep the reading position in
      // downstream chapters when a deep link opens before WebGL is ready.
      const anatomy = chapters[2];
      const previousTop = anatomy.getBoundingClientRect().top;
      story.dataset.live = 'true';
      if (previousTop <= 1) {
        const shift = anatomy.getBoundingClientRect().top - previousTop;
        if (Math.abs(shift) > 1)
          window.scrollTo({ top: scrollY + shift, behavior: 'instant' });
      }
      measure();
      story.dispatchEvent(new Event('scene-painted'));
    }
    if (
      gateReveal !== revealTarget ||
      ghosts.moving ||
      gatePhase === 'replays' ||
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
  story.addEventListener(
    'gate-reshape',
    (event) => {
      const { index, bend } = (
        event as CustomEvent<{ index: number; bend: LapBend }>
      ).detail;
      ghosts.reshape(index, bend);
      invalidate();
    },
    { signal },
  );
  // A fast wheel gesture can enter either viewing band without skipping it.
  // Once inside, each gesture advances normally at the scene's slower pace.
  story.addEventListener(
    'wheel',
    (event) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        Math.abs(event.deltaY) <= Math.abs(event.deltaX)
      )
        return;
      lastWheel = performance.now();
      if (event.deltaY < 0 || !event.cancelable) return;
      const pixels =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      const enteringReplay =
        ghosts.awaitingArrival &&
        scrollY < replayScrollEnd &&
        scrollY + pixels >= replayScrollStart;
      const enteringDiagram =
        scrollY < diagramScrollEnd && scrollY + pixels >= diagramScrollStart;
      if (!enteringReplay && !enteringDiagram) return;
      const bandStart = enteringReplay ? replayScrollStart : diagramScrollStart;
      const distanceToBand = Math.max(0, bandStart - scrollY);
      const rate = enteringReplay ? 0.24 : 0.46;
      const distance =
        distanceToBand +
        Math.min((pixels - distanceToBand) * rate, innerHeight * 0.48);
      event.preventDefault();
      window.scrollBy({ top: distance, behavior: 'instant' });
    },
    { passive: false, signal },
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
    const palette = getComputedStyle(document.documentElement);
    const accent = palette.getPropertyValue('--accent').trim();
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
    dial.ink.color.set(
      palette.getPropertyValue(dayGoal ? '--ink' : '--muted').trim(),
    );
    dial.accent.color.set(accent);
    gate.accent.color.set(accent);
    gate.accent.emissive.copy(neon);
  }
  lighting();
  const mo = new MutationObserver(() => {
    // Must precede lighting(): it picks the ring ink from dayGoal.
    dayGoal = document.documentElement.dataset.theme === 'light' ? 1 : 0;
    lighting();
    invalidate();
  });
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-season'],
  });
  const ro = new ResizeObserver(measure);
  ro.observe(host);
  ro.observe(radioHeading);
  ro.observe(story);
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) invalidate();
    else if (!document.hidden) ghosts.reset();
  });
  io.observe(host);
  window.addEventListener('scroll', scroll, { passive: true, signal });
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) ghosts.pause();
      else invalidate();
    },
    { signal },
  );
  function dispose() {
    if (disposed) return;
    disposed = true;
    startRoutes.style.removeProperty('--column-progress');
    startRoutes.style.removeProperty('--row-progress');
    startRoutes.style.removeProperty('--column-exit');
    radioHeading.style.removeProperty('--radio-heading-opacity');
    radioHeading.style.removeProperty('--radio-heading-visibility');
    delete story.dataset.live;
    delete story.dataset.gatePhase;
    delete story.dataset.gateSample;
    story.style.removeProperty('--diagram-opacity');
    story.style.removeProperty('--hero-floor');
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
