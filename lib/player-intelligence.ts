export type PlayerIdentity = {
  playerId: string;
  serverId: string;
  nickname: string;
  country: string | null;
  avatarUrl: string | null;
};

export type PlayerStatistics = {
  scope: "season" | "ranked" | "lifetime";
  currentRank: string | null;
  highestRank: string | null;
  accountLevel: number | null;
  matches: number | null;
  wins: number | null;
  losses: number | null;
  winRate: number | null;
  mvp: number | null;
  averageKda: number | null;
};

export type HeroPerformance = {
  heroId: string;
  matches: number | null;
  winRate: number | null;
  role: string | null;
  averageKda: number | null;
};

export type RolePerformance = {
  role: "Gold Lane" | "EXP Lane" | "Mid Lane" | "Jungle" | "Roam";
  matches: number | null;
  wins: number | null;
  winRate: number | null;
};

export type MatchHistoryEntry = {
  id: string;
  heroId: string;
  result: "victory" | "defeat";
  matchType: string | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  playedAt: string | null;
  durationSeconds: number | null;
  mvp: boolean | null;
};

export type RankHistoryEntry = {
  season: string;
  rank: string;
  recordedAt: string | null;
};
