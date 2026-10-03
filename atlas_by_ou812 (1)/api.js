async function requestJSON(path, options = {}) {
  let response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new Error('Could not reach A.T.L.A.S. services. Check your connection and try again.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status}).`);
  }
  return payload;
}

export async function getExpertPlaybook(expert, query) {
  const params = new URLSearchParams({ expert, q: query.slice(0, 500) });
  return requestJSON(`/api/expert-playbook?${params}`);
}

export async function searchWeb(query) {
  const params = new URLSearchParams({ q: query });
  return requestJSON(`/api/search?${params}`);
}

export async function listMemory(query = '') {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  return requestJSON(`/api/memory${params.size ? `?${params}` : ''}`);
}

export async function saveMemory(note) {
  return requestJSON('/api/memory', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ note }),
  });
}

export async function deleteMemory(id) {
  return requestJSON(`/api/memory/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function loadChatHistory(limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  return requestJSON(`/api/chat-history?${params}`);
}

export async function saveChatMessage(role, content) {
  return requestJSON('/api/chat-history', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ role, content }),
  });
}

export async function clearChatHistory() {
  return requestJSON('/api/chat-history', { method: 'DELETE' });
}
