export interface TTSOptions {
  text: string;
  lang?: 'en-US' | 'sw-KE';
  rate?: number;
  volume?: number;
}

class SpeechService {
  private synth: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private _isPlaying = false;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  speak(options: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._isPlaying) {
        this.stop();
      }

      this.utterance = new SpeechSynthesisUtterance(options.text);
      this.utterance.lang = options.lang || 'en-US';
      this.utterance.rate = options.rate || 1;
      this.utterance.volume = options.volume || 1;

      this.utterance.onstart = () => {
        this._isPlaying = true;
      };

      this.utterance.onend = () => {
        this._isPlaying = false;
        resolve();
      };

      this.utterance.onerror = (event) => {
        this._isPlaying = false;
        reject(event);
      };

      this.synth.speak(this.utterance);
    });
  }

  pause(): void {
    if (this.synth.speaking) {
      this.synth.pause();
    }
  }

  resume(): void {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  stop(): void {
    this.synth.cancel();
    this._isPlaying = false;
  }

  setRate(rate: number): void {
    if (this.utterance) {
      this.utterance.rate = rate;
    }
  }

  setVolume(volume: number): void {
    if (this.utterance) {
      this.utterance.volume = volume;
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }
}

export const speechService = new SpeechService();
