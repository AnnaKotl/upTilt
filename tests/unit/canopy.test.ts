import { expect, it } from 'vitest';
import { DoubleSide, Mesh, Raycaster, Vector3 } from 'three';
import { makeWhoop, disposeScene } from '../../src/graphics/specimen';
it('seats all four canopy feet on their bushes and the chassis underneath', () => {
  const { root, parts } = makeWhoop();
  root.updateMatrixWorld(true);
  root.traverse((child) => {
    if (child instanceof Mesh && !Array.isArray(child.material))
      child.material.side = DoubleSide;
  });
  try {
    for (const side of [-1, 1])
      for (const end of [-1, 1]) {
        const ray = new Raycaster(
          new Vector3(side * 0.255, 1, end * 0.23),
          new Vector3(0, -1, 0),
        );
        const heights = (id: string) =>
          ray.intersectObject(parts[id], true).map((hit) => hit.point.y);
        const foot = heights('canopy'),
          bush = heights('mounts'),
          seat = heights('frame');
        for (const hits of [foot, bush, seat])
          expect(hits.length).toBeGreaterThan(1);
        // Compare the touching surfaces at each mounting point, not the combined bounds.
        expect(Math.min(...foot)).toBeLessThanOrEqual(
          Math.max(...bush) + 0.001,
        );
        expect(Math.min(...bush)).toBeLessThanOrEqual(
          Math.max(...seat) + 0.001,
        );
      }
  } finally {
    disposeScene(root);
  }
});
