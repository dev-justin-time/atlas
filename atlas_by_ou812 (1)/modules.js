import legal from './modules/topics/legal.js';
import tax from './modules/topics/tax.js';
import competitor from './modules/topics/competitor.js';
import strategist from './modules/topics/strategist.js';
import mo from './modules/topics/mo.js';
import background from './modules/topics/background.js';
import poi from './modules/topics/poi.js';
import financial from './modules/topics/financial.js';
import cs from './modules/topics/cs.js';
import supply from './modules/topics/supply.js';

export const PLUGIN_REGISTRY = {
  legal,
  tax,
  competitor,
  strategist,
  mo,
  background,
  poi,
  financial,
  cs,
  supply,
};
function normalizeRoutingText(value) {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function getModuleKeyForText(text) {
  const query = ` ${normalizeRoutingText(text)} `;
  const matches = Object.entries(PLUGIN_REGISTRY)
    .flatMap(([key, module]) => [...module.keywords, module.domain, module.name.split(' ')[0]]
      .map((term) => ({ key, term: normalizeRoutingText(term) })))
    .filter(({ term }) => term && query.includes(` ${term} `))
    .sort((a, b) => b.term.length - a.term.length);
  return matches[0]?.key || null;
}

export function getRoutingHint(text, selectedModuleKey = null) {
  const moduleKey = selectedModuleKey && PLUGIN_REGISTRY[selectedModuleKey]
    ? selectedModuleKey
    : getModuleKeyForText(text);
  if (!moduleKey) return null;
  const module = PLUGIN_REGISTRY[moduleKey];
  const sourceNote = moduleKey === 'legal' || moduleKey === 'tax'
    ? 'Be careful about jurisdiction and professional advice.'
    : 'Use only information and sources actually supplied; never imply an external service ran.';
  return `[ACTIVE SPECIALIST: ${module.name} — ${module.domain}. Focus: ${module.focus}. Workflow: ${module.instructions} ${sourceNote}]`;
}
