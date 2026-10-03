export function attachVoiceInput({ input, draftMicButton, voiceSendButton, isRequestActive, sendMessage, setStatus, appendMessage }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let listening = false;
  let dictationMode = null;
  let voiceCommand = '';
  let draftBeforeVoice = '';

  function insertDictatedText(text) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const left = input.value.slice(0, start);
    const right = input.value.slice(end);
    const needsSpace = left && !/\s$/.test(left) && !/^\s/.test(text);
    const insertion = `${needsSpace ? ' ' : ''}${text}`;
    input.value = `${left}${insertion}${right}`;
    const cursor = start + insertion.length;
    input.setSelectionRange(cursor, cursor);
  }

  function toggleDictation(mode) {
    if (!SpeechRecognition) {
      appendMessage('assistant', 'Voice dictation is not available in this browser.');
      return;
    }
    if (listening) {
      if (dictationMode === 'send' && mode === 'draft') {
        dictationMode = 'cancel';
      }
      recognition?.stop();
      return;
    }
    if (isRequestActive()) return;

    recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = false;
    recognition.continuous = mode === 'send';
    dictationMode = mode;
    voiceCommand = '';
    draftBeforeVoice = mode === 'send' ? input.value : '';
    if (mode === 'send') input.value = '';

    recognition.onstart = () => {
      listening = true;
      const activeButton = mode === 'send' ? voiceSendButton : draftMicButton;
      activeButton.classList.add('listening');
      activeButton.setAttribute('aria-pressed', 'true');
      input.placeholder = mode === 'send' ? 'Listening for a command…' : 'Dictating into your draft…';
      setStatus(mode === 'send' ? 'LISTENING FOR COMMAND' : 'DICTATING TO DRAFT', true);
    };

    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result.isFinal) continue;
        const transcript = result[0].transcript.trim();
        if (!transcript) continue;
        if (mode === 'send') {
          voiceCommand = `${voiceCommand} ${transcript}`.trim();
          input.value = voiceCommand;
        } else {
          insertDictatedText(transcript);
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        appendMessage('assistant', 'Microphone access is blocked. Allow microphone access in your browser to dictate a message.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        appendMessage('assistant', 'Dictation stopped unexpectedly. Please try again.');
      }
    };

    recognition.onend = () => {
      listening = false;
      draftMicButton.classList.remove('listening');
      voiceSendButton.classList.remove('listening');
      draftMicButton.setAttribute('aria-pressed', 'false');
      voiceSendButton.setAttribute('aria-pressed', 'false');
      input.placeholder = 'Enter a command or ask A.T.L.A.S.…';
      if (!isRequestActive()) setStatus('READY');

      if (dictationMode === 'send') {
        if (voiceCommand.trim()) {
          const previousDraft = draftBeforeVoice;
          input.value = voiceCommand.trim();
          void sendMessage().finally(() => {
            if (previousDraft) input.value = previousDraft;
          });
        } else {
          input.value = draftBeforeVoice;
        }
      } else if (dictationMode === 'cancel') {
        input.value = draftBeforeVoice;
      }
      dictationMode = null;
    };

    try {
      recognition.start();
    } catch {
      listening = false;
      draftMicButton.classList.remove('listening');
      voiceSendButton.classList.remove('listening');
      if (mode === 'send') input.value = draftBeforeVoice;
      dictationMode = null;
      setStatus('READY');
    }
  }

  draftMicButton.addEventListener('click', () => toggleDictation('draft'));
  voiceSendButton.addEventListener('click', () => toggleDictation('send'));
  window.addEventListener('beforeunload', () => recognition?.stop());
  return { isListening: () => listening, stop: () => recognition?.stop() };
}
