import { getAllegato } from "@/lib/data/allegati";

// Solo questi tipi si aprono nel browser; tutto il resto viene scaricato.
const INLINE = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wantDownload = new URL(request.url).searchParams.has("download");
  const found = await getAllegato(id, wantDownload).catch(() => null);
  if (!found) return new Response("File non trovato", { status: 404 });

  const { meta } = found;
  const inline = INLINE.has(meta.mime) && !wantDownload;

  // Cloud: rimanda al link temporaneo firmato; i tipi non sicuri vengono sempre scaricati.
  if (found.tipo === "link") {
    if (!inline && !wantDownload) {
      const again = await getAllegato(id, true).catch(() => null);
      if (again?.tipo === "link") return Response.redirect(again.url, 302);
    }
    return Response.redirect(found.url, 302);
  }

  const ascii = meta.nome.replace(/[^\x20-\x7e]|["\\]/g, "_");
  return new Response(new Uint8Array(found.data), {
    headers: {
      "Content-Type": inline ? meta.mime : "application/octet-stream",
      "Content-Length": String(found.data.length),
      "Content-Disposition":
        `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(meta.nome)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}
