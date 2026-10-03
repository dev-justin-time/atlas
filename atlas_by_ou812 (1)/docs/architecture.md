# Architecture

## Browser application

- **index.html** defines the interface and loads **style.css** and **app.js**.
- **app.js** coordinates chat submission, specialist selection, boot state, and UI state. **voice-input.js** owns browser speech recognition.
- **calendar.js** stores one-time calendar events in browser local storage and imports supported events from `.ics` snapshots; **calendar/controller.js** owns calendar actions and import/review flow.
- **chat.js** builds assistant requests and bounded conversation context; **chat/prompt.js** owns assistant policy, and **chat/errors.js** maps provider failures to actionable messages. It calls **window.websim.chat.completions.create**.
- **modules.js** aggregates the specialist registry and keyword routing; each specialist definition lives in **modules/topics/**. These workflows do not access private business platforms.
- **commands.js** dispatches slash commands to domain handlers in **commands/** (calendar, memory, search, and ROI).
- **ui.js** owns conversation rendering and persistence; focused result renderers live in **ui/**. **voice-input.js** owns browser speech-recognition controls.
- **api.js** wraps the app's backend routes.

## Backend and data

**server.js** handles requests for **/api/search**, **/api/memory**, **/api/chat-history**, and **/api/expert-playbook**. User-specific records are scoped to the authenticated Websim user ID and stored through the Websim **env.DB** binding. The shared **atlas_expert_playbook** table is seeded with common query patterns and decision workflows for all ten experts. The read-only playbook endpoint matches trigger terms in memory and does not persist the visitor's query. Search fetches public DuckDuckGo HTML and returns a limited set of links and snippets.

- Private notes require sign-in and are only returned to their owner.
- Chat messages and assistant text replies are persisted for signed-in users. Voice audio and browser-local feedback preferences are not sent to these routes.
- **/clearhistory** deletes the signed-in user's saved chat transcript.
- **/resetlearning** removes locally stored ratings and preferences for this browser.

## Trust and limits

Search snippets and saved notes are treated as untrusted reference material in assistant prompts. Search results are evidence to inspect, not proof that a claim is true. The app does not claim access to external business systems, private records, or live data unless the user provides it or a search result is shown. Calendar data is local to the current browser; Google/Outlook links and email/WhatsApp links open user-controlled drafts, and no external account is modified or message sent automatically.
