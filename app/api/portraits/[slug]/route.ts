import { getHeroProfile } from "@/lib/mlbbdex";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) return new Response(null, { status: 400 });
  try {
    const profile = await getHeroProfile(slug);
    const path = profile.images.portrait ?? profile.images.icon;
    if (!path) return new Response(null, { status: 404 });
    // Only the validated image mapping returned for this exact hero is used.
    return new Response(null, { status: 307, headers: { Location: new URL(path, "https://mlbbdex.com").href, "Cache-Control": "public, max-age=3600" } });
  } catch {
    return new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
