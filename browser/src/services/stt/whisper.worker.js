import { pipeline, env } from "@huggingface/transformers";

env.allowRemoteModels = true;
env.useBrowserCache = true;
env.useWasmCache = true;

let transcriber = null;

self.onmessage = async (event) => {
  const { id, type, payload } = event.data;

  try {
    if (type === "init") {
      const device = navigator.gpu ? "webgpu" : "wasm";

      transcriber = await pipeline(
        "automatic-speech-recognition",
        "onnx-community/whisper-tiny",
        {
          device,
          dtype: "q8",
          progress_callback: (progress) => {
            self.postMessage({
              type: "progress",
              progress
            });
          }
        }
      );

      self.postMessage({
        id,
        type: "ready",
        device
      });

      return;
    }

    if (type === "transcribe") {
      if (!transcriber) {
        throw new Error("Whisper is not initialized");
      }

      const result = await transcriber(
        payload.audio,
        {
          sampling_rate: 16000,
          language: payload.language || "italian",
          task: "transcribe"
        }
      );

      self.postMessage({
        id,
        type: "result",
        text: result.text
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