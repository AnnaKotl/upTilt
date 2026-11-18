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
  radio = makeRadio(),
  gate = makeGate();
export function capture(id: string, day: boolean) {
  whoop.theme(day ? 1 : 0);
  const subject = new T.Group();
  scene.add(subject);
  let obj: T.Group;
  if (id === 'whoop') {
    obj = whoop.root.clone();
    obj.rotation.set(0.47, -0.4, -0.09, 'ZXY');
  } else if (id.startsWith('radio')) {
    const pose = Number(id.split('-')[1] ?? 0);
    radio.sticks[0].rotation.x = pose === 2 ? -0.8 : 0;
    radio.sticks[1].rotation.y = pose === 3 ? -0.54 : 0;
    radio.switches[0].rotation.x = pose > 0 ? 0.45 : -0.55;
    obj = radio.root.clone();
    obj.rotation.set(0.13, -0.21, 0.035);
  } else if (id === 'gate') {
    obj = gate.root.clone();
    obj.rotation.y = -0.65;
  } else {
    obj = whoop.parts[id].clone();
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
  out.width = Math.round(ratio * w);
  out.height = Math.round(ratio * h);
  out
    .getContext('2d')!
    .drawImage(canvas, l, t, w, h, 0, 0, out.width, out.height);
  return out.toDataURL('image/webp', 0.91).split(',')[1];
}
