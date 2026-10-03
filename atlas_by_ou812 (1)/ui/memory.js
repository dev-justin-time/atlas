import { makeAssistantCard } from '../ui.js';

const chatArea = document.getElementById('chatArea');

export function appendMemoryList(notes, query = '') {
  const message = makeAssistantCard();
  const body = document.createElement('div');
  body.className = 'message-body';
  const heading = document.createElement('p');
  heading.className = 'memory-list-heading';
  heading.textContent = notes.length
    ? `Private saved notes${query ? ` matching “${query}”` : ''}`
    : `No saved notes${query ? ` matching “${query}”` : ''}. Use /save <note> to save one.`;
  body.appendChild(heading);

  if (notes.length) {
    const list = document.createElement('div');
    list.className = 'memory-list';
    for (const note of notes) {
      const card = document.createElement('article');
      card.className = 'memory-card';
      const header = document.createElement('header');
      const date = new Date(note.created_at);
      const formattedDate = Number.isNaN(date.valueOf()) ? '' : date.toLocaleString();
      header.textContent = `NOTE #${note.id}${formattedDate ? ` · ${formattedDate}` : ''}`;
      const text = document.createElement('p');
      text.textContent = note.note;
      card.append(header, text);
      list.appendChild(card);
    }
    body.appendChild(list);
    const hint = document.createElement('p');
    hint.className = 'memory-list-heading';
    hint.textContent = 'Remove a note with /forget <id>.';
    body.appendChild(hint);
  }
  message.appendChild(body);
  chatArea.appendChild(message);
  chatArea.scrollTop = chatArea.scrollHeight;
}
