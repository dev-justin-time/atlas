import { searchWeb } from '../api.js';
import { appendSearchResults } from '../ui/search.js';
import { appendMessage, setStatus } from '../ui.js';

function naturalSearchQuery(text) {
  const match = text.match(/^(?:(?:can|could|would)\s+you\s+)?(?:please\s+)?(?:search(?:\s+(?:the\s+)?web)?|look\s+up|find\s+online)\s+(?:for\s+)?(.+)$/i);
  if (match) return match[1].trim();
  const localized = text.match(/^(?:(?:você\s+)?(?:pode\s+)?|(?:pouvez-vous\s+)?|(?:kannst du\s+)?)(?:pesquise(?:\s+na\s+web)?|busque(?:\s+na\s+web)?|procure(?:\s+na\s+web)?|recherche(?:\s+sur\s+le\s+web)?|suche(?:\s+im\s+web)?|busca(?:r)?(?:\s+en\s+la\s+web)?)\s+(?:por\s+|nach\s+|sobre\s+)?(.+)$/i);
  return localized ? localized[1].trim() : null;
}
async function runSearch(query, askAssistant) {
  if (!query) {
    appendMessage('assistant', 'Use `/search <query>` to search the public web.');
    return;
  }
  if (query.length > 300) {
    appendMessage('assistant', 'Search queries must be 300 characters or fewer.');
    return;
  }

  setStatus('SEARCHING WEB', true);
  try {
    const { results } = await searchWeb(query);
    appendSearchResults(results, query);
    if (!results.length) {
      setStatus('READY');
      return;
    }

    setStatus('SUMMARIZING', true);
    const answer = await askAssistant(query, { sources: results });
    appendMessage('assistant', answer, { feedback: true });
    setStatus('READY');
  } catch (error) {
    appendMessage('assistant', error.message || 'Web search failed. Please try again.');
    setStatus('READY');
  }
}

export async function handleSearchCommand(command, argument, askAssistant) {
  if (command !== 'search') return false;
  await runSearch(argument, askAssistant);
  return true;
}

export async function handleNaturalSearch(text, askAssistant) {
  const query = naturalSearchQuery(text);
  if (!query) return false;
  await runSearch(query, askAssistant);
  return true;
}
