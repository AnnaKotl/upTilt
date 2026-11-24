import { expect, it } from 'vitest';
import { Group, Scene } from 'three';
import { raceReplays } from '../../src/graphics/race-replays';
import { lapPoint, laps, sampleLap } from '../../src/data/gate-replays';
import {
  gateApproach,
  gateCameraLift,
  routesArrival,
  routesDeparture,
  sampleFlight,
  gateCrossing,
  gateParked,
  gatePoint,
} from '../../src/data/flight-path';

it('moves closer beside the column and stays inside the frame on approach', () => {
  const held = sampleFlight(routesArrival);
  const column = sampleFlight(routesDeparture);
  expect(column[0]).toBeLessThan(held[0]);
  expect(column[1]).toBeCloseTo(0.5, 1);
  expect(column[2]).toBeGreaterThan(held[2]);
  let lastY = column[1];
  for (let i = 1; i <= 160; i++) {
    const p = routesDeparture + ((gateCrossing - routesDeparture) * i) / 160;
    const [worldX, worldY] = gatePoint(p, 16);
    const screenY = 0.5 - (worldY - gateCameraLift(p)) / 10;
    expect(screenY).toBeGreaterThan(0.18);
    expect(Math.abs(screenY - lastY)).toBeLessThan(0.01);
    expect(Math.abs(worldX / 16)).toBeLessThan(0.37);
    lastY = screenY;
  }
  expect(gateCameraLift(gateCrossing)).toBe(0);
});

it('enters from above the right side, crosses the hoop and parks without reversing the visible trace', () => {
  const width = 16;
  let previous = gatePoint(gateApproach, width);
  expect(previous[0]).toBeGreaterThan(width * 0.3);
  expect(previous[1]).toBeGreaterThan(5);
  const [gateX, gateY, gateZ] = gatePoint(gateCrossing, width);
  expect(gateX).toBeCloseTo(0.08 * width);
  expect(gateY).toBeCloseTo(0.65);
  expect(gateZ).toBe(0);
  for (let index = 1; index <= 120; index++) {
    const position = gatePoint(
      gateApproach + ((gateParked - gateApproach) * index) / 120,
      width,
    );
    expect(position[0]).toBeLessThan(previous[0]);
    expect(position[1]).toBeLessThan(previous[1]);
    previous = position;
  }
  const parked = gatePoint(1.15, width);
  previous.forEach((value, axis) => expect(value).toBeCloseTo(parked[axis]));
});

it('starts at the parked pose and reveals the drawing only after the passes and a pause', () => {
  const scene = new Scene(),
    gate = new Group();
  const replay = raceReplays(scene, gate);
  replay.resize(16);
  expect(replay.update(0.77, 0, 0, 0)).toBe('pass');
  expect(replay.update(1, 200, 0, 200)).toBe('replays');
  const swarm = scene.getObjectByName('Previous laps')!;
  replay.update(1, 1400, 0, 200);
  expect(
    swarm.children.filter(
      (child) => child.name.startsWith('Replay') && child.visible,
    ),
  ).toHaveLength(3);
  expect(replay.update(1, 6200, 0, 200)).toBe('replays');
  expect(replay.update(1.1, 7200, 0, 7100)).toBe('replays');
  expect(replay.update(1.1, 8200, 0, 7100)).toBe('study');
  expect(replay.update(1.12, 8300, 0, 8300)).toBe('study');
  expect(swarm.visible).toBe(false);
  expect(replay.update(2, 8500, 0, 8500)).toBe('pass');
  expect(replay.update(1, 9100, 0, 9100)).toBe('replays');
  replay.reset();
  expect(swarm.visible).toBe(false);
});

it('all six paths pass within the ring and accumulate three-dimensional distance', () => {
  for (const width of [10, 16, 24]) {
    for (const index of laps.keys()) {
      expect(Math.hypot(...lapPoint(index, 0.5, width))).toBeLessThan(0.2);
      const samples = sampleLap(index, width);
      expect(samples[0].length).toBe(0);
      const end = samples.at(-1)!;
      expect(end.length).toBeGreaterThanOrEqual(
        Math.hypot(...end.point.map((v, i) => v - samples[0].point[i])),
      );
      expect(end.fraction).toBe(1);
    }
  }
});

it('lets launched aircraft and their deposited light coast when scrolling away', () => {
  const scene = new Scene(),
    gate = new Group();
  const replay = raceReplays(scene, gate);
  replay.resize(16);
  replay.update(1, 0, 0, 0);
  replay.update(1.34, 610, 0, 610);
  const swarm = scene.getObjectByName('Previous laps')!;
  expect(replay.moving).toBe(true);
  expect(swarm.getObjectByName('Replay 2')!.visible).toBe(true);
  replay.update(1.36, 2000, 0, 610);
  expect(swarm.getObjectByName('Replay 3')!.visible).toBe(false);
  replay.update(1.36, 3400, 0, 610);
  expect(swarm.getObjectByName('Replay 2')!.visible).toBe(false);
  expect(replay.moving).toBe(true);
  replay.update(1.36, 5200, 0, 610);
  expect(replay.moving).toBe(false);
});

it('resumes pending launches after a scroll reversal without replaying aircraft already launched', () => {
  const scene = new Scene();
  const replay = raceReplays(scene, new Group());
  replay.resize(16);
  replay.update(1, 0, 0, 0);
  const swarm = scene.getObjectByName('Previous laps')!;
  expect(replay.update(0.968, 350, 0, 350)).toBe('replays');
  expect(replay.update(1.37, 700, 0, 700)).toBe('pass');
  replay.update(1.37, 4200, 0, 700);
  expect(replay.update(1, 4600, 0, 4600)).toBe('replays');
  expect(swarm.getObjectByName('Replay 1')!.visible).toBe(false);
  expect(swarm.getObjectByName('Replay 3')!.visible).toBe(false);
  replay.update(1, 5050, 0, 4600);
  expect(swarm.getObjectByName('Replay 3')!.visible).toBe(true);
  expect(replay.followedAge).toBeCloseTo(0.03);
});

it('crossfades the dotted survey while the last trail fades and holds it through a short departure', () => {
  const replay = raceReplays(new Scene(), new Group());
  replay.resize(16);
  replay.update(1, 0, 0, 0);
  expect(replay.update(1, 5900, 0, 0)).toBe('replays');
  expect(replay.survey).toBeGreaterThan(0);
  expect(replay.survey).toBeLessThan(1);
  expect(replay.moving).toBe(true);
  const asSeen = replay.survey;
  replay.pause();
  replay.update(1, 40000, 0, 0);
  expect(replay.survey).toBe(asSeen);
  expect(replay.update(1, 41700, 0, 0)).toBe('study');
  expect(replay.update(1.44, 42100, 0, 42100)).toBe('pass');
  expect(replay.update(1, 42400, 0, 42400)).toBe('study');
  expect(replay.survey).toBe(1);
  replay.update(1.7, 42700, 0, 42700);
  expect(replay.update(1, 43000, 0, 43000)).toBe('replays');
  expect(replay.survey).toBe(0);
});

it('lets each side bend independently while pinning the gate and both endpoints', () => {
  for (const index of laps.keys()) {
    const original = sampleLap(index, 16);
    const raised = sampleLap(index, 16, [0.5, 0]);
    for (const step of [0, 60, 90, 120])
      expect(raised[step].point).toEqual(original[step].point);
    expect(raised[30].point[1] - original[30].point[1]).toBeCloseTo(0.5);
    expect(raised[120].length).not.toBeCloseTo(original[120].length, 4);
  }
});
