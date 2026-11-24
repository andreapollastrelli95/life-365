import { getSnapshot } from "@/lib/data";
import { todayISO } from "@/lib/domain/dates";

export async function GET() {
  const db = await getSnapshot();
  return new Response(JSON.stringify(db, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="life365-export-${todayISO()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
