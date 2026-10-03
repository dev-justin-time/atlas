const STORAGE_KEY = 'atlas-calendar-v1';
const EVENT_LIMIT = 500;

export function getCalendarEvents() {
  try {
    const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(events)) return [];
    return events
      .filter((event) => event && typeof event.id === 'string' && typeof event.title === 'string' && Number.isFinite(Date.parse(event.start)) && Number.isFinite(Date.parse(event.end)))
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  } catch {
    return [];
  }
}

export function saveCalendarEvent(event) {
  const events = getCalendarEvents();
  const existingIndex = events.findIndex((saved) => saved.id === event.id);
  if (existingIndex < 0 && events.length >= EVENT_LIMIT) throw new Error('This device calendar reached its 500-event limit.');
  if (existingIndex < 0) events.push(event);
  else events[existingIndex] = { ...events[existingIndex], ...event };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  return existingIndex >= 0 ? 'updated' : 'added';
}

export function removeCalendarEvent(id) {
  const events = getCalendarEvents();
  const remaining = events.filter((event) => event.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  return remaining.length !== events.length;
}

function decodeICSText(value) {
  return value
    .replace(/\\[nN]/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function parseICSDate(value, timeZone) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/);
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText = '0', minuteText = '0', secondText = '0'] = match;
  const parts = [Number(yearText), Number(monthText), Number(dayText), Number(hourText), Number(minuteText), Number(secondText)];
  const [year, month, day, hour, minute, second] = parts;
  const wallTime = Date.UTC(year, month - 1, day, hour, minute, second);
  if (Number.isNaN(wallTime)) return null;
  if (/Z$/i.test(value)) return new Date(wallTime).toISOString();
  if (timeZone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
      });
      const offsetAt = (epoch) => {
        const values = Object.fromEntries(formatter.formatToParts(new Date(epoch)).map(({ type, value: part }) => [type, Number(part)]));
        return Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second) - epoch;
      };
      let epoch = wallTime - offsetAt(wallTime);
      epoch = wallTime - offsetAt(epoch);
      return new Date(epoch).toISOString();
    } catch {
      return null;
    }
  }
  return new Date(year, month - 1, day, hour, minute, second).toISOString();
}

function parseVEVENT(lines) {
  const fields = {};
  for (const line of lines) {
    const colon = line.indexOf(':');
    if (colon < 1) continue;
    const [rawName, ...rawParameters] = line.slice(0, colon).split(';');
    const name = rawName.toUpperCase();
    const parameters = Object.fromEntries(rawParameters.map((part) => {
      const separator = part.indexOf('=');
      return separator < 0 ? [part.toUpperCase(), ''] : [part.slice(0, separator).toUpperCase(), part.slice(separator + 1).replace(/^"|"$/g, '')];
    }));
    fields[name] = { value: line.slice(colon + 1), parameters };
  }

  if (fields.STATUS?.value.toUpperCase() === 'CANCELLED' || fields.RRULE || !fields.SUMMARY || !fields.DTSTART || !fields.DTEND) return null;
  const timeZone = fields.DTSTART.parameters.TZID;
  const start = parseICSDate(fields.DTSTART.value, timeZone);
  const end = parseICSDate(fields.DTEND.value, fields.DTEND.parameters.TZID || timeZone);
  if (!start || !end || Date.parse(end) <= Date.parse(start)) return null;

  return {
    id: fields.UID?.value || globalThis.crypto?.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2),
    title: decodeICSText(fields.SUMMARY.value).slice(0, 200),
    start,
    end,
    location: decodeICSText(fields.LOCATION?.value || '').slice(0, 300),
    description: decodeICSText(fields.DESCRIPTION?.value || '').slice(0, 1000),
  };
}

export function importCalendarICS(text) {
  if (text.length > 1_000_000) throw new Error('Calendar files must be 1 MB or smaller.');
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const incoming = [];
  let eventLines = null;
  for (const line of lines) {
    if (line.toUpperCase() === 'BEGIN:VEVENT') eventLines = [];
    else if (line.toUpperCase() === 'END:VEVENT' && eventLines) {
      const event = parseVEVENT(eventLines);
      if (event) incoming.push(event);
      eventLines = null;
    } else if (eventLines) eventLines.push(line);
  }

  const current = getCalendarEvents();
  const byId = new Map(current.map((event) => [event.id, event]));
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  for (const event of incoming) {
    const existing = byId.get(event.id);
    if (existing && JSON.stringify(existing) === JSON.stringify(event)) {
      skipped += 1;
      continue;
    }
    if (!existing && byId.size >= EVENT_LIMIT) {
      skipped += 1;
      continue;
    }
    byId.set(event.id, event);
    if (existing) updated += 1;
    else imported += 1;
  }
  if (imported || updated) localStorage.setItem(STORAGE_KEY, JSON.stringify([...byId.values()]));
  return { imported, updated, skipped };
}
