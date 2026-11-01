"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/vayran/shared";
import { PlayerIntelligenceProfile } from "@/components/vayran/player-intelligence-profile";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlayerIdentity } from "@/lib/player-intelligence";
import { z } from "zod";

const lookupResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ready"),
    data: z.object({
      playerId: z.string(),
      serverId: z.string(),
      nickname: z.string(),
      country: z.string().optional(),
    }),
  }),
  z.object({
    status: z.enum(["unavailable", "not_found", "error"]),
    message: z.string(),
  }),
]);

type LookupStatus =
  | { kind: "idle" }
  | { kind: "invalid"; message: string }
  | { kind: "loading" }
  | { kind: "unavailable"; message: string }
  | { kind: "not-found"; message: string }
  | { kind: "ready"; identity: PlayerIdentity };

type PlayerLookupInput = {
  playerId: string;
  serverId: string;
};

function isPositiveInteger(value: string) {
  return value.length <= 20 && /^\d+$/.test(value) && /[1-9]/.test(value);
}

export default function PlayersPage() {
  const [playerId, setPlayerId] = useState("");
  const [serverId, setServerId] = useState("");
  const [status, setStatus] = useState<LookupStatus>({ kind: "idle" });
  const lookup: PlayerLookupInput = {
    playerId: playerId.trim(),
    serverId: serverId.trim(),
  };
  const canFindPlayer =
    isPositiveInteger(lookup.playerId) && isPositiveInteger(lookup.serverId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedLookup: PlayerLookupInput = {
      playerId: playerId.trim(),
      serverId: serverId.trim(),
    };
    if (
      !isPositiveInteger(submittedLookup.playerId) ||
      !isPositiveInteger(submittedLookup.serverId)
    ) {
      setStatus({
        kind: "invalid",
        message: "Enter positive whole numbers for Player ID and Server ID.",
      });
      return;
    }

    setStatus({ kind: "loading" });
    try {
      const response = await fetch("/api/players/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submittedLookup),
      });
      const parsedResult = lookupResultSchema.safeParse(await response.json());
      if (
        response.ok &&
        parsedResult.success &&
        parsedResult.data.status === "ready" &&
        parsedResult.data.data.playerId === submittedLookup.playerId &&
        parsedResult.data.data.serverId === submittedLookup.serverId
      ) {
        setStatus({
          kind: "ready",
          identity: {
            ...parsedResult.data.data,
            country: parsedResult.data.data.country ?? null,
            avatarUrl: null,
          },
        });
        return;
      }
      const message =
        parsedResult.success && parsedResult.data.status !== "ready"
          ? parsedResult.data.message
          : "Player lookup response could not be verified.";
      setStatus({
        kind:
          parsedResult.success && parsedResult.data.status === "not_found"
            ? "not-found"
            : "unavailable",
        message,
      });
    } catch {
      setStatus({
        kind: "unavailable",
        message: "Player lookup is currently unavailable. Try again later.",
      });
    }
  }

  function updatePlayerId(value: string) {
    setPlayerId(value);
    setStatus({ kind: "idle" });
  }

  function updateServerId(value: string) {
    setServerId(value);
    setStatus({ kind: "idle" });
  }

  return (
    <div className="support-page player-intelligence-page">
      <PageHeading
        eyebrow="PLAYER INTELLIGENCE"
        title="Player Intelligence"
        description="Verify a player identity and review competitive data when available."
      />
      <div className="player-intelligence-layout">
        <Card className="player-search-card">
          <CardHeader>
            <p className="player-kicker">ACCOUNT SEARCH</p>
            <CardTitle>Find player</CardTitle>
            <p className="player-search-description">Use the ID and Zone shown in the in-game profile.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate>
              <div className="player-search-fields">
                <label htmlFor="player-id">Player ID</label>
                <Input
                  id="player-id"
                  name="playerId"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Enter Player ID"
                  value={playerId}
                  aria-invalid={status.kind === "invalid"}
                  aria-describedby={status.kind === "invalid" ? "lookup-status" : undefined}
                  onChange={(event) => updatePlayerId(event.target.value)}
                  required
                />
                <label htmlFor="server-id">Server ID (Zone ID)</label>
                <Input
                  id="server-id"
                  name="serverId"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Enter Server ID"
                  value={serverId}
                  aria-invalid={status.kind === "invalid"}
                  aria-describedby={status.kind === "invalid" ? "lookup-status" : undefined}
                  onChange={(event) => updateServerId(event.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="player-search-submit"
                isDisabled={!canFindPlayer || status.kind === "loading"}
              >
                {status.kind === "loading" ? "Searching…" : status.kind === "ready" ? "Find another player" : "Find Player"}
              </Button>
              {status.kind === "invalid" ||
              status.kind === "unavailable" ||
              status.kind === "not-found" ? (
                <p
                  id="lookup-status"
                  className={`player-lookup-status ${status.kind}`}
                  role="alert"
                  aria-live="polite"
                >
                  {status.message}
                </p>
              ) : null}
            </form>
            <p className="player-search-note">Player identity is checked against both ID and Server ID.</p>
          </CardContent>
        </Card>

        <div className="player-profile-area">
          {status.kind === "ready" ? (
            <PlayerIntelligenceProfile identity={status.identity} />
          ) : status.kind === "loading" ? (
            <div className="player-profile-skeleton" aria-label="Loading player profile" role="status">
              <Skeleton className="player-skeleton-identity" />
              <div className="player-skeleton-grid">
                <Skeleton />
                <Skeleton />
              </div>
            </div>
          ) : (
            <Card className="player-profile-prompt">
              <CardContent>
                <div className="player-prompt-icon" aria-hidden="true">V</div>
                <h2>{status.kind === "not-found" ? "Player not found" : "Your competitive profile"}</h2>
                <p>
                  {status.kind === "not-found"
                    ? "Check the Player ID and Server ID, then search again."
                    : status.kind === "unavailable"
                      ? status.message
                      : "Search by Player ID and Server ID to view a verified identity and available player insights."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
