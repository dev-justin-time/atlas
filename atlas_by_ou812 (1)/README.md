# A.T.L.A.S.

A.T.L.A.S. is a browser-based assistant for research, business workflows, and practical analysis. It combines an AI chat interface with specialist prompt modes, database-backed expert playbooks, public web search, private saved notes, chat history, voice input/output, and a deterministic ROI calculator.

## Use

- Enter a request in the terminal, or choose a specialist in the module catalog.
- Use **/help** to list commands.
- Use **/roi investment=12000 monthly_benefit=3500 monthly_cost=500 months=12** for a simple ROI and payback estimate.
- Rate generated answers with **Useful** or **Needs work**. Optional response preferences are kept in this browser and influence later answers. Use **/resetlearning** to clear them.
- Sign in to use private notes and persisted chat history.

## Project

This is a Websim project, not a package-managed application. **index.html** is the entry point; the browser loads plain JavaScript modules and **style.css** directly. There is no build step or package.json. **server.js** handles the project's **/api/** routes in the Websim backend and uses its database binding. Voice replies use a bundled synthetic female sample for a consistent voice, with browser female TTS as a fallback; the sample was generated locally with Flite's SLT voice rather than recorded from a person.

## Documentation

- [Architecture and data flow](docs/architecture.md)
- [Database-backed expert playbooks](docs/expert-playbooks.md)
- [Feedback and adaptive behavior](docs/self-improvement.md)
- [Deployment and automation](docs/deployment.md)

## Important limits

Specialist modes are prompt workflows, not connected business systems or professional services. ROI output is a simple estimate, not financial advice. Feedback adapts prompts on one browser; it does not train or fine-tune a model. Websim's publish/deploy action is host-managed, so this workspace cannot safely enable unattended production deployment without an external target and its credentials.
