/**
 * Take a control out of reach, or bring it back, without a jump.
 *
 * `data-away` is what the stylesheet animates: fixed controls fade, a tab in
 * the rail also collapses its own box so the rail closes behind it. `inert`
 * carries the meaning — gone from the focus order and the accessibility tree —
 * which `hidden` used to provide at the cost of an instant `display: none`.
 */
export function setAway(node: Element | null | undefined, away: boolean): void {
  if (!node) return;
  node.toggleAttribute('data-away', away);
  (node as HTMLElement).inert = away;
}
