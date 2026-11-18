import { radioControls } from '../src/data/radio-controls';
import * as T from 'three';
import {
  makeGate,
  makeWhoop,
  makeRadio,
  studioLights,
} from '../src/graphics/specimen';
const width = 900,
  height = 660;
const render = new T.WebGLRenderer({
  alpha: true,
  antialias: true,
  preserveDrawingBuffer: true,
});
render.setSize(width, height);
render.setClearColor(0, 0);
const scene = new T.Scene(),
  camera = new T.OrthographicCamera(-3, 3, 2.2, -2.2, 0.1, 50);
camera.position.z = 15;
studioLights(scene);
const whoop = makeWhoop(),
  seven = makeWhoop(true),
  radio = makeRadio(),
  gate = makeGate();
export const posterControls: { x: number; y: number }[] = [];
export function capture(id: string, day: boolean) {
  const quad = id.startsWith('seven') ? seven : whoop;
  if (id === 'seven') id = 'whoop';
  else if (id.startsWith('seven-')) id = id.slice(6);
  quad.theme(day ? 1 : 0);
  const subject = new T.Group();
  scene.add(subject);
  let obj: T.Group;
  if (id === 'whoop') {
    obj = quad.root.clone();
    obj.rotation.set(0.47, -0.4, -0.09, 'ZXY');
  } else if (id.startsWith('radio')) {
    const pose = Number(id.split('-')[1] ?? 0);
    radio.sticks[0].rotation.x = pose === 2 ? -0.8 : 0;
    radio.sticks[1].rotation.y = pose === 3 ? -0.54 : 0;
    radio.switches.forEach((toggle, slot) => {
      const picked = radioControls[pose - 1];
      toggle.rotation.x =
        picked?.kind === 'switch' && picked.slot === slot ? 0.55 : -0.45;
    });
    obj = radio.root.clone();
    obj.rotation.set(-0.13, 0.18, -0.025);
  } else if (id === 'gate') {
    obj = gate.root.clone();
    obj.rotation.y = 0.68;
  } else {
    obj = quad.parts[id].clone();
    if (id === 'motor' || id === 'propeller')
      obj.children.slice(1).forEach((n) => (n.visible = false));
    obj.rotation.set(id === 'board' ? 0.8 : 0.46, -0.35, 0.03);
  }
  subject.add(obj);
  obj.updateMatrixWorld(true);
  const bounds = new T.Box3();
  obj.traverseVisible((n) => {
    if (n instanceof T.Mesh) {
      n.geometry.computeBoundingBox();
      bounds.union(n.geometry.boundingBox!.clone().applyMatrix4(n.matrixWorld));
    }
  });
  const size = bounds.getSize(new T.Vector3()),
    center = bounds.getCenter(new T.Vector3());
  const scale = Math.min(5.75 / size.x, 4.13 / size.y);
  subject.scale.setScalar(scale);
  subject.position.copy(center).multiplyScalar(-scale);
  render.render(scene, camera);
  scene.remove(subject);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  context.drawImage(render.domElement, 0, 0);
  const pixels = context.getImageData(0, 0, width, height).data;
  let l = width,
    r = 0,
    t = height,
    b = 0;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (pixels[(x + y * width) * 4 + 3] > 0) {
        l = Math.min(l, x);
        r = Math.max(r, x);
        t = Math.min(t, y);
        b = Math.max(b, y);
      }
    }
  const out = document.createElement('canvas'),
    w = r - l + 1,
    h = b - t + 1,
    ratio = Math.min(1, (id === 'whoop' ? 850 : 560) / Math.max(w, h));
  if (id === 'radio') {
    for (const entry of radioControls) {
      const node = (entry.kind === 'stick' ? radio.sticks : radio.switches)[
        entry.slot
      ];
      const point =
        entry.kind === 'stick'
          ? new T.Vector3(0, 0.05, 0.29)
          : new T.Vector3(Math.sign(node.position.x) * 0.12, 0.24, 0.08);
      node.updateMatrix();
      point
        .applyMatrix4(node.matrix)
        .applyMatrix4(obj.matrixWorld)
        .project(camera);
      posterControls.push({
        x: +((((point.x + 1) * width) / 2 - l) / w).toFixed(4),
        y: +((((1 - point.y) * height) / 2 - t) / h).toFixed(4),
      });
    }
  }
  out.width = Math.round(ratio * w);
  out.height = Math.round(ratio * h);
  out
    .getContext('2d')!
    .drawImage(canvas, l, t, w, h, 0, 0, out.width, out.height);
  return out.toDataURL('image/webp', 0.91).split(',')[1];
}
