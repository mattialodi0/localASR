/* ---------- TEXT TO SPEECH ---------- */
const synth = window.speechSynthesis;
const ttsText = document.getElementById('ttsText');
const voiceSelect = document.getElementById('voiceSelect');
const rate = document.getElementById('rate');
const pitch = document.getElementById('pitch');
const ttsStatus = document.getElementById('ttsStatus');
let voices = [];

if (!synth) {
  ttsStatus.innerHTML = '<span class="unsupported">Speech synthesis is not supported in this browser.</span>';
  document.querySelectorAll('#tts button').forEach(b => b.disabled = true);
} else {
  // Voices load asynchronously in some browsers
  function loadVoices() {
    voices = synth.getVoices();
    voiceSelect.innerHTML = '';
    voices.forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${v.name} (${v.lang})${v.default ? ' - default' : ''}`;
      voiceSelect.appendChild(opt);
    });
  }
  loadVoices();
  synth.onvoiceschanged = loadVoices;

  rate.addEventListener('input', () => document.getElementById('rateVal').textContent = rate.value);
  pitch.addEventListener('input', () => document.getElementById('pitchVal').textContent = pitch.value);

  document.getElementById('speakBtn').addEventListener('click', () => {
    const text = ttsText.value.trim();
    if (!text) { ttsStatus.textContent = 'Write some text first.'; return; }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voices[voiceSelect.value]) {
      utterance.voice = voices[voiceSelect.value];
      utterance.lang = utterance.voice.lang;
    }
    utterance.rate = parseFloat(rate.value);
    utterance.pitch = parseFloat(pitch.value);
    utterance.onstart = () => ttsStatus.textContent = 'Speaking...';
    utterance.onend = () => ttsStatus.textContent = 'Done.';
    utterance.onerror = e => ttsStatus.textContent = 'Error: ' + e.error;
    synth.speak(utterance);
  });

  document.getElementById('pauseBtn').addEventListener('click', () => { synth.pause(); ttsStatus.textContent = 'Paused.'; });
  document.getElementById('resumeBtn').addEventListener('click', () => { synth.resume(); ttsStatus.textContent = 'Speaking...'; });
  document.getElementById('stopBtn').addEventListener('click', () => { synth.cancel(); ttsStatus.textContent = 'Stopped.'; });
}

/* ---------- SPEECH TO TEXT ---------- */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const startBtn = document.getElementById('startBtn');
const stopListenBtn = document.getElementById('stopListenBtn');
const clearBtn = document.getElementById('clearBtn');
const langSelect = document.getElementById('langSelect');
const finalEl = document.getElementById('final');
const interimEl = document.getElementById('interim');
const sttStatus = document.getElementById('sttStatus');

if (!SpeechRecognition) {
  sttStatus.innerHTML = '<span class="unsupported">Speech recognition is not supported in this browser. Try Chrome or Edge.</span>';
  startBtn.disabled = true;
} else {
  const recognition = new SpeechRecognition();
  recognition.continuous = true;      // keep listening until stopped
  recognition.interimResults = true;  // show partial results while speaking

  recognition.onstart = () => {
    sttStatus.innerHTML = '<span class="listening">Listening... speak now.</span>';
    startBtn.disabled = true;
    stopListenBtn.disabled = false;
  };

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalEl.textContent += result[0].transcript + ' ';
      } else {
        interim += result[0].transcript;
      }
    }
    interimEl.textContent = interim;
  };

  recognition.onerror = (event) => {
    const messages = {
      'not-allowed': 'Microphone access was denied. Allow it in your browser settings.',
      'no-speech': 'No speech detected. Try again.',
      'audio-capture': 'No microphone found.',
      'network': 'Network error: recognition needs an internet connection in this browser.'
    };
    sttStatus.textContent = messages[event.error] || 'Error: ' + event.error;
  };

  recognition.onend = () => {
    interimEl.textContent = '';
    startBtn.disabled = false;
    stopListenBtn.disabled = true;
    if (!sttStatus.textContent.startsWith('Microphone') && !sttStatus.textContent.startsWith('Error')) {
      sttStatus.textContent = 'Stopped.';
    }
  };

  startBtn.addEventListener('click', () => {
    recognition.lang = langSelect.value;
    sttStatus.textContent = '';
    try { recognition.start(); } catch (e) { /* already started */ }
  });
  stopListenBtn.addEventListener('click', () => recognition.stop());
  clearBtn.addEventListener('click', () => { finalEl.textContent = ''; interimEl.textContent = ''; });
}
