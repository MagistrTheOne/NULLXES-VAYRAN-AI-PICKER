"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useDraft, useRank } from "@/components/vayran/session";

const modules = [
  {
    name: "Draft Lab",
    text: "Build teams, manage bans, and evaluate your draft.",
    href: "/",
  },
  {
    name: "Hero Intelligence",
    text: "Explore heroes, roles, strengths, and performance.",
    href: "/heroes",
  },
  {
    name: "Rank Analytics",
    text: "Compare available competitive statistics.",
    href: "/ranks",
  },
  {
    name: "Player Intelligence",
    text: "Find a player by Player ID and Server ID.",
    href: "/players",
  },
];

export default function OverviewPage() {
  const { draft } = useDraft();
  const { rank } = useRank();
  const allyPicks = Object.values(draft.picks.ally).filter(Boolean).length;
  const enemyPicks = Object.values(draft.picks.enemy).filter(Boolean).length;
  const allyBans = draft.bans.ally.length;
  const enemyBans = draft.bans.enemy.length;
  const draftComplete = allyPicks === 5 && enemyPicks === 5;

  return (
    <div className="support-page">
      <section className="overview-entry">
        <div className="overview-hero">
          <span className="eyebrow">VAYRAN</span>
          <h1>Make every pick count.</h1>
          <p>
            Analyze team compositions, explore hero matchups, and build
            stronger drafts with VAYRAN.
          </p>
          <Link href="/" className="primary-link">
            Open Draft Lab <ArrowRight size={17} />
          </Link>
        </div>
        <div className="overview-session">
          <span className="eyebrow">CURRENT SESSION</span>
          <h2>{rank}</h2>
          <dl>
            <div>
              <dt>Selected Rank</dt>
              <dd>{rank}</dd>
            </div>
            <div>
              <dt>Draft Status</dt>
              <dd>{draftComplete ? "Lineups complete" : "Build your lineup"}</dd>
            </div>
            <div>
              <dt>Allied Team</dt>
              <dd>{allyPicks}/5 heroes</dd>
            </div>
            <div>
              <dt>Enemy Team</dt>
              <dd>{enemyPicks}/5 heroes</dd>
            </div>
            <div>
              <dt>Bans</dt>
              <dd>{allyBans}/5 allied · {enemyBans}/5 enemy</dd>
            </div>
          </dl>
        </div>
      </section>
      <section className="module-table">
        <div className="section-label">
          <h2>Explore VAYRAN</h2>
        </div>
        {modules.map((item) => (
          <Link href={item.href} className="module-row" key={item.name}>
            <div>
              <h3>{item.name}</h3>
              <p>{item.text}</p>
            </div>
            <ArrowUpRight size={17} />
          </Link>
        ))}
      </section>
    </div>
  );
}
