import { ROLES, type Role } from "./heroes";
import type { DraftAnalysisData, DraftCounterSignal, SynergyPair } from "./provider-data";

type TeamPicks = Partial<Record<Role, string>>;
type DraftPicks = { ally: TeamPicks; enemy: TeamPicks };

export type LaneEvidence = {
  role: Extract<Role, "EXP" | "MID" | "GOLD">;
  allyHeroId: string;
  enemyHeroId: string;
  counter: DraftCounterSignal | null;
  jungleSynergy: SynergyPair | null;
  roamSynergy: SynergyPair | null;
};

export type TacticalEvidence = {
  lanes: LaneEvidence[];
  gankCandidates: LaneEvidence[];
  gankComparisonComplete: boolean;
  enemyThreats: DraftCounterSignal[];
};

const gankLanes = ["EXP", "MID", "GOLD"] as const;

function pairFor(
  pairs: SynergyPair[],
  firstHeroId: string | undefined,
  secondHeroId: string,
) {
  if (!firstHeroId) return null;
  return pairs
    .filter(pair =>
      pair.relationship === "positive" &&
      pair.delta > 0 &&
      ((pair.allyId === firstHeroId && pair.heroId === secondHeroId) ||
        (pair.allyId === secondHeroId && pair.heroId === firstHeroId)),
    )
    .sort((left, right) => right.delta - left.delta)[0] ?? null;
}

function counterFor(
  counters: DraftCounterSignal[],
  team: "ally" | "enemy",
  ownHeroId: string,
  opposingHeroId: string,
) {
  return counters
    .filter(signal =>
      signal.relationship === "counter" &&
      signal.impact > 0 &&
      signal.counterTeam === team &&
      signal.counterHeroId === ownHeroId &&
      signal.mainHeroId === opposingHeroId,
    )
    .sort((left, right) => right.impact - left.impact)[0] ?? null;
}

export function analyzeTacticalEvidence(
  picks: DraftPicks,
  data: Pick<
    DraftAnalysisData,
    "counters" | "synergyPairs" | "unavailableCounterHeroIds" | "unavailableSynergyHeroIds"
  >,
): TacticalEvidence {
  const lanes = gankLanes.flatMap(role => {
    const allyHeroId = picks.ally[role];
    const enemyHeroId = picks.enemy[role];
    if (!allyHeroId || !enemyHeroId) return [];

    return [{
      role,
      allyHeroId,
      enemyHeroId,
      counter: counterFor(data.counters, "ally", allyHeroId, enemyHeroId),
      jungleSynergy: pairFor(data.synergyPairs, picks.ally.JUNGLE, allyHeroId),
      roamSynergy: pairFor(data.synergyPairs, picks.ally.ROAM, allyHeroId),
    }];
  });
  const gankCandidates = lanes.filter(lane =>
    lane.counter !== null &&
    (lane.jungleSynergy !== null || lane.roamSynergy !== null),
  );
  const pickedAllies = new Set(ROLES.flatMap(role => picks.ally[role] ? [picks.ally[role]] : []));
  const pickedEnemies = new Set(ROLES.flatMap(role => picks.enemy[role] ? [picks.enemy[role]] : []));
  const allPicks = [...pickedAllies, ...pickedEnemies];
  const unavailableCounters = new Set(data.unavailableCounterHeroIds);
  const unavailableSynergy = new Set(data.unavailableSynergyHeroIds);
  const gankComparisonComplete =
    ROLES.every(role => picks.ally[role] && picks.enemy[role]) &&
    allPicks.every(heroId => !unavailableCounters.has(heroId)) &&
    [...pickedAllies].every(heroId => !unavailableSynergy.has(heroId));
  const enemyThreats = data.counters
    .filter(signal =>
      signal.relationship === "counter" &&
      signal.impact > 0 &&
      signal.counterTeam === "enemy" &&
      pickedEnemies.has(signal.counterHeroId) &&
      pickedAllies.has(signal.mainHeroId),
    )
    .sort((left, right) => right.impact - left.impact);

  return { lanes, gankCandidates, gankComparisonComplete, enemyThreats };
}
