import { redirect } from "next/navigation";

export default async function WallPreviewIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`${locale === "ru" ? "/ru" : ""}/works`);
}
