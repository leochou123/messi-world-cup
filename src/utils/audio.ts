/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const NOTE_FREQS: Record<string, number> = {
  // Octave 1
  "B1": 61.74,
  // Octave 2
  "C2": 65.41, "C#2": 69.30, "D2": 73.42, "D#2": 77.78, "E2": 82.41, "F2": 87.31, "F#2": 92.50, "G2": 98.00, "G#2": 103.83, "A2": 110.00, "A#2": 116.54, "B2": 123.47,
  // Octave 3
  "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "G3": 196.00, "G#3": 207.65, "A3": 220.00, "A#3": 233.08, "B3": 246.94,
  // Octave 4
  "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88,
  // Octave 5
  "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "A#5": 932.33, "B5": 987.77,
  "R": 0
};

interface BGMSong {
  name: string;
  chineseName: string;
  year: string;
  country: string;
  tempo: number; // ms per step
  melody: string[];
  bass: string[];
}

const BGM_SONGS: BGMSong[] = [
  {
    name: "Waka Waka",
    chineseName: "哇卡哇卡 (2010)",
    year: "2010",
    country: "南非",
    tempo: 145,
    melody: ["C4", "E4", "G4", "G4", "G4", "A4", "G4", "E4", "D4", "D4", "D4", "R", "D4", "E4", "F4", "F4", "F4", "G4", "F4", "D4", "C4", "C4", "C4", "R", "E4", "E4", "E4", "D4", "C4", "E4", "G4", "R"],
    bass: ["C3", "R", "C3", "R", "G2", "R", "G2", "R", "D3", "R", "D3", "R", "A2", "R", "A2", "R", "C3", "R", "C3", "R", "G2", "R", "G2", "R", "C3", "R", "C3", "R", "G2", "R", "G2", "R"]
  },
  {
    name: "Un'estate italiana",
    chineseName: "意大利之夏 (1990)",
    year: "1990",
    country: "意大利",
    tempo: 175,
    melody: ["E4", "E4", "D4", "D4", "C4", "C4", "D4", "D4", "E4", "E4", "G4", "G4", "C5", "C5", "C5", "R", "B4", "B4", "A4", "A4", "G4", "G4", "G4", "R", "F4", "F4", "E4", "E4", "D4", "D4", "D4", "R"],
    bass: ["C3", "R", "C3", "R", "G2", "R", "G2", "R", "A2", "R", "A2", "R", "F2", "R", "F2", "R", "C3", "R", "C3", "R", "E2", "R", "E2", "R", "F2", "R", "G2", "R", "C3", "R", "C3", "R"]
  },
  {
    name: "La Copa de la Vida",
    chineseName: "生命之杯 (1998)",
    year: "1998",
    country: "法国",
    tempo: 135,
    melody: ["E4", "E4", "A4", "A4", "B4", "C5", "B4", "R", "A4", "A4", "G#4", "G#4", "B4", "B4", "A4", "R", "E4", "E4", "B4", "B4", "C5", "D5", "C5", "R", "B4", "B4", "A#4", "A#4", "C5", "C5", "B4", "R"],
    bass: ["A2", "R", "E2", "R", "A2", "R", "E2", "R", "E2", "R", "B2", "R", "E2", "R", "B2", "R", "A2", "R", "E2", "R", "A2", "R", "E2", "R", "E2", "R", "B2", "R", "E2", "R", "B2", "R"]
  },
  {
    name: "Seven Nation Army",
    chineseName: "七国军乐 (2006)",
    year: "2006",
    country: "德国",
    tempo: 160,
    melody: ["E4", "E4", "R", "E4", "G4", "E4", "D4", "R", "C4", "C4", "R", "R", "B3", "B3", "R", "R", "E4", "E4", "R", "E4", "G4", "E4", "D4", "R", "C4", "D4", "C4", "R", "B3", "B3", "R", "R"],
    bass: ["E2", "R", "E2", "R", "G2", "R", "E2", "R", "D2", "R", "C2", "R", "C2", "R", "B1", "R", "B1", "R", "E2", "R", "E2", "R", "G2", "R", "E2", "R", "D2", "R", "C2", "R", "B1", "R"]
  },
  {
    name: "Dreamers",
    chineseName: "梦想家 (2022)",
    year: "2022",
    country: "卡塔尔",
    tempo: 150,
    melody: ["B3", "D4", "E4", "E4", "R", "D4", "E4", "F#4", "D4", "B3", "B3", "R", "B3", "D4", "E4", "E4", "R", "D4", "E4", "G4", "F#4", "D4", "B3", "R", "A3", "C#4", "D4", "D4", "R", "C#4", "D4", "E4"],
    bass: ["B2", "R", "B2", "R", "D3", "R", "D3", "R", "A2", "R", "A2", "R", "G2", "R", "F#2", "R", "B2", "R", "B2", "R", "D3", "R", "D3", "R", "A2", "R", "A2", "R", "G2", "R", "F#2", "R"]
  }
];

class AudioController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmGainNode: GainNode | null = null;
  private bgmTimer: any = null;
  private currentBgmLevel: number = -1;
  private bgmStepIndex = 0;

  private init() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private initBgmGainNode() {
    if (this.ctx && !this.bgmGainNode) {
      this.bgmGainNode = this.ctx.createGain();
      this.bgmGainNode.connect(this.ctx.destination);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.updateBgmVolume();
    return this.isMuted;
  }

  getMuted() {
    return this.isMuted;
  }

  startBgm(level: number) {
    this.init();
    this.initBgmGainNode();
    this.stopBgm(); // clean up previous timer

    const songIndex = (level - 1) % BGM_SONGS.length;
    const song = BGM_SONGS[songIndex];
    this.currentBgmLevel = level;
    this.bgmStepIndex = 0;

    const stepDurationMs = song.tempo;

    this.bgmTimer = setInterval(() => {
      if (this.isMuted || !this.ctx) return;

      const melodyNote = song.melody[this.bgmStepIndex % song.melody.length];
      const bassNote = song.bass[this.bgmStepIndex % song.bass.length];

      const stepDurationSec = stepDurationMs / 1000;

      // Melody note play (Triangle wave, soft volume)
      if (melodyNote && melodyNote !== 'R' && NOTE_FREQS[melodyNote]) {
        this.playBgmNote(NOTE_FREQS[melodyNote], 'triangle', stepDurationSec * 1.5, 0.04);
      }

      // Bass note play (Sine wave, warm and deep)
      if (bassNote && bassNote !== 'R' && NOTE_FREQS[bassNote]) {
        this.playBgmNote(NOTE_FREQS[bassNote], 'sine', stepDurationSec * 1.8, 0.07);
      }

      this.bgmStepIndex++;
    }, stepDurationMs);

    this.updateBgmVolume();
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.currentBgmLevel = -1;
  }

  updateBgmVolume() {
    if (!this.bgmGainNode) return;
    const now = this.ctx ? this.ctx.currentTime : 0;
    if (this.isMuted) {
      this.bgmGainNode.gain.setValueAtTime(0, now);
    } else {
      // Smooth fade-in
      this.bgmGainNode.gain.setValueAtTime(0, now);
      this.bgmGainNode.gain.linearRampToValueAtTime(0.4, now + 0.1);
    }
  }

  private playBgmNote(freq: number, type: 'sine' | 'triangle' | 'sawtooth' | 'square', durationSec: number, volume: number) {
    if (!this.ctx || !this.bgmGainNode) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(volume, now + 0.015);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    // Lowpass filter for warm tone
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'sine' ? 250 : 1000, now);

    osc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.bgmGainNode);

    osc.start(now);
    osc.stop(now + durationSec);
  }

  // Play a standard soccer referee whistle (double high-pitch beep)
  playWhistle() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const playBeep = (time: number, duration: number, freq: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      // Add minor vibrato
      osc.frequency.linearRampToValueAtTime(freq + 50, time + duration);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    };

    const now = this.ctx.currentTime;
    playBeep(now, 0.15, 1000);
    playBeep(now + 0.2, 0.3, 1000);
  }

  // Launch hook whoosh sound
  playShoot() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Grab item thud
  playGrab() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Low frequency thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // High snap
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(800, now);
    osc2.frequency.setValueAtTime(200, now + 0.05);

    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.08);
  }

  // Straining/pulling ticker sound for heavy items
  playPullTick(speedMultiplier: number) {
    this.init();
    if (this.isMuted || !this.ctx) return;

    // Rate limits how often we tick
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(60 + (1 - speedMultiplier) * 40, now);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // Success fan-fare (high scores like Trophy or Boot)
  playSuccess() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
    
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const time = now + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.08, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 0.25);
    });

    // Stadium crowd roar synth
    const roarDuration = 1.0;
    const bufferSize = this.ctx.sampleRate * roarDuration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // White noise
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(450, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(250, now + roarDuration);
    noiseFilter.Q.setValueAtTime(2.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.12, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + roarDuration);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + roarDuration);
  }

  // Normal grab success sound (football or simple bag)
  playNormalSuccess() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [392.00, 523.25, 659.25]; // G, C, E

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const time = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.08, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 0.18);
    });
  }

  // Grab fail/Red card penalty sound
  playFail() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Sad double slide down
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.35);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);

    // Referee warning double whistle (harsh, flat)
    const whOsc = this.ctx.createOscillator();
    const whGain = this.ctx.createGain();
    whOsc.type = 'square';
    whOsc.frequency.setValueAtTime(440, now);
    whOsc.frequency.linearRampToValueAtTime(400, now + 0.25);

    whGain.gain.setValueAtTime(0, now + 0.05);
    whGain.gain.linearRampToValueAtTime(0.04, now + 0.07);
    whGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    whOsc.connect(whGain);
    whGain.connect(this.ctx.destination);
    whOsc.start(now + 0.05);
    whOsc.stop(now + 0.25);
  }

  // Explosion sound for bomb
  playExplode() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    
    // White noise explosion
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(10, now + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.5);

    // Deep bass boom
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Click / select sound
  playClick() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Ticking countdown clock
  playCountdown() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Purchase item cash register cha-ching sound
  playPurchase() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Quick double high bell sound
    const playBell = (time: number, freq: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.1, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 0.15);
    };

    playBell(now, 1500);
    playBell(now + 0.06, 1800);
  }
}

export const gameAudio = new AudioController();
