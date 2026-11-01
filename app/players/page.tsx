"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/vayran/shared";

type LookupStatus =
  | { kind: "idle" }
  | { kind: "invalid"; message: string }
  | { kind: "unavailable"; message: string };

type PlayerLookupInput = {
  playerId: string;
  serverId: string;
};

function isPositiveInteger(value: string) {
  return /^\d+$/.test(value) && /[1-9]/.test(value);
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    setStatus({
      kind: "unavailable",
      message:
        "Player lookup is unavailable until the provider endpoint is confirmed. No request was sent.",
    });
  }

  function updatePlayerId(value: string) {
    setPlayerId(value);
    setStatus({ kind: "idle" });
  }

  function updateServerId(value: string) {
    setServerId(value);
    setStatus({ kind: "idle" });
  }

  const invalid = status.kind === "invalid";

  return (
    <div className="support-page">
      <PageHeading
        eyebrow="PLAYER INTELLIGENCE"
        title="Player Intelligence"
        description="Find a player by Player ID and Server ID. No account connection required."
      />
      <section className="player-lookup">
        <h2>Player Lookup</h2>
        <p>Enter the Player ID and Server ID shown on the player&apos;s in-game profile.</p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="player-lookup-fields">
            <label htmlFor="player-id">Player ID</label>
            <Input
              id="player-id"
              name="playerId"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Enter Player ID"
              value={playerId}
              aria-invalid={invalid}
              aria-describedby={invalid ? "lookup-status" : undefined}
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
              aria-invalid={invalid}
              aria-describedby={invalid ? "lookup-status" : undefined}
              onChange={(event) => updateServerId(event.target.value)}
              required
            />
          </div>
          <Button type="submit" isDisabled={!canFindPlayer}>
            Find Player
          </Button>
          {status.kind !== "idle" ? (
            <p
              id="lookup-status"
              className={`player-lookup-status ${status.kind}`}
              role={status.kind === "invalid" ? "alert" : "status"}
              aria-live="polite"
            >
              {status.message}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
