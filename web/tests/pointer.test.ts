import { expect, test } from "bun:test";
import { PointerInput } from "../src/pointer";
import type { PointerSample } from "../src/capabilities";

const sample = (clientX: number, buttons = 0): PointerSample => ({ clientX, clientY: 20,
  button: 0, buttons, altKey: false, ctrlKey: false, shiftKey: false, metaKey: false });

test("fast clicks move the guest cursor before pressing and discard the delayed move", () => {
  const frames = new Map<number, FrameRequestCallback>();
  const events: [number, number][] = [];
  const pointer = new PointerInput((point, type) => events.push([point.clientX, type]),
    callback => { frames.set(1, callback); return 1; }, id => { frames.delete(id); });
  pointer.move(sample(10));
  pointer.button(sample(100, 1), 1);
  pointer.move(sample(150, 1));
  pointer.button(sample(200), 2);
  for (const frame of frames.values()) frame(0);
  expect(events).toEqual([[100, 0], [100, 1], [200, 0], [200, 2]]);
});

test("motion remains coalesced and disconnect cancels pending input", () => {
  const frames = new Map<number, FrameRequestCallback>();
  const events: number[] = [];
  const pointer = new PointerInput(point => events.push(point.clientX),
    callback => { frames.set(1, callback); return 1; }, id => { frames.delete(id); });
  pointer.move(sample(10));
  pointer.move(sample(20));
  frames.get(1)!(0);
  expect(events).toEqual([20]);
  pointer.move(sample(30));
  pointer.reset();
  expect(frames.size).toBe(0);
  expect(events).toEqual([20]);
});
