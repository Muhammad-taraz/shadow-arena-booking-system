"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ZONE,
  CONSOLES,
  BULK_RATE,
  BULK_FROM,
  MAX_HOURS,
  ADVANCE_DAYS,
} from "../lib/config.js";
import {
  price,
  range,
  startOptions,
  arenaNow,
  firstBookableDate,
  addDays,
  fmt,
} from "../lib/booking.js";

const pkr = (n) => "PKR " + n.toLocaleString("en-PK");
const MODES = [
  { id: "1", label: "PS5 One", note: "Solo session", c: [1] },
  { id: "2", label: "PS5 Two", note: "Solo session", c: [2] },
  { id: "both", label: "Both PS5s", note: "Play with friends", c: [1, 2] },
];
const dLabel = (d, o) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", {
    timeZone: "UTC",
    ...o,
  });
const REASON = { booked: "Booked", past: "Passed", closes: "After close" };

export default function Page() {
  const [now, setNow] = useState(null);
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [mode, setMode] = useState("1");
  const [duration, setDuration] = useState(2);
  const [start, setStart] = useState(null);
  const [locks, setLocks] = useState([]);
  const [plan, setPlan] = useState("half");
  const [f, setF] = useState({
    name: "",
    phone: "",
    method: "JazzCash",
    sender: "",
  });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const today = now ? arenaNow(now).date : "";
  const first = now ? firstBookableDate(now) : "";
  useEffect(() => {
    if (first && (!date || date < first)) setDate(first);
  }, [first, date]);

  const load = useCallback(async () => {
    if (!date) return;
    try {
      const r = await fetch(`/api/slots?date=${date}`, { cache: "no-store" });
      setLocks((await r.json()).locks || []);
    } catch {}
  }, [date]);
  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  const consoles = MODES.find((m) => m.id === mode).c;
  const opts = useMemo(
    () =>
      now && date ? startOptions({ date, duration, consoles, locks, now }) : [],
    [now, date, duration, mode, locks],
  );
  const startOk = opts.some((o) => o.hour === start && o.ok);
  const total = price(duration, consoles.length);
  const payNow = plan === "full" ? total : Math.ceil(total / 2);
  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const quick = first ? [0, 1, 2, 3].map((i) => addDays(first, i)) : [];
  const preLaunch = !!today && today < ZONE.launch;

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (step === 1) {
      if (startOk) setStep(2);
      else setErr("Pick an available start time.");
      return;
    }
    if (!startOk) return setErr("Pick an available start time.");
    if (!file) return setErr("Upload your payment screenshot.");
    if (file.size > 4 * 1024 * 1024)
      return setErr("Screenshot must be under 4 MB.");
    const fd = new FormData();
    Object.entries({
      ...f,
      date,
      start,
      duration,
      plan,
      consoles: JSON.stringify(consoles),
    }).forEach(([k, v]) => fd.append(k, v));
    fd.append("screenshot", file);
    setBusy(true);
    try {
      const res = await fetch("/api/book", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error);
        if (res.status === 409) {
          setStep(1);
          setStart(null);
          load();
        }
      } else {
        setDone({ ...j, date, start, duration, consoles, name: f.name });
        window.scrollTo({ top: 0 });
      }
    } catch {
      setErr("Network problem. Check your connection and try again.");
    }
    setBusy(false);
  }

  const copy = () =>
    navigator.clipboard?.writeText(done.ref).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;

  if (done)
    return (
      <div className="wrap">
        <div className="ticket" style={{ marginTop: 20 }}>
          <div className="pic" />
          <div className="in">
            <h3 className="ok">Reservation received</h3>
            <p className="sub">
              Your session is held while we verify your payment. Keep the
              reference below.
            </p>
            <div className="refbox">
              <span className="note" style={{ margin: 0 }}>
                Your booking reference
              </span>
              <b>{done.ref}</b>
              <button
                type="button"
                className="btn ghost sm"
                style={{ marginTop: 10 }}
                onClick={copy}
              >
                {copied ? "Copied" : "Copy reference"}
              </button>
            </div>
            <div className="line">
              <span>Player</span>
              <b>{done.name}</b>
            </div>
            <div className="line">
              <span>Date</span>
              <b>
                {dLabel(done.date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </b>
            </div>
            <div className="line">
              <span>Session</span>
              <b>{range(done.start, done.duration)}</b>
            </div>
            <div className="line">
              <span>Console</span>
              <b>
                {done.consoles.length === 2
                  ? "Both PS5s"
                  : CONSOLES.find((c) => c.id === done.consoles[0]).label}
              </b>
            </div>
            <div className="line">
              <span>Paid now</span>
              <b>{pkr(done.paid_now)}</b>
            </div>
            <div className="line">
              <span>Pay at the arena</span>
              <b>{pkr(done.total - done.paid_now)}</b>
            </div>
            {f.method === "Bank transfer" ? (
              <p className="note">
                Send <b>{pkr(payNow)}</b> to{" "}
                <b>{process.env.NEXT_PUBLIC_BANK_NAME}</b>, account title{" "}
                <b>{process.env.NEXT_PUBLIC_BANK_TITLE}</b>, IBAN{" "}
                <b>{process.env.NEXT_PUBLIC_BANK_IBAN}</b>.
              </p>
            ) : (
              <p className="note">
                Send <b>{pkr(payNow)}</b> to{" "}
                <b>{process.env.NEXT_PUBLIC_PAY_NUMBER}</b> (
                {process.env.NEXT_PUBLIC_PAY_TITLE}) on {f.method}.
              </p>
            )}{" "}
            <div className="booking-actions">
              <a className="btn" href={`/track?ref=${done.ref}`}>
                Check booking status
              </a>
              {wa && (
                <a
                  className="btn ghost"
                  href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi, I booked ${done.ref} for ${done.date}, ${range(done.start, done.duration)}.`)}`}
                >
                  Message the arena on WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <>
      <header className="hero">
        <nav className="bar">
          <a href="/track">Booking status</a>
        </nav>
        <div className="hero-artwork-frame">
          <img
            className="hero-artwork"
            src="/images/bg.jpeg"
            alt="Shadow Tournament Arena — Victory is earned. Never given. GTA VI advance booking."
            fetchPriority="high"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        </div>
        <div className="inner hero-copy">
          <span className="badge">GTA VI launch reservations</span>
          <h1>Reserve your slot for GTA VI</h1>
          <p>
            Reserve a PS5 and be playing the moment Vice City opens. Open daily{" "}
            {fmt(14)} to {fmt(26)}.
          </p>
          <div className="rates">
            <div className="rate">
              <b>{pkr(price(1, 1))}</b>
              <span>1 hour</span>
            </div>
            <div className="rate">
              <b>{pkr(price(3, 1))}</b>
              <span>3 hours</span>
            </div>
            <div className="rate">
              <b>2 PS5s</b>
              <span>Book one or both</span>
            </div>
          </div>
        </div>
      </header>
      <div className="sec layout">
        <form onSubmit={submit}>
          <div className="steps">
            <button
              type="button"
              className={step === 1 ? "on" : ""}
              onClick={() => setStep(1)}
            >
              1. Session
            </button>
            <button
              type="button"
              className={step === 2 ? "on" : ""}
              disabled={!startOk}
              onClick={() => setStep(2)}
            >
              2. Pay and confirm
            </button>
          </div>
          {!now ? (
            <div className="panel">Loading live availability...</div>
          ) : step === 1 ? (
            <>
              <div className="panel">
                <h2>Date</h2>
                <p className="sub">
                  {preLaunch
                    ? `Bookings open on launch day, ${dLabel(first, { weekday: "long", day: "numeric", month: "long" })}.`
                    : `Pick any day up to ${ADVANCE_DAYS} days ahead.`}
                </p>
                <div className="row">
                  {quick.map((d) => (
                    <button
                      type="button"
                      key={d}
                      className={"opt" + (d === date ? " on" : "")}
                      onClick={() => setDate(d)}
                    >
                      {dLabel(d, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                      <small>
                        {d === ZONE.launch
                          ? "Launch day"
                          : d === today
                            ? "Today"
                            : "\u00a0"}
                      </small>
                    </button>
                  ))}
                </div>
                <label htmlFor="d">Or choose from the calendar</label>
                <input
                  id="d"
                  type="date"
                  value={date}
                  min={first}
                  max={addDays(first, ADVANCE_DAYS)}
                  onChange={(e) =>
                    e.target.value &&
                    e.target.value >= first &&
                    setDate(e.target.value)
                  }
                />
              </div>
              <div className="panel">
                <h2>Console</h2>
                <p className="sub">Choose one PS5, or take both for a group.</p>
                <div className="cons">
                  {MODES.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      className={"opt" + (mode === m.id ? " on" : "")}
                      onClick={() => setMode(m.id)}
                    >
                      <b>{m.label}</b>
                      <small>{m.note}</small>
                    </button>
                  ))}
                </div>
              </div>
              <div className="panel">
                <h2>Duration</h2>
                <p className="sub">
                  From {BULK_FROM} hours every hour costs {pkr(BULK_RATE)} per
                  console.
                </p>
                <div className="row" style={{ alignItems: "center" }}>
                  <div className="stepper">
                    <button
                      type="button"
                      className="opt"
                      aria-label="Fewer hours"
                      disabled={duration <= 1}
                      onClick={() => setDuration(duration - 1)}
                    >
                      -
                    </button>
                    <b>
                      {duration} hr{duration > 1 ? "s" : ""}
                    </b>
                    <button
                      type="button"
                      className="opt"
                      aria-label="More hours"
                      disabled={duration >= MAX_HOURS}
                      onClick={() => setDuration(duration + 1)}
                    >
                      +
                    </button>
                  </div>
                  {[1, 2, 3, 4, 6].map((h) => (
                    <button
                      type="button"
                      key={h}
                      className={"opt" + (duration === h ? " on" : "")}
                      onClick={() => setDuration(h)}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
              <div className="panel">
                <h2>Start time</h2>
                <p className="sub">
                  Only times where your whole session is free can be selected.
                </p>
                <div className="grid">
                  {opts.map((o) => (
                    <button
                      type="button"
                      key={o.hour}
                      disabled={!o.ok}
                      className={
                        "opt" + (o.hour === start && o.ok ? " on" : "")
                      }
                      onClick={() => setStart(o.hour)}
                    >
                      {fmt(o.hour)}
                      <small>{o.ok ? "Free" : REASON[o.reason]}</small>
                    </button>
                  ))}
                </div>
                {!opts.some((o) => o.ok) && (
                  <p className="note">
                    No start time fits on this day. Try fewer hours, another
                    console or another date.
                  </p>
                )}
              </div>
              {err && (
                <p className="err" role="alert">
                  {err}
                </p>
              )}
              <button
                type="button"
                className="btn"
                disabled={!startOk}
                onClick={() => {
                  setErr("");
                  setStep(2);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Continue to payment
              </button>
            </>
          ) : (
            <>
              <div className="panel">
                <h2>Player details</h2>
                <label htmlFor="n">Full name</label>
                <input
                  id="n"
                  type="text"
                  required
                  minLength={2}
                  maxLength={60}
                  value={f.name}
                  onChange={set("name")}
                  autoComplete="name"
                />
                <label htmlFor="p">Mobile number</label>
                <input
                  id="p"
                  type="tel"
                  required
                  pattern="03[0-9]{9}"
                  inputMode="numeric"
                  placeholder="03XXXXXXXXX"
                  value={f.phone}
                  onChange={set("phone")}
                  autoComplete="tel"
                />
                <p className="note">
                  You will need this number with your reference to check your
                  booking.
                </p>
              </div>
              <div className="panel">
                <h2>Payment</h2>
                <p className="sub">
                  Send the amount, then upload your screenshot.
                </p>
                <div
                  className="cons"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  <button
                    type="button"
                    className={"opt" + (plan === "half" ? " on" : "")}
                    onClick={() => setPlan("half")}
                  >
                    <b>50% advance</b>
                    <small>{pkr(Math.ceil(total / 2))} now</small>
                  </button>
                  <button
                    type="button"
                    className={"opt" + (plan === "full" ? " on" : "")}
                    onClick={() => setPlan("full")}
                  >
                    <b>Pay in full</b>
                    <small>{pkr(total)} now</small>
                  </button>
                </div>
                <label>Sent with</label>
                <div className="row">
                  {["JazzCash", "Bank transfer"].map((m) => (
                    <button
                      type="button"
                      key={m}
                      className={"opt" + (f.method === m ? " on" : "")}
                      onClick={() => setF({ ...f, method: m })}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <p className="note">
                  Send <b>{pkr(payNow)}</b> to{" "}
                  <b>{process.env.NEXT_PUBLIC_PAY_NUMBER}</b> (
                  {process.env.NEXT_PUBLIC_PAY_TITLE}).
                </p>
                <label htmlFor="s">Name on the paying account</label>
                <input
                  id="s"
                  type="text"
                  required
                  maxLength={60}
                  value={f.sender}
                  onChange={set("sender")}
                />
                <label htmlFor="f">Payment screenshot</label>
                <input
                  id="f"
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
                {preview && (
                  <img
                    className="preview"
                    src={preview}
                    alt="Payment screenshot preview"
                  />
                )}
              </div>
              {err && (
                <p className="err" role="alert">
                  {err}
                </p>
              )}
              <button className="btn" disabled={busy}>
                {busy
                  ? "Holding your session..."
                  : `Confirm and pay ${pkr(payNow)}`}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setStep(1)}
              >
                Back to session
              </button>
            </>
          )}
        </form>
        <aside className="aside">
          <div className="ticket">
            <div className="pic" />
            <div className="in">
              <h3>Your reservation</h3>
              <div className="line">
                <span>Date</span>
                <b>
                  {date
                    ? dLabel(date, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })
                    : "-"}
                </b>
              </div>
              <div className="line">
                <span>Console</span>
                <b>{MODES.find((m) => m.id === mode).label}</b>
              </div>
              <div className="line">
                <span>Time</span>
                <b>{startOk ? range(start, duration) : "Pick a start time"}</b>
              </div>
              <div className="line">
                <span>Total</span>
                <b>{pkr(total)}</b>
              </div>
              <div className="line">
                <span>Pay now</span>
                <b>{pkr(payNow)}</b>
              </div>
              <div className="line">
                <span>Pay at the arena</span>
                <b>{pkr(total - payNow)}</b>
              </div>
              <p className="note">
                Availability updates automatically. Rejected payments release
                the session.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
