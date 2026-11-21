import { gateRadius } from '../data/flight-path';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type Material = T.MeshStandardMaterial;
const tau = Math.PI * 2;
const mat = (color: string, roughness = 0.46, metalness = 0.12) =>
  new T.MeshStandardMaterial({ color, roughness, metalness });
const vector = (xyz: number[]) =>
  new T.Vector3(...(xyz as [number, number, number]));

// A small repeating satin twill picked out by the studio light on the open frame.
function wovenFrameMaterial() {
  const size = 32;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const warp = (Math.floor(x / 8) + Math.floor(y / 8)) % 4 < 2;
      const along = warp ? x : y;
      const crown = Math.sin((Math.PI * ((along % 8) + 0.5)) / 8);
      const value = Math.round(
        (warp ? 213 : 189) + 23 * crown + 3 * Math.cos(Math.PI * along),
      );
      pixels.set([value, value, value, 255], 4 * (y * size + x));
    }
  }
  const texture = new T.DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.colorSpace = T.SRGBColorSpace;
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  const material = mat('#40464b', 0.6, 0.12);
  material.map = texture;
  return material;
}

// Project the weave after baking so the arm and plate use the same yarn scale.
function frameTextureCoordinates(geometry: T.BufferGeometry) {
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const uv = new Float32Array(positions.count * 2);
  for (let i = 0; i < positions.count; i++) {
    const side = Math.abs(normals.getX(i)) > 0.75;
    const front = Math.abs(normals.getZ(i)) > 0.75;
    uv[2 * i] = 3 * (side ? positions.getZ(i) : positions.getX(i));
    uv[2 * i + 1] = 3 * (side || front ? positions.getY(i) : positions.getZ(i));
  }
  geometry.setAttribute('uv', new T.BufferAttribute(uv, 2));
}

// Bake the fixed pieces of each moving part into one draw call per material.
function batch(group: T.Group) {
  const buckets = new Map<T.Material, T.BufferGeometry[]>();
  for (const m of [...group.children]) {
    if (!(m instanceof T.Mesh) || Array.isArray(m.material)) continue;
    m.updateMatrix();
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    g.applyMatrix4(m.matrix);
    for (const key of Object.keys(g.attributes))
      if (key !== 'normal' && key !== 'position') g.deleteAttribute(key);
    const list = buckets.get(m.material) ?? [];
    list.push(g);
    buckets.set(m.material, list);
    group.remove(m);
    m.geometry.dispose();
  }
  for (const [material, list] of buckets) {
    const geometry = mergeGeometries(list);
    if (geometry) {
      if (material instanceof T.MeshStandardMaterial && material.map)
        frameTextureCoordinates(geometry);
      group.add(new T.Mesh(geometry, material));
    }
    list.forEach((g) => g.dispose());
  }
}
function mesh(
  parent: T.Object3D,
  geo: T.BufferGeometry,
  material: Material,
  x = 0,
  y = 0,
  z = 0,
) {
  const m = new T.Mesh(geo, material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function box(
  parent: T.Object3D,
  m: Material,
  size: number[],
  pos: number[],
  radius = 0.04,
) {
  return mesh(
    parent,
    new RoundedBoxGeometry(size[0], size[1], size[2], 1, radius),
    m,
    ...(pos as [number, number, number]),
  );
}
function cyl(
  parent: T.Object3D,
  m: Material,
  top: number,
  bottom: number,
  height: number,
  pos: number[],
  segments = 24,
) {
  return mesh(
    parent,
    new T.CylinderGeometry(top, bottom, height, segments),
    m,
    ...(pos as [number, number, number]),
  );
}
function rod(
  parent: T.Object3D,
  m: Material,
  a: number[],
  b: number[],
  r: number,
  end = r,
) {
  const from = vector(a),
    to = vector(b),
    delta = to.clone().sub(from);
  const obj = cyl(
    parent,
    m,
    end,
    r,
    delta.length(),
    from.addScaledVector(delta, 0.5).toArray(),
    8,
  );
  obj.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
  return obj;
}
function tube(parent: T.Object3D, m: Material, points: number[][], r: number) {
  return mesh(
    parent,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(points.map(vector)),
      18,
      r,
      8,
      false,
    ),
    m,
  );
}
function loop(
  parent: T.Object3D,
  m: Material,
  x: number,
  y: number,
  z: number,
  r: number,
  thickness: number,
) {
  const obj = mesh(
    parent,
    new T.TorusGeometry(r, thickness, 6, 48),
    m,
    x,
    y,
    z,
  );
  obj.rotation.x = Math.PI / 2;
  return obj;
}
function shellProfile(parent: T.Object3D, m: Material, x: number, z: number) {
  const pts = [
    [0.94, -0.24],
    [0.97, -0.235],
    [1.025, 0.085],
    [1.028, 0.12],
    [1.006, 0.15],
    [0.975, 0.146],
    [0.92, -0.21],
    [0.94, -0.24],
  ];
  mesh(
    parent,
    new T.LatheGeometry(
      pts.map(([a, b]) => new T.Vector2(a, b)),
      52,
    ),
    m,
    x,
    0,
    z,
  );
}
function sphere(p: T.Object3D, m: Material, pos: number[], scale: number[]) {
  const o = mesh(
    p,
    new T.SphereGeometry(1, 24, 12),
    m,
    ...(pos as [number, number, number]),
  );
  o.scale.copy(vector(scale));
  return o;
}
export function studioLights(scene: T.Scene) {
  scene.add(new T.HemisphereLight(0xfffaf2, 0x8b9cb9, 1.65));
  for (const [pos, power, color] of [
    [[1, 5, 4], 3.0, 0xfff7ed],
    [[-5, 2, -1], 1.7, 0xe7f1ff],
    [[3, 1, -4], 2.4, 0xbddaff],
  ] as const) {
    const light = new T.DirectionalLight(color, power);
    light.position.set(pos[0], pos[1], pos[2]);
    scene.add(light);
  }
}
export function makeWhoop(openFrame = false) {
  const root = new T.Group();
  const frame = mat('#202328', 0.86, 0.035),
    guard = mat('#373b41', 0.82, 0.05),
    lip = mat('#494e53', 0.69, 0.1),
    shell = mat('#202329', 0.78, 0.08),
    trim = mat('#72878c', 0.35, 0.28);
  const carbon = mat('#20262c'),
    steel = mat('#9faab0', 0.3, 0.65),
    copper = mat('#b66943', 0.42, 0.38),
    board = mat('#284941'),
    gold = mat('#c5a45d', 0.35, 0.42);
  const framePlate = openFrame ? wovenFrameMaterial() : frame;
  const lens = mat('#254254', 0.12, 0.52),
    optic = mat('#afd8e1', 0.2, 0.27),
    cell = mat('#a2aab1', 0.48, 0.36),
    cap = mat('#31363a');
  const blade = mat('#b1c0c5', 0.28, 0.19);
  blade.transparent = true;
  blade.opacity = 0.68;
  blade.depthWrite = false;
  blade.side = T.DoubleSide;
  const led = mat('#a0def6');
  led.emissive.set('#93d5ef');
  led.emissiveIntensity = 1;
  const parts: Record<string, T.Group> = {},
    rotors: T.Group[] = [],
    repeats: T.Group[] = [];
  const part = (id: string) => {
    const node = new T.Group();
    node.name = id;
    root.add(node);
    parts[id] = node;
    return node;
  };
  const chassis = part('frame'),
    props = part('propeller'),
    motors = part('motor'),
    circuits = part('board'),
    canopy = part('canopy'),
    camera = part('camera'),
    battery = part('battery'),
    antenna = part('antenna'),
    strip = part('light-strip'),
    mounts = part('mounts'),
    plug = part('connector'),
    lead = part('power-lead'),
    holder = part('battery-holder');
  let index = 0;
  const span = openFrame ? 1.42 : 1.037;
  for (const x of [-span, span])
    for (const z of [-span, span]) {
      if (!openFrame) {
        shellProfile(chassis, guard, x, z);
        loop(chassis, lip, x, 0.145, z, 1.002, 0.018);
        for (let i = 0; i < 3; i++) {
          const a = (tau * i) / 3 + 0.29;
          rod(
            chassis,
            frame,
            [x, -0.19, z],
            [x + 0.945 * Math.cos(a), -0.16, z + 0.945 * Math.sin(a)],
            0.043,
            0.028,
          );
        }
      }
      if (openFrame) {
        const arm = box(
          chassis,
          framePlate,
          [0.21, 0.1, Math.hypot(x, z)],
          [x / 2, -0.18, z / 2],
          0.025,
        );
        arm.rotation.y = Math.atan2(x, z);
        cyl(chassis, framePlate, 0.22, 0.2, 0.1, [x, -0.19, z]);
      } else
        rod(
          chassis,
          frame,
          [0.29 * Math.sign(x), -0.22, 0.28 * Math.sign(z)],
          [x, -0.22, z],
          0.087,
          0.11,
        );
      const motor = new T.Group();
      motors.add(motor);
      motor.position.set(x, -0.13, z);
      cyl(motor, carbon, 0.19, 0.175, 0.29, [0, 0, 0]);
      cyl(motor, copper, 0.173, 0.173, 0.12, [0, -0.08, 0]);
      for (let j = 0; j < 8; j++) {
        const a = (tau * j) / 8;
        box(
          motor,
          carbon,
          [0.052, 0.14, 0.045],
          [0.16 * Math.cos(a), -0.07, 0.16 * Math.sin(a)],
          0.008,
        ).rotation.y = -a;
      }
      // Two small position lights remain fixed on the motor housing as the prop turns.
      for (const side of [-1, 1]) {
        const angle = side * 0.17;
        box(
          motor,
          led,
          [0.044, 0.017, 0.01],
          [0.184 * Math.sin(angle), 0.038, 0.184 * Math.cos(angle)],
          0.004,
        ).rotation.y = angle;
      }
      cyl(motor, steel, 0.106, 0.165, 0.07, [0, 0.16, 0]);
      batch(motor);
      const rotor = new T.Group();
      props.add(rotor);
      rotor.position.set(x, 0.105, z);
      rotor.rotation.y = index * 0.9;
      cyl(rotor, cap, 0.105, 0.13, 0.13, [0, 0, 0]);
      cyl(rotor, steel, 0.052, 0.052, 0.025, [0, 0.075, 0]);
      for (let i = 0; i < 3; i++) {
        const shape = new T.Shape();
        shape.moveTo(0.06, -0.035);
        shape.bezierCurveTo(0.29, -0.12, 0.69, -0.04, 0.87, 0.12);
        shape.quadraticCurveTo(0.93, 0.22, 0.78, 0.25);
        shape.bezierCurveTo(0.51, 0.23, 0.25, 0.115, 0.06, 0.035);
        shape.closePath();
        const geo = new T.ExtrudeGeometry(shape, {
          depth: 0.018,
          bevelEnabled: false,
          curveSegments: 7,
        });
        geo.rotateX(-1.39);
        geo.rotateY((i * tau) / 3);
        mesh(rotor, geo, blade);
      }
      batch(rotor);
      rotors.push(rotor);
      if (index) repeats.push(rotor, motor);
      index++;
    }
  // Open protective canopy: moulded rails leave the camera and board visible.
  // Chamfer the corners that face the rotor ducts. An orthogonal full-width
  // plate pokes through the inner duct wall on the assembled whoop.
  const pcb = new T.Shape();
  const outline = [
    [-0.16, -0.48],
    [0.16, -0.48],
    [0.44, -0.16],
    [0.44, 0.16],
    [0.16, 0.48],
    [-0.16, 0.48],
    [-0.44, 0.16],
    [-0.44, -0.16],
  ];
  outline.forEach(([x, z], i) => {
    if (i) pcb.lineTo(x, -z);
    else pcb.moveTo(x, -z);
  });
  pcb.closePath();
  const pcbGeometry = new T.ExtrudeGeometry(pcb, {
    depth: 0.069,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.006,
    bevelSegments: 1,
  });
  pcbGeometry.rotateX(-Math.PI / 2);
  mesh(circuits, pcbGeometry, board, 0, -0.132, 0);
  box(
    circuits,
    carbon,
    [0.32, 0.058, 0.32],
    [0.05, -0.025, -0.04],
    0.015,
  ).rotation.y = 0.785;
  for (const s of [-1, 1])
    for (let j = 0; j < 6; j++) {
      const z = (j - 2.5) * 0.134;
      cyl(
        circuits,
        gold,
        0.035,
        0.035,
        0.012,
        [s * (0.399 - Math.max(0, Math.abs(z) - 0.12)), -0.054, z],
        10,
      );
      box(
        circuits,
        j % 2 ? steel : cap,
        [0.065, 0.048, 0.08],
        [s * (0.28 - Math.max(0, Math.abs(z) - 0.18) * 0.55), -0.044, z],
        0.008,
      );
    }
  if (openFrame) {
    for (const s of [-1, 1])
      rod(camera, cap, [s * 0.21, 0.33, 0.3], [s * 0.29, 0.33, 0.63], 0.047);
    box(chassis, framePlate, [0.85, 0.09, 1.94], [0, -0.21, 0]);
    box(canopy, framePlate, [0.71, 0.085, 1.72], [0, 0.49, -0.08]);
    for (const side of [-1, 1])
      for (const end of [-1, 1]) {
        cyl(canopy, trim, 0.047, 0.047, 0.65, [side * 0.29, 0.12, end * 0.64]);
        cyl(
          canopy,
          steel,
          0.065,
          0.065,
          0.025,
          [side * 0.29, 0.54, end * 0.64],
          8,
        );
      }
  } else {
    for (const s of [-1, 1]) {
      // Keep both feet inside the web between the ducts, with a continuous load path.
      for (const end of [-1, 1]) {
        const x = s * 0.255,
          z = end * 0.23;
        rod(chassis, frame, [s * 0.18, -0.21, z], [x, -0.14, z], 0.088);
        cyl(chassis, frame, 0.104, 0.125, 0.13, [x, -0.15, z]);
        cyl(mounts, cap, 0.083, 0.087, 0.115, [x, -0.062, z]);
        cyl(canopy, shell, 0.097, 0.1, 0.055, [x, 0.012, z]);
      }
      tube(
        canopy,
        shell,
        [
          [s * 0.255, 0.018, 0.23],
          [s * 0.35, 0.3, 0.26],
          [s * 0.27, 0.66, 0.13],
          [s * 0.23, 0.69, -0.14],
          [s * 0.31, 0.36, -0.27],
          [s * 0.255, 0.018, -0.23],
        ],
        0.077,
      );
      tube(
        canopy,
        trim,
        [
          [s * 0.255, 0.04, 0.23],
          [s * 0.332, 0.09, -0.05],
          [s * 0.31, 0.36, -0.27],
        ],
        0.032,
      );
      rod(camera, cap, [s * 0.2, 0.34, 0.3], [s * 0.345, 0.34, 0.25], 0.059);
    }
    sphere(canopy, shell, [0, 0.64, -0.053], [0.3, 0.097, 0.37]);
    // The accent follows the curved top of the moulded canopy.
    const stripe = new T.PlaneGeometry(0.081, 0.44, 2, 16);
    const vertices = stripe.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i),
        z = vertices.getY(i);
      vertices.setXYZ(
        i,
        x,
        0.642 + 0.097 * Math.sqrt(1 - (x / 0.3) ** 2 - (z / 0.37) ** 2),
        -0.053 - z,
      );
    }
    stripe.computeVertexNormals();
    mesh(canopy, stripe, trim);
  }
  box(camera, carbon, [0.5, 0.39, 0.33], [0, 0.34, 0.31], 0.075);
  const glass = (m: Material, r: number, h: number, z: number) => {
    const o = cyl(camera, m, r, r, h, [0, 0.36, z], 32);
    o.rotation.x = Math.PI / 2;
    return o;
  };
  glass(lip, 0.224, 0.115, 0.513);
  glass(cap, 0.197, 0.064, 0.589);
  glass(lens, 0.166, 0.059, 0.638);
  sphere(camera, lens, [0, 0.36, 0.661], [0.152, 0.152, 0.028]);
  sphere(camera, optic, [-0.056, 0.424, 0.684], [0.036, 0.014, 0.005]);
  // An annular collar can slide forward at dusk without covering the glass.
  const evening = new T.Group();
  camera.add(evening);
  evening.position.set(0, 0.36, 0.54);
  const collar = new T.LatheGeometry(
    [
      [0.166, -0.055],
      [0.201, -0.058],
      [0.215, -0.041],
      [0.215, 0.027],
      [0.203, 0.039],
      [0.167, 0.031],
      [0.166, -0.055],
    ].map(([r, h]) => new T.Vector2(r, h)),
    36,
  );
  collar.rotateX(Math.PI / 2);
  mesh(evening, collar, cap);
  mesh(evening, new T.TorusGeometry(0.204, 0.008, 6, 40), trim, 0, 0, 0.034);
  evening.name = 'evening-bezel';
  // The emitter sits on the lower lip of the camera cradle. Its diodes face forward and down.
  for (const side of [-1, 1])
    tube(
      chassis,
      frame,
      [
        [side * 0.31, -0.18, 0.3],
        [side * 0.3, -0.23, 0.65],
        [side * 0.24, -0.27, 0.72],
        [side * 0.14, -0.29, 0.77],
      ],
      0.026,
    );
  box(chassis, frame, [0.36, 0.05, 0.17], [0, -0.29, 0.77], 0.022);
  box(strip, cap, [0.26, 0.06, 0.078], [0, -0.317, 0.822], 0.012);
  for (const x of [-0.09, -0.03, 0.03, 0.09])
    box(strip, led, [0.05, 0.024, 0.024], [x, -0.317, 0.866], 0.007);
  if (openFrame)
    for (const s of [-1, 1])
      cyl(mounts, cap, 0.075, 0.08, 0.065, [s * 0.29, -0.12, 0.64]);
  box(plug, cap, [0.22, 0.13, 0.19], [0, -0.23, -0.65], 0.024);
  tube(
    lead,
    frame,
    [
      [-0.06, -0.24, -0.69],
      [-0.09, -0.35, -0.71],
      [-0.09, -0.35, -0.6],
    ],
    0.021,
  );

  tube(
    antenna,
    carbon,
    [
      [0.12, -0.02, -0.3],
      [0.18, 0.27, -0.68],
      [0.25, 0.46, -1.06],
      [0.3, 0.55, -1.3],
    ],
    0.036,
  );
  rod(antenna, trim, [0.25, 0.46, -1.06], [0.31, 0.57, -1.36], 0.042);
  box(battery, cell, [0.5, 0.26, 1.27], [0, -0.345, 0.03], 0.085);
  for (const s of [-1, 1]) {
    box(battery, cap, [0.51, 0.27, 0.14], [0, -0.345, 0.03 + s * 0.59]);
    box(holder, frame, [0.57, 0.06, 0.09], [0, -0.49, s * 0.33]);
  }
  box(battery, cap, [0.505, 0.267, 0.48], [0, -0.345, 0.08], 0.035);
  for (const z of [-0.04, 0.02, 0.08]) {
    box(battery, cell, [0.26, 0.01, 0.018], [0, -0.207, z]);
  }
  if (openFrame) {
    // Simplified silhouettes for the component atlas.
    for (const [i, id] of ['esc', 'receiver', 'video'].entries()) {
      const module = part(id);
      const z = [-0.05, -0.52, -0.68][i],
        y = [-0.16, 0.08, 0.23][i];
      const width = [0.68, 0.29, 0.46][i];
      box(module, board, [width, 0.045, width * 0.83], [0, y, z], 0.025);
      for (const side of [-1, 1]) {
        box(
          module,
          cap,
          [width * 0.26, 0.055, width * 0.42],
          [side * width * 0.22, y + 0.045, z],
          0.012,
        );
        for (const end of [-1, 1])
          cyl(
            module,
            gold,
            0.025,
            0.025,
            0.013,
            [side * width * 0.41, y + 0.03, z + end * width * 0.3],
            10,
          );
      }
    }
    rod(antenna, carbon, [-0.15, 0.06, -0.31], [-0.44, 0.14, -0.94], 0.022);
  }
  // Keep the optical bezel independently movable for the dusk transition.
  camera.remove(evening);
  for (const p of Object.values(parts)) batch(p);
  camera.add(evening);
  const palette = [
    [frame, '#1d1e21', '#f1f3f3'],
    [guard, '#35373b', '#86c4e3'],
    [lip, '#4b4d50', '#a6d8eb'],
    [shell, '#232b34', '#f7faf9'],
    [trim, '#617780', '#53a5cb'],
    [lens, '#536e80', '#2b5269'],
  ] as const;
  const colors = palette.map(([m, a, b]) => ({
    m,
    night: new T.Color(a),
    day: new T.Color(b),
  }));
  function theme(day: number) {
    for (const { m, night, day: light } of colors)
      m.color.lerpColors(night, light, day);
    led.emissiveIntensity = 2.3 * (1 - day) + 0.06;
    evening.scale.setScalar(1.08 - 0.18 * day);
    evening.position.z = 0.64 - 0.12 * day;
  }
  return { root, parts, rotors, repeats, theme, blade, led };
}
export function makeViewingKit() {
  const root = new T.Group();
  const shell = mat('#242a30'),
    bezel = mat('#404952'),
    glass = mat('#28404b', 0.22, 0.34);
  const rubber = mat('#15191e'),
    trim = mat('#728087');
  // A small monitor behind the goggles keeps both viewing options in silhouette.
  box(root, bezel, [1.62, 1.05, 0.15], [0.32, 0.4, -0.48], 0.07);
  box(root, glass, [1.49, 0.91, 0.025], [0.32, 0.4, -0.395], 0.018);
  rod(root, rubber, [0.96, 0.91, -0.47], [1.14, 1.46, -0.47], 0.041);
  box(root, rubber, [2.08, 0.29, 0.21], [-0.15, -0.18, -0.06], 0.1);
  box(root, shell, [1.54, 0.4, 0.62], [-0.15, -0.06, 0.09], 0.17);
  for (const sign of [-1, 1]) {
    const x = -0.15 + sign * 0.39;
    const eye = box(root, shell, [0.82, 0.55, 0.6], [x, -0.2, 0.1], 0.16);
    eye.rotation.z = sign * 0.08;
    for (let j = 0; j < 4; j++)
      box(
        root,
        rubber,
        [0.052, 0.11, 0.015],
        [x + (j - 1.5) * 0.08, -0.15, 0.407],
        0.015,
      );
    rod(root, trim, [x, 0.15, 0.01], [x + sign * 0.12, 0.42, 0.01], 0.031);
    box(root, rubber, [0.18, 0.24, 0.12], [x + sign * 0.12, 0.43, 0.01], 0.05);
  }
  batch(root);
  return root;
}
export function makeGate() {
  const root = new T.Group(),
    trim = mat('#d7dbd9', 0.38, 0.32),
    body = mat('#35414a'),
    accent = mat('#ed8a54'),
    foot = mat('#637078', 0.6);
  for (let i = 0; i < 12; i++) {
    const arc = Math.PI / 6;
    const segment = mesh(
      root,
      new T.TorusGeometry(gateRadius, 0.102, 12, 12, arc),
      i % 3 === 0 ? accent : i % 3 === 1 ? trim : body,
    );
    segment.rotation.z = i * arc;
    const a = i * arc;
    const sleeve = mesh(
      root,
      new T.TorusGeometry(gateRadius, 0.114, 10, 3, 0.035),
      foot,
    );
    sleeve.rotation.z = a;
  }
  rod(root, foot, [0, -1.72, 0], [0, -2.64, 0], 0.073);
  for (const x of [-1, 1]) {
    rod(root, body, [0, -2.48, 0], [x * 0.74, -2.74, 0.25], 0.05);
    box(root, foot, [0.32, 0.07, 0.38], [x * 0.72, -2.74, 0.25]);
  }
  rod(root, body, [0, -2.48, 0], [0, -2.74, -0.53], 0.05);
  batch(root);
  return { root, accent };
}
export function makeRadio() {
  // Original exterior study drawn against RadioMaster's front view of the black TX16S MK3.
  const root = new T.Group();
  root.name = 'TX16S MK3';
  const graphite = mat('#27292e', 0.51),
    rear = mat('#34373e', 0.57),
    grip = mat('#191c20', 0.71),
    rim = mat('#52565e', 0.36, 0.32),
    black = mat('#15171b', 0.38),
    silver = mat('#bac1c6', 0.33, 0.63),
    satin = mat('#858b93', 0.4, 0.41),
    screen = mat('#bfd7e1', 0.24, 0.12),
    power = mat('#52565e', 0.36, 0.32),
    indicators = Array.from({ length: 6 }, () => mat('#858b93', 0.4, 0.41));
  // Front silhouette, from the raised centre shoulder to the rounded lower corners.
  const shape = new T.Shape();
  shape.moveTo(-0.43, 1.4);
  shape.quadraticCurveTo(-0.55, 1.4, -0.68, 1.35);
  shape.lineTo(-1.28, 1.15);
  shape.bezierCurveTo(-1.47, 1.0, -1.46, 0.76, -1.48, 0.52);
  shape.lineTo(-1.48, -1.11);
  shape.bezierCurveTo(-1.46, -1.49, -1.29, -1.74, -0.98, -1.75);
  shape.lineTo(0.98, -1.75);
  shape.bezierCurveTo(1.29, -1.74, 1.46, -1.49, 1.48, -1.11);
  shape.lineTo(1.48, 0.52);
  shape.bezierCurveTo(1.46, 0.76, 1.47, 1, 1.28, 1.15);
  shape.lineTo(0.68, 1.35);
  shape.quadraticCurveTo(0.55, 1.4, 0.43, 1.4);
  shape.closePath();
  const shell = (m: Material, d: number, z: number, rad: number) =>
    mesh(
      root,
      new T.ExtrudeGeometry(shape, {
        depth: d,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: rad,
        bevelThickness: rad,
        curveSegments: 13,
      }),
      m,
      0,
      0,
      z,
    );
  shell(rear, 0.23, -0.37, 0.11);
  shell(graphite, 0.27, -0.09, 0.107);
  const faceZ = 0.3;
  const disc = (
    parent: T.Object3D,
    m: Material,
    x: number,
    y: number,
    z: number,
    r: number,
    depth: number,
  ) => {
    const o = cyl(parent, m, r, r, depth, [x, y, z], 36);
    o.rotation.x = Math.PI / 2;
    return o;
  };
  const sticks: T.Group[] = [],
    switches: T.Group[] = [],
    switchTips: T.Vector3[] = [];
  for (const s of [-1, 1]) {
    const x = s * 0.89,
      y = 0.36;
    box(root, grip, [0.32, 1.91, 0.47], [s * 1.32, -0.3, -0.18], 0.14);
    for (let i = 0; i < 8; i++)
      box(
        root,
        rear,
        [0.043, 0.027, 0.275],
        [s * 1.48, -0.1 - i * 0.095, -0.18],
        0.011,
      );
    disc(root, black, x, y, faceZ, 0.536, 0.082);
    disc(root, rim, x, y, 0.345, 0.444, 0.027);
    disc(root, grip, x, y, 0.363, 0.426, 0.02);
    const ring = mesh(
      root,
      new T.TorusGeometry(0.437, 0.011, 6, 52),
      satin,
      x,
      y,
      0.385,
    );
    ring.name = 'gimbal-ring';
    box(root, rim, [0.594, 0.48, 0.045], [x, y, 0.392], 0.037);
    box(root, black, [0.521, 0.405, 0.026], [x, y, 0.423], 0.041);
    box(root, silver, [0.46, 0.31, 0.034], [x, y, 0.441], 0.04);
    box(root, grip, [0.31, 0.17, 0.038], [x, y, 0.466], 0.032);
    for (const dx of [-1, 1])
      for (const dy of [-1, 1])
        disc(root, black, x + dx * 0.219, y + dy * 0.229, 0.443, 0.027, 0.013);
    const stick = new T.Group();
    root.add(stick);
    stick.position.set(x, y, 0.482);
    disc(stick, satin, 0, 0, 0.02, 0.085, 0.074);
    rod(stick, silver, [0, 0, 0.025], [0, 0.05, 0.288], 0.039, 0.049);
    stick.name = s < 0 ? 'Left gimbal' : 'Right gimbal';
    disc(stick, silver, 0, 0.05, 0.296, 0.081, 0.09);
    for (let i = 0; i < 3; i++)
      disc(stick, satin, 0, 0.05, 0.26 + i * 0.026, 0.084, 0.008);
    disc(stick, graphite, 0, 0.05, 0.342, 0.052, 0.003);
    for (let i = 0; i < 10; i++) {
      const angle = (i * tau) / 10;
      const tooth = mesh(
        stick,
        new T.ConeGeometry(0.024, 0.048, 4),
        silver,
        0.064 * Math.cos(angle),
        0.05 + 0.064 * Math.sin(angle),
        0.36,
      );
      tooth.rotation.set(Math.PI / 2, angle, 0);
    }
    batch(stick);
    sticks.push(stick);
    // The face carries two toggles. The two behind them seat into the sloping shoulder.
    for (let i = 0; i < 4; i++) {
      const shoulder = i >= 2;
      const xx = s * [0.86, 1.115, 1.235, 1.365][i];
      const yy = [1.2, 1.075, 1.245, 1.15][i];
      const zz = [0.315, 0.315, -0.075, -0.28][i];
      const mount = new T.Group();
      mount.position.set(xx, yy, zz);
      if (shoulder) {
        mount.rotation.order = 'ZXY';
        mount.rotation.set(-Math.PI / 2, 0, -s * 0.4, 'ZXY');
      }
      root.add(mount);
      disc(mount, black, 0, 0, 0, 0.099, 0.07);
      disc(mount, silver, 0, 0, 0.039, 0.065, 0.024);
      batch(mount);
      const toggle = new T.Group();
      root.add(toggle);
      const pivot = new T.Vector3(0, 0, 0.05).applyQuaternion(mount.quaternion);
      toggle.position.copy(mount.position).add(pivot);
      const tip = new T.Vector3(
        s * (shoulder ? 0.105 : 0.07),
        shoulder ? (i === 2 ? 0.35 : 0.23) : 0.16,
        shoulder ? 0.025 : 0.22,
      );
      sphere(toggle, satin, [0, 0, 0], [0.046, 0.046, 0.046]);
      rod(toggle, silver, [0, 0, 0], tip.toArray(), 0.025, 0.018);
      const handle = box(
        toggle,
        i === 0 ? grip : silver,
        [0.053, 0.081, 0.037],
        tip.toArray(),
        0.012,
      );
      handle.quaternion.setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        tip.clone().normalize(),
      );
      batch(toggle);
      switches.push(toggle);
      switchTips.push(tip);
    }
    disc(root, black, s * 0.38, 1.278, 0.329, 0.102, 0.108);
    disc(root, rim, s * 0.38, 1.278, 0.395, 0.082, 0.032);
    rod(
      root,
      silver,
      [s * 0.38, 1.278, 0.419],
      [s * 0.402, 1.323, 0.419],
      0.009,
    );
    for (const yy of [0.67, 0.02])
      box(
        root,
        black,
        [0.074, 0.151, 0.039],
        [s * 0.285, yy, 0.338],
        0.026,
      ).rotation.z = -s * 0.35;
    box(root, black, [0.157, 0.066, 0.041], [s * 0.66, -0.22, 0.332], 0.023);
    disc(root, silver, s * 1.27, -0.22, 0.333, 0.094, 0.044);
  }
  // Lower controls flank the wide touch display; the right wheel sits vertically.
  box(root, black, [1.97, 1.22, 0.046], [0, -0.96, 0.307], 0.048);
  box(root, screen, [1.88, 1.135, 0.026], [0, -0.95, 0.346], 0.028);
  for (let i = 0; i < 4; i++)
    box(
      root,
      grip,
      [0.235, 0.11, 0.052],
      [-1.18, -0.64 - i * 0.19, 0.335],
      0.041,
    );
  box(root, black, [0.2, 0.65, 0.046], [1.18, -0.99, 0.335], 0.085);
  cyl(root, grip, 0.079, 0.079, 0.46, [1.18, -0.99, 0.39], 20);
  for (let i = 0; i < 11; i++)
    cyl(root, rim, 0.08, 0.08, 0.012, [1.18, -1.175 + i * 0.037, 0.39], 18);
  for (let i = 0; i < 6; i++)
    disc(root, indicators[i], (i - 2.5) * 0.155, -0.22, 0.335, 0.037, 0.018);
  box(root, power, [0.67, 0.32, 0.072], [0, 0.37, 0.32], 0.13);
  box(root, grip, [0.595, 0.265, 0.053], [0, 0.37, 0.37], 0.1);
  disc(root, silver, 0, -0.005, 0.365, 0.083, 0.075);
  for (let i = 0; i < 7; i++)
    box(
      root,
      black,
      [0.023, 0.035, 0.018],
      [(i - 3) * 0.056, 0.91, 0.307],
      0.008,
    );
  box(root, grip, [0.22, 0.26, 0.23], [0, 1.48, -0.1], 0.06);
  box(root, graphite, [2.24, 0.26, 0.17], [0, 1.68, -0.13], 0.07);
  batch(root);
  // Silkscreen is one small transparent texture; the geometry carries the actual controls.
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 640;
  labelCanvas.height = 720;
  const ctx = labelCanvas.getContext('2d')!;
  const ink = (
    text: string,
    x: number,
    y: number,
    size: number,
    color = '#b4b8ba',
  ) => {
    ctx.fillStyle = color;
    ctx.font = '600 ' + size + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, (x + 1.6) * 200, (1.55 - y) * 200);
  };
  ink('RADIOMASTER', 0, 1.06, 18, '#85898e');
  ink('TX16S', 0, 0.81, 19, '#8e9399');
  ['SA', 'SB', 'SC', 'SD'].forEach((v, i) =>
    ink(v, [-1.12, -0.86, 0.86, 1.12][i], i === 1 || i === 2 ? 0.99 : 0.905, 8),
  );
  ['RTN', 'PAGE›', 'PAGE‹', 'TELE'].forEach((v, i) =>
    ink(v, -1.18, -0.64 - i * 0.19, 8),
  );
  for (let i = 0; i < 6; i++) ink(String(i + 1), (i - 2.5) * 0.155, -0.31, 8);
  ink('⏻', 0, 0.37, 28, '#afb6bd');
  const labelTexture = new T.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = T.SRGBColorSpace;
  const labelMaterial = new T.MeshBasicMaterial({
    map: labelTexture,
    transparent: true,
    depthWrite: false,
  });
  const labels = new T.Mesh(new T.PlaneGeometry(3.2, 3.6), labelMaterial);
  labels.position.set(0, -0.25, 0.411);
  root.add(labels);
  return { root, sticks, switches, switchTips, power, indicators, screen };
}
export function disposeScene(scene: T.Object3D) {
  const materials = new Set<T.Material>();
  scene.traverse((n) => {
    if (n instanceof T.Mesh || n instanceof T.Line) {
      n.geometry.dispose();
      for (const m of Array.isArray(n.material) ? n.material : [n.material])
        materials.add(m);
    }
  });
  for (const material of materials) {
    if (
      material instanceof T.MeshBasicMaterial ||
      material instanceof T.MeshStandardMaterial
    )
      material.map?.dispose();
    material.dispose();
  }
}
