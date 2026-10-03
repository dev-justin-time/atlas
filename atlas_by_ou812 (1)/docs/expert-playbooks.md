# Expert Playbooks

A.T.L.A.S. stores shared, curated expert playbook entries in the Websim SQLite database table **atlas_expert_playbook**. Each row belongs to an expert key and an intent and provides a common-query label, trigger terms, a workflow checklist, and value logic. The table is seeded idempotently by the exported schema in **server.js**.

## Runtime flow

1. Specialist mode or keyword routing selects an expert key.
2. The browser requests **GET /api/expert-playbook?expert=<key>&q=<current request>**.
3. The backend normalizes the request in memory, scores stored trigger terms, and returns up to three relevant playbooks. If no term matches, it returns up to three default entries for the selected expert.
4. **chat.js** adds the returned workflow and value checks to the specialist prompt. If the database lookup fails, the assistant still answers using its existing specialist instructions.

The endpoint is read-only. It does not persist or log the visitor's query in an app-owned table. The playbook rows are shared project-authored reference data, not visitor-submitted content, so they do not contain user IDs. Private notes and chat history remain in their existing user-scoped tables.

## Expert coverage

- **LexGuard AI:** contract review and compliance; prioritizes business impact, exposure, deadlines, and counsel review.
- **FiscalNav AI:** deductions and cross-border questions; requires jurisdiction and tax-year facts, and only estimates value from supplied figures.
- **MarketRadar AI:** competitor comparisons and pricing; separates evidence from hypotheses and weighs customer value, confidence, and cost.
- **StratOS AI:** initiative prioritization and roadmaps; considers impact, confidence, effort, time-to-value, dependencies, and downside.
- **OpsFlow AI:** workflows and metrics; focuses on throughput, time saved, error reduction, ownership, and control risk.
- **TalentShield AI:** scorecards and role design; uses consistent job-related criteria and avoids protected-trait inference.
- **NetworkNode AI:** relationship mapping and entity research; ranks evidence and relevance while avoiding sensitive inference.
- **CashPulse AI:** cash runway and scenarios; calculates from supplied inputs, sensitivity, and early-warning thresholds.
- **ChurnShield AI:** churn assessment and retention plans; ties observable signals to an owner, due date, and retention measure.
- **ChainLink AI:** supplier and logistics risk; compares impact, recovery time, mitigation cost, and contingency ownership.

To add an intent, add an **INSERT OR IGNORE** row to the schema seed in **server.js**. Keep trigger terms narrow enough to avoid unrelated matches, and phrase value logic as a decision checklist rather than fabricated data or an automatic external action.
