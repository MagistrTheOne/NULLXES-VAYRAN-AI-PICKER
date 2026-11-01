"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ROLES, type Hero, type Role } from "@/lib/heroes";
import { CatalogStatus, useCatalog } from "./catalog-provider";
import { Unavailable } from "./shared";
import { HeroPortrait } from "./hero-portrait";

export function HeroSelector({
  onSelect,
  occupied = new Map<string, string>(),
  selectedId,
  compact = false,
}: {
  onSelect: (hero: Hero) => void;
  occupied?: Map<string, string>;
  selectedId?: string;
  compact?: boolean;
}) {
  const { heroes, status } = useCatalog();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "ALL">("ALL");
  const [availableOnly, setAvailableOnly] = useState(false);
  const filtered = heroes.filter(
    (hero) =>
      hero.name.toLowerCase().includes(query.trim().toLowerCase()) &&
      (role === "ALL" || hero.roles.includes(role)) &&
      (!availableOnly || !occupied.has(hero.id)),
  );
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
              onPress={() => setRole(item)}
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
          Gold coverage is partial. Use All heroes for the full identity
          catalog.
        </p>
      ) : null}
      <div className="hero-grid">
        {filtered.map((hero) => {
          const unavailable = occupied.get(hero.id);
          return (
            <Button
              key={hero.id}
              variant="ghost"
              className="hero-tile"
              aria-label={`${hero.name}${unavailable ? ` — ${unavailable}` : ""}`}
              aria-pressed={selectedId === hero.id}
              isDisabled={Boolean(unavailable)}
              onPress={() => onSelect(hero)}
            >
              <HeroPortrait hero={hero} className="hero-monogram" />
              <span className="hero-name">{hero.name}</span>
              <span className="hero-lanes">
                {unavailable ?? (hero.roles.join(" · ") || "LANE UNVERIFIED")}
              </span>
            </Button>
          );
        })}
      </div>
      {filtered.length === 0 ? (
        <Unavailable
          title="No matching heroes"
          description="Change the search or lane filter. Lane coverage is limited to the published source snapshot."
        />
      ) : null}
      <footer className="catalog-footer">
        <CatalogStatus />
        <span>Portraits: MLBBDex · artwork © Moonton</span>
      </footer>
    </section>
  );
}
