// import * as ort from 'onnxruntime-web';

// ort.env.wasm.wasmPaths =
//   'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/';
  
  import * as Piper from "@mintplex-labs/piper-tts-web";

let availableVoices = [];

self.onmessage = async ({ data }) => {
  const { id, type, payload } = data;

  try {
    if (type === "init") {
      availableVoices = await Piper.voices();

      self.postMessage({
        id,
        type: "ready",
        voices: availableVoices
      });

      return;
    }

    if (type === "download") {
      await Piper.download(
        payload.voiceId,
        (progress) => {
          self.postMessage({
            type: "progress",
            progress
          });
        }
      );

      self.postMessage({
        id,
        type: "downloaded"
      });

      return;
    }

    if (type === "speak") {
      const wav = await Piper.predict({
        text: payload.text,
        voiceId: payload.voiceId
      });

      self.postMessage({
        id,
        type: "audio",
        wav
      });
    }

    if (type === "stored") {
      const voices = await Piper.stored();

      self.postMessage({
        id,
        type: "stored",
        voices
      });
    }

  } catch (error) {
    self.postMessage({
      id,
      type: "error",
      error: error.message
    });
  }
};