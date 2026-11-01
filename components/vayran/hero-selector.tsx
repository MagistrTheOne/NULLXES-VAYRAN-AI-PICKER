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
  const [query, setQuery] = useState("");
  const [localRole, setLocalRole] = useState<Role | "ALL">("ALL");
  const [availableOnly, setAvailableOnly] = useState(false);
  const role = roleFilter ?? localRole;
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
          return (
            <Button
              key={hero.id}
              variant="ghost"
              className="hero-tile"
              aria-label={`${hero.name}${unavailable ? ` — ${unavailable}` : ""}`}
              aria-pressed={selectedId === hero.id}
              isDisabled={Boolean(unavailable) || selectionDisabled}
              onPress={() => onSelect(hero)}
            >
              <HeroPortrait hero={hero} className="hero-monogram" />
              <span className="hero-name">{hero.name}</span>
              <span className="hero-lanes">
                {unavailable ?? (hero.roles.join(" · ") || "Role not listed")}
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
    </section>
  );
}
