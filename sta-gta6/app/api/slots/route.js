import { db } from "../../../lib/db.js";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const date = new URL(req.url).searchParams.get("date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || ""))
    return Response.json({ locks: [] });
  const { data } = await db()
    .from("slot_locks")
    .select("hour, console")
    .eq("date", date);
  return Response.json({ locks: data || [] });
}
