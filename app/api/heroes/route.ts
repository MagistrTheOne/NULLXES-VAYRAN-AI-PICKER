import { getCatalog } from "@/lib/mlbbdex";
export async function GET() {
  try {
    return Response.json({ status: "ready", data: await getCatalog() }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch {
    return Response.json({ status: "error", message: "MLBBDex catalog is unavailable or failed validation. The local identity snapshot remains available." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
