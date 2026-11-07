import type { PeerInfo, SwitchDisplay } from "./generated/message";

// Resolution changes arrive as Misc.switch_display, not PeerInfo. Input and
// video must move to that geometry together after a guest resize.
export function applyDisplaySwitch(peer: PeerInfo, change: SwitchDisplay): PeerInfo | undefined {
  if (!Number.isInteger(change.display) || change.display < 0 ||
      !Number.isInteger(change.width) || change.width <= 0 ||
      !Number.isInteger(change.height) || change.height <= 0) return;
  const previous = peer.displays[change.display];
  if (!previous) return;
  if (peer.current_display === change.display && previous.x === change.x &&
      previous.y === change.y && previous.width === change.width &&
      previous.height === change.height) return;
  const displays = [...peer.displays];
  displays[change.display] = { ...previous, x: change.x, y: change.y,
    width: change.width, height: change.height, cursor_embedded: change.cursor_embedded,
    original_resolution: change.original_resolution };
  return { ...peer, displays, current_display: change.display };
}
