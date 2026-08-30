import { redirect } from "next/navigation";

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  redirect(q ? `/campanhas?q=${encodeURIComponent(q)}` : "/campanhas");
}
