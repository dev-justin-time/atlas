import { makeAssistantCard } from '../ui.js';

const chatArea = document.getElementById('chatArea');

export function appendCalendarOverview(events, { onCreate, onImport, onRemove, onSyncUp } = {}) {
  const message = makeAssistantCard('calendar-overview');
  const body = document.createElement('div');
  body.className = 'message-body';
  const heading = document.createElement('h2');
  heading.className = 'calendar-event-title';
  heading.textContent = 'DEVICE CALENDAR';
  const note = document.createElement('p');
  note.className = 'calendar-event-note';
  note.textContent = 'Events stay in this browser. Import an .ics snapshot from Google, Outlook, or Apple to sync; no account is connected.';
  body.append(heading, note);
  const form = document.createElement('form');
  form.className = 'calendar-create-form';
  const title = document.createElement('input');
  title.required = true; title.maxLength = 200; title.placeholder = 'Event title'; title.setAttribute('aria-label', 'Event title');
  const times = document.createElement('div'); times.className = 'calendar-time-fields';
  const start = document.createElement('input'); start.type = 'datetime-local'; start.required = true; start.setAttribute('aria-label', 'Event start');
  const end = document.createElement('input'); end.type = 'datetime-local'; end.required = true; end.setAttribute('aria-label', 'Event end');
  times.append(start, end);
  const location = document.createElement('input'); location.maxLength = 300; location.placeholder = 'Location (optional)'; location.setAttribute('aria-label', 'Event location');
  const description = document.createElement('textarea'); description.maxLength = 1000; description.rows = 2; description.placeholder = 'Details (optional)'; description.setAttribute('aria-label', 'Event details');
  const create = document.createElement('button'); create.type = 'submit'; create.textContent = 'Create event';
  form.append(title, times, location, description, create);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const startDate = new Date(start.value); const endDate = new Date(end.value);
    if (!Number.isFinite(startDate.valueOf()) || !Number.isFinite(endDate.valueOf()) || endDate <= startDate) return;
    onCreate?.({ title: title.value.trim(), start: startDate.toISOString(), end: endDate.toISOString(), location: location.value.trim(), description: description.value.trim() });
    form.reset();
  });
  body.appendChild(form);
  const tools = document.createElement('div'); tools.className = 'calendar-actions';
  const importLabel = document.createElement('label'); importLabel.className = 'calendar-import-button'; importLabel.textContent = 'Import .ics';
  const file = document.createElement('input'); file.type = 'file'; file.accept = '.ics,text/calendar'; file.setAttribute('aria-label', 'Import calendar file');
  file.addEventListener('change', async () => {
    const selected = file.files?.[0]; if (!selected) return;
    await onImport?.(selected); file.value = '';
  });
  importLabel.appendChild(file); tools.appendChild(importLabel);
  body.appendChild(tools);
  const syncDetails = document.createElement('details'); syncDetails.className = 'calendar-syncup';
  const syncSummary = document.createElement('summary'); syncSummary.textContent = 'Review an email or WhatsApp update';
  const syncForm = document.createElement('form');
  const sharedText = document.createElement('textarea'); sharedText.required = true; sharedText.maxLength = 12000; sharedText.rows = 4; sharedText.placeholder = 'Paste a message or calendar update…'; sharedText.setAttribute('aria-label', 'Pasted email or WhatsApp update');
  const review = document.createElement('button'); review.type = 'submit'; review.textContent = 'Review with A.T.L.A.S.';
  const syncNote = document.createElement('p'); syncNote.className = 'calendar-event-note'; syncNote.textContent = 'Pasted text is sent to A.T.L.A.S. and may be saved in signed-in chat history. Review the result; no changes are applied.';
  syncForm.append(sharedText, review, syncNote);
  syncForm.addEventListener('submit', (event) => { event.preventDefault(); onSyncUp?.(sharedText.value.trim()); });
  syncDetails.append(syncSummary, syncForm); body.appendChild(syncDetails);
  const visibleEvents = events.filter((item) => Date.parse(item.end) >= Date.now() - 30 * 86400000).slice(0, 40);
  if (!visibleEvents.length) {
    const empty = document.createElement('p'); empty.className = 'calendar-event-note'; empty.textContent = 'No saved events yet.'; body.appendChild(empty);
  } else {
    const list = document.createElement('div'); list.className = 'calendar-event-list';
    for (const item of visibleEvents) {
      const card = document.createElement('article'); card.className = 'calendar-entry';
      const eventTitle = document.createElement('h3'); eventTitle.textContent = item.title;
      const date = document.createElement('p'); date.textContent = new Date(item.start).toLocaleString() + ' - ' + new Date(item.end).toLocaleString();
      card.append(eventTitle, date);
      if (item.location) { const place = document.createElement('p'); place.textContent = item.location; card.appendChild(place); }
      const shareText = [item.title, new Date(item.start).toLocaleString(), item.location, item.description].filter(Boolean).join('\n');
      const actions = document.createElement('div'); actions.className = 'calendar-actions';
      const email = document.createElement('a'); email.href = 'mailto:?subject=' + encodeURIComponent('Calendar: ' + item.title) + '&body=' + encodeURIComponent(shareText); email.textContent = 'Email draft';
      const whatsapp = document.createElement('a'); whatsapp.href = 'https://wa.me/?text=' + encodeURIComponent(shareText); whatsapp.target = '_blank'; whatsapp.rel = 'noopener noreferrer'; whatsapp.textContent = 'WhatsApp draft';
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove'; remove.addEventListener('click', () => onRemove?.(item.id));
      actions.append(email, whatsapp, remove); card.appendChild(actions); list.appendChild(card);
    }
    body.appendChild(list);
  }
  message.appendChild(body); chatArea.appendChild(message); chatArea.scrollTop = chatArea.scrollHeight;
}
export function appendCalendarEvent(event) {
  const message = makeAssistantCard('calendar-event');
  const body = document.createElement('div');
  body.className = 'message-body';
  const title = document.createElement('h2');
  title.className = 'calendar-event-title';
  title.textContent = event.title;
  const date = document.createElement('p');
  date.className = 'calendar-event-date';
  date.textContent = event.start.toLocaleString() + ' - ' + event.end.toLocaleString();
  body.append(title, date);
  if (event.location) {
    const location = document.createElement('p');
    location.className = 'calendar-event-location';
    location.textContent = event.location;
    body.appendChild(location);
  }
  if (event.description) {
    const description = document.createElement('p');
    description.className = 'calendar-event-description';
    description.textContent = event.description;
    body.appendChild(description);
  }
  const actions = document.createElement('div');
  actions.className = 'calendar-actions';
  for (const [label, href] of [['Google Calendar', event.googleUrl], ['Outlook', event.outlookUrl]]) {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label;
    actions.appendChild(link);
  }
  const icsUrl = URL.createObjectURL(new Blob([event.icsContent], { type: 'text/calendar;charset=utf-8' }));
  const icsLink = document.createElement('a');
  icsLink.href = icsUrl;
  icsLink.download = event.fileName;
  icsLink.textContent = 'Apple Calendar / .ics';
  actions.appendChild(icsLink);
  window.setTimeout(() => URL.revokeObjectURL(icsUrl), 60000);
  body.appendChild(actions);
  const note = document.createElement('p');
  note.className = 'calendar-event-note';
  note.textContent = 'Review and save the event in your calendar. A.T.L.A.S. does not access or change calendar accounts.';
  body.appendChild(note);
  message.appendChild(body);
  chatArea.appendChild(message);
  chatArea.scrollTop = chatArea.scrollHeight;
}
