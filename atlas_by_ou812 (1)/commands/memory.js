import { deleteMemory, listMemory, saveMemory } from '../api.js';
import { appendMemoryList } from '../ui/memory.js';
import { appendMessage, setStatus } from '../ui.js';

const MEMORY_WORKFLOWS = Object.freeze({
  prioritize: { usage: '/prioritize <goal, project, or time period>', instructions: 'Prioritize relevant saved commitments and goals. Return the top three priorities, why each matters, one concrete next action, what can be deferred, and any deadline that needs confirmation. Do not invent dates or commitments.' },
  decision: { usage: '/decision <decision and options>', instructions: 'Compare the stated options using relevant saved goals, constraints, and preferences. Show tradeoffs, key unknowns, a tentative recommendation with confidence, and the smallest reversible test. If options are missing, ask for them instead of inventing them.' },
  meeting: { usage: '/meeting <person, topic, or objective>', instructions: 'Prepare a practical meeting brief from relevant notes: desired outcome, concise agenda, questions to ask, commitments or facts to confirm, and a short preparation checklist. Do not invent attendee roles, facts, or prior agreements.' },
  followup: { usage: '/followup <person, topic, or conversation>', instructions: 'Draft a concise, professional follow-up grounded in relevant notes and the current request. Include a useful subject line and clear next step. Use placeholders for missing names, dates, or commitments; never fabricate an agreement.' },
  plan: { usage: '/plan <goal or project>', instructions: 'Turn the goal into an actionable plan grounded in relevant notes. Give milestones, the next three actions, dependencies, an owner only when known, a measurable definition of done, and risks. Use relative timing unless dates were provided.' },
  riskcheck: { usage: '/riskcheck <project, decision, or change>', instructions: 'Run a concise pre-mortem using relevant saved context. List material risks, evidence or uncertainty, early warning signals, practical mitigations, and contingency actions. Do not invent numeric likelihoods or claim access to external systems.' },
});

function normalizeMemoryText(value) {
  return value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function selectRelevantMemories(notes, query) {
  const terms = [...new Set(normalizeMemoryText(query).split(/\s+/).map((word) => word.replace(/[^a-z0-9]/g, '')).filter((word) => word.length >= 3))].slice(0, 12);
  return notes.map((note) => {
    const normalizedNote = normalizeMemoryText(note.note);
    const score = terms.reduce((total, term) => total + Number(normalizedNote.includes(term)), 0);
    return { note, score };
  }).sort((a, b) => b.score - a.score || b.note.created_at - a.note.created_at).slice(0, 8).map(({ note }) => note);
}

async function runMemoryWorkflow(command, argument, askAssistant) {
  const workflow = MEMORY_WORKFLOWS[command];
  if (!argument) {
    appendMessage('assistant', 'Use ' + workflow.usage + '. This uses your private saved notes as context.');
    return;
  }
  if (argument.length > 500) {
    appendMessage('assistant', 'Keep the request to 500 characters or fewer.');
    return;
  }
  setStatus('LOADING NOTES', true);
  try {
    const { notes } = await listMemory();
    if (!notes.length) {
      appendMessage('assistant', 'No private notes are saved yet. Sign in and use /save <note> to add goals, preferences, commitments, or project context first.');
      return;
    }
    setStatus('USING SAVED CONTEXT', true);
    const answer = await askAssistant(argument, { memory: selectRelevantMemories(notes, argument), taskInstructions: workflow.instructions });
    appendMessage('assistant', answer, { feedback: true });
  } catch (error) {
    appendMessage('assistant', error.message || 'Could not use your saved notes.');
  } finally {
    setStatus('READY');
  }
}

export async function handleMemoryCommand(command, argument, askAssistant) {
  if (command === 'save') {
    if (!argument) {
      appendMessage('assistant', 'Use /save <note> to store a private note in your account.');
      return true;
    }
    if (argument.length > 10000) {
      appendMessage('assistant', 'Notes must be 10,000 characters or fewer.');
      return true;
    }
    setStatus('SAVING NOTE', true);
    try {
      const saved = await saveMemory(argument);
      appendMessage('assistant', 'Saved private note **#' + saved.id + '**. Find it later with /memory; remove it with /forget ' + saved.id + '.');
    } catch (error) {
      appendMessage('assistant', error.message || 'Could not save that note.');
    } finally {
      setStatus('READY');
    }
    return true;
  }

  if (command === 'memory') {
    setStatus('LOADING NOTES', true);
    try {
      const { notes } = await listMemory(argument);
      appendMemoryList(notes, argument);
      if (argument && notes.length) {
        setStatus('READING NOTES', true);
        const answer = await askAssistant(argument, { memory: notes });
        appendMessage('assistant', answer, { feedback: true });
      }
    } catch (error) {
      appendMessage('assistant', error.message || 'Could not load saved notes.');
    } finally {
      setStatus('READY');
    }
    return true;
  }

  if (command === 'forget') {
    if (!/^\d+$/.test(argument)) {
      appendMessage('assistant', 'Use /forget <note id> to remove one of your saved notes.');
      return true;
    }
    setStatus('DELETING NOTE', true);
    try {
      await deleteMemory(argument);
      appendMessage('assistant', 'Private note **#' + argument + '** deleted.');
    } catch (error) {
      appendMessage('assistant', error.message || 'Could not remove that note.');
    } finally {
      setStatus('READY');
    }
    return true;
  }

  if (Object.hasOwn(MEMORY_WORKFLOWS, command)) {
    await runMemoryWorkflow(command, argument, askAssistant);
    return true;
  }
  return false;
}
