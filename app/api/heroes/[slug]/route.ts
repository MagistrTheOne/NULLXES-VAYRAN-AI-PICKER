import { getCatalog, getHeroProfile } from "@/lib/mlbbdex";
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) return Response.json({ status: "error", message: "Invalid hero identifier." }, { status: 400 });
  try {
    const catalog = await getCatalog();
    if (!catalog.heroes.some(hero => hero.providerSlug === slug)) return Response.json({ status: "error", message: "Hero not found in the provider catalog." }, { status: 404 });
    return Response.json({ status: "ready", data: await getHeroProfile(slug) }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch {
    return Response.json({ status: "error", message: "Hero profile is unavailable or failed validation." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
