import { ClipboardFormat, ControlKey, KeyboardMode, Message } from "./generated/message";

// Text insertion belongs to the guest protocol, so native hosts do not need to
// synthesize DOM keys or guess an application's paste shortcut.
export function remotePasteMessages(text: string): Message[] {
  const messages = [Message.create({ clipboard: {
    compress: false, content: new TextEncoder().encode(text), width: 0, height: 0,
    format: ClipboardFormat.Text, special_name: "",
  } })];
  if (text) messages.push(Message.create({ key_event: {
    seq: text, down: false, press: true, modifiers: [], mode: KeyboardMode.Legacy,
  } }));
  return messages;
}

export function remoteCopyMessage(): Message {
  return Message.create({ key_event: {
    // Ctrl+C sends SIGINT in terminals. Ctrl+Insert copies in both terminals
    // and desktop editors without interrupting the foreground process.
    control_key: ControlKey.Insert, down: true, press: true,
    modifiers: [ControlKey.Control], mode: KeyboardMode.Legacy,
  } });
}
