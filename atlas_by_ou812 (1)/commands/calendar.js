import { saveCalendarEvent } from '../calendar.js';
import { appendCalendarEvent } from '../ui/calendar.js';
import { appendMessage } from '../ui.js';

function escapeCalendarText(value) {
  const slash = String.fromCharCode(92);
  return String(value).replaceAll(slash, slash + slash).replace(/\r\n?/g, '\n').replaceAll('\n', slash + 'n').replaceAll(',', slash + ',').replaceAll(';', slash + ';');
}

function foldCalendarLine(line) {
  const encoder = new TextEncoder();
  const lines = [];
  let current = '';
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 73) {
      lines.push(current);
      current = ' ' + character;
      bytes = size + 1;
    } else {
      current += character;
      bytes += size;
    }
  }
  lines.push(current);
  return lines.join('\r\n');
}

function formatICSTime(date) {
  return date.toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}/, '');
}

function createCalendarEvent(argument) {
  const fields = argument.split('|').map((field) => field.trim());
  if (fields.length < 3 || fields.length > 5) {
    appendMessage('assistant', 'Use /event <title> | <start ISO with timezone> | <end ISO with timezone> | [location] | [description]. Example: /event Design review | 2026-10-04T14:00:00-07:00 | 2026-10-04T14:30:00-07:00 | Studio 2');
    return;
  }
  const [title, startText, endText, location = '', description = ''] = fields;
  const hasTimezone = (value) => /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const start = new Date(startText);
  const end = new Date(endText);
  if (!title || title.length > 200 || !hasTimezone(startText) || !hasTimezone(endText) || !Number.isFinite(start.valueOf()) || !Number.isFinite(end.valueOf()) || end <= start || location.length > 300 || description.length > 1000) {
    appendMessage('assistant', 'Check the event fields: include a title, explicit timezone offsets or Z, an end after the start, and keep location under 300 characters and description under 1,000.');
    return;
  }
  const google = new URL('https://calendar.google.com/calendar/render');
  google.search = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: formatICSTime(start) + '/' + formatICSTime(end), details: description, location });
  const outlook = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  outlook.search = new URLSearchParams({ subject: title, startdt: start.toISOString(), enddt: end.toISOString(), body: description, location });
  const uid = globalThis.crypto?.randomUUID?.() || String(Date.now()) + '-' + Math.random().toString(36).slice(2);
  const savedEvent = { id: uid + '@atlas', title, start: start.toISOString(), end: end.toISOString(), location, description };
  try {
    saveCalendarEvent(savedEvent);
  } catch (error) {
    appendMessage('assistant', error.message || 'Could not save this event on the device.');
    return;
  }
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//A.T.L.A.S.//Calendar Event//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    'UID:' + uid + '@atlas', 'DTSTAMP:' + formatICSTime(new Date()), 'DTSTART:' + formatICSTime(start), 'DTEND:' + formatICSTime(end),
    'SUMMARY:' + escapeCalendarText(title), 'LOCATION:' + escapeCalendarText(location), 'DESCRIPTION:' + escapeCalendarText(description), 'END:VEVENT', 'END:VCALENDAR',
  ];
  const fileName = (title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'calendar-event') + '.ics';
  appendCalendarEvent({ ...savedEvent, start, end, googleUrl: google.href, outlookUrl: outlook.href, icsContent: lines.map(foldCalendarLine).join('\r\n') + '\r\n', fileName });
}

export function createCalendarEventFromFields(event) {
  const fields = [event.title, event.start, event.end, event.location || '', event.description || '']
    .map((value) => String(value).replaceAll('|', ' '));
  createCalendarEvent(fields.join(' | '));
}


export function handleCalendarCommand(command, argument) {
  if (command === 'calendar') {
    window.dispatchEvent(new Event('atlas:open-calendar'));
    return true;
  }
  if (command === 'event') {
    createCalendarEvent(argument);
    return true;
  }
  return false;
}
