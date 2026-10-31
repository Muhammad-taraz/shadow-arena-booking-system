import { timingSafeEqual } from "node:crypto";
import { db } from "../../../lib/db.js";
export const dynamic = "force-dynamic";
function authed(req) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const a = Buffer.from(req.headers.get("x-admin-key") || ""),
    b = Buffer.from(real);
  return a.length === b.length && timingSafeEqual(a, b);
}
const deny = () => Response.json({ error: "Wrong password" }, { status: 401 });

export async function GET(req) {
  if (!authed(req)) return deny();
  const sb = db();
  const { data } = await sb
    .from("bookings")
    .select("*")
    .order("date")
    .order("start_hour");
  const rows = await Promise.all(
    (data || []).map(async (b) => {
      const s = await sb.storage
        .from("payments")
        .createSignedUrl(b.screenshot_path, 3600);
      return { ...b, shot: s.data?.signedUrl };
    }),
  );
  return Response.json({ rows });
}
export async function PATCH(req) {
  if (!authed(req)) return deny();
  const { id, status } = await req.json();
  const sb = db();
  if (status === "approved") {
    const { data } = await sb
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .eq("status", "pending")
      .select("id");
    if (!data?.length)
      return Response.json(
        { error: "Only pending bookings can be approved." },
        { status: 409 },
      );
  } else if (status === "rejected") {
    await sb.from("bookings").update({ status }).eq("id", id);
    await sb.from("slot_locks").delete().eq("booking_id", id); // frees the console hours
  } else return Response.json({ error: "Bad status" }, { status: 400 });
  return Response.json({ ok: true });
}
