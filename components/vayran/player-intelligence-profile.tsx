"use client";

import { useState } from "react";
import {
  Activity,
  Check,
  ChartNoAxesCombined,
  CircleHelp,
  Clock3,
  Copy,
  Gamepad2,
  Globe2,
  History,
  Medal,
  Shield,
  Swords,
  Trophy,
  UserRound,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { PlayerIdentity } from "@/lib/player-intelligence";

function SectionTitle({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Activity;
  title: string;
  detail?: string;
}) {
  return (
    <div className="player-module-heading">
      <Icon aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        {detail ? <p>{detail}</p> : null}
      </div>
    </div>
  );
}

function EmptyModule({ children }: { children: string }) {
  return (
    <div className="player-module-empty">
      <CircleHelp aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

function UnknownValue() {
  return <span className="player-unknown">—</span>;
}

function IdentityCopyButton({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    window.setTimeout(() => setCopyState("idle"), 1500);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="player-copy-button"
      aria-label={
        copyState === "failed"
          ? `Could not copy ${label}`
          : copyState === "copied"
            ? `${label} copied`
            : `Copy ${label}`
      }
      aria-live="polite"
      onPress={() => void copyValue()}
    >
      {copyState === "copied" ? (
        <Check aria-hidden="true" />
      ) : copyState === "failed" ? (
        <CircleHelp aria-hidden="true" />
      ) : (
        <Copy aria-hidden="true" />
      )}
    </Button>
  );
}

function IdentityCard({ identity }: { identity: PlayerIdentity }) {
  return (
    <Card className="player-identity-card">
      <CardContent className="player-identity-content">
        <Avatar className="player-avatar-frame" size="lg">
          {identity.avatarUrl ? (
            <AvatarImage src={identity.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback>
            <UserRound aria-hidden="true" />
          </AvatarFallback>
        </Avatar>

        <div className="player-identity-main">
          <p className="player-kicker">PLAYER PROFILE</p>
          <h2>{identity.nickname}</h2>
          <div className="player-identity-ids">
            <span>PLAYER ID <strong>{identity.playerId}</strong></span>
            <IdentityCopyButton value={identity.playerId} label="Player ID" />
            <span className="player-id-separator" aria-hidden="true">/</span>
            <span>SERVER <strong>{identity.serverId}</strong></span>
            <IdentityCopyButton value={identity.serverId} label="Server ID" />
          </div>
          <div className="player-identity-meta">
            <span className="player-verified"><Check aria-hidden="true" /> Identity verified</span>
            {identity.country ? (
              <span><Globe2 aria-hidden="true" /> {identity.country}</span>
            ) : null}
          </div>
        </div>

        <div className="player-rank-summary" aria-label="Rank information unavailable">
          <div className="player-rank-badge"><Shield aria-hidden="true" /></div>
          <div>
            <span>RANK DATA</span>
            <strong>Not available</strong>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompetitiveOverview() {
  const metrics = [
    { label: "Overall win rate", icon: ChartNoAxesCombined },
    { label: "Total matches", icon: Swords },
    { label: "Wins / losses", icon: Activity },
    { label: "MVP", icon: Trophy },
    { label: "Average KDA", icon: ChartNoAxesCombined },
    { label: "Account level", icon: Medal },
  ];

  return (
    <Card className="player-module">
      <CardHeader>
        <SectionTitle icon={Activity} title="Competitive overview" detail="Verified player statistics" />
      </CardHeader>
      <CardContent>
        <div className="player-metric-grid">
          {metrics.map(({ label, icon: Icon }) => (
            <div className="player-metric" key={label}>
              <span><Icon aria-hidden="true" />{label}</span>
              <UnknownValue />
            </div>
          ))}
        </div>
        <p className="player-module-footnote">Competitive statistics are not available from the connected source.</p>
      </CardContent>
    </Card>
  );
}

function WinRateModule() {
  return (
    <Card className="player-module player-winrate">
      <CardHeader>
        <SectionTitle icon={ChartNoAxesCombined} title="Win rate analytics" detail="No verified match sample" />
      </CardHeader>
      <CardContent>
        <div className="player-winrate-empty">
          <div className="player-winrate-value">—<span>WIN RATE</span></div>
          <EmptyModule>Win rate data is not available from the connected source.</EmptyModule>
        </div>
      </CardContent>
    </Card>
  );
}

function HeroPerformanceModule() {
  return (
    <Card className="player-module">
      <CardHeader>
        <SectionTitle icon={Gamepad2} title="Most played heroes" detail="Personal hero history" />
      </CardHeader>
      <CardContent>
        <EmptyModule>Player-specific hero performance is not available.</EmptyModule>
      </CardContent>
    </Card>
  );
}

function RolePerformanceModule() {
  return (
    <Card className="player-module">
      <CardHeader>
        <SectionTitle icon={Swords} title="Role performance" detail="Lane-specific results" />
      </CardHeader>
      <CardContent>
        <EmptyModule>Role performance requires verified match history.</EmptyModule>
      </CardContent>
    </Card>
  );
}

function RecentMatchesModule() {
  return (
    <Card className="player-module">
      <CardHeader>
        <SectionTitle icon={Clock3} title="Recent matches" detail="Match history" />
      </CardHeader>
      <CardContent>
        <EmptyModule>Match history is not available from the connected source.</EmptyModule>
      </CardContent>
    </Card>
  );
}

function RankProgressionModule() {
  return (
    <Card className="player-module">
      <CardHeader>
        <SectionTitle icon={History} title="Rank progression" detail="Seasonal history" />
      </CardHeader>
      <CardContent>
        <div className="player-rank-unavailable">
          <div className="player-rank-mini"><Shield aria-hidden="true" /></div>
          <div><span>Current rank</span><strong>—</strong></div>
          <div className="player-rank-divider" />
          <div className="player-rank-mini"><Trophy aria-hidden="true" /></div>
          <div><span>Highest rank</span><strong>—</strong></div>
        </div>
        <EmptyModule>Rank and season history are not available from the connected source.</EmptyModule>
      </CardContent>
    </Card>
  );
}

export function PlayerIntelligenceProfile({
  identity,
}: {
  identity: PlayerIdentity;
}) {
  return (
    <div className="player-profile">
      <IdentityCard identity={identity} />
      <div className="player-profile-grid">
        <CompetitiveOverview />
        <WinRateModule />
        <HeroPerformanceModule />
        <RolePerformanceModule />
        <RecentMatchesModule />
        <RankProgressionModule />
      </div>
    </div>
  );
}
