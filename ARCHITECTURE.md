# NULLXES VAYRAN — SYSTEM ARCHITECTURE
Version: 1.0 · 2026-10-29 · Owner: Мага / NULLXES

## 1. Identity and mission
**NULLXES VAYRAN** is an independent competitive intelligence and draft prediction system for *Mobile Legends: Bang Bang* (MLBB). It analyses hero selections, bans, current patch, rank-specific hero statistics, team synergy, counters and eventually player performance to estimate match outcomes and recommend meaningful draft changes.

VAYRAN is a NULLXES product, not an official Moonton service. It is **not** a bot that plays the game, and not a generic AI chat wrapper. Every decision must serve an explainable competitive-analysis workflow.

Product pillars:
1. **Draft Lab** — ally/enemy picks, bans, roles, draft validation, recommendations and prediction when evidence is sufficient.
2. **Hero Intelligence** — patch- and rank-scoped statistics, matchup context and data provenance.
3. **Rank Intelligence** — independent analysis for Legend, Mythic, Mythical Honor, Mythical Glory and Mythical Immortal.
4. **Player Intelligence** — opt-in player statistics, individual strengths/weaknesses, historical progression (later).
5. **Analyst** — Grok-powered data-grounded analytical commentary (later); GPT-powered user assistance/explanations (later).

Primary objective: identify which **concrete change to a draft** is expected to improve its matchup, not merely output a percentage.

## 2. Scope and delivery phases
**Phase 1 — FRONTEND (active):** production-grade Next.js interface, navigation, real interactive draft editing and validation, responsive design, accurate empty/unavailable/error states, typed contracts and isolated UI state. No backend calls, LLM integrations, calibrated match predictions or invented statistics. An intentionally empty screen is preferable to fabricated data.

**Phase 2 — DATA/BACKEND (public-source integration authorized by ORDER 003A, 2026-10-30):** narrow server-only MLBBDex and Rone Arena adapters, schema validation, caching and guarded read-only data endpoints. A transparent, non-calibrated comparison of rank-filtered hero win rates may be shown, but it is not a match win probability or prediction model. No authentication, database or LLM is authorized by this integration. Rank boundaries and missing provenance remain explicit.

**Phase 3 — LLM APIs (not authorized yet):** server-side OpenAI GPT and xAI Grok; Grok has the analyst role, GPT the explanation/assistant role. Exact models, endpoint contracts, pricing, quotas, output policies and enablement require explicit owner approval. **No local LLM, no fine-tuning and no self-hosted model runtime** are part of the current design.

An LLM **cannot be the source of win-rate facts or calibrated win probabilities**. Numerical predictions must come from a separately validated statistical mechanism with traceable data. GPT/Grok interpret that evidence and may say "insufficient data." They must never fabricate a match history, patch statistics, matchup rates, confidence, citations or probabilities.

## 3. Current repository facts (observed on main, 2026-10-29)
- Next.js **16.4.3**, App Router; React **19.3.0**; TypeScript; Tailwind CSS **4**.
- shadcn/ui configuration uses **aria-nova**, React Aria and Lucide; see `components.json`.
- Root folders include `app/`, `components/`, `hooks/`, `lib/`, `public/`.
- Single application, **not a monorepo**. Do not introduce `packages/ui`.
- Existing package managers/config, components and styling are authoritative; inspect before making changes.
- `AGENTS.md` contains a Next.js-generated guidance block that MUST remain intact.

All future structure below is a **logical responsibility map**, not permission to scaffold empty directories, classes, facades, services, stores or generic frameworks. Add files **only when an actual feature requires them**.

## 4. Frontend design
UI design language: premium NULLXES corporate minimalism — matte black, graphite, white, muted metallic surfaces, generous negative space, restrained typography, precise grids, thin borders, crisp functional animation. No neon, cyberpunk, sci-fi HUDs, holograms, glassmorphism overload, "gaming AI" clichés or decorative gimmicks.

Use the project's shadcn/ui **aria-nova** conventions, React Aria behaviors, Lucide icons and established CSS tokens. Avoid mixing incompatible shadcn Base UI/React Aria variants. Existing working components take priority over reinstallation or rewrites.

Suggested navigation, introduced only as actual screens are built:
- Overview
- Draft Lab (primary)
- Heroes
- Rank Analytics
- Player Profile (later, empty/unavailable without real data)

Draft Lab requirements:
- Five ally and five opponent draft positions; explicit role mapping (EXP / JUNGLE / MID / GOLD / ROAM).
- A hero cannot be picked by both teams or picked when banned. The same hero may appear in both teams’ ban lists; duplicate bans within one team are rejected. Picks and bans remain reversible, with clear/reset.
- Pick/ban order or stage must be explicit when prediction depends on it; do not infer unprovided drafts.
- Each rank segment selectable without collapsing statistics into an overall tier list.
- Explicit `not_connected`, `insufficient_data`, `unavailable` and `ready` states. Rank-filtered hero win rates may power a clearly labeled rough comparison only; never present it as a calibrated match probability. **No fictional metrics or demo percentages.**
- Responsive desktop/mobile experience; keyboard accessibility and clear focus/disabled states.

Rank policy: **exclude Grandmaster and Epic from analysis**. Legend, Mythic, Mythical Honor, Mythical Glory, Mythical Immortal are separate analytical populations. Do not aggregate them into a global rank to produce an overall hero prediction. Segmentation should later additionally account for patch, time range, role, region, party configuration and sample size where sources allow.

## 5. Architecture boundaries
```text
Browser / Next.js UI
  ├─ Presentation (existing app/ and components/)
  ├─ Draft state and deterministic validation (only when required)
  └─ Typed domain contracts (only when consumed)
      ↓ future implementation; not active in Phase 1
Server-side API boundary
  ├─ Authorized game statistics sources / provenance
  ├─ Deterministic draft/rank matching & statistical prediction
  └─ OpenAI GPT and xAI Grok API gateways (later)
```

Server credentials must NEVER be exposed through `NEXT_PUBLIC_*`, browser bundles, screenshots or committed files. Future AI integrations require authenticated/authorized endpoints, input validation, budget/rate limits, timeouts, sanitized logs and data-minimizing prompts. No unsolicited calls to third-party services.

Future draft input (illustrative contract, NOT instruction to build stubs):
- patch identifier; rank segment; ally/enemy hero IDs and roles; banned hero IDs; optional region and draft stage.
Future prediction response:
- explicit availability status; probability only if calibrated and grounded; sample/window/patch attribution; recommendations tied to evidence; reasons and uncertainty.
Use discriminated unions or equivalent invariants so unavailable results cannot accidentally carry a fabricated numeric probability.

Data source integrity: legal access and terms review before scraping/APIs. Never assume the MLBB ranking site exposes a supported API. No game client automation, memory reading, anti-cheat evasion or private account scraping.

## 6. Engineering rules
- Senior-level production TypeScript: strict typing, cohesive components, clear ownership and names, small diff, no `any` to suppress errors.
- Preserve established architecture, routes, working UI, styles and dependencies. Read before edit; fix root causes.
- Prefer direct, boring, maintainable code over design-pattern theater. Introduce an abstraction only when an actual feature has proven duplication or a stable boundary demands it.
- No test cases, test suites, unit/integration/e2e test files, fabricated test inputs, test fixtures, mock data, mock requests, fake servers, fake APIs, placeholder business statistics, dummy predictions or sample hero rankings. Do not add QA infrastructure.
- Do not run test suites or invent "passed tests." Existing lint/typecheck/build tooling may be used **only to verify implementation integrity**, not to create or run test cases.
- No broad refactors, unrelated rewrites, speculative packages, empty modules, new monorepo, unrelated features, CI workflows or automation without a scoped task.
- Explain source assumptions, missing upstream data and nonfunctional integration state truthfully.
- Keep design and user-visible copy polished, concise and direct. User-facing analyst voice may be sharp, irreverent, sarcastic or use profanity **when configured and appropriate**; it must not degrade into harassment of protected classes, dishonest analysis, hate or personal threats. It does not override factual accuracy.

## 7. Working protocol for coding agents
1. Inspect repository state, read `AGENTS.md`, this file, task-relevant source and installed Next.js documentation at `node_modules/next/dist/docs/` before implementation.
2. State exact scope and identify files to change. Preserve existing user changes and generated Next.js guidance.
3. Implement only the authorized feature. Do not create mocks to fill empty UIs or add tests by reflex.
4. Verify with appropriate non-test checks (TypeScript, lint, build) when available and report actual results.
5. Report files changed, decisions, blockers, integration status and any deviations. No fabricated completion claims.
6. Never push, force-push, reset, delete, deploy, introduce external APIs or alter dependency strategy without explicit instruction. Local commits likewise require authorization.

## 8. Definition of done
A feature is done when real UI interaction works for its authorized scope; requirements and rank rules are upheld; unavailable data is shown honestly; no mock/fictional statistics have been introduced; styling follows NULLXES; existing behavior is preserved; and all performed checks plus limitations are reported.

**Operating principle: senior engineering, minimum necessary complexity, no fabricated intelligence.**
