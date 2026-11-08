// Keep fast travel tactile without scheduling a pulse for every skipped percent.
export class DragHaptics {
  private percent = 0;
  private lastPulse = -Infinity;
  private lastBurst = -Infinity;
  private timers: ReturnType<typeof setTimeout>[] = [];
  constructor(private pulse: () => void) {}
  begin(position: number) { this.end(); this.percent = Math.round(position * 100); this.lastPulse = this.lastBurst = -Infinity; }
  move(position: number) {
    const percent = Math.round(Math.max(0, Math.min(1, position)) * 100);
    const delta = Math.abs(percent - this.percent);
    this.percent = percent;
    if (!delta) return;
    const now = Date.now();
    if (delta >= 5 && now - this.lastBurst >= 100) {
      this.timers.forEach(clearTimeout); this.timers = [];
      this.lastBurst = this.lastPulse = now;
      this.pulse();
      this.timers = [18, 36].map(delay => setTimeout(() => this.pulse(), delay));
    } else if (now - this.lastPulse >= 25 && now - this.lastBurst >= 45) {
      this.lastPulse = now; this.pulse();
    }
  }
  end(finishBurst = false) { if (finishBurst) return; this.timers.forEach(clearTimeout); this.timers = []; }
}
