// data-away is animated by the stylesheet; inert keeps it out of focus order.
export function setAway(node: Element | null | undefined, away: boolean): void {
  if (!node) return;
  node.toggleAttribute('data-away', away);
  (node as HTMLElement).inert = away;
}
