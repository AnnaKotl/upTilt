export const phases = [
  { id: 1, term: 'ARMED', x: 0, y: 0, arrow: '' },
  { id: 2, term: 'Throttle', x: 0, y: 1, arrow: 'up' },
  { id: 3, term: 'Pitch', x: 0, y: 1, arrow: 'up' },
  { id: 3, term: 'Roll', x: 1, y: 0, arrow: 'right' },
  { id: 3, term: 'Pitch', x: 0, y: -1, arrow: 'down' },
  { id: 3, term: 'Roll', x: -1, y: 0, arrow: 'left' },
  { id: 2, term: 'Yaw', x: 1, y: 0, arrow: 'cw' },
  { id: 2, term: 'Yaw', x: -1, y: 0, arrow: 'ccw' },
  ...['ANGLE', 'HORIZON', 'ACRO'].map((term, i) => ({
    id: 4,
    term,
    x: 0,
    y: i - 1,
    arrow: '',
  })),
  { id: 2, term: 'Throttle', x: 0, y: -1, arrow: 'down' },
  { id: 1, term: 'DISARMED', x: 0, y: 0, arrow: '' },
];

const stepMs = 1780;
const returnMs = 420;
export const leadInMs = 1400;
// The stick holds its command, then centres while the same label is still visible.
export const demoFrames = phases.flatMap((phase) =>
  phase.id === 3 || phase.term === 'Yaw'
    ? [
        { ...phase, duration: stepMs - returnMs },
        { ...phase, x: 0, y: 0, arrow: '', duration: returnMs },
      ]
    : [{ ...phase, duration: stepMs }],
);
export const demoDurationMs = leadInMs + (phases.length - 1) * stepMs;
