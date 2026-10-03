export const schema = `
  CREATE TABLE IF NOT EXISTS atlas_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS atlas_memory_user_created
    ON atlas_memory (user_id, created_at DESC);
  CREATE TABLE IF NOT EXISTS atlas_chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS atlas_chat_user_id
    ON atlas_chat_messages (user_id, id DESC);
  CREATE TABLE IF NOT EXISTS atlas_expert_playbook (
    expert_key TEXT NOT NULL,
    intent_key TEXT NOT NULL,
    common_query TEXT NOT NULL,
    trigger_terms TEXT NOT NULL,
    workflow TEXT NOT NULL,
    value_logic TEXT NOT NULL,
    PRIMARY KEY (expert_key, intent_key)
  );
  INSERT OR IGNORE INTO atlas_expert_playbook
    (expert_key, intent_key, common_query, trigger_terms, workflow, value_logic) VALUES
    ('legal', 'contract-review', 'Review a contract or clause for risk', '["contract","clause","agreement","nda"]', 'Identify obligations, ambiguous terms, termination, liability, confidentiality, and missing context. Ask for jurisdiction when needed.', 'Rank issues by likely business impact and reversibility. Suggest precise questions or negotiation edits, and flag when counsel should review.'),
    ('legal', 'compliance', 'Check a policy or process for compliance gaps', '["compliance","regulation","policy","regulatory"]', 'Clarify jurisdiction, industry, entity type, and effective date. Separate stated requirements from assumptions and unknowns.', 'Prioritize gaps by exposure, likelihood, remediation effort, and deadline. Give a verification source or qualified-counsel next step.'),
    ('tax', 'deductions', 'Identify deductions or tax planning options', '["deduction","deductions","expense","write off","tax planning"]', 'Ask for jurisdiction, tax year, entity type, and relevant facts. Distinguish potentially eligible items from confirmed treatment.', 'Estimate value only when amounts and rates are supplied. List records to gather and the highest-value eligibility questions to verify.'),
    ('tax', 'cross-border', 'Compare tax implications across countries', '["cross border","international","foreign","treaty","country"]', 'Establish countries, tax year, residency, entity, transaction type, and where work or income occurs.', 'Map possible double-tax, withholding, and reporting exposure. Prioritize specialist review by amount, deadline, and uncertainty; never invent rates.'),
    ('competitor', 'comparison', 'Compare named competitors or alternatives', '["competitor","compare","comparison","versus","vs"]', 'Compare audience, offer, positioning, proof, strengths, weaknesses, and unknowns. Label sourced facts separately from hypotheses.', 'Rank differentiators by customer value, evidence confidence, and execution cost. Recommend one test that could disprove the leading hypothesis.'),
    ('competitor', 'pricing', 'Assess competitor pricing or market position', '["pricing","price","market","positioning","market share"]', 'Capture segment, geography, offer scope, date, and source for each price or market claim.', 'Compare like-for-like unit economics and identify the pricing assumption with the largest revenue or margin sensitivity.'),
    ('strategist', 'prioritization', 'Prioritize initiatives or strategic options', '["prioritize","prioritization","initiative","tradeoff","strategy"]', 'Define the objective, time horizon, constraints, candidate options, and evidence. Surface dependencies and reversibility.', 'Score options on impact, confidence, effort, time-to-value, and downside. Show assumptions and recommend a reversible next test.'),
    ('strategist', 'roadmap', 'Build a business roadmap or launch plan', '["roadmap","launch","go to market","milestone","90 day"]', 'Translate the goal into sequenced outcomes, dependencies, owners, decision gates, and measurable milestones.', 'Prioritize the shortest path to validated value. Give 30/60/90 day actions and leading indicators, not activity-only goals.'),
    ('mo', 'workflow', 'Document or improve an operational workflow', '["workflow","process","sop","handoff","bottleneck"]', 'Define trigger, owner, ordered steps, handoffs, exceptions, completion criteria, and current bottleneck.', 'Estimate time saved or error reduction only from supplied baselines. Rank fixes by throughput impact, implementation effort, and control risk.'),
    ('mo', 'metrics', 'Choose operating metrics or service levels', '["metric","kpi","service level","sla","throughput"]', 'Tie each metric to an outcome, owner, source, cadence, numerator, denominator, and target.', 'Prefer a small set of leading and lagging measures. Flag gaming risk and quantify the threshold that should trigger action.'),
    ('background', 'scorecard', 'Evaluate candidates against role criteria', '["candidate","hiring","scorecard","interview","applicant"]', 'Use consistent job-related criteria and supplied evidence. Record evidence, uncertainty, and missing information for each criterion.', 'Compare evidence against the same rubric, avoid protected-trait inference, and leave the decision to the human hiring team.'),
    ('background', 'role-design', 'Define a fair role-related evaluation rubric', '["role criteria","job description","rubric","competency"]', 'Translate essential job outcomes into observable competencies and structured interview questions.', 'Prioritize criteria by on-the-job impact and assessability. Remove proxies and criteria unrelated to role performance.'),
    ('poi', 'relationship-map', 'Map relationships among people or organizations', '["relationship","network","connection","people","organization"]', 'List entities, stated connections, evidence source, date, and confidence. Separate facts from inferred links.', 'Prioritize links by relevance to the stated question and evidence strength. Show unknowns; do not infer sensitive traits or wrongdoing.'),
    ('poi', 'entity-research', 'Organize public information about an entity', '["entity","public information","due diligence","organization","person of interest"]', 'Define the entity and purpose. Keep user-provided facts distinct from cited public-source claims and unresolved identity matches.', 'Rank follow-up checks by decision relevance, evidence quality, and privacy risk. Do not imply private-record access.'),
    ('financial', 'cash-runway', 'Forecast cash flow or runway', '["cash flow","cashflow","runway","burn rate","liquidity"]', 'Request starting cash, periods, dated inflows and outflows, and explicit assumptions. Show formulas and scenario boundaries.', 'Calculate runway and low-cash dates from supplied figures. Identify the few assumptions that move the result most and an early warning threshold.'),
    ('financial', 'scenario', 'Compare financial scenarios or forecasts', '["forecast","scenario","revenue","budget","projection"]', 'Build base, downside, and upside cases from stated inputs. Label estimates and missing drivers.', 'Compare cash or margin outcomes, sensitivity, and break-even thresholds. Do not present projections as guarantees or investment advice.'),
    ('cs', 'churn-risk', 'Assess churn risk for a customer account', '["churn","renewal","customer health","at risk","retention"]', 'Separate observed usage, support, sentiment, and commercial signals from interpretation. Capture renewal date and confidence.', 'Rank risks by renewal impact and actionability. Recommend a named owner, next contact date, and measurable retention signal.'),
    ('cs', 'retention-plan', 'Create a customer retention or recovery plan', '["retention","save plan","customer success","adoption","onboarding"]', 'Clarify desired customer outcome, blockers, stakeholders, adoption evidence, and prior commitments.', 'Choose the smallest next action tied to customer value. Set owner, due date, success measure, and escalation trigger.'),
    ('supply', 'supplier-risk', 'Assess supplier concentration or disruption risk', '["supplier","vendor","single source","concentration","disruption"]', 'Map critical inputs, supplier locations, substitutes, lead times, inventory cover, and known dependencies.', 'Rank exposure by likelihood evidence, operational impact, time to recover, and mitigation cost. Identify a trigger and contingency owner.'),
    ('supply', 'logistics', 'Plan for a logistics or lead-time disruption', '["logistics","shipping","lead time","freight","inventory"]', 'Establish route, mode, lead time, inventory position, demand, and the disruption facts actually known.', 'Estimate days of cover and service impact from supplied numbers. Compare reroute, buffer, and alternate-source options by cost and recovery time.');
`;

const jsonError = (error, status = 400) =>
  Response.json({ error }, { status, headers: { 'cache-control': 'no-store' } });

const searchRateLimits = new Map();
const SEARCH_LIMIT_PER_MINUTE = 20;
const SIGNED_OUT_SEARCH_LIMIT_PER_MINUTE = 60;

function consumeSearchQuota(request) {
  const userId = request.headers.get('x-websim-user-id');
  const key = userId || 'signed-out';
  const limit = userId ? SEARCH_LIMIT_PER_MINUTE : SIGNED_OUT_SEARCH_LIMIT_PER_MINUTE;
  const now = Date.now();
  const bucket = searchRateLimits.get(key);
  if (!bucket || now - bucket.startedAt >= 60_000) {
    searchRateLimits.set(key, { startedAt: now, count: 1 });
  } else if (bucket.count >= limit) {
    return false;
  } else {
    bucket.count += 1;
  }

  if (searchRateLimits.size > 1000) {
    for (const [entryKey, entry] of searchRateLimits) {
      if (now - entry.startedAt >= 60_000) searchRateLimits.delete(entryKey);
      if (searchRateLimits.size <= 750) break;
    }
  }
  return true;
}

function requireUser(request) {
  return request.headers.get('x-websim-user-id');
}

function normalizeExpertText(value) {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

async function handleExpertPlaybook(request, env, url) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { allow: 'GET', 'cache-control': 'no-store' },
    });
  }

  const expert = url.searchParams.get('expert') || '';
  const query = (url.searchParams.get('q') || '').trim().slice(0, 500);
  if (!/^(legal|tax|competitor|strategist|mo|background|poi|financial|cs|supply)$/.test(expert)) {
    return jsonError('Choose a valid specialist key.');
  }

  const { results } = await env.DB
    .prepare(
      `SELECT intent_key, common_query, trigger_terms, workflow, value_logic
       FROM atlas_expert_playbook
       WHERE expert_key = ?
       ORDER BY intent_key`
    )
    .bind(expert)
    .all();

  const normalizedQuery = ` ${normalizeExpertText(query)} `;
  const ranked = results.map((entry) => {
    let terms = [];
    try {
      terms = JSON.parse(entry.trigger_terms);
    } catch {
      terms = [];
    }
    const score = terms.filter((term) => {
      const normalizedTerm = normalizeExpertText(term);
      return normalizedTerm && normalizedQuery.includes(` ${normalizedTerm} `);
    }).length;
    return { entry, score };
  });
  const matched = ranked
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  const selected = (matched.length ? matched : ranked).slice(0, 3);
  return Response.json({
    expert,
    matched: matched.length > 0,
    entries: selected.map(({ entry }) => ({
      intent: entry.intent_key,
      commonQuery: entry.common_query,
      workflow: entry.workflow,
      valueLogic: entry.value_logic,
    })),
  }, { headers: { 'cache-control': 'no-store' } });
}

function plainTextFromHTML(value) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, decimal) => {
      const codePoint = Number(decimal);
      return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : '';
    })
    .replace(/&#x([\da-f]+);/gi, (_, hex) => {
      const codePoint = Number.parseInt(hex, 16);
      return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : '';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function readAttribute(tag, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`\\b${escapedName}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match ? match[2] : '';
}

function resolveSearchUrl(rawHref) {
  try {
    const href = plainTextFromHTML(rawHref).replace(/&amp;/g, '&');
    const parsed = new URL(href, 'https://duckduckgo.com');
    const redirected = parsed.searchParams.get('uddg');
    const destination = redirected ? new URL(redirected) : parsed;
    if (destination.protocol !== 'https:' && destination.protocol !== 'http:') return null;
    if (destination.hostname === 'duckduckgo.com' || destination.hostname.endsWith('.duckduckgo.com')) return null;
    destination.hash = '';
    return destination.toString();
  } catch {
    return null;
  }
}

function parseSearchResults(html) {
  const anchors = [...html.matchAll(/<a\b[^>]*class=(["'])[^"']*\bresult__a\b[^"']*\1[^>]*>[\s\S]*?<\/a>/gi)];
  const results = [];
  const seen = new Set();

  for (const anchorMatch of anchors) {
    const tag = anchorMatch[0];
    const href = resolveSearchUrl(readAttribute(tag, 'href'));
    const title = plainTextFromHTML(tag.replace(/^<a\b[^>]*>/i, '').replace(/<\/a>$/i, ''));
    if (!href || !title || seen.has(href)) continue;
    seen.add(href);

    const afterAnchor = html.slice(anchorMatch.index + tag.length);
    const nextAnchor = afterAnchor.search(/<a\b[^>]*class=(["'])[^"']*\bresult__a\b[^"']*\1/i);
    const resultRegion = nextAnchor < 0 ? afterAnchor : afterAnchor.slice(0, nextAnchor);
    const snippetMatch = resultRegion.match(/<(?:a|div|span)\b[^>]*class=(["'])[^"']*\bresult__snippet\b[^"']*\1[^>]*>([\s\S]*?)<\/(?:a|div|span)>/i);
    const snippet = snippetMatch ? plainTextFromHTML(snippetMatch[2]).slice(0, 500) : '';

    results.push({ title: title.slice(0, 240), snippet, url: href });
    if (results.length === 6) break;
  }
  return results;
}

async function handleMemory(request, env, url) {
  const userId = requireUser(request);
  if (!userId) return jsonError('Sign in to use private saved notes.', 401);

  if (request.method === 'GET') {
    const query = (url.searchParams.get('q') || '').trim().slice(0, 200);
    const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`;
    const { results } = await env.DB
      .prepare(
        `SELECT id, note, created_at
         FROM atlas_memory
         WHERE user_id = ? AND (? = '' OR note LIKE ? ESCAPE '\\')
         ORDER BY created_at DESC, id DESC
         LIMIT 50`
      )
      .bind(userId, query, pattern)
      .all();
    return Response.json({ notes: results }, { headers: { 'cache-control': 'no-store' } });
  }

  if (request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError('Expected a JSON body with a note.');
    }
    const note = typeof body.note === 'string' ? body.note.trim() : '';
    if (!note) return jsonError('Enter a note to save.');
    if (note.length > 10000) return jsonError('Notes must be 10,000 characters or fewer.');

    const createdAt = Date.now();
    const { meta } = await env.DB
      .prepare(
        `INSERT INTO atlas_memory (user_id, note, created_at)
         SELECT ?, ?, ?
         WHERE (SELECT COUNT(*) FROM atlas_memory WHERE user_id = ?) < 500`
      )
      .bind(userId, note, createdAt, userId)
      .run();
    if (!meta.changes) return jsonError('You have reached the 500 saved-note limit.', 409);
    return Response.json({ id: meta.last_row_id, created_at: createdAt });
  }

  return new Response('Method not allowed', {
    status: 405,
    headers: { allow: 'GET, POST', 'cache-control': 'no-store' },
  });
}

async function handleDeleteMemory(request, env, id) {
  const userId = requireUser(request);
  if (!userId) return jsonError('Sign in to manage private saved notes.', 401);
  if (request.method !== 'DELETE') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { allow: 'DELETE', 'cache-control': 'no-store' },
    });
  }

  const result = await env.DB
    .prepare('DELETE FROM atlas_memory WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run();
  if (!result.meta.changes) return jsonError('That saved note was not found.', 404);
  return Response.json({ deleted: true });
}

async function handleChatHistory(request, env, url) {
  const userId = requireUser(request);
  if (!userId) return jsonError('Sign in to save and restore chat history.', 401);

  if (request.method === 'GET') {
    const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '100', 10);
    const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(200, requestedLimit)) : 100;
    const { results } = await env.DB
      .prepare(
        `SELECT id, role, content, created_at
         FROM atlas_chat_messages
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT ?`
      )
      .bind(userId, limit)
      .all();
    return Response.json(
      { messages: results.reverse() },
      { headers: { 'cache-control': 'no-store' } }
    );
  }

  if (request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError('Expected a JSON body with a chat message.');
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonError('Expected a JSON object with a chat message.');
    }
    const role = body.role;
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!['user', 'assistant'].includes(role)) return jsonError('Chat role must be user or assistant.');
    if (!content) return jsonError('Chat messages cannot be empty.');
    if (content.length > 20000) return jsonError('Chat messages must be 20,000 characters or fewer.');

    const { meta } = await env.DB
      .prepare(
        `INSERT INTO atlas_chat_messages (user_id, role, content, created_at)
         SELECT ?, ?, ?, ?
         WHERE (SELECT COUNT(*) FROM atlas_chat_messages WHERE user_id = ?) < 20000`
      )
      .bind(userId, role, content, Date.now(), userId)
      .run();
    if (!meta.changes) return jsonError('Chat history is full. Remove older messages to keep saving.', 409);
    return Response.json({ id: meta.last_row_id });
  }

  if (request.method === 'DELETE') {
    const { meta } = await env.DB
      .prepare('DELETE FROM atlas_chat_messages WHERE user_id = ?')
      .bind(userId)
      .run();
    return Response.json({ deleted: meta.changes });
  }

  return new Response('Method not allowed', {
    status: 405,
    headers: { allow: 'GET, POST, DELETE', 'cache-control': 'no-store' },
  });
}

async function handleWebSearch(request, url) {
  const query = (url.searchParams.get('q') || '').trim();
  if (!query) return jsonError('Enter a search query.');
  if (query.length > 300) return jsonError('Search queries must be 300 characters or fewer.');
  if (!consumeSearchQuota(request)) {
    return new Response(JSON.stringify({ error: 'Search limit reached. Please wait a minute and try again.' }), {
      status: 429,
      headers: { 'content-type': 'application/json; charset=utf-8', 'retry-after': '60', 'cache-control': 'no-store' },
    });
  }

  const searchUrl = new URL('https://html.duckduckgo.com/html/');
  searchUrl.searchParams.set('q', query);
  let response;
  try {
    response = await fetch(searchUrl, {
      headers: {
        accept: 'text/html',
        'user-agent': 'Mozilla/5.0 (compatible; ATLASWebSearch/1.0)',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return jsonError('The web search provider could not be reached. Please try again shortly.', 502);
  }

  if (!response.ok) {
    return jsonError('The web search provider returned an error. Please try again shortly.', 502);
  }
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > 2_000_000) return jsonError('The web search response was too large to process.', 502);
  const html = await response.text();
  if (html.length > 2_000_000) return jsonError('The web search response was too large to process.', 502);
  return Response.json(
    { query, results: parseSearchResults(html) },
    { headers: { 'cache-control': 'no-store' } }
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });

    try {
      if (url.pathname === '/api/expert-playbook') {
        return await handleExpertPlaybook(request, env, url);
      }
      if (url.pathname === '/api/search' && request.method === 'GET') {
        return await handleWebSearch(request, url);
      }
      if (url.pathname === '/api/memory') {
        return await handleMemory(request, env, url);
      }
      if (url.pathname === '/api/chat-history') {
        return await handleChatHistory(request, env, url);
      }
      const memoryId = url.pathname.match(/^\/api\/memory\/(\d+)$/);
      if (memoryId) return await handleDeleteMemory(request, env, memoryId[1]);
      if (url.pathname === '/api/search') {
        return new Response('Method not allowed', {
          status: 405,
          headers: { allow: 'GET', 'cache-control': 'no-store' },
        });
      }
      return new Response('Not found', { status: 404 });
    } catch (error) {
      console.error('A.T.L.A.S. API error:', error);
      return jsonError('A.T.L.A.S. could not complete that request. Please try again.', 500);
    }
  },
};
