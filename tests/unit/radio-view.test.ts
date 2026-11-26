import { describe, it, expect } from 'vitest';
import { demonstrationHold, radioViewAngles } from '../../src/lib/radio-view';

describe('transmitter demonstration view', () => {
  it('turns the model tail-on once the demonstration holds', () => {
    const { yaw } = radioViewAngles(0.26, 0.2, 1);
    // Tail-on is what makes a stick pushed right bank right on screen.
    expect(yaw).toBeCloseTo(Math.PI, 6);
  });

  it('leaves the flight path untouched outside the chapter', () => {
    expect(radioViewAngles(0.26, 0.2, 0)).toEqual({ tilt: 0.26, yaw: 0.2 });
  });

  it('squares the model up as it settles', () => {
    const half = radioViewAngles(0.26, 0.2, 0.5);
    expect(half.tilt).toBeLessThan(0.26);
    expect(half.yaw).toBeGreaterThan(0.2);
    expect(half.yaw).toBeLessThan(Math.PI);
  });

  it('holds only while airborne in the chapter', () => {
    expect(demonstrationHold(0, 0.74)).toBe(0);
    expect(demonstrationHold(1, 0)).toBe(0);
    expect(demonstrationHold(1, 0.74)).toBe(1);
    expect(demonstrationHold(1, 2)).toBe(1);
  });
});
