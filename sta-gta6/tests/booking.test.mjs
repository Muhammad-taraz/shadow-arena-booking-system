import test from "node:test";
import assert from "node:assert/strict";
import {
  price,
  arenaNow,
  isPast,
  startOptions,
  validate,
  range,
  lockRows,
  firstBookableDate,
} from "../lib/booking.js";
import { OPEN, CLOSE, MAX_HOURS, ZONE } from "../lib/config.js";

const at = (iso) => new Date(iso); // ISO with Z; Pakistan = UTC+5
const good = {
  name: "Ali Khan",
  phone: "03001234567",
  date: "2026-11-20",
  start: 14,
  duration: 3,
  consoles: [1],
};
const now = at("2026-11-19T05:00:00Z"); // 10:00 AM PKT on launch day
const early = at("2026-11-01T10:00:00Z"); // before launch

test("pricing: 1-2h at 700, 3h+ at 600 per console-hour", () => {
  assert.equal(price(1, 1), 700);
  assert.equal(price(2, 1), 1400);
  assert.equal(price(3, 1), 1800);
  assert.equal(price(4, 1), 2400);
  assert.equal(price(6, 1), 3600);
  assert.equal(price(3, 2), 3600);
  assert.equal(price(1, 2), 1400);
});
test("pricing is never lower for a longer session", () => {
  for (let h = 1; h < MAX_HOURS; h++) assert.ok(price(h + 1, 1) > price(h, 1));
});
test("arena clock: after midnight still belongs to previous arena day", () => {
  assert.deepEqual(arenaNow(at("2026-11-19T19:30:00Z")), {
    date: "2026-11-19",
    hour: 24,
  });
  assert.deepEqual(arenaNow(at("2026-11-19T08:15:00Z")), {
    date: "2026-11-19",
    hour: 13,
  });
});
test("isPast: current and earlier hours are not bookable", () => {
  assert.equal(isPast("2026-11-19", 15, at("2026-11-19T10:20:00Z")), true);
  assert.equal(isPast("2026-11-19", 16, at("2026-11-19T10:20:00Z")), false);
  assert.equal(isPast("2026-11-20", 14, at("2026-11-19T10:20:00Z")), false);
});
test("first bookable date is launch day before launch, today after", () => {
  assert.equal(firstBookableDate(early), ZONE.launch);
  assert.equal(firstBookableDate(now), "2026-11-19");
  assert.equal(firstBookableDate(at("2026-12-05T10:00:00Z")), "2026-12-05");
  assert.equal(firstBookableDate(at("2026-12-05T20:30:00Z")), "2026-12-05");
});
test("before launch: nothing earlier than launch day is accepted", () => {
  assert.ok(validate({ ...good, date: "2026-11-18" }, early));
  assert.ok(validate({ ...good, date: "2026-11-04" }, early));
  assert.equal(validate({ ...good, date: "2026-11-19" }, early), null);
});
test("after launch: past days rejected, today accepted if time remains", () => {
  const later = at("2026-12-05T10:20:00Z");
  assert.ok(validate({ ...good, date: "2026-12-04" }, later));
  assert.ok(validate({ ...good, date: "2026-12-05", start: 15 }, later));
  assert.equal(
    validate({ ...good, date: "2026-12-05", start: 16 }, later),
    null,
  );
});
test("advance window is 90 days from the first bookable day", () => {
  assert.equal(validate({ ...good, date: "2027-02-17" }, early), null);
  assert.ok(validate({ ...good, date: "2027-02-18" }, early));
});
test("start options respect closing time, past hours and locks", () => {
  const locks = [{ hour: 16, console: 1 }];
  const o = startOptions({
    date: "2026-11-20",
    duration: 3,
    consoles: [1],
    locks,
    now,
  });
  const by = (h) => o.find((x) => x.hour === h);
  assert.equal(by(14).reason, "booked");
  assert.equal(by(17).ok, true);
  assert.equal(by(24).reason, "closes");
  assert.equal(by(23).ok, true);
  const both = startOptions({
    date: "2026-11-20",
    duration: 1,
    consoles: [1, 2],
    locks,
    now,
  });
  assert.equal(both.find((x) => x.hour === 16).ok, false);
  const two = startOptions({
    date: "2026-11-20",
    duration: 1,
    consoles: [2],
    locks,
    now,
  });
  assert.equal(two.find((x) => x.hour === 16).ok, true);
  const today = startOptions({
    date: "2026-11-19",
    duration: 1,
    consoles: [1],
    locks: [],
    now: at("2026-11-19T10:20:00Z"),
  });
  assert.equal(today.find((x) => x.hour === 15).reason, "past");
});
test("validate accepts good input and rejects bad input", () => {
  assert.equal(validate(good, now), null);
  for (const bad of [
    { phone: "12345" },
    { phone: "0300123456" },
    { consoles: [3] },
    { consoles: [1, 1] },
    { consoles: [] },
    { consoles: "x" },
    { duration: 0 },
    { duration: 1.5 },
    { duration: 13 },
    { start: 24, duration: 3 },
    { start: 10 },
    { start: 14.5 },
    { name: "A" },
    { name: 5 },
    { date: "tomorrow" },
  ])
    assert.ok(validate({ ...good, ...bad }, now), JSON.stringify(bad));
  assert.equal(validate({ ...good, start: 23, duration: 3 }, now), null);
  assert.equal(
    validate({ ...good, duration: 12, start: 14, consoles: [1, 2] }, now),
    null,
  );
});
test("lock rows: one per hour per console; range label", () => {
  assert.equal(lockRows("2026-11-20", 14, 3, [1, 2], "x").length, 6);
  assert.equal(range(23, 3), "11:00 PM to 2:00 AM");
});
test("property: start option is ok <=> lock insert would not collide (random bookings)", () => {
  let seed = 7;
  const rnd = (n) => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed % n;
  };
  for (let round = 0; round < 400; round++) {
    const db = new Set();
    const locks = [];
    for (let k = 0; k < rnd(6); k++) {
      const d = 1 + rnd(4),
        s = OPEN + rnd(CLOSE - OPEN - d + 1),
        cs = rnd(3) === 0 ? [1, 2] : [1 + rnd(2)];
      const rows = lockRows("2026-11-20", s, d, cs, "b");
      if (rows.some((r) => db.has(`${r.hour}:${r.console}`))) continue;
      rows.forEach((r) => {
        db.add(`${r.hour}:${r.console}`);
        locks.push({ hour: r.hour, console: r.console });
      });
    }
    const duration = 1 + rnd(6),
      consoles = rnd(3) === 0 ? [1, 2] : [1 + rnd(2)];
    for (const o of startOptions({
      date: "2026-11-20",
      duration,
      consoles,
      locks,
      now,
    })) {
      const fits = o.hour + duration <= CLOSE;
      const collides = lockRows(
        "2026-11-20",
        o.hour,
        duration,
        consoles,
        "n",
      ).some((r) => db.has(`${r.hour}:${r.console}`));
      assert.equal(o.ok, fits && !collides);
    }
  }
});
test("every valid start/duration combination validates and fits opening hours", () => {
  for (let d = 1; d <= MAX_HOURS; d++)
    for (let s = OPEN; s < CLOSE; s++) {
      const ok =
        validate(
          { ...good, start: s, duration: d, date: "2026-11-25" },
          early,
        ) === null;
      assert.equal(ok, s + d <= CLOSE);
    }
});
