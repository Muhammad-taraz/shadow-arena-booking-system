"use client";
import { useState } from "react";
import { range } from "../../lib/booking.js";
const pkr = (n) => "PKR " + n.toLocaleString("en-PK");
const cons = (c) =>
  c.length === 2 ? "Both PS5s" : c[0] === 1 ? "PS5 One" : "PS5 Two";

const waLink = (b) => {
  const st =
    b.status === "approved"
      ? "CONFIRMED"
      : b.status === "rejected"
        ? "not confirmed because we could not verify the payment"
        : "under review";
  const msg = `Assalam o Alaikum ${b.name}, your Shadow Tournament Arena booking ${b.ref} (${b.date}, ${range(b.start_hour, b.duration)}) is ${st}. Check it anytime: ${window.location.origin}/track?ref=${b.ref}`;
  return `https://wa.me/92${b.phone.slice(1)}?text=${encodeURIComponent(msg)}`;
};

export default function Admin() {
  const [key, setKey] = useState("");
  const [rows, setRows] = useState(null);
  const [tab, setTab] = useState("pending");
  const [day, setDay] = useState("");
  const [err, setErr] = useState("");
  const H = { "x-admin-key": key, "Content-Type": "application/json" };
  async function load(e) {
    e?.preventDefault();
    const r = await fetch("/api/admin", { headers: H });
    const j = await r.json();
    if (!r.ok) return setErr(j.error);
    setErr("");
    setRows(j.rows);
  }
  async function act(id, status) {
    if (
      !confirm(
        status === "approved"
          ? "Approve this booking?"
          : "Reject and release these slots?",
      )
    )
      return;
    const r = await fetch("/api/admin", {
      method: "PATCH",
      headers: H,
      body: JSON.stringify({ id, status }),
    });
    if (!r.ok) alert((await r.json()).error);
    load();
  }
  if (!rows)
    return (
      <div className="wrap admin-login-wrap">
        <form className="panel admin-login" onSubmit={load}>
          <h2>Owner login</h2>
          <p className="sub">Sign in to review and manage arena bookings.</p>
          <label htmlFor="k">Password</label>
          <input
            id="k"
            type="password"
            required
            autoComplete="current-password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          {err && (
            <p className="err" role="alert">
              {err}
            </p>
          )}
          <button className="btn">Open dashboard</button>
        </form>
      </div>
    );
  const list = rows.filter(
    (r) => (tab === "all" || r.status === tab) && (!day || r.date === day),
  );
  const n = (s) => rows.filter((r) => r.status === s).length;
  return (
    <div className="wrap">
      <h2 style={{ marginTop: 20 }}>Bookings</h2>
      <div className="row" style={{ margin: "12px 0" }}>
        {["pending", "approved", "rejected", "all"].map((t) => (
          <button
            key={t}
            className={"opt" + (tab === t ? " on" : "")}
            onClick={() => setTab(t)}
          >
            {t}
            {t !== "all" ? ` (${n(t)})` : ""}
          </button>
        ))}
        <button className="opt" onClick={() => load()}>
          Refresh
        </button>
      </div>
      <label htmlFor="dd">Filter by date</label>
      <input
        id="dd"
        type="date"
        value={day}
        onChange={(e) => setDay(e.target.value)}
      />
      {!list.length && <p className="note">No bookings here.</p>}
      {list.map((b) => (
        <div key={b.id} className="panel" style={{ marginTop: 14 }}>
          <div className="between">
            <b>
              {b.ref} · {b.name}
            </b>
            <span className={"tag " + b.status}>{b.status}</span>
          </div>
          <div className="line">
            <span>When</span>
            <b>
              {b.date}, {range(b.start_hour, b.duration)}
            </b>
          </div>
          <div className="line">
            <span>Console</span>
            <b>{cons(b.consoles)}</b>
          </div>
          <div className="line">
            <span>Contact</span>
            <b>{b.phone}</b>
          </div>
          <div className="line">
            <span>Paid with</span>
            <b>
              {b.method}
              {b.sender ? `, ${b.sender}` : ""}
            </b>
          </div>
          <div className="line">
            <span>Total / paid now</span>
            <b>
              {pkr(b.total)} / {pkr(b.paid_now)} (
              {b.plan === "full" ? "100%" : "50%"})
            </b>
          </div>
          {b.shot && (
            <p className="note">
              <a href={b.shot} target="_blank" rel="noreferrer">
                Open payment screenshot
              </a>
            </p>
          )}
          <div className="row" style={{ marginTop: 12 }}>
            {b.status === "pending" && (
              <button className="btn sm" onClick={() => act(b.id, "approved")}>
                Approve
              </button>
            )}
            {b.status !== "rejected" && (
              <button
                className="btn sm ghost"
                onClick={() => act(b.id, "rejected")}
              >
                Reject and free slots
              </button>
            )}
            <a
              className="btn sm ghost"
              href={waLink(b)}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp customer
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
