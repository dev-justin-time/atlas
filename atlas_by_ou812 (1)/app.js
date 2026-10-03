import { askAssistant, restoreConversationContext } from './chat.js';
import { handleCommand } from './commands.js';
import { openCalendar } from './calendar/controller.js';
import { detectLanguage, getInterfaceLanguage, getWelcomeMessage } from './language.js';
import { getModuleKeyForText, PLUGIN_REGISTRY } from './modules.js';
import { loadChatHistory } from './api.js';
import { speakReply } from './speech.js';
import { attachVoiceInput } from './voice-input.js';
import {
  appendMessage,
  flushConversationWrites,
  setConversationPersistenceEnabled,
  setConversationPersistenceStatus,
  setStatus,
} from './ui.js';

const form = document.getElementById('composer');
const input = document.getElementById('input');
const sendButton = document.getElementById('send');
const draftMicButton = document.getElementById('micDraft');
const voiceSendButton = document.getElementById('voiceSend');
const clock = document.getElementById('clock');
const bootOverlay = document.getElementById('bootOverlay');

let requestActive = false;
let sessionRequests = 0;
let activeModuleKey = null;
let routedModuleKey = null;
let currentMessageModuleKey = null;
let lastModuleStarter = '';

function renderModuleCatalog() {
  const list = document.getElementById('moduleList');
  const modules = Object.entries(PLUGIN_REGISTRY);
  document.getElementById('moduleCount').textContent = String(modules.length).padStart(2, '0');
  list.replaceChildren(...modules.map(([key, module]) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'module-card';
    card.dataset.moduleKey = key;
    card.title = `Activate ${module.name} specialist mode`;
    const indicator = document.createElement('span');
    indicator.className = 'module-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    const details = document.createElement('span');
    const name = document.createElement('span');
    name.className = 'module-name';
    name.textContent = module.name;
    const domain = document.createElement('span');
    domain.className = 'module-domain';
    domain.textContent = module.domain;
    details.append(name, domain);
    const tag = document.createElement('span');
    tag.className = 'module-tag';
    tag.textContent = 'READY';
    card.append(indicator, details, tag);
    card.addEventListener('click', () => {
      activeModuleKey = activeModuleKey === key ? null : key;
      updateModuleSelection();
      if (activeModuleKey) {
        if (!input.value.trim() || input.value === lastModuleStarter) {
          input.value = `${module.starter} `;
          lastModuleStarter = input.value;
        }
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      } else if (input.value === lastModuleStarter) {
        input.value = '';
        lastModuleStarter = '';
      }
    });
    return card;
  }));
  updateModuleSelection();
}

function updateModuleSelection() {
  const visibleKey = activeModuleKey || routedModuleKey;
  const module = visibleKey ? PLUGIN_REGISTRY[visibleKey] : null;
  document.querySelectorAll('.module-card').forEach((card) => {
    const key = card.dataset.moduleKey;
    const isActive = key === activeModuleKey;
    const isRouted = !activeModuleKey && key === routedModuleKey;
    card.classList.toggle('selected', isActive || isRouted);
    card.setAttribute('aria-pressed', String(isActive));
    card.querySelector('.module-tag').textContent = isActive ? 'ACTIVE' : isRouted ? 'ROUTED' : 'READY';
  });
  document.getElementById('workspaceEyebrow').textContent =
    module ? (activeModuleKey ? 'SPECIALIST MODE' : 'AUTO ROUTED') : 'COMMAND INTERFACE';
  document.getElementById('workspaceTitle').textContent = module ? module.name : 'Terminal';
  input.placeholder = activeModuleKey
    ? PLUGIN_REGISTRY[activeModuleKey].placeholder
    : 'Enter a command or ask A.T.L.A.S.…';
}

async function answerAssistant(text, options) {
  const answer = await askAssistant(text, { ...options, moduleKey: currentMessageModuleKey });
  void speakReply(answer, detectLanguage(text) || getInterfaceLanguage());
  return answer;
}

function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

let clockTimeout;
function scheduleClockUpdate() {
  window.clearTimeout(clockTimeout);
  if (document.hidden) return;
  updateClock();
  clockTimeout = window.setTimeout(scheduleClockUpdate, 60000 - (Date.now() % 60000));
}

document.addEventListener('visibilitychange', scheduleClockUpdate);

function setServiceIndicator(name, state) {
  const stateElement = document.getElementById(`${name}ServiceState`);
  const dotElement = document.getElementById(`${name}ServiceDot`);
  if (stateElement) stateElement.textContent = state;
  dotElement?.classList.toggle('limited', ['SIGN IN', 'OFFLINE', 'UNAVAILABLE'].includes(state));
}

async function updateConnectionIndicators() {
  const websim = window.websim;
  setServiceIndicator('assistant', websim?.chat?.completions?.create ? 'READY' : 'OFFLINE');
  setServiceIndicator('voice', websim?.textToSpeech ? 'FEMALE TTS' : 'UNAVAILABLE');
  if (!websim?.getUser) {
    setServiceIndicator('notes', 'OFFLINE');
    return;
  }
  try {
    const user = await websim.getUser();
    setServiceIndicator('notes', user ? 'READY' : 'SIGN IN');
  } catch {
    setServiceIndicator('notes', 'OFFLINE');
  }
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function restoreConversation() {
  try {
    const { messages } = await loadChatHistory(100);
    setConversationPersistenceEnabled(true);
    return Array.isArray(messages) ? messages : [];
  } catch (error) {
    setConversationPersistenceStatus(
      error.message?.toLowerCase().includes('sign in') ? 'SIGN IN' : 'OFFLINE',
    );
    return [];
  }
}

const conversationHistoryPromise = restoreConversation();

async function boot() {
  setStatus('CALIBRATING SYSTEMS', true);
  const previousMessages = await conversationHistoryPromise;
  setStatus('READY');
  bootOverlay.classList.add('done');
  await delay(450);
  bootOverlay.remove();

  const interfaceLanguage = getInterfaceLanguage();
  document.documentElement.lang = interfaceLanguage;
  restoreConversationContext(previousMessages);
  if (previousMessages.length) {
    previousMessages.forEach(({ role, content }) => {
      if (['user', 'assistant'].includes(role) && typeof content === 'string') {
        appendMessage(role, content, { persist: false, feedback: role === 'assistant' });
      }
    });
  } else {
    appendMessage('assistant', getWelcomeMessage(interfaceLanguage), { persist: false });
  }
  input.focus();
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text || requestActive) return;

  sessionRequests += 1;
  document.getElementById('requestCount').textContent = String(sessionRequests);
  requestActive = true;
  currentMessageModuleKey = activeModuleKey || getModuleKeyForText(text);
  routedModuleKey = activeModuleKey ? null : currentMessageModuleKey;
  updateModuleSelection();
  sendButton.disabled = true;
  draftMicButton.disabled = true;
  voiceSendButton.disabled = true;
  input.value = '';
  appendMessage('user', text);

  try {
    const handled = await handleCommand(text, answerAssistant);
    if (!handled) {
      setStatus('THINKING', true);
      const answer = await answerAssistant(text);
      appendMessage('assistant', answer, { feedback: true });
    }
  } catch (error) {
    appendMessage('assistant', error.message || 'A.T.L.A.S. could not complete that request. Please try again.');
  } finally {
    await flushConversationWrites();
    requestActive = false;
    routedModuleKey = null;
    currentMessageModuleKey = null;
    updateModuleSelection();
    sendButton.disabled = false;
    draftMicButton.disabled = false;
    voiceSendButton.disabled = false;
    setStatus('READY');
    input.focus();
  }
}

const voiceInput = attachVoiceInput({ input, draftMicButton, voiceSendButton, isRequestActive: () => requestActive, sendMessage, setStatus, appendMessage });

document.getElementById('calendarOpen').addEventListener('click', openCalendar);
window.addEventListener('atlas:open-calendar', openCalendar);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (voiceInput.isListening()) {
    voiceInput.stop();
    return;
  }
  sendMessage();
});

scheduleClockUpdate();
renderModuleCatalog();
void updateConnectionIndicators();
boot();
