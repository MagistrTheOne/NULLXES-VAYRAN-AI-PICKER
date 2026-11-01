"use client";

import {
  createContext,
  useContext,
  useReducer,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { RANKS, ROLES, type Hero, type Rank, type Role } from "@/lib/heroes";
import { useCatalog } from "./catalog-provider";

export type Team = "ally" | "enemy";
export type Target =
  | { kind: "pick"; team: Team; role: Role }
  | { kind: "ban"; team: Team };
type Draft = {
  picks: Record<Team, Partial<Record<Role, string>>>;
  bans: Record<Team, string[]>;
  message: string;
};
type Action =
  | { type: "select"; target: Target; id: string }
  | { type: "remove"; target: Target; id?: string }
  | { type: "clear" };
const emptyDraft: Draft = {
  picks: { ally: {}, enemy: {} },
  bans: { ally: [], enemy: [] },
  message: "Choose your heroes to build your lineup.",
};

function draftReducer(state: Draft, action: Action, heroes: Map<string, Hero>): Draft {
  if (action.type === "clear")
    return { ...emptyDraft, message: "Draft cleared." };
  const target = action.target;
  if (action.type === "remove") {
    if (target.kind === "ban")
      return {
        ...state,
        bans: {
          ...state.bans,
          [target.team]: state.bans[target.team].filter(
            (id) => id !== action.id,
          ),
        },
        message: "Ban removed.",
      };
    return {
      ...state,
      picks: {
        ...state.picks,
        [target.team]: {
          ...state.picks[target.team],
          [target.role]: undefined,
        },
      },
      message: `${target.role} position cleared.`,
    };
  }
  const hero = heroes.get(action.id);
  if (!hero)
    return {
      ...state,
      message: "This hero is not available in the catalog.",
    };
  if (
    target.kind === "pick" &&
    state.picks[target.team][target.role] === action.id
  )
    return state;
  const picked = [
    ...Object.values(state.picks.ally),
    ...Object.values(state.picks.enemy),
  ];
  const used =
    target.kind === "ban"
      ? [...picked, ...state.bans[target.team]]
      : [...picked, ...state.bans.ally, ...state.bans.enemy];
  if (used.includes(action.id))
    return { ...state, message: `${hero.name} is already picked or banned.` };
  if (target.kind === "ban" && state.bans[target.team].length >= 5)
    return {
      ...state,
      message: `Maximum of 5 bans reached for the ${target.team === "ally" ? "allied" : "enemy"} team.`,
    };
  if (target.kind === "ban")
    return {
      ...state,
      bans: {
        ...state.bans,
        [target.team]: [...state.bans[target.team], action.id],
      },
      message: `${hero.name} banned by ${target.team === "ally" ? "allied" : "enemy"} team.`,
    };
  if (!ROLES.includes(target.role)) return state;
  return {
    ...state,
    picks: {
      ...state.picks,
      [target.team]: { ...state.picks[target.team], [target.role]: action.id },
    },
    message: `${hero.name} selected for ${target.team === "ally" ? "allied" : "enemy"} ${target.role}.`,
  };
}

const SessionContext = createContext<{
  draft: Draft;
  dispatch: React.Dispatch<Action>;
} | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const { heroes } = useCatalog();
  const heroById = new Map(heroes.map(hero => [hero.id, hero]));
  const [draft, dispatch] = useReducer((state: Draft, action: Action) => draftReducer(state, action, heroById), emptyDraft);
  return (
    <SessionContext value={{ draft, dispatch }}>{children}</SessionContext>
  );
}
export function useDraft() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("Draft workspace requires SessionProvider.");
  return value;
}

const rankKey = "vayran.rank.v1";
let memoryRank: Rank = "Mythic";
function getRank(): Rank {
  try {
    const stored = sessionStorage.getItem(rankKey);
    return RANKS.find((rank) => rank === stored) ?? memoryRank;
  } catch {
    return memoryRank;
  }
}
function subscribeRank(listener: () => void) {
  window.addEventListener("vayran-rank", listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener("vayran-rank", listener);
    window.removeEventListener("storage", listener);
  };
}
export function useRank() {
  const rank = useSyncExternalStore(
    subscribeRank,
    getRank,
    () => "Mythic" as Rank,
  );
  function setRank(next: Rank) {
    if (!RANKS.includes(next)) return;
    memoryRank = next;
    try {
      sessionStorage.setItem(rankKey, next);
    } catch {
      /* Session still works in memory when storage is disabled. */
    }
    window.dispatchEvent(new Event("vayran-rank"));
  }
  return { rank, setRank };
}
