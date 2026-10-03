import { clearChatHistory, saveChatMessage } from './api.js';

const chatArea = document.getElementById('chatArea');
let conversationPersistenceEnabled = false;
let conversationWriteQueue = Promise.resolve();
const LEARNING_KEY = 'atlas-learning-v1';

function readLearningProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(LEARNING_KEY) || '{}');
    return {
      helpful: Number.isInteger(saved.helpful) ? Math.min(10000, Math.max(0, saved.helpful)) : 0,
      needsWork: Number.isInteger(saved.needsWork) ? Math.min(10000, Math.max(0, saved.needsWork)) : 0,
      preferences: Array.isArray(saved.preferences)
        ? saved.preferences.filter((item) => typeof item === 'string').slice(-8).map((item) => item.slice(0, 240))
        : [],
    };
  } catch {
    return { helpful: 0, needsWork: 0, preferences: [] };
  }
}

let learningProfile = readLearningProfile();

function saveLearningProfile() {
  try {
    localStorage.setItem(LEARNING_KEY, JSON.stringify(learningProfile));
  } catch {
    // Feedback remains usable for this session when browser storage is unavailable.
  }
}

export function getLearningContext() {
  return {
    helpful: learningProfile.helpful,
    needsWork: learningProfile.needsWork,
    preferences: [...learningProfile.preferences],
  };
}

export function resetLearningProfile() {
  learningProfile = { helpful: 0, needsWork: 0, preferences: [] };
  try {
    localStorage.removeItem(LEARNING_KEY);
  } catch {
    saveLearningProfile();
  }
}

function addAnswerFeedback(message) {
  const controls = document.createElement('div');
  controls.className = 'answer-feedback';
  const prompt = document.createElement('span');
  prompt.textContent = 'Was this useful?';
  const helpful = document.createElement('button');
  helpful.type = 'button';
  helpful.textContent = 'Useful';
  const improve = document.createElement('button');
  improve.type = 'button';
  improve.textContent = 'Needs work';
  const correctionForm = document.createElement('form');
  correctionForm.className = 'learning-correction';
  correctionForm.hidden = true;
  const correction = document.createElement('input');
  correction.type = 'text';
  correction.maxLength = 240;
  correction.placeholder = 'What should change in future replies?';
  correction.setAttribute('aria-label', 'Preference for future replies');
  const save = document.createElement('button');
  save.type = 'submit';
  save.textContent = 'Save preference';
  correctionForm.append(correction, save);
  controls.append(prompt, helpful, improve, correctionForm);

  function record(rating) {
    learningProfile[rating] += 1;
    saveLearningProfile();
    helpful.disabled = true;
    improve.disabled = true;
    prompt.textContent = rating === 'helpful' ? 'Feedback saved on this device.' : 'Feedback saved. Add a preference for future replies:';
    if (rating === 'needsWork') {
      correctionForm.hidden = false;
      correction.focus();
    }
  }

  helpful.addEventListener('click', () => record('helpful'));
  improve.addEventListener('click', () => record('needsWork'));
  correctionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const preference = correction.value.trim();
    if (!preference) return;
    learningProfile.preferences = [...learningProfile.preferences, preference].slice(-8);
    saveLearningProfile();
    correctionForm.replaceChildren();
    prompt.textContent = 'Preference saved on this device.';
  });
  message.appendChild(controls);
}

function setHistoryState(state) {
  const element = document.getElementById('historyServiceState');
  if (element) element.textContent = state;
  document.getElementById('historyServiceDot')?.classList.toggle(
    'limited',
    ['SIGN IN', 'OFFLINE', 'RETRY'].includes(state),
  );
}

export function setConversationPersistenceEnabled(enabled) {
  conversationPersistenceEnabled = enabled;
  if (!enabled) return;
  setHistoryState('DATABASE');
}

export function setConversationPersistenceStatus(state) {
  setHistoryState(state);
}

export async function clearSavedConversationHistory() {
  await conversationWriteQueue.catch(() => {});
  await clearChatHistory();
  chatArea.replaceChildren();
  setHistoryState('SAVED');
}

export async function flushConversationWrites() {
  await conversationWriteQueue.catch(() => {});
}

function persistConversationMessage(role, text) {
  if (!conversationPersistenceEnabled || !['user', 'assistant'].includes(role)) return;
  conversationWriteQueue = conversationWriteQueue
    .catch(() => {})
    .then(() => {
      setHistoryState('SAVING');
      return saveChatMessage(role, text);
    })
    .then(() => setHistoryState('SAVED'))
    .catch((error) => {
      setHistoryState('RETRY');
      console.warn('A.T.L.A.S. could not save this chat message.', error);
    });
}

function appendInline(parent, text) {
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    parent.append(document.createTextNode(text.slice(cursor, match.index)));
    const token = match[0];
    const element = document.createElement(token.startsWith('**') ? 'strong' : 'code');
    if (token.startsWith('**')) {
      element.textContent = token.slice(2, -2);
    } else {
      element.className = 'inline';
      element.textContent = token.slice(1, -1);
    }
    parent.appendChild(element);
    cursor = match.index + token.length;
  }
  parent.append(document.createTextNode(text.slice(cursor)));
}

function appendFormattedText(parent, text) {
  const blocks = text.split(/(```[\s\S]*?```)/g);
  for (const block of blocks) {
    if (!block) continue;
    if (block.startsWith('```')) {
      const code = block.replace(/^```[^\n]*\n?/, '').replace(/```$/, '');
      const pre = document.createElement('pre');
      const codeElement = document.createElement('code');
      codeElement.textContent = code;
      pre.appendChild(codeElement);
      parent.appendChild(pre);
      continue;
    }

    const paragraphs = block.trim().split(/\n{2,}/);
    for (const paragraphText of paragraphs) {
      if (!paragraphText.trim()) continue;
      const paragraph = document.createElement('p');
      const lines = paragraphText.split('\n');
      lines.forEach((line, index) => {
        if (index) paragraph.appendChild(document.createElement('br'));
        appendInline(paragraph, line);
      });
      parent.appendChild(paragraph);
    }
  }
}

export function makeAssistantCard(className = '') {
  const message = document.createElement('article');
  message.className = `message assistant${className ? ` ${className}` : ''}`;
  const label = document.createElement('span');
  label.className = 'message-label';
  label.textContent = 'A.T.L.A.S.';
  message.appendChild(label);
  return message;
}

export function appendMessage(role, text, { persist = true, feedback = false } = {}) {
  const message = document.createElement('article');
  message.className = `message ${role === 'user' ? 'user' : 'assistant'}`;
  const label = document.createElement('span');
  label.className = 'message-label';
  label.textContent = role === 'user' ? 'You' : 'A.T.L.A.S.';
  const body = document.createElement('div');
  body.className = 'message-body';
  appendFormattedText(body, String(text ?? ''));
  message.append(label, body);
  chatArea.appendChild(message);
  if (feedback && role === 'assistant') addAnswerFeedback(message);
  chatArea.scrollTop = chatArea.scrollHeight;
  if (persist) persistConversationMessage(role, String(text ?? ''));
  return message;
}

export function setStatus(status, busy = false) {
  const statusElement = document.getElementById('status');
  statusElement.textContent = status;
  statusElement.closest('.status-badge')?.classList.toggle('busy', busy);
  statusElement.classList.toggle('typing', busy);
}
