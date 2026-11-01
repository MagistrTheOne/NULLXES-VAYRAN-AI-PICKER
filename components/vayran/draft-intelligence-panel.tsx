"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { Activity, AlertCircle, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ROLES, RANKS } from "@/lib/heroes";
import { DATA_WINDOWS, type DraftAnalysisData } from "@/lib/provider-data";
import { analyzeTacticalEvidence, type LaneEvidence } from "@/lib/draft-tactics";
import { useCatalog } from "./catalog-provider";
import { useDataWindow, useDraft, useRank } from "./session";
import { SynergyPanel } from "./synergy-panel";
import { z } from "zod";

const analysisResponse = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ready"),
    data: z.object({
      rank: z.enum(RANKS),
      days: z.number().refine(
        (value): value is (typeof DATA_WINDOWS)[number] => DATA_WINDOWS.some(day => day === value),
      ),
      fetchedAt: z.string(),
      populationNote: z.string(),
      rankData: z.object({
        rows: z.array(z.object({
          heroId: z.string().nullable(),
          providerId: z.number(),
          name: z.string(),
          winRate: z.number().min(0).max(100),
          pickRate: z.number().min(0).max(100),
          banRate: z.number().min(0).max(100),
        })),
        fetchedAt: z.string(),
      }),
      synergyPairs: z.array(z.object({
        allyId: z.string(),
        heroId: z.string(),
        delta: z.number().min(-100).max(100),
        relationship: z.enum(["positive", "negative"]),
        recordUpdatedAt: z.string().nullable(),
        sourceUrl: z.string(),
      })),
      unavailableSynergyHeroIds: z.array(z.string()),
      timelines: z.array(z.object({
        heroId: z.string(),
        role: z.enum(ROLES),
        winRate: z.number().min(0).max(100),
        updatedAt: z.string().nullable(),
        durations: z.array(z.object({
          timeMin: z.number(),
          timeMax: z.number().nullable(),
          winRate: z.number().min(0).max(100),
        })),
      })),
      counters: z.array(z.object({
        mainHeroId: z.string(),
        counterHeroId: z.string(),
        mainTeam: z.enum(["ally", "enemy"]),
        counterTeam: z.enum(["ally", "enemy"]),
        relationship: z.enum(["counter", "negative"]),
        impact: z.number().min(-100).max(100),
        updatedAt: z.string().nullable(),
      })),
      unavailableTimelineHeroIds: z.array(z.string()),
      unavailableCounterHeroIds: z.array(z.string()),
    }),
  }),
  z.object({ status: z.enum(["unsupported", "error"]), message: z.string() }),
]);

type AnalysisState =
  | { status: "idle" }
  | {
      status: "ready";
      requestKey: string;
      data: Omit<DraftAnalysisData, "rankData"> & {
        rankData: Pick<DraftAnalysisData["rankData"], "rows" | "fetchedAt">;
      };
    }
  | { status: "unsupported" | "error"; requestKey: string; message: string }
  | { status: "loading"; requestKey: string };

const phases = [
  { label: "EARLY", detail: "0–8 min", includes: (duration: { timeMin: number; timeMax: number | null }) => duration.timeMin >= 0 && duration.timeMax !== null && duration.timeMax <= 8 },
  { label: "MID", detail: "8–15 min", includes: (duration: { timeMin: number; timeMax: number | null }) => duration.timeMin >= 8 && duration.timeMax !== null && duration.timeMax <= 15 },
  { label: "LATE", detail: "15+ min", includes: (duration: { timeMin: number; timeMax: number | null }) => duration.timeMin >= 15 },
] as const;
const detailTabs = ["OVERVIEW", "GAME PLAN", "MATCHUPS", "DATA"] as const;
type DetailTab = (typeof detailTabs)[number];

function percentage(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function advantageIndex(allyAverage: number | null, enemyAverage: number | null) {
  if (allyAverage === null || enemyAverage === null) return null;
  return Math.max(0, Math.min(100, 50 + (allyAverage - enemyAverage) / 2));
}

export function DraftIntelligencePanel() {
  const { draft } = useDraft();
  const { rank } = useRank();
  const { days, setDays } = useDataWindow();
  const { heroes } = useCatalog();
  const [result, setResult] = useState<AnalysisState>({ status: "idle" });
  const [attempt, setAttempt] = useState(0);
  const [activeTab, setActiveTab] = useState<DetailTab>("OVERVIEW");
  const pickedCount =
    Object.values(draft.picks.ally).filter(Boolean).length +
    Object.values(draft.picks.enemy).filter(Boolean).length;
  const payload = JSON.stringify({ rank, days, picks: draft.picks, bans: draft.bans });
  const heroName = (id: string) => heroes.find(hero => hero.id === id)?.name ?? id;

  useEffect(() => {
    if (!pickedCount) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/draft-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          signal: controller.signal,
        });
        let responseBody: unknown;
        try {
          responseBody = await response.json();
        } catch {
          throw new Error(`Draft analysis returned an unreadable response (HTTP ${response.status}).`);
        }
        const parsed = analysisResponse.safeParse(responseBody);
        if (!parsed.success) {
          throw new Error("Draft analysis response did not match the expected data contract.");
        }
        if (parsed.data.status !== "ready") {
          setResult({ status: parsed.data.status, requestKey: payload, message: parsed.data.message });
          return;
        }
        if (!response.ok) throw new Error(`Draft analysis failed (HTTP ${response.status}).`);
        if (parsed.data.data.rank !== rank || parsed.data.data.days !== days) {
          throw new Error("Draft analysis returned data for a different rank or statistics window.");
        }
        setResult({ status: "ready", requestKey: payload, data: parsed.data.data });
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setResult({
            status: "error",
            requestKey: payload,
            message: error instanceof Error ? error.message : "Draft analysis failed unexpectedly.",
          });
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [attempt, days, payload, pickedCount, rank]);

  const visibleResult: AnalysisState = !pickedCount
    ? { status: "idle" }
    : result.status === "idle" || ("requestKey" in result && result.requestKey !== payload)
      ? { status: "loading", requestKey: payload }
      : result;
  const data = visibleResult.status === "ready" ? visibleResult.data : null;
  const timelineUpdatedAt = data
    ? [...new Set(data.timelines.flatMap(timeline => timeline.updatedAt ? [timeline.updatedAt] : []))]
    : [];
  const rowsById = new Map(
    data?.rankData.rows.flatMap(row => row.heroId ? [[row.heroId, row] as const] : []) ?? [],
  );
  const summary = (team: "ally" | "enemy") => {
    const picks = ROLES.flatMap(role => {
      const id = draft.picks[team][role];
      return id ? [{ role, id }] : [];
    });
    const rates = picks.flatMap(pick => {
      const row = rowsById.get(pick.id);
      return row ? [row.winRate] : [];
    });
    const rankRows = picks.flatMap(pick => {
      const row = rowsById.get(pick.id);
      return row ? [row] : [];
    });
    const knownRoleFits = picks.flatMap(pick => {
      const hero = heroes.find(candidate => candidate.id === pick.id);
      return hero?.roles.length ? [hero.roles.includes(pick.role)] : [];
    });
    return {
      picked: picks.length,
      rated: rates.length,
      average: rates.length ? rates.reduce((total, rate) => total + rate, 0) / rates.length : null,
      averagePickRate: rankRows.length ? rankRows.reduce((total, row) => total + row.pickRate, 0) / rankRows.length : null,
      averageBanRate: rankRows.length ? rankRows.reduce((total, row) => total + row.banRate, 0) / rankRows.length : null,
      roleFits: knownRoleFits.filter(Boolean).length,
      knownRoles: knownRoleFits.length,
    };
  };
  const allySummary = summary("ally");
  const enemySummary = summary("enemy");
  const draftScore = advantageIndex(allySummary.average, enemySummary.average);
  const baselineDifference = allySummary.average !== null && enemySummary.average !== null
    ? allySummary.average - enemySummary.average
    : null;
  const phaseObservations = (phase: typeof phases[number]) => data?.timelines.flatMap(timeline =>
    timeline.durations
      .filter(phase.includes)
      .map(duration => ({
        team: Object.values(draft.picks.ally).includes(timeline.heroId) ? "A" : "E",
        heroId: timeline.heroId,
        role: timeline.role,
        timeMin: duration.timeMin,
        timeMax: duration.timeMax,
        timeLabel: duration.timeMax === null
          ? `${duration.timeMin}+`
          : `${duration.timeMin}–${duration.timeMax}`,
        winRate: duration.winRate,
      })),
  ) ?? [];
  const bestSynergy = (team: "ally" | "enemy") => {
    if (!data) return null;
    const picked = new Set(Object.values(draft.picks[team]).filter((id): id is string => Boolean(id)));
    return data.synergyPairs
      .filter(pair => picked.has(pair.allyId) && picked.has(pair.heroId) && pair.relationship === "positive" && pair.delta > 0)
      .sort((left, right) => right.delta - left.delta)[0] ?? null;
  };
  const teams = [
    { key: "ally", label: "ALLIED TEAM", summary: allySummary, score: draftScore },
    { key: "enemy", label: "ENEMY TEAM", summary: enemySummary, score: draftScore === null ? null : 100 - draftScore },
  ] as const;
  const tactical = data ? analyzeTacticalEvidence(draft.picks, data) : null;
  const gankCandidate = tactical?.gankComparisonComplete && tactical.gankCandidates.length === 1
    ? tactical.gankCandidates[0]
    : null;
  const laneName = (lane: LaneEvidence) => `${lane.role} · ${heroName(lane.enemyHeroId)}`;
  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const currentIndex = detailTabs.indexOf(activeTab);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextTab = detailTabs[(currentIndex + direction + detailTabs.length) % detailTabs.length];
    setActiveTab(nextTab);
    document.getElementById(`draft-tab-${nextTab.toLowerCase().replace(" ", "-")}`)?.focus();
  }
  const completionLabel = pickedCount === 10
    ? "FULL DRAFT ANALYSIS"
    : pickedCount > 0
      ? "PROVISIONAL ANALYSIS"
      : "AWAITING PICKS";

  return (
    <section className="draft-intelligence-panel" aria-label="Draft intelligence">
      <div className="draft-summary-status">
        <span className="eyebrow">{completionLabel}</span>
        <strong>{pickedCount}<span>/10</span></strong>
        <small>{visibleResult.status === "loading"
          ? "Updating analysis"
          : visibleResult.status === "error" || visibleResult.status === "unsupported"
            ? "Analysis unavailable"
            : pickedCount === 10
              ? "Full draft"
              : pickedCount
                ? "Provisional"
                : "Select heroes"}</small>
      </div>
      <div className="draft-summary-teams">
        <div className="draft-summary-team team-ally">
          <span>ALLIED TEAM</span>
          <strong
            key={draftScore === null ? "ally-unavailable" : `ally-${draftScore.toFixed(1)}`}
            className="draft-summary-score"
          >
            {draftScore === null ? "—" : draftScore.toFixed(1)}
          </strong>
          <small>Draft index</small>
        </div>
        <span className="draft-summary-vs" aria-hidden="true">VS</span>
        <div className="draft-summary-team team-enemy">
          <span>ENEMY TEAM</span>
          <strong
            key={draftScore === null ? "enemy-unavailable" : `enemy-${(100 - draftScore).toFixed(1)}`}
            className="draft-summary-score"
          >
            {draftScore === null ? "—" : (100 - draftScore).toFixed(1)}
          </strong>
          <small>Draft index</small>
        </div>
        <div className="draft-score-track" role="img" aria-label={draftScore === null
          ? "Draft comparison unavailable until both teams have rank data."
          : `Allied draft index ${draftScore.toFixed(1)} of 100; enemy draft index ${(100 - draftScore).toFixed(1)} of 100. Not a win probability.`}>
          {draftScore === null
            ? <span className="draft-score-pending" />
            : <>
                <span style={{ width: `${draftScore}%` }} />
                <span style={{ width: `${100 - draftScore}%` }} />
              </>}
        </div>
      </div>
      <div className="draft-summary-phases" aria-label="Phase advantage is unavailable">
        {phases.map(phase => (
          <div className="draft-summary-phase" key={phase.label}>
            <span>{phase.label}</span>
            <strong>—</strong>
            <small>Unavailable</small>
          </div>
        ))}
      </div>
      <details className="draft-details">
        <summary>Details <span>{rank} · {days}d</span></summary>
        <div className="draft-details-popover">
          <div
            className="draft-details-tabs"
            role="tablist"
            aria-label="Draft analysis details"
            onKeyDown={onTabKeyDown}
          >
            {detailTabs.map(tab => {
              const id = `draft-tab-${tab.toLowerCase().replace(" ", "-")}`;
              return (
                <button
                  key={tab}
                  id={id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  aria-controls="draft-details-panel"
                  tabIndex={activeTab === tab ? 0 : -1}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              );
            })}
          </div>
          <div id="draft-details-panel" role="tabpanel" aria-labelledby={`draft-tab-${activeTab.toLowerCase().replace(" ", "-")}`}>
            {activeTab === "OVERVIEW" ? (
              <>
                <section className="draft-matchup-summary" aria-label="Draft score overview">
                  <div className="draft-summary-heading">
                    <div>
                      <span className="eyebrow">{completionLabel}</span>
                      <p>{pickedCount}/10 picks</p>
                    </div>
                  </div>
                  <div className="draft-score-grid">
                    {teams.map(team => (
                      <div className="draft-score-card" key={team.key}>
                        <span>{team.label}</span>
                        <strong>{team.score === null ? "—" : `${team.score.toFixed(1)}/100`}</strong>
                        <small>Descriptive draft index · not win probability</small>
                        <small>Mean selected-hero WR {percentage(team.summary.average)} · {team.summary.rated}/{team.summary.picked} rated</small>
                        <small>Mean pick / ban rate {percentage(team.summary.averagePickRate)} / {percentage(team.summary.averageBanRate)}</small>
                        <small>Catalog-listed role fit {team.summary.roleFits}/{team.summary.knownRoles} known · {team.summary.picked}/5 slots assigned</small>
                      </div>
                    ))}
                  </div>
                  <p className="draft-integrity-note">
                    The index is available only when both teams have rank-scoped WR data. It compares the unweighted means of rated selected heroes; it is not a match-outcome estimate. Synergy, counters and phase records are separate observations.
                  </p>
                  <p className="draft-score-explanation">
                    {baselineDifference === null
                      ? pickedCount === 0
                        ? "Select heroes from both teams to begin a rank-scoped comparison."
                        : visibleResult.status === "loading"
                          ? "Loading rank-scoped evidence for the current draft."
                          : "A comparable rank-scoped baseline is not currently available for both teams."
                      : Math.abs(baselineDifference) < 0.05
                        ? "The available mean hero baselines are level; this does not predict the match result."
                        : `${baselineDifference > 0 ? "Allied" : "Enemy"} selected heroes lead the descriptive mean WR baseline by ${Math.abs(baselineDifference).toFixed(1)} percentage points. This is not a match-outcome prediction.`}
                  </p>
                </section>
                {visibleResult.status === "loading" ? <p role="status">Recalculating rank-scoped data…</p> : null}
                {visibleResult.status === "idle" ? <p className="muted-copy">Select a hero to load real rank-scoped statistics.</p> : null}
                {visibleResult.status === "unsupported" || visibleResult.status === "error" ? (
                  <div className="draft-analysis-error" role="status">
                    <AlertCircle aria-hidden="true" />
                    <p>{visibleResult.message}</p>
                    {visibleResult.status === "error" ? (
                      <Button size="xs" variant="outline" onPress={() => {
                        setResult({ status: "loading", requestKey: payload });
                        setAttempt(value => value + 1);
                      }}>Retry</Button>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}

            {activeTab === "GAME PLAN" ? (
              <section className="draft-tactical-plan" aria-label="Tactical game plan">
                <div className="draft-module-heading">
                  <Activity aria-hidden="true" />
                  <div><h3>Tactical game plan</h3><p>Draft evidence only · no live map state</p></div>
                </div>
                {!data || !tactical ? (
                  <p className="muted-copy">{visibleResult.status === "loading" ? "Waiting for current draft evidence." : "Insufficient evidence for a draft-specific plan."}</p>
                ) : (
                  <>
                    <div className="draft-tactical-summary">
                      <span>GANK PRIORITY</span>
                      <strong>{gankCandidate
                        ? laneName(gankCandidate)
                        : tactical.gankComparisonComplete && tactical.gankCandidates.length > 1
                          ? "Several candidates · no unique priority"
                          : tactical.gankComparisonComplete
                            ? "No evidence-ranked lane"
                            : "Insufficient evidence"}</strong>
                      <small>{gankCandidate
                        ? `${heroName(gankCandidate.allyHeroId)} has a direct counter record and a Jungle/Roam pair record.`
                        : tactical.gankComparisonComplete && tactical.gankCandidates.length > 1
                          ? "Available pair records support more than one lane; they do not establish which target is safer."
                          : tactical.gankComparisonComplete
                            ? "No selected lane has both direct counter evidence and a Jungle/Roam pair record."
                            : "Complete 5v5 counter coverage and allied pair records are required before comparing target lanes."}</small>
                    </div>
                    <div className="draft-plan-grid">
                      {phases.map(phase => {
                        const threat = tactical.enemyThreats[0];
                        const why = phase.label === "EARLY"
                          ? gankCandidate
                            ? `${heroName(gankCandidate.allyHeroId)} has a +${gankCandidate.counter?.impact.toFixed(2)} pp direct counter signal against ${heroName(gankCandidate.enemyHeroId)} and a recorded allied pair.`
                            : "The available selected-pair records do not identify a unique early gank target."
                          : phase.label === "MID"
                            ? threat
                              ? `Rone lists ${heroName(threat.counterHeroId)} against ${heroName(threat.mainHeroId)} (+${threat.impact.toFixed(2)} pp).`
                              : "No selected opposing-hero counter record identifies a specific mid-game threat."
                            : "The available sources contain no objective damage, zone-control or live team-position data.";
                        const action = phase.label === "EARLY"
                          ? gankCandidate ? "Review a conditional gank window" : "Do not force a draft-ranked gank"
                          : phase.label === "MID"
                            ? threat ? "Track the recorded counter threat" : "Rotate only on a confirmed map window"
                            : "Require live confirmation before Lord";
                        const target = phase.label === "EARLY"
                          ? gankCandidate ? laneName(gankCandidate) : "EXP · MID · GOLD"
                          : phase.label === "MID" && threat
                            ? `${heroName(threat.counterHeroId)} vs ${heroName(threat.mainHeroId)}`
                            : phase.label === "MID" ? "Map rotations" : "Lord area";
                        return (
                          <article className="draft-tactic-card" key={phase.label}>
                            <span>{phase.label}</span>
                            <strong>{action}</strong>
                            <small><b>Target</b> {target}</small>
                            <small><b>Why</b> {why}</small>
                            <small><b>Condition</b> Confirm wave state and enemy positions in game; check actual escape tools before committing.</small>
                            <small><b>Risk</b> Draft statistics do not show live positions, waves, levels or ability readiness.</small>
                          </article>
                        );
                      })}
                    </div>
                    <div className="draft-plan-grid draft-objective-grid">
                      <article className="draft-tactic-card">
                        <span>TURTLE</span>
                        <strong>Set up only with verified lane priority</strong>
                        <small><b>Action</b> Check nearby waves and confirm Mid/Roam rotation before contesting.</small>
                        <small><b>Why</b> Draft records do not establish objective speed or contest strength.</small>
                        <small><b>Risk</b> Disengage if lanes cannot arrive first or the enemy Jungler is untracked.</small>
                      </article>
                      <article className="draft-tactic-card">
                        <span>LORD</span>
                        <strong>Do not start from draft score alone</strong>
                        <small><b>Action</b> Verify enemy positions and allied readiness before entering the area.</small>
                        <small><b>Why</b> No live zone-control, damage or objective-state data is connected.</small>
                        <small><b>Risk</b> Enemy initiation and arrival timing are unknown to VAYRAN.</small>
                      </article>
                    </div>
                    <section className="draft-gank-section" aria-label="Lane gank evidence">
                      <h4>Lane checks</h4>
                      {tactical.lanes.length ? tactical.lanes.map(lane => {
                        const supported = tactical.gankCandidates.includes(lane);
                        return (
                          <article className="draft-lane-check" key={lane.role}>
                            <span>{laneName(lane)}</span>
                            <strong>{supported ? "Counter + pair evidence" : "Insufficient evidence"}</strong>
                            <small>
                              {lane.counter
                                ? `${heroName(lane.allyHeroId)} counter signal: +${lane.counter.impact.toFixed(2)} pp.`
                                : "No selected direct counter record for this lane."}
                              {lane.jungleSynergy
                                ? ` Jungle pair: +${lane.jungleSynergy.delta.toFixed(2)} pp.`
                                : lane.roamSynergy
                                  ? ` Roam pair: +${lane.roamSynergy.delta.toFixed(2)} pp.`
                                  : " No selected Jungle/Roam pair record."}
                            </small>
                          </article>
                        );
                      }) : <p className="muted-copy">Assign both teams&apos; EXP, MID or GOLD hero to compare a lane.</p>}
                    </section>
                    <section className="draft-gank-section" aria-label="Selected enemy threats">
                      <h4>Enemy threats</h4>
                      {tactical.enemyThreats.length ? tactical.enemyThreats.slice(0, 3).map(signal => (
                        <article className="draft-lane-check" key={`${signal.mainHeroId}-${signal.counterHeroId}`}>
                          <span>{heroName(signal.counterHeroId)} vs {heroName(signal.mainHeroId)}</span>
                          <strong>+{signal.impact.toFixed(2)} pp</strong>
                          <small>Provider counter observation; check the actual matchup and positioning in game.</small>
                        </article>
                      )) : <p className="muted-copy">No positive selected enemy counter signal is present in returned records.</p>}
                    </section>
                    <p className="draft-integrity-note">
                      Tactical prompts are conditional. Hero skills, crowd control, mobility, cooldowns, live map state and objective damage are not verified by the connected data.
                    </p>
                  </>
                )}
              </section>
            ) : null}

            {activeTab === "MATCHUPS" ? (
              <>
                <section className="draft-counter-section" aria-label="Selected counter signals">
                  <div className="draft-module-heading">
                    <Swords aria-hidden="true" />
                    <div><h3>Matchup signals</h3><p>Directional provider observations</p></div>
                  </div>
                  {data?.counters.length ? (
                    <ul className="draft-counter-list">
                      {data.counters.map((signal, index) => (
                        <li key={`${signal.mainHeroId}-${signal.counterHeroId}-${index}`}>
                          <span>{heroName(signal.counterHeroId)} vs {heroName(signal.mainHeroId)}</span>
                          <strong>{signal.impact > 0 ? "+" : ""}{signal.impact.toFixed(2)} pp</strong>
                          <small>
                            {signal.relationship === "counter" ? "Counter relation" : "Negative relation"} · {signal.mainTeam === "ally" ? "allied" : "enemy"} hero record
                            {signal.updatedAt ? ` · updated ${new Date(signal.updatedAt).toLocaleDateString()}` : ""}
                          </small>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="muted-copy">{data ? "No selected opposing-hero pair is listed in the available counter records." : "Counter evidence is unavailable until the current analysis completes."}</p>}
                  <p className="draft-integrity-note">Values are individual provider-reported percentage-point signals. They are not added into a team advantage.</p>
                </section>
                <div className="draft-matchup-signals" aria-label="Selected teammate synergy evidence">
                  {teams.map(team => {
                    const synergy = bestSynergy(team.key);
                    return (
                      <div className="draft-signal-card" key={team.key}>
                        <span>{team.label} · PAIR EVIDENCE</span>
                        <strong>{synergy
                          ? `${heroName(synergy.allyId)} + ${heroName(synergy.heroId)}`
                          : "No selected pair signal"}</strong>
                        <small>{synergy
                          ? `${synergy.delta > 0 ? "+" : ""}${synergy.delta.toFixed(2)} pp · strongest individual pair`
                          : !data
                            ? "Awaiting analysis"
                            : data.unavailableSynergyHeroIds.length
                              ? "Pair data unavailable for some selected heroes"
                              : "No positive selected-pair record returned"}</small>
                      </div>
                    );
                  })}
                </div>
                <SynergyPanel />
              </>
            ) : null}

            {activeTab === "DATA" ? (
              <>
                <label className="draft-window-control">
                  Statistics window
                  <NativeSelect value={days} onChange={event => {
                    const next = DATA_WINDOWS.find(day => day === Number(event.target.value));
                    if (next) setDays(next);
                  }}>
                    {DATA_WINDOWS.map(day => <NativeSelectOption key={day} value={day}>{day} days</NativeSelectOption>)}
                  </NativeSelect>
                </label>
                {visibleResult.status === "error" || visibleResult.status === "unsupported" ? (
                  <div className="draft-analysis-error" role="status">
                    <AlertCircle aria-hidden="true" />
                    <p>{visibleResult.message}</p>
                  </div>
                ) : null}
                {data ? (
                  <>
                    <p className="draft-data-provenance">{rank} · {days}-day hero data · retrieved {new Date(data.rankData.fetchedAt).toLocaleString()}</p>
                    <p className="draft-integrity-note">{data.populationNote}</p>
                    <p className="draft-integrity-note">Match sample counts and statistics patch metadata are not supplied by the provider.</p>
                    <a className="draft-source-credit" href="https://arena.rone.dev" target="_blank" rel="noreferrer">Data source: Rone Arena</a>
                    <section className="draft-phase-section" aria-label="Per-hero game phase observations">
                      <div className="draft-module-heading">
                        <Activity aria-hidden="true" />
                        <div><h3>Per-hero phase records</h3><p>No team phase advantage is calculated.</p></div>
                      </div>
                      <div className="draft-phase-grid">
                        {phases.map(phase => {
                          const observations = phaseObservations(phase);
                          return (
                            <div className="draft-phase-card" key={phase.label}>
                              <span>{phase.label} · {phase.detail}</span>
                              {observations.length ? observations.map(item => (
                                <p key={`${item.team}-${item.heroId}-${item.timeMin}`}>
                                  <b>{item.team}</b> {heroName(item.heroId)} · {item.timeLabel}m · {percentage(item.winRate)}
                                </p>
                              )) : <p className="muted-copy">—</p>}
                            </div>
                          );
                        })}
                      </div>
                      <p className="draft-integrity-note">Only source intervals wholly contained in the configured 0–8, 8–15 and 15+ minute bands are shown. Timeline records have no statistics-window filter and no sample counts.</p>
                      {timelineUpdatedAt.length ? (
                        <p className="draft-data-provenance">Timeline record updated: {timelineUpdatedAt.map(value => new Date(value).toLocaleString()).join(" · ")}</p>
                      ) : null}
                    </section>
                    <section className="draft-counter-section" aria-label="Data coverage">
                      <h3>Coverage</h3>
                      <p>Hero WR: {allySummary.rated + enemySummary.rated}/{pickedCount} selected heroes rated.</p>
                      <p>Counter records unavailable: {data.unavailableCounterHeroIds.length ? data.unavailableCounterHeroIds.map(heroName).join(", ") : "—"}.</p>
                      <p>Synergy records unavailable: {data.unavailableSynergyHeroIds.length ? data.unavailableSynergyHeroIds.map(heroName).join(", ") : "—"}.</p>
                      <p>Timeline records unavailable: {data.unavailableTimelineHeroIds.length ? data.unavailableTimelineHeroIds.map(heroName).join(", ") : "—"}.</p>
                    </section>
                  </>
                ) : visibleResult.status === "loading" ? (
                  <p role="status">Loading current rank-scoped analysis…</p>
                ) : visibleResult.status === "idle" ? (
                  <p className="muted-copy">Select heroes to load provider data.</p>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </details>
      {visibleResult.status === "error" || visibleResult.status === "unsupported" ? (
        <div className="draft-analysis-error draft-analysis-error-inline" role="status">
          <AlertCircle aria-hidden="true" />
          <p>{visibleResult.message}</p>
          {visibleResult.status === "error" ? (
            <Button size="xs" variant="outline" onPress={() => {
              setResult({ status: "loading", requestKey: payload });
              setAttempt(value => value + 1);
            }}>Retry</Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
