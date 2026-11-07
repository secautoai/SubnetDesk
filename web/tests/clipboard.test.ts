import { expect, test } from "bun:test";
import { remoteCopyMessage, remotePasteMessages } from "../src/clipboard";
import { ClipboardFormat, ControlKey, Message } from "../src/generated/message";

test("paste preserves Unicode, backslashes and line breaks on the wire", () => {
  const text = "Linux / Windows \\path\n中文 😀";
  const messages = remotePasteMessages(text).map(value => Message.decode(Message.encode(value).finish()));
  expect(messages).toHaveLength(2);
  expect(messages[0]?.clipboard?.format).toBe(ClipboardFormat.Text);
  expect(new TextDecoder().decode(messages[0]?.clipboard?.content)).toBe(text);
  expect(messages[1]?.key_event?.seq).toBe(text);
  expect(messages[1]?.key_event?.modifiers).toEqual([]);
});

test("clearing the clipboard does not synthesize a keystroke", () => {
  const messages = remotePasteMessages("");
  expect(messages).toHaveLength(1);
  expect(messages[0]?.clipboard?.content).toHaveLength(0);
});

test("copy requests a guest selection rather than returning stale clipboard text", () => {
  const event = remoteCopyMessage().key_event;
  expect(event?.control_key).toBe(ControlKey.Insert);
  expect(event?.chr).toBeUndefined();
  expect(event?.press).toBe(true);
  expect(event?.modifiers).toEqual([ControlKey.Control]);
  expect(event?.unicode).toBeUndefined();
});
