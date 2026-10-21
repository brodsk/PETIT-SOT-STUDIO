import { redirect } from "next/navigation";

export default async function LegacyWallPreview({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ work?: string }>;
}) {
  const { locale } = await params;
  const { work } = await searchParams;
  const prefix = locale === "ru" ? "/ru" : "";
  const query = work ? `?work=${encodeURIComponent(work)}` : "";
  redirect(`${prefix}/wall-preview${query}`);
}
