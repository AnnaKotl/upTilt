export type Aircraft = 'whoop' | 'seven';
export function currentAircraft(): Aircraft {
  return document.documentElement.dataset.aircraft === 'seven'
    ? 'seven'
    : 'whoop';
}
export function selectAircraft(model: Aircraft) {
  if (currentAircraft() === model) return;
  document.documentElement.dataset.aircraft = model;
  try {
    sessionStorage.setItem('uptilt:aircraft', model);
  } catch {}
  window.dispatchEvent(new Event('aircraft-change'));
}
