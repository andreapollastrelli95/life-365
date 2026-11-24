import { revalidatePath } from "next/cache";
import { addAllegati } from "@/lib/data/allegati";

/** Caricamento file nella modalità locale (nel cloud il browser carica direttamente su Storage). */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const text = (key: string) => {
      const v = form.get(key);
      return typeof v === "string" ? v : undefined;
    };
    const result = await addAllegati(form.getAll("files").filter((f): f is File => f instanceof File), {
      destinazione: text("destinazione") ?? "",
      titolo: text("titolo"),
      categoria: text("categoria"),
      note: text("note"),
    });
    if (!result.ok) return Response.json(result, { status: 400 });
    revalidatePath("/", "layout");
    return Response.json(result);
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: "Caricamento non riuscito. Riprova." }, { status: 500 });
  }
}
