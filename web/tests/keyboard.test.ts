import { expect, test } from "bun:test";
import { remoteKeyEvent } from "../src/keyboard";
import { ControlKey, KeyEvent } from "../src/generated/message";

const event = (key: string, modifiers = {}) => ({ key, altKey: false, ctrlKey: false, shiftKey: false, metaKey: false, ...modifiers });

test("Windows shortcuts use layout keys rather than Unicode insertion", () => {
  for (const key of ["a", "c", "v", "z"]) {
    const value = remoteKeyEvent(event(key, { ctrlKey: true }))!;
    const wire = KeyEvent.decode(KeyEvent.encode(value).finish());
    expect(wire.chr).toBe(key.charCodeAt(0));
    expect(wire.unicode).toBeUndefined();
    expect(wire.modifiers).toEqual([ControlKey.Control]);
  }
});

test("Alt and Meta shortcuts retain their modifiers", () => {
  expect(remoteKeyEvent(event("r", { metaKey: true }))?.chr).toBe(114);
  expect(remoteKeyEvent(event("f", { altKey: true }))?.modifiers).toEqual([ControlKey.Alt]);
});

test("typed Unicode is inserted once and supplementary characters are preserved", () => {
  expect(remoteKeyEvent(event("😀"))?.unicode).toBe(0x1f600);
  expect(remoteKeyEvent(event("A", { shiftKey: true }))?.unicode).toBe(65);
  expect(remoteKeyEvent(event("a"), true)).toBeUndefined();
  expect(remoteKeyEvent(event("Unidentified"))).toBeUndefined();
});

test("control keys send their release without inserting text", () => {
  const value = remoteKeyEvent(event("Enter"), true);
  expect(value?.control_key).toBe(ControlKey.Return);
  expect(value?.down).toBe(false);
  expect(value?.press).toBe(false);
});

test("Ctrl stays held across a Windows shortcut instead of being clicked and released first", () => {
  const down = remoteKeyEvent(event("Control", { ctrlKey: true }))!;
  const key = remoteKeyEvent(event("n", { ctrlKey: true }))!;
  const up = remoteKeyEvent(event("Control"), true)!;
  expect(down.control_key).toBe(ControlKey.Control);
  expect(down.down).toBe(true);
  expect(down.press).toBe(false);
  expect(key.chr).toBe(110);
  expect(key.modifiers).toEqual([ControlKey.Control]);
  expect(up.down).toBe(false);
  expect(up.press).toBe(false);
  for (const name of ["Shift", "Alt", "Meta"]) {
    expect(remoteKeyEvent(event(name))?.press).toBe(false);
  }
});
