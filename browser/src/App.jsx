import { useEffect, useRef, useState } from "react";

import { WhisperService } from "./services/stt/WhisperService";
import { PiperService } from "./services/tts/PiperService";

export default function App() {
  const whisper = useRef(null);
  const piper = useRef(null);

  const recorder = useRef(null);
  const chunks = useRef([]);

  const [sttStatus, setSttStatus] = useState("Not loaded");
  const [ttsStatus, setTtsStatus] = useState("Not loaded");
  const [voice, setVoice] = useState("");
  const [ttsVoices, setTtsVoices] = useState([]);

  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [text, setText] = useState(
    "Ciao a te, umano!"
  );

  const [error, setError] = useState("");

  useEffect(() => {
    whisper.current = new WhisperService();

    whisper.current.onProgress = (p) => {
      setSttStatus(p.status || "Downloading model...");
    };

    return () => {
      whisper.current?.terminate();
      piper.current?.terminate();
    };
  }, []);

  async function loadSTT() {
    try {
      setError("");
      setSttStatus("Loading...");

      const result = await whisper.current.initialize();

      setSttStatus(`Ready (${result.device})`);
    } catch (e) {
      setSttStatus("Failed");
      setError(e.message);
    }
  }

  async function loadTTS() {
    try {
      setError("");
      setTtsStatus("Loading Piper...");

      piper.current = new PiperService();

      piper.current.onProgress = (progress) => {
        setTtsStatus("Downloading voice...");
      };

      const voices = await piper.current.initialize();
      // The package exposes voice IDs as keys.
      const italianVoices = voices
        .filter(voice => voice.key.startsWith("it_IT-"))
        .map(voice => voice.key);


      setTtsVoices(italianVoices);

      if (italianVoices.length === 0) {
        throw new Error("No Italian Piper voices available");
      }

      setVoice(italianVoices[0]);
      setTtsStatus("Ready");
    } catch (e) {
      setTtsStatus("Failed");
      setError(e.message);
    }
  }

  async function downloadVoice() {
    try {
      setTtsStatus("Downloading voice...");

      await piper.current.download(voice);

      setTtsStatus("Voice installed");
    } catch (e) {
      setError(e.message);
      setTtsStatus("Failed");
    }
  }

  async function startRecording() {
    try {
      setError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      chunks.current = [];

      const mediaRecorder = new MediaRecorder(stream);

      recorder.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          setBusy(true);

          const blob = new Blob(chunks.current, {
            type: mediaRecorder.mimeType
          });

          const result = await whisper.current.transcribe(
            blob,
            "italian"
          );

          setTranscript(result);
          setText(result);
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (e) {
      setError(e.message);
    }
  }

  function stopRecording() {
    if (recorder.current?.state === "recording") {
      recorder.current.stop();
      setRecording(false);
    }
  }

  async function transcribeText() {
    // The transcription is automatically triggered
    // when the recording stops.
    return transcript;
  }

  async function speak() {
    try {
      setError("");
      setBusy(true);

      await piper.current.speak(text, voice);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app">
      <h1>Browser Voice Assistant</h1>

      <p>
        Local Whisper STT + Piper TTS
      </p>

      <section className="panel">
        <h2>Speech Recognition</h2>

        <p>
          Status: <strong>{sttStatus}</strong>
        </p>

        <button
          onClick={loadSTT}
          disabled={sttStatus.includes("Loading") ||
            sttStatus.startsWith("Ready")}
        >
          Load Whisper
        </button>

        <hr />

        <button
          onClick={startRecording}
          disabled={!sttStatus.startsWith("Ready") ||
            recording || busy}
        >
          Start recording
        </button>

        <button
          onClick={stopRecording}
          disabled={!recording}
        >
          Stop recording
        </button>

        {recording && <p>Listening...</p>}

        <h3>Transcription</h3>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={4}
          placeholder="Your transcription will appear here"
        />
      </section>

      <section className="panel">
        <h2>Text to Speech</h2>

        <p>
          Status: <strong>{ttsStatus}</strong>
        </p>

        <button
          onClick={loadTTS}
          disabled={ttsStatus.includes("Loading") ||
            ttsStatus.startsWith("Ready")}
        >
          Load Kokoro
        </button>

        <hr />

        <span>Voice</span>

        <select
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
        >
          {ttsVoices.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>

        <button
          onClick={downloadVoice}
          disabled={!voice || !piper.current}
        >
          Download voice for offline use
        </button>

        <h3>Text to speak</h3>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
        />

        <button
          onClick={speak}
          disabled={!voice || !text.trim() || busy}
        >
          Generate speech
        </button>
      </section>

      {busy && <p>Processing audio...</p>}

      {error && (
        <div className="error">
          {error}
        </div>
      )}
    </main>
  );
}