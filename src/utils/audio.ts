/**
 * Synthesizes piezoelectric buzzer alarm audio and acoustic clap feedback
 * using the Web Audio API.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private buzzerOscillator: OscillatorNode | null = null;
  private buzzerGain: GainNode | null = null;
  private beepInterval: number | null = null;
  public isMuted: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.buzzerGain && this.ctx) {
      this.buzzerGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public startBuzzerAlarm(frequency: number = 2400) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // If already beeping, don't recreate
    if (this.buzzerOscillator) return;

    try {
      const now = this.ctx.currentTime;
      this.buzzerOscillator = this.ctx.createOscillator();
      this.buzzerGain = this.ctx.createGain();

      this.buzzerOscillator.type = 'square'; // Typical piezoelectric timbre
      this.buzzerOscillator.frequency.setValueAtTime(frequency, now);

      this.buzzerGain.gain.setValueAtTime(0, now);
      this.buzzerOscillator.connect(this.buzzerGain);
      this.buzzerGain.connect(this.ctx.destination);
      this.buzzerOscillator.start();

      // Pulsed alarm sound pattern (100ms on, 100ms off)
      let isOn = false;
      this.beepInterval = window.setInterval(() => {
        if (!this.ctx || !this.buzzerGain || this.isMuted) return;
        isOn = !isOn;
        const t = this.ctx.currentTime;
        this.buzzerGain.gain.cancelScheduledValues(t);
        this.buzzerGain.gain.setValueAtTime(isOn ? 0.22 : 0.001, t);
      }, 120);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public stopBuzzerAlarm() {
    if (this.beepInterval) {
      clearInterval(this.beepInterval);
      this.beepInterval = null;
    }

    if (this.buzzerGain && this.ctx) {
      try {
        this.buzzerGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.buzzerGain.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch {}
    }

    if (this.buzzerOscillator) {
      try {
        this.buzzerOscillator.stop();
        this.buzzerOscillator.disconnect();
      } catch {}
      this.buzzerOscillator = null;
      this.buzzerGain = null;
    }
  }

  public playClapSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      // Noise-like snap using frequency glide
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  public playVibrationThud() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }
}

export const audioSynth = new AudioSynthesizer();
