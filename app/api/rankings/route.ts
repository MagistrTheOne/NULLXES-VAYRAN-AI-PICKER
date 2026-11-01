import { getRankings } from "@/lib/mlbbdex";
export async function GET() {
  try {
    return Response.json({ status: "ready", data: await getRankings() }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch {
    return Response.json({ status: "error", message: "Published rankings are unavailable or failed validation." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
