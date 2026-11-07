import { ControlKey, KeyboardMode, KeyEvent } from "./generated/message";

export function currentModifiers(
  event: Pick<KeyboardEvent, "altKey" | "ctrlKey" | "shiftKey" | "metaKey">,
): ControlKey[] {
  const modifiers: ControlKey[] = [];
  if (event.altKey) modifiers.push(ControlKey.Alt);
  if (event.ctrlKey) modifiers.push(ControlKey.Control);
  if (event.shiftKey) modifiers.push(ControlKey.Shift);
  if (event.metaKey) modifiers.push(ControlKey.Meta);
  return modifiers;
}

const controlKeys: Record<string, ControlKey> = {
  Alt: ControlKey.Alt,
  Backspace: ControlKey.Backspace,
  CapsLock: ControlKey.CapsLock,
  Control: ControlKey.Control,
  Delete: ControlKey.Delete,
  ArrowDown: ControlKey.DownArrow,
  End: ControlKey.End,
  Escape: ControlKey.Escape,
  Home: ControlKey.Home,
  ArrowLeft: ControlKey.LeftArrow,
  Meta: ControlKey.Meta,
  PageDown: ControlKey.PageDown,
  PageUp: ControlKey.PageUp,
  Enter: ControlKey.Return,
  ArrowRight: ControlKey.RightArrow,
  Shift: ControlKey.Shift,
  " ": ControlKey.Space,
  Tab: ControlKey.Tab,
  ArrowUp: ControlKey.UpArrow,
  Insert: ControlKey.Insert,
};
for (let index = 1; index <= 12; index += 1) {
  controlKeys[`F${index}`] = ControlKey[`F${index}` as keyof typeof ControlKey] as ControlKey;
}

export const modifierKeys = new Set([ControlKey.Alt, ControlKey.Control, ControlKey.Shift, ControlKey.Meta]);

export function remoteKeyEvent(event: Pick<KeyboardEvent, "key" | "altKey" | "ctrlKey" | "shiftKey" | "metaKey">, release = false): KeyEvent | undefined {
  const controlKey = controlKeys[event.key];
  if (release && controlKey === undefined) return;
  const keyEvent: Partial<KeyEvent> = {
    down: !release,
    // A modifier stays down until keyup; an atomic press would release Ctrl
    // before the following character reaches Windows.
    press: !release && (controlKey === undefined || !modifierKeys.has(controlKey)),
    modifiers: currentModifiers(event),
    mode: KeyboardMode.Legacy,
  };
  if (controlKey !== undefined) {
    keyEvent.control_key = controlKey;
  } else {
    const characters = Array.from(event.key);
    const codePoint = characters[0]?.codePointAt(0);
    if (codePoint === undefined || characters.length !== 1) return;
    // Unicode injection inserts text on Windows and cannot invoke shortcuts.
    // Chr asks the guest to press the layout key with the supplied modifiers.
    if (event.ctrlKey || event.altKey || event.metaKey) keyEvent.chr = codePoint;
    else keyEvent.unicode = codePoint;
  }
  return KeyEvent.create(keyEvent);
}
