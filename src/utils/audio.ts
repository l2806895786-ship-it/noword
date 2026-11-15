let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playCorrectSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.065);

    gain.gain.setValueAtTime(0.0001, now + i * 0.065);
    gain.gain.exponentialRampToValueAtTime(0.11, now + i * 0.065 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.065 + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.065);
    osc.stop(now + i * 0.065 + 0.24);
  });
}

export function playWrongSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [261.63, 220.0]; // C4 -> A3 gentle descending tone
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + i * 0.11);

    gain.gain.setValueAtTime(0.0001, now + i * 0.11);
    gain.gain.exponentialRampToValueAtTime(0.09, now + i * 0.11 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.11 + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.11);
    osc.stop(now + i * 0.11 + 0.2);
  });
}

export function playCompleteSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.08);

    gain.gain.setValueAtTime(0.0001, now + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.11, now + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.34);
  });
}

export interface SpeakOptions {
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function speakEnglishWord(text: string, options: SpeakOptions = {}): boolean {
  const { rate = 0.9, onStart, onEnd } = options;

  if (!isSpeechSupported()) {
    onStart?.();
    setTimeout(() => onEnd?.(), 500);
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang === 'en-US' && v.localService) ||
      voices.find((v) => v.lang === 'en-US') ||
      voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    let ended = false;
    const finish = () => {
      if (!ended) {
        ended = true;
        onEnd?.();
      }
    };

    utterance.onstart = () => onStart?.();
    utterance.onend = finish;
    utterance.onerror = finish;

    // Safety timeout in case some browsers stall onend
    setTimeout(finish, Math.max(1800, text.length * 140));

    window.speechSynthesis.speak(utterance);
    onStart?.();
    return true;
  } catch {
    onEnd?.();
    return false;
  }
}
