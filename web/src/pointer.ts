import type { PointerSample } from "./capabilities";

export class PointerInput {
  private pending?: PointerSample;
  private animationFrame?: number;

  constructor(
    private readonly send: (sample: PointerSample, type: number) => void,
    private readonly schedule: (callback: FrameRequestCallback) => number = requestAnimationFrame,
    private readonly cancel: (handle: number) => void = cancelAnimationFrame,
  ) {}

  move(sample: PointerSample): void {
    this.pending = sample;
    if (this.animationFrame !== undefined) return;
    this.animationFrame = this.schedule(() => {
      this.animationFrame = undefined;
      const latest = this.pending;
      this.pending = undefined;
      if (latest) this.send(latest, 0);
    });
  }

  button(sample: PointerSample, type: 1 | 2): void {
    this.reset();
    // RustDesk applies button transitions at its current cursor position;
    // coordinates in a button message do not move it. A coalesced move must
    // therefore never arrive after the click or after the end of a drag.
    this.send(sample, 0);
    this.send(sample, type);
  }

  reset(): void {
    if (this.animationFrame !== undefined) this.cancel(this.animationFrame);
    this.animationFrame = undefined;
    this.pending = undefined;
  }
}
