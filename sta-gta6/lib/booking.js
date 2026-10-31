import {
  OPEN,
  CLOSE,
  MAX_HOURS,
  ADVANCE_DAYS,
  RATE,
  BULK_RATE,
  BULK_FROM,
  CONSOLES,
  ZONE,
} from "./config.js";

export const price = (hours, consoleCount) =>
  hours * (hours >= BULK_FROM ? BULK_RATE : RATE) * consoleCount;
export const fmt = (h) => {
  const x = h % 24;
  return `${x % 12 || 12}:00 ${x >= 12 ? "PM" : "AM"}`;
};
export const range = (start, duration) =>
  `${fmt(start)} to ${fmt(start + duration)}`;
export const span = (start, duration) =>
  Array.from({ length: duration }, (_, i) => start + i);
export const addDays = (date, n) => {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// Arena clock: Pakistan time (UTC+5, no DST). Between midnight and closing, we are still in the previous arena day.
export function arenaNow(now = new Date()) {
  const k = new Date(now.getTime() + 5 * 3600 * 1000);
  let date = k.toISOString().slice(0, 10),
    hour = k.getUTCHours();
  if (hour < CLOSE - 24) {
    date = addDays(date, -1);
    hour += 24;
  }
  return { date, hour };
}

// Bookings open on launch day. After launch, the first bookable day is today (arena clock).
export const firstBookableDate = (now = new Date()) => {
  const t = arenaNow(now).date;
  return t < ZONE.launch ? ZONE.launch : t;
};

export const isPast = (date, h, now) => {
  const n = arenaNow(now);
  return date < n.date || (date === n.date && h <= n.hour);
};

export function startOptions({ date, duration, consoles, locks, now }) {
  const taken = new Set(locks.map((l) => `${l.hour}:${l.console}`));
  const out = [];
  for (let s = OPEN; s < CLOSE; s++) {
    let reason = null;
    if (s + duration > CLOSE) reason = "closes";
    else if (isPast(date, s, now)) reason = "past";
    else if (
      span(s, duration).some((h) =>
        consoles.some((c) => taken.has(`${h}:${c}`)),
      )
    )
      reason = "booked";
    out.push({ hour: s, ok: !reason, reason });
  }
  return out;
}

export const lockRows = (date, start, duration, consoles, bookingId) =>
  span(start, duration).flatMap((hour) =>
    consoles.map((console) => ({ date, hour, console, booking_id: bookingId })),
  );

export function validate(
  { name, phone, date, start, duration, consoles },
  now = new Date(),
) {
  if (typeof name !== "string" || name.trim().length < 2 || name.length > 60)
    return "Enter your full name.";
  if (!/^03\d{9}$/.test(phone))
    return "Enter a valid mobile number, e.g. 03XXXXXXXXX.";
  const first = firstBookableDate(now);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    date < first ||
    date > addDays(first, ADVANCE_DAYS)
  )
    return "Choose a valid date.";
  const ids = CONSOLES.map((c) => c.id);
  if (
    !Array.isArray(consoles) ||
    !consoles.length ||
    new Set(consoles).size !== consoles.length ||
    consoles.some((c) => !ids.includes(c))
  )
    return "Choose a console.";
  if (!Number.isInteger(duration) || duration < 1 || duration > MAX_HOURS)
    return "Choose a valid duration.";
  if (!Number.isInteger(start) || start < OPEN || start + duration > CLOSE)
    return "Choose a start time within opening hours.";
  if (isPast(date, start, now)) return "That start time has already passed.";
  return null;
}
