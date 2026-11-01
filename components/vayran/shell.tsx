"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  CircleUserRound,
  LayoutGrid,
  Settings2,
  Shield,
  Swords,
} from "lucide-react";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { RANKS } from "@/lib/heroes";
import { useRank } from "./session";

const navigation = [
  { href: "/overview", label: "Overview", short: "Overview", icon: LayoutGrid },
  { href: "/", label: "Draft Lab", short: "Draft Lab", icon: Swords },
  { href: "/heroes", label: "Heroes", short: "Heroes", icon: Shield },
  {
    href: "/ranks",
    label: "Rank Analytics",
    short: "Ranks",
    icon: ChartNoAxesCombined,
  },
  {
    href: "/players",
    label: "Player Intelligence",
    short: "Players",
    icon: CircleUserRound,
  },
  { href: "/settings", label: "Settings", short: "Settings", icon: Settings2 },
];

export function NavigationRail() {
  const pathname = usePathname();
  return (
    <aside className="navigation-rail">
      <Link href="/" className="rail-brand" aria-label="VAYRAN Draft Lab">
        <span className="brand-letter">V</span>
        <span>VAYRAN</span>
      </Link>
      <nav aria-label="Primary navigation">
        {navigation.map(({ href, label, short, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`rail-link ${href === "/settings" ? "rail-settings" : ""}`}
            aria-label={label}
            aria-current={pathname === href ? "page" : undefined}
            title={label}
          >
            <Icon size={21} strokeWidth={1.5} aria-hidden="true" />
            <span>{short}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function RankSelector({ id = "workspace-rank" }: { id?: string }) {
  const { rank, setRank } = useRank();
  return (
    <div className="rank-selector">
      <label htmlFor={id}>Rank segment</label>
      <NativeSelect
        id={id}
        value={rank}
        onChange={(event) => {
          const next = RANKS.find((item) => item === event.target.value);
          if (next) setRank(next);
        }}
      >
        {RANKS.map((item) => (
          <NativeSelectOption key={item} value={item}>
            {item}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

export function TopBar() {
  const pathname = usePathname();
  return (
    <header className="top-bar">
      <div className="section-trail">
        <span>WORKSPACE</span>
        <span className="trail-divider">/</span>
        <strong>
          {navigation.find((item) => item.href === pathname)?.label ?? "VAYRAN"}
        </strong>
      </div>
      <div className="top-controls">
        <RankSelector />
        <Link
          className="top-settings"
          href="/settings"
          aria-label="Open settings"
        >
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </header>
  );
}

export function CurrentRank() {
  const { rank } = useRank();
  return <>{rank}</>;
}
