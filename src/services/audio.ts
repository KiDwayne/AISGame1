/**
 * Procedural Web Audio API sound synthesizer
 * Zero external audio files required, low-latency, dynamic audio synthesis.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private alarmOscillator: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;

  constructor() {
    // Lazy initialization on first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.6, this.ctx.currentTime);
    }
    if (muted && this.alarmOscillator) {
      this.stopAlarm();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Helper to create a noise buffer for explosions & bullet impact snap
  private createNoiseBuffer(duration = 0.5): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Primary player weapons
  public playWeaponFire(weaponId: string) {
    if (this.isMuted) return;
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    switch (weaponId) {
      case 'gatling': {
        // Quick punchy gunshot with pitch drop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260 + Math.random() * 40, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.08);

        // Noise snap
        const noise = this.ctx.createBufferSource();
        const noiseBuf = this.createNoiseBuffer(0.05);
        if (noiseBuf) {
          noise.buffer = noiseBuf;
          const noiseFilter = this.ctx.createBiquadFilter();
          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.setValueAtTime(1400, t);
          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0.3, t);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(this.masterGain);
          noise.start(t);
        }
        break;
      }

      case 'shotgun': {
        // Heavy multi-barrel blast with low-end rumble
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.22);

        gain.gain.setValueAtTime(0.65, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.22);

        // Heavy boom noise
        const noise = this.ctx.createBufferSource();
        const noiseBuf = this.createNoiseBuffer(0.25);
        if (noiseBuf) {
          noise.buffer = noiseBuf;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, t);
          filter.frequency.exponentialRampToValueAtTime(100, t + 0.25);
          const nGain = this.ctx.createGain();
          nGain.gain.setValueAtTime(0.7, t);
          nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
          noise.connect(filter);
          filter.connect(nGain);
          nGain.connect(this.masterGain);
          noise.start(t);
        }
        break;
      }

      case 'railgun': {
        // High-pitch charging tone then hypersonic supersonic sonic boom
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.35);

        gain.gain.setValueAtTime(0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(300, t);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.35);
        break;
      }

      case 'rockets': {
        // Rocket launch whoosh
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, t);
        osc.frequency.exponentialRampToValueAtTime(350, t + 0.15);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.18);
        break;
      }

      case 'plasma': {
        // Sci-fi high energy chirp
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(650, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.14);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.14);
        break;
      }
    }
  }

  // Explosions
  public playExplosion(large = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const dur = large ? 0.6 : 0.35;

    const noise = this.ctx.createBufferSource();
    const noiseBuf = this.createNoiseBuffer(dur);
    if (!noiseBuf) return;

    noise.buffer = noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(large ? 450 : 600, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(large ? 0.9 : 0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);

    // Deep sub-bass thump
    const osc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(large ? 85 : 120, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + dur);
    subGain.gain.setValueAtTime(large ? 0.7 : 0.4, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(subGain);
    subGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  // Side Turret Sounds
  public playTurretFire(type: string) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    if (type === 'vulcan') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.05);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (type === 'tesla') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900 + Math.random() * 300, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.12);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.12);
    } else if (type === 'cryo') {
      // Freezing hiss
      const noise = this.ctx.createBufferSource();
      const noiseBuf = this.createNoiseBuffer(0.12);
      if (noiseBuf) {
        noise.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2400, t);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
      }
    } else if (type === 'mortar') {
      // Mortar launch thump
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.2);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  }

  // Zombie sounds
  public playZombieHit() {
    if (this.isMuted || Math.random() > 0.4) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.06);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playZombieDeath(isBoss = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const dur = isBoss ? 0.7 : 0.2;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isBoss ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isBoss ? 90 : 160 + Math.random() * 60, t);
    osc.frequency.exponentialRampToValueAtTime(isBoss ? 25 : 45, t + dur);

    gain.gain.setValueAtTime(isBoss ? 0.6 : 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  public playBunkerDamage() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Metallic crunch & thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Active EMP Shockwave
  public playEmpBlast() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.6);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  // Low HP Bunker Alarm
  public startAlarm() {
    if (this.isMuted || this.alarmOscillator) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      this.alarmOscillator = this.ctx.createOscillator();
      this.alarmGain = this.ctx.createGain();
      this.alarmOscillator.type = 'square';
      this.alarmOscillator.frequency.setValueAtTime(440, this.ctx.currentTime);

      this.alarmGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.alarmOscillator.connect(this.alarmGain);
      this.alarmGain.connect(this.masterGain);
      this.alarmOscillator.start();
    } catch {
      // Ignore
    }
  }

  public stopAlarm() {
    if (this.alarmOscillator) {
      try {
        this.alarmOscillator.stop();
        this.alarmOscillator.disconnect();
      } catch {
        // Ignore
      }
      this.alarmOscillator = null;
    }
  }

  // UI Sounds
  public playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.04);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  public playUpgradeSuccess() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Dual-tone chime
    [480, 720].forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + idx * 0.08;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  public playWaveHorn() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Deep siren horn
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(220, t + 0.4);
    osc.frequency.linearRampToValueAtTime(160, t + 0.8);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.9);
  }
}

export const soundEngine = new SoundEngine();
