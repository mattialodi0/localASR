# Text-to-Speech and Speech-to-Text in a Web App

Text-to-Speech (TTS) turns a string of text (and optional instructions) into an audio file of someone speaking those words.
Speech-to-Text (STT, also called Automatic Speech Recognition, ASR) is the inverse.

This repository explores the different ways to add TTS and STT to a web app: cloud APIs, local models run on a server, models run directly in the browser, the browser's native Web Speech API, and the Android native APIs. Each folder is an experiment with one approach, and the sections below compare them on cost, quality and speed.

## Repository structure

| Folder | Content |
|---|---|
| [browser/](browser/) | React + Vite demo app running TTS and STT **fully in the browser**, with no backend. STT uses Whisper tiny (`@huggingface/transformers`, WebGPU with WASM fallback, q8). TTS uses Piper (`@mintplex-labs/piper-tts-web`, ONNX runtime). Both run in Web Workers (`src/services/stt/`, `src/services/tts/`). |
| [local_STT/](local_STT/) | Jupyter notebooks testing local STT: [whisper.ipynb](local_STT/whisper.ipynb) (OpenAI Whisper) and [faster_whisper.ipynb](local_STT/faster_whisper.ipynb) (Faster Whisper). |
| [local_TTS/](local_TTS/) | Local TTS tests: [piper.ipynb](local_TTS/piper.ipynb) (Piper in Python) and [kokorojs/](local_TTS/kokorojs/) (a Node.js script generating WAV files with Kokoro-82M through `kokoro-js`). |
| [webSpeechAPI/](webSpeechAPI/) | Plain HTML/JS demo of the browser-native Web Speech API (`SpeechSynthesis` and `SpeechRecognition`). |
| [test_files/](test_files/) | Sample `.wav` recordings (English and Italian) used as STT input, plus a TTS output example. |

### Running the demos
- **browser**: `cd browser && npm install && npm run dev`
- **kokorojs**: `cd local_TTS/kokorojs && npm install && node kokoro-tts.js "Hello" out.wav af_heart` (use `--list-voices` to list voices; the model is downloaded on first run)
- **webSpeechAPI**: open [webSpeechAPI/demo.html](webSpeechAPI/demo.html) in Chrome, Edge or Safari
- **notebooks**: open them in Jupyter/VS Code with the required Python packages installed

## Overview of the approaches

| Approach | Runs where | Cost | Offline | Privacy | Notes |
|---|---|---|---|---|---|
| Cloud APIs (OpenAI, AWS) | Provider servers | Pay per use | No | Audio leaves the device | Best quality, needs a backend or keys |
| Local models on a server | Your server | Hardware only | Yes | Data stays on your infrastructure | You manage deployment and scaling |
| Models in the browser (WASM/WebGPU) | User's device | Free | Yes, after model download | Data stays on the device | Model download on first use; speed depends on device |
| Web Speech API | Browser / OS | Free | Partly | Chrome STT sends audio to Google | Nothing to host, uneven support |
| Android native APIs | Device | Free | Depends on engine | Depends on engine | Native apps only |

## Text-to-Speech

### OpenAI
The dedicated TTS models are deprecated and no alternative is available at the moment.

### AWS
Amazon Polly is a fully-managed service that generates voice on demand, converting any text to an audio stream. Its Speech Synthesis Markup Language (SSML) tags allow adjusting emphasis, intonation, phrasing and style.
Price: $4-30 per million characters.

### Local
**Piper** is a local model that converts text into spoken audio with neural voices. Good for low-latency services, smaller machines, and deployments that don't need elaborate voice cloning. It also runs in the browser through ONNX (see [browser/](browser/)).

| Quality | Sample rate | Parameters |
|---|---|---|
| X-low | 16 kHz | 5-7 M |
| Low | 16 kHz | 15-20 M |
| Medium | 22.05 kHz | 15-20 M |
| High | 22.05 kHz | 28-32 M |

**Kokoro** (Kokoro-82M, via `kokoro-js`) is an 82M-parameter open model with many ready-made voices (American/British, male/female). It runs in Node.js and in the browser, with quantized variants (`fp32`, `fp16`, `q8`, `q4`, `q4f16`); `q8` is small and fast on CPU. See [local_TTS/kokorojs/](local_TTS/kokorojs/).

## Speech-to-Text

### OpenAI
- **GPT Transcribe**: speech-to-text for completed audio files, streamed file transcripts, and committed turns in Realtime sessions over WebSocket. Price: $0.0045 per minute. Medium speed, high performance.
- **GPT Live Transcribe**: same use cases, optimised for speed. Price: $0.017 per minute. High speed, high performance.

### AWS
Amazon Transcribe is an automatic speech recognition service that ingests audio input and produces easy-to-read transcripts.
Price: $0.006-0.01 per minute.

### Local
**Whisper** (OpenAI's open model) and **Faster Whisper** (a high-performance reimplementation of Whisper inference) are tested in [local_STT/](local_STT/). The browser demo uses the ONNX build of Whisper tiny through Transformers.js.

| Size | Memory |
|---|---|
| Tiny | 70 MB |
| Base | 145 MB |
| Small | 484 MB |

## Web Speech API
In-browser API to incorporate voice data into web apps. It has 2 main components: `SpeechSynthesis` for TTS and `SpeechRecognition` for STT. Demo in [webSpeechAPI/](webSpeechAPI/).

Pros:
- Nothing to download or host, no model to bundle and no GPU to worry about
- Recognition quality can be high. In Chrome the audio is processed by Google's servers, which are strong, fast, and handle many languages with streaming partial results
- TTS voices come from the OS. They're free, instant, and often decent

Cons:
- In Chrome, speech recognition typically sends audio to a remote server, with no control over it. Newer Chrome versions have started adding on-device recognition options, but support is still uneven
- Recognition is effectively limited to Chrome, Edge and Safari; Firefox has none
- Server-backed recognition fails without a connection
- It is built for live microphone input, not for transcribing files, and has no real way to process a recording

## In-browser models (WASM / WebGPU)
Running Piper, Kokoro or Whisper in the browser ([browser/](browser/)) removes server costs and keeps data on the device, and works with recorded files as well as the microphone.

Pros:
- No per-request cost, no backend, works offline once models are cached
- Works across browsers (WebGPU where available, WASM fallback)

Cons:
- Models must be downloaded on first use (tens to hundreds of MB)
- Speed and memory depend on the user's device; small models trade accuracy for size

## Android
The Android API has 2 classes dedicated to TTS and STT: `TextToSpeech` and `SpeechRecognizer`.
