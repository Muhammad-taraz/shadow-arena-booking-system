"use client";
import { useEffect, useState } from "react";
import { range } from "../../lib/booking.js";
const LABEL = {
  pending:
    "We are checking your payment. This usually takes a few minutes during arena hours.",
  approved: "Confirmed. Show your reference at the arena.",
  rejected:
    "We could not verify your payment and your session was released. Please contact us on WhatsApp.",
};
export default function Track() {
  const [ref, setRef] = useState("");
  const [phone, setPhone] = useState("");
  const [b, setB] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("ref");
    if (q) setRef(q);
  }, []);
  async function go(e) {
    e.preventDefault();
    setErr("");
    setB(null);
    const r = await fetch(
      `/api/track?ref=${encodeURIComponent(ref)}&phone=${encodeURIComponent(phone)}`,
    );
    const j = await r.json();
    r.ok ? setB(j.booking) : setErr(j.error);
  }
  return (
    <div className="wrap">
      <form className="panel" onSubmit={go}>
        <h2>Check your booking</h2>
        <p className="sub">
          Enter the reference you received after booking and the mobile number
          you booked with.
        </p>
        <label htmlFor="r">Booking reference</label>
        <input
          id="r"
          type="text"
          required
          placeholder="ARN-XXXXXX"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
        />
        <label htmlFor="p">Mobile number</label>
        <input
          id="p"
          type="tel"
          required
          placeholder="03XXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {err && (
          <p className="err" role="alert">
            {err}
          </p>
        )}
        <button className="btn">Check status</button>
      </form>
      {b && (
        <div className="ticket">
          <div className="in" style={{ paddingTop: 20 }}>
            <span className={"tag " + b.status}>
              {b.status === "pending"
                ? "Under review"
                : b.status === "approved"
                  ? "Confirmed"
                  : "Not verified"}
            </span>
            <h3 style={{ marginTop: 8 }}>{b.ref}</h3>
            <p className="sub">{LABEL[b.status]}</p>
            <div className="line">
              <span>Date</span>
              <b>{b.date}</b>
            </div>
            <div className="line">
              <span>Session</span>
              <b>{range(b.start_hour, b.duration)}</b>
            </div>
            <div className="line">
              <span>Console</span>
              <b>
                {b.consoles.length === 2
                  ? "Both PS5s"
                  : `PS5 ${b.consoles[0] === 1 ? "One" : "Two"}`}
              </b>
            </div>
          </div>
        </div>
      )}
      <p className="note">
        <a href="/">Back to booking</a>
      </p>
    </div>
  );
}
