"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { HEROES, type Hero } from "@/lib/heroes";
import type { CatalogData, ProviderResult } from "@/lib/provider-data";
import { Button } from "@/components/ui/button";

type CatalogState = { heroes: Hero[]; status: "loading" | "ready" | "error"; data: CatalogData | null; message: string; retry: () => void };
const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<ProviderResult<CatalogData> | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/heroes", { signal: controller.signal });
        const payload: ProviderResult<CatalogData> = await response.json();
        if (!response.ok || payload.status !== "ready" || !Array.isArray(payload.data.heroes)) throw new Error("Catalog unavailable");
        setResult(payload);
      } catch {
        if (!controller.signal.aborted) setResult({ status: "error", message: "Hero details are temporarily unavailable. Showing saved identities; some lane details may be missing." });
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);
  function retry() { setResult(null); setAttempt(value => value + 1); }
  const data = result?.status === "ready" ? result.data : null;
  return <CatalogContext value={{ heroes: data?.heroes ?? HEROES, status: result?.status ?? "loading", data, message: result?.status === "error" ? result.message : "", retry }}>{children}</CatalogContext>;
}
export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("CatalogProvider is required");
  return context;
}
export function CatalogStatus() {
  const { status, message, retry } = useCatalog();
  if (status === "ready") return null;
  return <div className="catalog-provider-status" role="status">{status === "loading" ? "Loading hero details…" : <>{message} <Button size="xs" variant="outline" onPress={retry}>Retry</Button></>}</div>;
}
