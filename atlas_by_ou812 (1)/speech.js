const FEMALE_VOICE_ENGINE = Object.freeze({
  defaultVoice: 'en-female',
  byLanguage: Object.freeze({
    pt: 'pt-female',
    en: 'en-female',
    fr: 'fr-female',
    de: 'de-female',
    es: 'es-female',
  }),
});
const FEMALE_VOICE_SAMPLE = new URL('./assets/atlas-female-voice.wav', import.meta.url).href;

function selectFemaleVoice(language) {
  const languageCode = String(language || '')
    .toLowerCase()
    .split(/[-_]/, 1)[0];
  return Object.hasOwn(FEMALE_VOICE_ENGINE.byLanguage, languageCode)
    ? FEMALE_VOICE_ENGINE.byLanguage[languageCode]
    : FEMALE_VOICE_ENGINE.defaultVoice;
}

async function playGeneratedVoice(url) {
  const audio = new Audio(url);
  const finished = new Promise((resolve, reject) => {
    audio.addEventListener('ended', resolve, { once: true });
    audio.addEventListener('error', () => reject(new Error('Generated speech could not be played.')), { once: true });
  });
  try {
    await audio.play();
    await finished;
  } finally {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }
}

async function playFemaleVoice(text, language) {
  const engine = window.websim?.textToSpeech;
  if (typeof engine !== 'function') return;
  try {
    const result = await engine.call(window.websim, {
      text,
      generateFile: true,
      voice_sample: FEMALE_VOICE_SAMPLE,
    });
    if (!result?.url) throw new Error('Generated speech URL was not returned.');
    await playGeneratedVoice(result.url);
  } catch (error) {
    console.warn('Dedicated voice unavailable; using browser female TTS.', error);
    await engine.call(window.websim, { text, voice: selectFemaleVoice(language) });
  }
}

let speechQueue = Promise.resolve();
let avatarVoiceActive = false;

const AVATAR_STILL = 'uploads/talkalot-still.jpg';
const AVATAR_MOTION = 'uploads/talkalot.gif';

function setAvatarVoiceActive(active) {
  const avatar = document.getElementById('avatar');
  const avatarImage = document.getElementById('avatarImg');
  avatar?.classList.toggle('speaking', active);
  if (!avatarImage || avatarVoiceActive === active) return;
  avatarVoiceActive = active;
  avatarImage.src = active ? AVATAR_MOTION : AVATAR_STILL;
}

function cleanSpeechText(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' Code block omitted. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(?:note\s+#)?(\d+)\]/gi, ' source $1 ')
    .replace(/\*\*/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speakReply(text, language = 'en') {
  const spokenText = cleanSpeechText(String(text || ''));
  if (!spokenText || typeof window.websim?.textToSpeech !== 'function') return;

  speechQueue = speechQueue
    .catch(() => {})
    .then(async () => {
      setAvatarVoiceActive(true);
      try {
        await playFemaleVoice(spokenText, language);
      } finally {
        setAvatarVoiceActive(false);
      }
    })
    .catch((error) => {
      console.warn('A.T.L.A.S. speech playback was unavailable.', error);
    });
  return speechQueue;
}
