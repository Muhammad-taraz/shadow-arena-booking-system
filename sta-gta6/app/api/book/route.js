import { db } from "../../../lib/db.js";
import { price, validate, lockRows } from "../../../lib/booking.js";
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const bad = (m, s = 400) => Response.json({ error: m }, { status: s });

export async function POST(req) {
  let f;
  try {
    f = await req.formData();
  } catch {
    return bad("Invalid request.");
  }
  let consoles;
  try {
    consoles = JSON.parse(f.get("consoles") || "[]").map(Number);
  } catch {
    return bad("Choose a console.");
  }
  const input = {
    name: String(f.get("name") || "").trim(),
    phone: String(f.get("phone") || "").replace(/\D/g, ""),
    date: String(f.get("date") || ""),
    start: Number(f.get("start")),
    duration: Number(f.get("duration")),
    consoles,
  };
  const problem = validate(input);
  if (problem) return bad(problem);
  const file = f.get("screenshot");
  if (!file || typeof file === "string" || !TYPES[file.type])
    return bad("Upload your payment screenshot (JPG, PNG or WebP).");
  if (file.size < 1 || file.size > 4 * 1024 * 1024)
    return bad("Screenshot must be under 4 MB.");

  const plan = f.get("plan") === "full" ? "full" : "half";
  const method = ["JazzCash", "EasyPaisa", "Bank transfer"].includes(
    f.get("method"),
  )
    ? f.get("method")
    : "JazzCash";
  const sender = String(f.get("sender") || "")
    .trim()
    .slice(0, 60);
  const total = price(input.duration, consoles.length);
  const paid_now = plan === "full" ? total : Math.ceil(total / 2);
  const ref = "ARN-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const path = `${input.date}/${ref}.${TYPES[file.type]}`;
  const sb = db();

  const up = await sb.storage
    .from("payments")
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
    });
  if (up.error) {
    console.error("UPLOAD", up.error);
    return bad("Upload failed. Please try again.", 500);
  }

  const { data: b, error } = await sb
    .from("bookings")
    .insert({
      ref,
      name: input.name,
      phone: input.phone,
      date: input.date,
      start_hour: input.start,
      duration: input.duration,
      consoles,
      total,
      paid_now,
      plan,
      method,
      sender,
      screenshot_path: path,
    })
    .select("id")
    .single();
  if (error) {
    console.error("BOOKING", error);
    await sb.storage.from("payments").remove([path]);
    return bad("Could not save your booking.", 500);
  }

  // One multi-row insert is atomic: if any console-hour is taken, nothing is locked.
  const lock = await sb
    .from("slot_locks")
    .insert(lockRows(input.date, input.start, input.duration, consoles, b.id));
  if (lock.error) {
    await sb.from("bookings").delete().eq("id", b.id);
    await sb.storage.from("payments").remove([path]);
    if (lock.error.code === "23505")
      return bad(
        "Someone just booked part of that session. Please pick another time.",
        409,
      );
    console.error("LOCK", lock.error);
    return bad("Could not reserve the slot.", 500);
  }
  return Response.json({ ref, total, paid_now });
}
