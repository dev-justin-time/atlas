import { makeAssistantCard } from '../ui.js';

const chatArea = document.getElementById('chatArea');

export function appendSearchResults(results, query) {
  const message = makeAssistantCard();
  const body = document.createElement('div');
  body.className = 'message-body';
  const intro = document.createElement('p');
  intro.textContent = results.length
    ? `Web results for “${query}” · Search by DuckDuckGo`
    : `No web results found for “${query}”. Search by DuckDuckGo.`;
  body.appendChild(intro);

  if (results.length) {
    const list = document.createElement('div');
    list.className = 'result-list';
    for (const result of results) {
      let url;
      try {
        url = new URL(result.url);
      } catch {
        continue;
      }
      if (!['http:', 'https:'].includes(url.protocol)) continue;

      const card = document.createElement('article');
      card.className = 'result-card';
      const link = document.createElement('a');
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = result.title;
      const address = document.createElement('span');
      address.className = 'result-url';
      address.textContent = url.hostname;
      card.append(link, address);
      if (result.snippet) {
        const snippet = document.createElement('p');
        snippet.textContent = result.snippet;
        card.appendChild(snippet);
      }
      list.appendChild(card);
    }
    body.appendChild(list);
  }
  message.appendChild(body);
  chatArea.appendChild(message);
  chatArea.scrollTop = chatArea.scrollHeight;
}
