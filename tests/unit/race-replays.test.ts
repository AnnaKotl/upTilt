import { expect, it } from 'vitest';
import { Group, Scene } from 'three';
import { raceReplays } from '../../src/graphics/race-replays';
it('finishes launched runs after exit and waits for a fresh forward crossing', () => {
  const gate = new Group(),
    scene = new Scene();
  scene.add(gate);
  const replay = raceReplays(scene, gate);
  expect(replay.update(1.1, 0, 0)).toBe(true);
  expect(replay.update(1.1, 1200, 0)).toBe(true);
  gate.visible = false;
  expect(replay.update(1.65, 1500, 0)).toBe(true);
  expect(replay.update(1.15, 4500, 0)).toBe(true);
  expect(replay.update(1.12, 5100, 0)).toBe(false);
  expect(replay.update(1.08, 6000, 0)).toBe(false);
  replay.update(0.7, 6200, 0);
  expect(replay.update(1.1, 6600, 0)).toBe(true);
  replay.reset();
  replay.update(1.7, 7100, 0);
  expect(replay.update(1.1, 7300, 0)).toBe(false);
});
