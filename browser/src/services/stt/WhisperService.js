export class WhisperService {
  constructor() {
    this.worker = new Worker(
      new URL("./whisper.worker.js", import.meta.url),
      { type: "module" }
    );

    this.pending = new Map();
    this.counter = 0;

    this.worker.onmessage = (event) => {
      const msg = event.data;

      if (msg.type === "progress") {
        this.onProgress?.(msg.progress);
        return;
      }

      const pending = this.pending.get(msg.id);
      if (!pending) return;

      if (msg.type === "error") {
        pending.reject(new Error(msg.error));
      } else {
        pending.resolve(msg);
      }

      this.pending.delete(msg.id);
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
    return this.request("init");
  }

  async transcribe(audioBlob, language = "italian") {
    const audio = await this.convertTo16kHz(audioBlob);

    const result = await this.request("transcribe", {
      audio,
      language
    });

    return result.text;
  }

  async convertTo16kHz(blob) {
    const context = new AudioContext();

    try {
      const buffer = await context.decodeAudioData(
        await blob.arrayBuffer()
      );

      // Mix channels into mono.
      const mono = new Float32Array(buffer.length);

      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const samples = buffer.getChannelData(channel);

        for (let i = 0; i < samples.length; i++) {
          mono[i] += samples[i] / buffer.numberOfChannels;
        }
      }

      const offline = new OfflineAudioContext(
        1,
        Math.ceil(buffer.duration * 16000),
        16000
      );

      const source = offline.createBufferSource();

      const monoBuffer = offline.createBuffer(
        1,
        mono.length,
        buffer.sampleRate
      );

      monoBuffer.copyToChannel(mono, 0);

      source.buffer = monoBuffer;
      source.connect(offline.destination);
      source.start();

      const resampled = await offline.startRendering();

      return resampled.getChannelData(0).slice();
    } finally {
      await context.close();
    }
  }

  terminate() {
    this.worker.terminate();
  }
}