# WebSpeechAPI

Pros:
- nothing to download or host, and no model to bundle or GPU to worry about
- recognition quality can be high. In Chrome the audio is processed by Google’s servers, which are strong, fast, and handle many languages with streaming partial results.
- TTS voices come from the OS. They’re free, instant, and often decent
Cons:
- in Chrome, speech recognition typically sends audio to a remote server, and there is no control over it. Newer Chrome versions have started adding on-device recognition options, but support is still uneven.
- the API is effectively Chrome, Edge, and Safari for recognition, and Firefox has none
- server-backed recognition fails without a connection
- the Web Speech API is built for live microphone input, not transcribing files, and it has no real way to process a recording