import { db } from "../../../lib/db.js";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const p = new URL(req.url).searchParams;
  const ref = String(p.get("ref") || "")
      .trim()
      .toUpperCase(),
    phone = String(p.get("phone") || "").replace(/\D/g, "");
  if (!ref || !phone)
    return Response.json(
      { error: "Enter your reference and phone number." },
      { status: 400 },
    );
  const { data } = await db()
    .from("bookings")
    .select("ref,name,date,start_hour,duration,consoles,total,paid_now,status")
    .eq("ref", ref)
    .eq("phone", phone)
    .maybeSingle();
  if (!data)
    return Response.json(
      { error: "No booking found with those details." },
      { status: 404 },
    );
  return Response.json({ booking: data });
}
