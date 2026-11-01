"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ROLES, RANKS, type Hero, type Role } from "@/lib/heroes";
import { DATA_WINDOWS } from "@/lib/provider-data";
import { useDataWindow, useRank } from "./session";
import { CatalogStatus, useCatalog } from "./catalog-provider";
import { Unavailable } from "./shared";
import { HeroPortrait } from "./hero-portrait";
import { z } from "zod";

const rankMetricsResponse = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ready"),
    data: z.object({
      rank: z.enum(RANKS),
      days: z.number(),
      rows: z.array(z.object({
        heroId: z.string().nullable(),
        winRate: z.number(),
        pickRate: z.number(),
        banRate: z.number(),
      })),
    }),
  }),
  z.object({ status: z.enum(["unsupported", "error"]), message: z.string() }),
]);

type HeroRankMetric = { winRate: number; pickRate: number; banRate: number };
type RankMetricState =
  | { status: "loading" | "unsupported" | "error"; byHero: Map<string, HeroRankMetric> }
  | { status: "ready"; byHero: Map<string, HeroRankMetric> };

export function HeroSelector({
  onSelect,
  occupied = new Map<string, string>(),
  selectedId,
  compact = false,
  roleFilter,
  onRoleFilterChange,
  selectionDisabled = false,
}: {
  onSelect: (hero: Hero) => void;
  occupied?: Map<string, string>;
  selectedId?: string;
  compact?: boolean;
  roleFilter?: Role | "ALL";
  onRoleFilterChange?: (role: Role | "ALL") => void;
  selectionDisabled?: boolean;
}) {
  const { heroes, status } = useCatalog();
  const { rank } = useRank();
  const { days } = useDataWindow();
  const [query, setQuery] = useState("");
  const [localRole, setLocalRole] = useState<Role | "ALL">("ALL");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [rankMetrics, setRankMetrics] = useState<RankMetricState>({
    status: "loading",
    byHero: new Map(),
  });
  const [metricsAttempt, setMetricsAttempt] = useState(0);
  const role = roleFilter ?? localRole;
  const filtered = heroes.filter(
    (hero) =>
      hero.name.toLowerCase().includes(query.trim().toLowerCase()) &&
      (role === "ALL" || hero.roles.includes(role)) &&
      (!availableOnly || !occupied.has(hero.id)),
  );
  useEffect(() => {
    const controller = new AbortController();
    async function loadRankMetrics() {
      try {
        const response = await fetch(`/api/ranks?rank=${encodeURIComponent(rank)}&days=${days}`, {
          signal: controller.signal,
        });
        const parsed = rankMetricsResponse.safeParse(await response.json());
        if (!parsed.success) throw new Error("Rank metrics response could not be verified.");
        const payload = parsed.data;
        if (payload.status !== "ready") {
          setRankMetrics({ status: payload.status, byHero: new Map() });
          return;
        }
        const selectedDays = DATA_WINDOWS.find(value => value === payload.data.days);
        if (payload.data.rank !== rank || selectedDays !== days) {
          throw new Error("Rank metrics do not match the selected filters.");
        }
        setRankMetrics({
          status: "ready",
          byHero: new Map(
            payload.data.rows.flatMap(row =>
              row.heroId ? [[row.heroId, {
                winRate: row.winRate,
                pickRate: row.pickRate,
                banRate: row.banRate,
              }] as const] : [],
            ),
          ),
        });
      } catch {
        if (!controller.signal.aborted) {
          setRankMetrics({ status: "error", byHero: new Map() });
        }
      }
    }
    void loadRankMetrics();
    return () => controller.abort();
  }, [days, metricsAttempt, rank]);
  return (
    <section
      className={`hero-selector ${compact ? "selector-compact" : ""}`}
      aria-label="Hero catalog"
    >
      <div className="catalog-toolbar">
        <div className="search-field">
          <Search size={15} aria-hidden="true" />
          <Input
            aria-label="Search heroes"
            placeholder="Search heroes…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Clear hero search"
              onPress={() => setQuery("")}
            >
              <X />
            </Button>
          ) : null}
        </div>
        <div className="role-filters" aria-label="Filter by lane">
          {(["ALL", ...ROLES] as const).map((item) => (
            <Button
              key={item}
              size="xs"
              variant={role === item ? "secondary" : "ghost"}
              aria-pressed={role === item}
              onPress={() => {
                if (onRoleFilterChange) onRoleFilterChange(item);
                else setLocalRole(item);
              }}
            >
              {item === "ALL" ? "All heroes" : item}
            </Button>
          ))}
        </div>
        <div className="catalog-count">
          <span>
            {filtered.length} heroes<span className="count-separator">/</span>{" "}
            A–Z
          </span>
          <span className="hero-metric-scope">
            {rank} · {days}d · <a href="https://arena.rone.dev" target="_blank" rel="noreferrer">Rone</a>
          </span>
          <label>
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(event) => setAvailableOnly(event.target.checked)}
            />{" "}
            Available only
          </label>
        </div>
      </div>
      {role === "GOLD" && status !== "ready" ? (
        <p className="filter-notice">
          Some heroes do not have a listed role. Select All heroes to browse the full roster.
        </p>
      ) : null}
      <div className="hero-grid">
        {filtered.map((hero) => {
          const unavailable = occupied.get(hero.id);
          const metrics = rankMetrics.status === "ready" ? rankMetrics.byHero.get(hero.id) : undefined;
          const rankDetails = metrics
            ? `WR ${metrics.winRate.toFixed(1)}%, pick ${metrics.pickRate.toFixed(1)}%, ban ${metrics.banRate.toFixed(1)}%`
            : rankMetrics.status === "loading"
              ? "Loading rank rates"
              : rankMetrics.status === "unsupported"
                ? "Rank rates unavailable"
                : rankMetrics.status === "ready"
                  ? "No rank data"
                  : "Rank rates unavailable";
          return (
            <Button
              key={hero.id}
              variant="ghost"
              className="hero-tile"
              aria-label={`${hero.name}${unavailable ? ` — ${unavailable}` : ""} — ${rankDetails}`}
              aria-pressed={selectedId === hero.id}
              isDisabled={Boolean(unavailable) || selectionDisabled}
              onPress={() => onSelect(hero)}
            >
              <HeroPortrait hero={hero} className="hero-monogram" />
              <span className="hero-name">{hero.name}</span>
              <span className="hero-lanes">
                {unavailable ?? (hero.roles.join(" · ") || "Role not listed")}
              </span>
              <span className="hero-rank-metrics">
                {metrics
                  ? `WR ${metrics.winRate.toFixed(1)} · P ${metrics.pickRate.toFixed(1)} · B ${metrics.banRate.toFixed(1)}`
                  : rankMetrics.status === "loading"
                    ? "Loading rates…"
                    : rankDetails}
              </span>
            </Button>
          );
        })}
      </div>
      {filtered.length === 0 ? (
        <Unavailable
          title="No matching heroes"
          description="Try another search or lane. Heroes without a listed role appear under All heroes."
        />
      ) : null}
      {status !== "ready" ? (
        <div className="catalog-status">
          <CatalogStatus />
        </div>
      ) : null}
      {rankMetrics.status === "error" ? (
        <div className="catalog-status" role="status">
          Rank statistics are temporarily unavailable.
          <Button size="xs" variant="outline" onPress={() => setMetricsAttempt(value => value + 1)}>Retry</Button>
        </div>
      ) : rankMetrics.status === "unsupported" ? (
        <div className="catalog-status" role="status">No rank statistics are published for this rank.</div>
      ) : null}
    </section>
  );
}
