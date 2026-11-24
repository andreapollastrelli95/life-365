import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ModulePage } from "@/components/ModulePage";
import { MODULES } from "@/modules/pages";

export default async function Page({ params }: { params: Promise<{ module: string }> }) {
  const { module: slug } = await params;
  if (!Object.hasOwn(MODULES, slug)) notFound();
  return (
    <Suspense>
      <ModulePage slug={slug} />
    </Suspense>
  );
}
