import { handleCalendarCommand } from './commands/calendar.js';
import { handleMemoryCommand } from './commands/memory.js';
import { calculateRoi } from './commands/roi.js';
import { handleNaturalSearch, handleSearchCommand } from './commands/search.js';
import { restoreConversationContext } from './chat.js';
import { PLUGIN_REGISTRY } from './modules.js';
import { appendDashboard } from './ui/dashboard.js';
import { appendMessage, clearSavedConversationHistory, resetLearningProfile, setStatus } from './ui.js';

export { createCalendarEventFromFields } from './commands/calendar.js';

async function executeCommand(command, argument, askAssistant) {
  if (await handleCalendarCommand(command, argument)) return true;
  if (await handleMemoryCommand(command, argument, askAssistant)) return true;
  if (await handleSearchCommand(command, argument, askAssistant)) return true;

  switch (command) {
    case 'roi':
      appendMessage('assistant', calculateRoi(argument));
      return true;
    case 'dashboard':
    case 'plugins':
    case 'status':
    case 'commandcenter':
      appendDashboard(PLUGIN_REGISTRY);
      return true;
    case 'resetlearning':
      resetLearningProfile();
      appendMessage('assistant', 'Local feedback and learned response preferences have been reset.');
      return true;
    case 'clearhistory':
      setStatus('CLEARING HISTORY', true);
      try {
        await clearSavedConversationHistory();
        restoreConversationContext([]);
        appendMessage('assistant', 'Saved chat history cleared. This confirmation will be saved as the start of a new history.');
      } catch (error) {
        appendMessage('assistant', error.message || 'Could not clear saved chat history.');
      } finally {
        setStatus('READY');
      }
      return true;
    case 'help':
      appendMessage('assistant', 'Commands: `/calendar` opens your device calendar; `/event <title> | <start ISO with timezone> | <end ISO with timezone> | [location] | [description]` creates an event; `/prioritize <goal>` ranks saved commitments; `/decision <options>` compares choices against your preferences; `/meeting <topic>` prepares an agenda; `/followup <topic>` drafts a fact-grounded message; `/plan <goal>` builds an action plan; `/riskcheck <project>` runs a premortem; `/search <query>` searches public web pages; `/roi investment=<amount> monthly_benefit=<amount> months=<n> [monthly_cost=<amount>]` calculates ROI; `/save <note>` stores private context; `/memory [query]` finds notes; `/forget <id>` removes one; `/clearhistory` deletes saved chat history; `/resetlearning` clears local feedback; `/dashboard` shows specialist modes.');
      return true;
    default:
      return false;
  }
}

export async function handleCommand(text, askAssistant) {
  const slashCommand = text.match(/^\/([a-z]+)(?:\s+([\s\S]*))?$/i);
  if (slashCommand) {
    const handled = await executeCommand(slashCommand[1].toLowerCase(), (slashCommand[2] || '').trim(), askAssistant);
    if (handled) return true;
  }
  return handleNaturalSearch(text, askAssistant);
}
