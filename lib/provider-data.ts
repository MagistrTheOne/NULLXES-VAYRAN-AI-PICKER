import type { Hero, Rank, Role } from "./heroes";

export type Attribution = { name: string; url: string; license: string };
export type CatalogData = { heroes: Hero[]; source: Attribution; fetchedAt: string; total: number; retained: number };
export type PublishedRanking = { slug: string; name: string; tier: string; winRate: number; banRate: number; pickRate: number; score: number; lowSample: boolean };
export type RankingsData = { heroes: PublishedRanking[]; measuredAt: string; fetchedAt: string; source: Attribution; population: "unspecified"; total: number };
export type HeroProfileData = { slug: string; name: string; title: string; roles: string[]; lanes: string[]; specialties: string[]; skills: { name: string }[]; images: { portrait?: string; icon?: string }; source: Attribution; imageReuse: "unverified" };
export type ProviderResult<T> = { status: "ready"; data: T } | { status: "error"; message: string };
export const DATA_WINDOWS = [1, 3, 7, 15, 30] as const;
export type DataWindow = (typeof DATA_WINDOWS)[number];
export type RankRow = { heroId: string | null; providerId: number; name: string; winRate: number; pickRate: number; banRate: number };
export type RankData = { rank: Rank; providerRank: string; days: DataWindow; rows: RankRow[]; total: number; fetchedAt: string; populationNote: string };
export type SynergyPair = { allyId: string; heroId: string; delta: number; relationship: "positive" | "negative"; recordUpdatedAt: string | null; sourceUrl: string };
export type SynergyData = { rank: Rank; days: DataWindow; candidates: SynergyPair[]; selectedPairs: SynergyPair[]; unavailableHeroIds: string[]; fetchedAt: string; populationNote: string };
export type MatchDurationRate = { timeMin: number; timeMax: number | null; winRate: number };
export type HeroLaneTimeline = {
  heroId: string;
  role: Role;
  winRate: number;
  updatedAt: string | null;
  durations: MatchDurationRate[];
};
export type DraftCounterSignal = {
  mainHeroId: string;
  counterHeroId: string;
  mainTeam: "ally" | "enemy";
  counterTeam: "ally" | "enemy";
  relationship: "counter" | "negative";
  impact: number;
  updatedAt: string | null;
};
export type DraftAnalysisData = {
  rank: Rank;
  days: DataWindow;
  fetchedAt: string;
  populationNote: string;
  rankData: RankData;
  timelines: HeroLaneTimeline[];
  counters: DraftCounterSignal[];
  synergyPairs: SynergyPair[];
  unavailableSynergyHeroIds: string[];
  unavailableTimelineHeroIds: string[];
  unavailableCounterHeroIds: string[];
};
