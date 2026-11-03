# Automatic Text-to-Speech and Speech-to-Text

Text-to-Speech is the translation of a string of text (and optional instructions) into an audio file of someone speaking that words.
Speech-to-Text (also called Automatic Speech Recognition) is the inverse.

There are many providers with APIs offering both services, and there is also the possibility of using local models.
This is a review on the main options available, their cost, effectiveness and time efficiency.

## Text-to-Speech
### OpenAI 
tts models are deprecated, no alternatives are available at the moment
### AWS
Amazon Polly is a fully-managed service that generates voice on demand, converting any text to an audio stream. Amazon Polly’s Speech Synthesis Markup Languages (SSML) tags also allow you to adjust emphasis, intonation, phrasing, and style. 
Price: $4-30 per million characters.
### Local 
Piper is a local model that converts text into spoken audio, with local neural voices. Good for low-latency services, smaller machines, and deployments that don't need elaborate voice cloning. 
X-low:{
    Sample rate: 16 kHz 
    Paramenters: 5–7 M
}
Low: {
    Sample rate: 16 kHz 
    Paramenters: 15-20 M
}
Medium: {
    Sample rate: 22.05 kHz 
    Paramenters: 15–20 M
}
High: {
    Sample rate: 22.05 kHz 
    Paramenters: 28-32 M
}

## Speech-to-Text
### OpenAI 
- GPT Transcribe is a speech-to-text model for completed audio files, streamed file transcripts, and committed turns in Realtime sessions over WebSocket. Price: $0.0045 per minute. Medium speed. High performance
- GPT Live Transcribe is a speech-to-text model for completed audio files, streamed file transcripts, and committed turns in Realtime sessions over WebSocket. Price: $0.017 per minute. High speed. High performance
### AWS
Amazon Transcribe is an automatic speech recognition service that enable you to ingest audio input, produce easy to read and review transcripts.
Price: $0.006-0.01 per minute
### Local 
Faster Whisper is a high-performance inference of OpenAI's model.
Tiny: {
    Memory: 70 MB
}
Base: {
    Memory: 145 MB
}
Small: {
    Memory: 484 MB
}

## WebSpeechAPI
In-browser API to incorporate voice data into web apps. It has 2 main components: SpeechSynthesis for TTS and SpeechRecognition for ASR

Pros:
- nothing to download or host, and no model to bundle or GPU to worry about
- recognition quality can be high. In Chrome the audio is processed by Google’s servers, which are strong, fast, and handle many languages with streaming partial results.
- TTS voices come from the OS. They’re free, instant, and often decent
Cons:
- in Chrome, speech recognition typically sends audio to a remote server, and there is no control over it. Newer Chrome versions have started adding on-device recognition options, but support is still uneven.
- the API is effectively Chrome, Edge, and Safari for recognition, and Firefox has none
- server-backed recognition fails without a connection
- the Web Speech API is built for live microphone input, not transcribing files, and it has no real way to process a recording