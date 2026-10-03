import { makeAssistantCard } from '../ui.js';

const chatArea = document.getElementById('chatArea');

export function appendDashboard(registry) {
  const message = makeAssistantCard('dashboard-message');
  const heading = document.createElement('h2');
  heading.className = 'dashboard-heading';
  heading.textContent = 'UNIFIED COMMAND CENTER';
  message.appendChild(heading);

  const note = document.createElement('p');
  note.className = 'dashboard-note';
  note.textContent = 'Each module is an in-app specialist workflow powered by A.T.L.A.S. It uses your prompt and any sources you provide; external business systems are not connected.';
  message.appendChild(note);

  const list = document.createElement('div');
  list.className = 'plugin-list';
  for (const plugin of Object.values(registry)) {
    const row = document.createElement('div');
    row.className = 'plugin-row';
    const indicator = document.createElement('span');
    indicator.className = 'plugin-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.className = 'plugin-name';
    name.textContent = plugin.name;
    const domain = document.createElement('span');
    domain.className = 'plugin-domain';
    domain.textContent = plugin.domain;
    const state = document.createElement('span');
    state.className = 'plugin-state';
    state.textContent = 'READY';
    row.append(indicator, name, domain, state);
    list.appendChild(row);
  }
  message.appendChild(list);

  const recommendation = document.createElement('p');
  recommendation.className = 'dashboard-recommendation';
  recommendation.textContent = 'Suggested rollout: start with 2–3 modules tied to immediate priorities, then expand after validating access controls and data boundaries.';
  message.appendChild(recommendation);
  chatArea.appendChild(message);
  chatArea.scrollTop = chatArea.scrollHeight;
}
