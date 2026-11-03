export class PiperService {
  constructor() {
    this.worker = new Worker(
      new URL("./piper.worker.js", import.meta.url),
      { type: "module" }
    );

    this.pending = new Map();
    this.counter = 0;
    this.currentAudio = null;

    this.worker.onmessage = ({ data }) => {
      if (data.type === "progress") {
        this.onProgress?.(data.progress);
        return;
      }

      const pending = this.pending.get(data.id);

      if (!pending) return;

      this.pending.delete(data.id);

      if (data.type === "error") {
        pending.reject(new Error(data.error));
      } else {
        pending.resolve(data);
      }
    };
  }

  request(type, payload = {}) {
    const id = ++this.counter;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      this.worker.postMessage({
        id,
        type,
        payload
      });
    });
  }

  async initialize() {
    const result = await this.request("init");

    return result.voices;
  }

  async download(voiceId) {
    return this.request("download", { voiceId });
  }

  async stored() {
    const result = await this.request("stored");

    return result.voices;
  }

  async speak(text, voiceId) {
    const result = await this.request("speak", {
      text,
      voiceId
    });

    const url = URL.createObjectURL(result.wav);

    this.stop();

    this.currentAudio = new Audio(url);

    this.currentAudio.onended = () => {
      URL.revokeObjectURL(url);
      this.currentAudio = null;
    };

    this.currentAudio.onerror = () => {
      URL.revokeObjectURL(url);
      this.currentAudio = null;
    };

    await this.currentAudio.play();
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  terminate() {
    this.stop();
    this.worker.terminate();

    this.pending.forEach(({ reject }) => {
      reject(new Error("Piper worker terminated"));
    });

    this.pending.clear();
  }
}