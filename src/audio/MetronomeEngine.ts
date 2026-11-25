import type {
  AccentLevel,
  MetronomeConfig,
  ScheduledStepEvent,
} from '../types/metronome';

interface WebkitWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;
const STEPS_PER_BAR = 16; // 4 beats * 4 subdivisions (1, e, &, a)

const LEVEL_GAIN: Record<AccentLevel, number> = {
  mute: 0,
  soft: 0.28,
  normal: 0.65,
  accent: 1.0,
};

/**
 * Sample-accurate Web Audio API lookahead scheduler for 4/4 micro-timing grooves.
 * Uses a 25ms JS lookahead timer to schedule audio events 100ms ahead on the
 * hardware AudioContext clock (never triggering clicks directly on JS timers).
 */
export class MetronomeEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private schedulerId: number | null = null;
  private isRunning = false;
  private unlocked = false;

  /** Quantized grid timestamp (AudioContext seconds) of the next 16th-note step. */
  private nextGridTime = 0;
  /** Current 16th-note index within the 4/4 bar (0..15). */
  private currentStep = 0;

  /** Queue of scheduled step events for requestAnimationFrame visual sync. */
  private visualQueue: ScheduledStepEvent[] = [];

  private config: MetronomeConfig;

  constructor(initialConfig: MetronomeConfig) {
    this.config = {
      bpm: initialConfig.bpm,
      feel: initialConfig.feel,
      subdivisions: [
        { ...initialConfig.subdivisions[0] },
        { ...initialConfig.subdivisions[1] },
        { ...initialConfig.subdivisions[2] },
        { ...initialConfig.subdivisions[3] },
      ],
    };
  }

  /**
   * Lazily initializes the AudioContext and runs the iOS Safari unlock routine.
   * Must be invoked inside a user gesture handler (e.g., Play tap).
   */
  public unlock(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxCtor =
        window.AudioContext || (window as WebkitWindow).webkitAudioContext;
      if (!AudioCtxCtor) {
        throw new Error('Web Audio API is not supported in this browser.');
      }
      this.audioCtx = new AudioCtxCtor();

      const compressor = this.audioCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-6, this.audioCtx.currentTime);
      compressor.knee.setValueAtTime(12, this.audioCtx.currentTime);
      compressor.ratio.setValueAtTime(6, this.audioCtx.currentTime);
      compressor.attack.setValueAtTime(0.002, this.audioCtx.currentTime);
      compressor.release.setValueAtTime(0.08, this.audioCtx.currentTime);

      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0.9, this.audioCtx.currentTime);

      this.masterGain.connect(compressor);
      compressor.connect(this.audioCtx.destination);

      this.noiseBuffer = this.createNoiseBuffer(this.audioCtx);
    }

    const ctx = this.audioCtx;
    const state = ctx.state as string;
    if (state === 'suspended' || state === 'interrupted') {
      void ctx.resume();
    }

    // Play a 1-sample silent buffer on first unlock to wake iOS Safari audio hardware
    if (!this.unlocked) {
      const silentBuffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(ctx.destination);
      source.start(0);
      this.unlocked = true;
    }

    return ctx;
  }

  public updateConfig(next: MetronomeConfig): void {
    this.config = {
      bpm: Math.max(30, Math.min(260, next.bpm)),
      feel: Math.max(0, Math.min(100, next.feel)),
      subdivisions: [
        { ...next.subdivisions[0] },
        { ...next.subdivisions[1] },
        { ...next.subdivisions[2] },
        { ...next.subdivisions[3] },
      ],
    };
  }

  public start(): void {
    if (this.isRunning) return;

    const ctx = this.unlock();
    this.isRunning = true;
    this.currentStep = 0;
    this.visualQueue = [];

    // Give enough initial headroom so even a -30% offset on step 0 schedules cleanly
    const sixteenthDur = this.getSixteenthDuration();
    const initialLead = Math.max(0.05, 0.35 * sixteenthDur);
    this.nextGridTime = ctx.currentTime + initialLead;

    // Schedule first batch immediately, then continue on the 25ms lookahead interval
    this.schedulerTick();
    this.schedulerId = window.setInterval(() => {
      this.schedulerTick();
    }, LOOKAHEAD_MS);
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    this.visualQueue = [];
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getCurrentTime(): number {
    return this.audioCtx ? this.audioCtx.currentTime : 0;
  }

  /**
   * Drains all scheduled visual events whose audio time has arrived, returning
   * the most recent active step (or null if none have fired since last poll).
   */
  public consumeLatestVisualEvent(): ScheduledStepEvent | null {
    if (!this.audioCtx || this.visualQueue.length === 0) {
      return null;
    }

    const now = this.audioCtx.currentTime;
    let latest: ScheduledStepEvent | null = null;

    while (
      this.visualQueue.length > 0 &&
      this.visualQueue[0].scheduledTime <= now
    ) {
      latest = this.visualQueue.shift() ?? null;
    }

    return latest;
  }

  public dispose(): void {
    this.stop();
    if (this.audioCtx) {
      void this.audioCtx.close();
      this.audioCtx = null;
      this.masterGain = null;
      this.noiseBuffer = null;
      this.unlocked = false;
    }
  }

  private getSixteenthDuration(): number {
    return 60 / this.config.bpm / 4;
  }

  private schedulerTick(): void {
    if (!this.audioCtx || !this.isRunning) return;

    const now = this.audioCtx.currentTime;

    // Guard against tab-backgrounding catch-up bursts
    if (this.nextGridTime < now - 0.5) {
      this.nextGridTime = now + 0.05;
    }

    const horizon = now + SCHEDULE_AHEAD_SEC;

    while (true) {
      const subIndex = this.currentStep % 4;
      const slot = this.config.subdivisions[subIndex];
      const sixteenthDur = this.getSixteenthDuration();
      const effectiveOffsetPercent =
        slot.offsetPercent * (this.config.feel / 100);
      const offsetSec = (effectiveOffsetPercent / 100) * sixteenthDur;
      const candidateTime = this.nextGridTime + offsetSec;

      // Schedule if either the quantized grid point or the shifted hit falls inside the lookahead window
      if (Math.min(this.nextGridTime, candidateTime) >= horizon) {
        break;
      }

      const scheduledTime = Math.max(now + 0.002, candidateTime);
      const beatIndex = Math.floor(this.currentStep / 4);

      this.scheduleStep(
        this.currentStep,
        beatIndex,
        subIndex,
        scheduledTime,
        effectiveOffsetPercent,
        slot.level
      );

      // Advance quantized grid cleanly so micro-timing never causes tempo drift
      this.nextGridTime += sixteenthDur;
      this.currentStep = (this.currentStep + 1) % STEPS_PER_BAR;
    }
  }

  private scheduleStep(
    stepIndex: number,
    beatIndex: number,
    subIndex: number,
    time: number,
    effectiveOffsetPercent: number,
    level: AccentLevel
  ): void {
    // Always enqueue visual event so the 16th-note tracker stays smooth
    this.visualQueue.push({
      stepIndex,
      beatIndex,
      subIndex,
      scheduledTime: time,
      effectiveOffsetPercent,
      level,
    });

    if (level === 'mute' || !this.audioCtx || !this.masterGain) {
      return;
    }

    const gainScale = LEVEL_GAIN[level];
    const isDownbeat = stepIndex === 0;
    const isMainBeat = subIndex === 0;

    if (isDownbeat) {
      this.triggerDownbeatClick(time, gainScale);
    } else if (isMainBeat) {
      this.triggerBeatClick(time, gainScale);
    } else {
      this.triggerSubdivisionClick(time, gainScale, level === 'accent');
    }
  }

  /**
   * Downbeat accent (Beat 1): bright, punchy woodblock/rimshot transient.
   */
  private triggerDownbeatClick(time: number, gainScale: number): void {
    const ctx = this.audioCtx!;
    const dest = this.masterGain!;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1760, time);
    osc.frequency.exponentialRampToValueAtTime(880, time + 0.028);

    oscGain.gain.setValueAtTime(0.0001, time);
    oscGain.gain.linearRampToValueAtTime(0.95 * gainScale, time + 0.0015);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.06);

    // Crisp transient snap
    this.triggerNoiseBurst(time, 3600, 1.8, 0.35 * gainScale, 0.014);
  }

  /**
   * Standard beat click (Beats 2, 3, 4): focused woody pulse.
   */
  private triggerBeatClick(time: number, gainScale: number): void {
    const ctx = this.audioCtx!;
    const dest = this.masterGain!;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1180, time);
    osc.frequency.exponentialRampToValueAtTime(620, time + 0.022);

    oscGain.gain.setValueAtTime(0.0001, time);
    oscGain.gain.linearRampToValueAtTime(0.75 * gainScale, time + 0.0015);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.042);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.048);

    this.triggerNoiseBurst(time, 2600, 2.2, 0.24 * gainScale, 0.011);
  }

  /**
   * Subdivision click (e, &, a): tight, dry percussive tick.
   */
  private triggerSubdivisionClick(
    time: number,
    gainScale: number,
    isAccented: boolean
  ): void {
    const ctx = this.audioCtx!;
    const dest = this.masterGain!;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    const startFreq = isAccented ? 1520 : 1340;
    const endFreq = isAccented ? 920 : 820;

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.015);

    oscGain.gain.setValueAtTime(0.0001, time);
    oscGain.gain.linearRampToValueAtTime(0.48 * gainScale, time + 0.0012);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.028);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.032);

    this.triggerNoiseBurst(time, 5200, 2.0, 0.22 * gainScale, 0.009);
  }

  private triggerNoiseBurst(
    time: number,
    centerFreq: number,
    q: number,
    peakGain: number,
    duration: number
  ): void {
    if (!this.audioCtx || !this.masterGain || !this.noiseBuffer) return;

    const ctx = this.audioCtx;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(centerFreq, time);
    filter.Q.setValueAtTime(q, time);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(peakGain, time + 0.001);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    noise.connect(filter);
    filter.connect(env);
    env.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + duration + 0.004);
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const sampleCount = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}
