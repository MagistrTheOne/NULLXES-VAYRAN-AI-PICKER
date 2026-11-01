"use client";

import { useState } from "react";
import Link from "next/link";
import { Ban, Check, Plus, RotateCcw, Shield, Swords, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLES } from "@/lib/heroes";
import { useCatalog } from "./catalog-provider";
import { useDraft, type Target, type Team } from "./session";
import { HeroSelector } from "./hero-selector";
import { HeroPortrait } from "./hero-portrait";
import { PageHeading } from "./shared";

export function DraftWorkspace() {
  const { heroes } = useCatalog();
  const heroById = new Map(heroes.map(hero => [hero.id, hero]));
  const { draft, dispatch } = useDraft();
  const [target, setTarget] = useState<Target>({
    kind: "pick",
    team: "ally",
    role: "EXP",
  });
  const [mobileTeam, setMobileTeam] = useState<Team>("ally");
  const [confirmClear, setConfirmClear] = useState(false);
  const occupied = new Map<string, string>();
  for (const team of ["ally", "enemy"] as const) {
    for (const role of ROLES) {
      const id = draft.picks[team][role];
      if (id)
        occupied.set(id, `${team === "ally" ? "ALLY" : "ENEMY"} · ${role}`);
    }
    if (target.kind === "pick" || target.team === team) {
      for (const id of draft.bans[team]) occupied.set(id, "BANNED");
    }
  }
  const pickCount =
    Object.values(draft.picks.ally).filter(Boolean).length +
    Object.values(draft.picks.enemy).filter(Boolean).length;
  const banCount = draft.bans.ally.length + draft.bans.enemy.length;
  function selectTarget(next: Target) {
    setTarget(next);
    setMobileTeam(next.team);
  }
  return (
    <div className="draft-page">
      <PageHeading
        eyebrow="COMPETITIVE DRAFT INTELLIGENCE"
        title="Draft Lab"
        description="Build both sides. Understand the decision."
      >
        <div className="draft-heading-actions">
          <Badge variant="outline">FREE DRAFT</Badge>
          <Button
            variant="outline"
            isDisabled={occupied.size === 0}
            onPress={() => setConfirmClear(true)}
          >
            <RotateCcw /> Clear draft
          </Button>
        </div>
      </PageHeading>
      {confirmClear ? (
        <div className="clear-confirmation" role="alert">
          <span>Remove all picks and bans?</span>
          <Button
            size="sm"
            onPress={() => {
              dispatch({ type: "clear" });
              setConfirmClear(false);
            }}
          >
            Clear everything
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => setConfirmClear(false)}
          >
            Cancel
          </Button>
        </div>
      ) : null}
      <div className="draft-context">
        <span>
          <span className="status-dot" />{" "}
          {pickCount === 10 ? "COMPOSITIONS COMPLETE" : "DRAFT IN PROGRESS"}
        </span>
        <span>
          {pickCount} / 10 picks<span className="count-separator">·</span>
          {banCount} bans
        </span>
        <span className="draft-mode-note">
          Manual editor · no enforced turn order
        </span>
      </div>
      <div className="mobile-team-switch" aria-label="Visible team">
        {(["ally", "enemy"] as const).map((team) => (
          <Button
            key={team}
            variant={mobileTeam === team ? "secondary" : "ghost"}
            aria-pressed={mobileTeam === team}
            onPress={() => setMobileTeam(team)}
          >
            {team === "ally" ? "Allied team" : "Enemy team"}
          </Button>
        ))}
      </div>
      <div className="draft-board">
        {(["ally", "enemy"] as const).map((team) => (
          <section
            key={team}
            className={`team-column team-${team} ${mobileTeam === team ? "mobile-active" : ""}`}
            aria-label={team === "ally" ? "Allied team" : "Enemy team"}
          >
            <header className="team-heading">
              {team === "ally" ? <Shield size={16} /> : <Swords size={16} />}
              <h2>{team === "ally" ? "ALLIED TEAM" : "ENEMY TEAM"}</h2>
              <span>
                {Object.values(draft.picks[team]).filter(Boolean).length}/5
              </span>
            </header>
            <div className="team-slots">
              {ROLES.map((role, index) => {
                const id = draft.picks[team][role];
                const hero = id ? heroById.get(id) : undefined;
                const active =
                  target.kind === "pick" &&
                  target.team === team &&
                  target.role === role;
                return (
                  <div
                    className={`draft-slot ${active ? "slot-active" : ""}`}
                    key={role}
                  >
                    <Button
                      variant="ghost"
                      className="slot-select"
                      aria-label={`${hero ? "Replace" : "Select"} ${team === "ally" ? "allied" : "enemy"} ${role}${hero ? ` ${hero.name}` : ""}`}
                      aria-pressed={active}
                      onPress={() => selectTarget({ kind: "pick", team, role })}
                    >
                      {hero ? <HeroPortrait hero={hero} className="slot-portrait" /> : <span className="slot-number">0{index + 1}</span>}
                      <span className="slot-content">
                        <span className="slot-role">{role}</span>
                        <strong>{hero?.name ?? "Select hero"}</strong>
                        <span className="slot-caption">
                          {hero
                            ? "Click to replace"
                            : active
                              ? "Choose from catalog"
                              : "Empty position"}
                        </span>
                      </span>
                      {hero ? <Check size={15} /> : <Plus size={16} />}
                    </Button>
                    {hero ? (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="slot-remove"
                        aria-label={`Remove ${hero.name} from ${team} ${role}`}
                        onPress={() =>
                          dispatch({
                            type: "remove",
                            target: { kind: "pick", team, role },
                          })
                        }
                      >
                        <X />
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="ban-section">
              <div className="ban-heading">
                <span>
                  <Ban size={13} /> BANS
                </span>
                <Button
                  size="xs"
                  variant={
                    target.kind === "ban" && target.team === team
                      ? "secondary"
                      : "ghost"
                  }
                  aria-pressed={target.kind === "ban" && target.team === team}
                  aria-label={`Add ${team === "ally" ? "allied" : "enemy"} ban`}
                  onPress={() => selectTarget({ kind: "ban", team })}
                >
                  <Plus /> Add ban
                </Button>
              </div>
              {draft.bans[team].length ? (
                <div className="ban-list">
                  {draft.bans[team].map((id) => (
                    <Button
                      key={id}
                      variant="outline"
                      size="xs"
                      aria-label={`Remove ban ${heroById.get(id)?.name}`}
                      onPress={() =>
                        dispatch({
                          type: "remove",
                          target: { kind: "ban", team },
                          id,
                        })
                      }
                    >
                      {heroById.get(id) && <HeroPortrait hero={heroById.get(id)!} className="ban-portrait" />}
                      {heroById.get(id)?.name}
                      <X />
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="ban-empty">No heroes banned</p>
              )}
            </div>
          </section>
        ))}
        <section className="selection-column" aria-label="Select hero">
          <header className="selection-heading">
            <div>
              <span className="eyebrow">HERO SELECTION</span>
              <h2>
                {target.team === "ally" ? "Allied" : "Enemy"} <span>/</span>{" "}
                {target.kind === "pick" ? target.role : "Ban selection"}
              </h2>
            </div>
            <span className="selection-instruction">
              {target.kind === "pick" ? "Select to assign" : "Select to ban"}
            </span>
          </header>
          <HeroSelector
            occupied={occupied}
            onSelect={(hero) =>
              dispatch({ type: "select", target, id: hero.id })
            }
          />
        </section>
      </div>
      <div className="draft-bottom">
        <p role="status" aria-live="polite">
          {draft.message}
        </p>
        <Link href="/settings">Source & coverage ↗</Link>
      </div>
    </div>
  );
}
