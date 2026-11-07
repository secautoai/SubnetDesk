import { expect, test } from "bun:test";
import { applyDisplaySwitch } from "../src/display";
import { PeerInfo, SwitchDisplay } from "../src/generated/message";
import { mapCanvasPoint } from "../src/protocol";

test("Windows resolution notifications update input before the next frame", () => {
  const peer = PeerInfo.create({ displays: [{ x: 0, y: 0, width: 1920, height: 1200 }], current_display: 0 });
  const change = SwitchDisplay.decode(SwitchDisplay.encode(SwitchDisplay.create({
    display: 0, x: 0, y: 0, width: 1520, height: 976,
  })).finish());
  const updated = applyDisplaySwitch(peer, change)!;
  const display = updated.displays[updated.current_display]!;
  expect(mapCanvasPoint(760, 488, 1520, 976, display.width, display.height, display.x, display.y))
    .toEqual({ x: 760, y: 488 });
  expect(peer.displays[0]?.width).toBe(1920);
  expect(applyDisplaySwitch(updated, change)).toBeUndefined();
});

test("monitor switches preserve origins and reject invalid geometry", () => {
  const peer = PeerInfo.create({ displays: [{ width: 1920, height: 1080 }, { x: -1280, width: 1280, height: 720 }] });
  const change = SwitchDisplay.create({ display: 1, x: -1280, y: 120, width: 1280, height: 720 });
  const updated = applyDisplaySwitch(peer, change)!;
  const display = updated.displays[1]!;
  expect(mapCanvasPoint(640, 360, 1280, 720, display.width, display.height, display.x, display.y))
    .toEqual({ x: -640, y: 480 });
  expect(applyDisplaySwitch(peer, { ...change, display: 2 })).toBeUndefined();
  expect(applyDisplaySwitch(peer, { ...change, width: 0 })).toBeUndefined();
});
