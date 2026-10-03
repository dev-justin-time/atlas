const LANGUAGE_HINTS = {
  pt: ['nao', 'voce', 'senhor', 'ajuda', 'preciso', 'como', 'posso', 'pode', 'obrigado', 'para', 'uma', 'isso', 'pesquise', 'salve', 'quero', 'favor', 'com', 'minha'],
  fr: ['bonjour', 'monsieur', 'merci', 'comment', 'vous', 'je', 'avec', 'pour', 'est', 'dans', 'cette', 'recherche', 'peux', 'besoin', 'une'],
  de: ['bitte', 'ich', 'nicht', 'wie', 'und', 'der', 'die', 'das', 'hallo', 'danke', 'sie', 'konnen', 'suche', 'brauche', 'mein'],
  es: ['hola', 'gracias', 'usted', 'como', 'quiero', 'puedes', 'para', 'una', 'por favor', 'busca', 'necesito', 'esto', 'puedo'],
  en: ['the', 'you', 'please', 'what', 'how', 'can', 'would', 'could', 'help', 'search', 'save', 'explain', 'with', 'this', 'need', 'find'],
};

export function detectLanguage(text) {
  const normalized = ` ${text.toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')} `;
  let bestLanguage = 'en';
  let bestScore = 0;
  for (const [language, hints] of Object.entries(LANGUAGE_HINTS)) {
    const score = hints.reduce((total, hint) =>
      total + (normalized.includes(` ${hint} `) ? 1 : 0), 0);
    if (score > bestScore) {
      bestLanguage = language;
      bestScore = score;
    }
  }
  return bestScore ? bestLanguage : null;
}

export function getInterfaceLanguage() {
  const language = (navigator.language || 'en').split('-')[0].toLowerCase();
  return ['pt', 'fr', 'de', 'es'].includes(language) ? language : 'en';
}

export function getWelcomeMessage(language) {
  const messages = {
    en: 'A.T.L.A.S. is ready. Use `/search <query>` for web search, `/save <note>` and `/memory [query]` for private notes, or `/help` for commands.',
    pt: 'A.T.L.A.S. está pronto. Use `/search <consulta>` para pesquisar na web, `/save <nota>` e `/memory [consulta]` para notas privadas, ou `/help` para ver os comandos.',
    fr: 'A.T.L.A.S. est prêt. Utilisez `/search <requête>` pour chercher sur le Web, `/save <note>` et `/memory [requête]` pour vos notes privées, ou `/help` pour les commandes.',
    de: 'A.T.L.A.S. ist bereit. Mit `/search <Suchbegriff>` durchsuchen Sie das Web, mit `/save <Notiz>` und `/memory [Suchbegriff]` verwalten Sie private Notizen; `/help` zeigt alle Befehle.',
    es: 'A.T.L.A.S. está listo. Usa `/search <consulta>` para buscar en la web, `/save <nota>` y `/memory [consulta]` para notas privadas, o `/help` para ver los comandos.',
  };
  return messages[language] || messages.en;
}
