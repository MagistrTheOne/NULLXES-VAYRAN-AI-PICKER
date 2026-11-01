# NULLXES VAYRAN — SYSTEM ARCHITECTURE
Version: 1.0 · 2026-10-29 · Owner: Мага / NULLXES

## 1. Identity and mission
**NULLXES VAYRAN** is an independent competitive intelligence and draft analysis system for *Mobile Legends: Bang Bang* (MLBB). It analyses hero selections, bans, rank-specific statistics, team synergy, counters and eventually player performance to recommend meaningful draft changes. A win probability is not displayed without an independently validated model.

VAYRAN is a NULLXES product, not an official Moonton service. It is **not** a bot that plays the game, and not a generic AI chat wrapper. Every decision must serve an explainable competitive-analysis workflow.

Product pillars:
1. **Draft Lab** — ally/enemy picks, bans, roles, draft validation, recommendations and prediction when evidence is sufficient.
2. **Hero Intelligence** — patch- and rank-scoped statistics, matchup context and data provenance.
3. **Rank Intelligence** — independent analysis for Legend, Mythic, Mythical Honor, Mythical Glory and Mythical Immortal.
4. **Player Intelligence** — opt-in player statistics, individual strengths/weaknesses, historical progression (later).
5. **Analyst** — Grok-powered data-grounded analytical commentary (later); GPT-powered user assistance/explanations (later).

Primary objective: identify which **concrete change to a draft** is expected to improve its matchup, not merely output a percentage.

## 2. Scope and delivery phases
**Phase 1 — FRONTEND (delivered foundation):** production-grade Next.js interface, navigation, real interactive draft editing and validation, responsive design, accurate empty/unavailable/error states, typed contracts and isolated UI state. No LLM integrations, calibrated match predictions or invented statistics.

**Phase 2 — DATA/BACKEND (public-source integration authorized by ORDER 003A, 2026-10-30):** narrow server-only MLBBDex and Rone Arena adapters, schema validation, caching and guarded read-only data endpoints. No prediction model, authentication, database or LLM is authorized by this integration. Rank boundaries and missing provenance remain explicit.

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
- Unique hero picks across both teams; picks cannot overlap bans. The same hero may appear in both teams’ ban lists; duplicate bans within one team are rejected. Picks and bans remain reversible, with clear/reset.
- At most five bans per team.
- Pick/ban order or stage must be explicit when prediction depends on it; do not infer unprovided drafts.
- Each rank segment selectable without collapsing statistics into an overall tier list.
- Explicit `not_connected`, `insufficient_data`, `unavailable` and `ready` states. **No fictional metrics or demo percentages.**
- Hero WR/pick/ban values must retain the selected rank and data window. A team baseline may be shown only as the explicitly labelled unweighted arithmetic mean of available selected-hero WRs; it is descriptive, not a team WR or probability, and sample counts must be disclosed as unavailable when the source omits them.
- Keep each teammate-pair and counter result directional and individual; do not add pair deltas into a synergy or counter score.
- Keep phase values at their source-provided hero/lane/time-bucket granularity. Do not calculate Early/Mid/Late team advantage without comparable samples and a documented aggregation method.
- VAYRAN player identity is the pair `{ playerId, serverId }`; both must be positive integers. A provider may receive only documented request fields. Do not treat a lookup as identified unless the returned player ID matches and, when the provider supplies a server ID, it matches the requested server ID; if the provider omits the server ID, identity remains unconfirmed. Public lookup requires a documented, read-only provider and verified access terms. If provider authentication is required, only an explicit user-authorized flow permitted by that provider may be used; never access another player's protected account. Never ask for game passwords or session cookies.
- ALU Player Lookup is fail-closed unless `ALU_LOOKUP_ENABLED`, `ALU_TERMS_APPROVED`, and `ALU_IP_WHITELISTED` are all explicitly set to `true`; these server-only flags are a release gate, not evidence that the conditions have been met. Successful identity-verified profiles are cached for 24 hours. The initial route limiter is process-local and derives client identity from proxy IP headers; only deploy behind a proxy that overwrites these headers. Do not enable a multi-instance public deployment without shared rate-limit storage or equivalent edge protection.
- A draft win-rate strip requires real rank-, patch- and time-window-specific stage data. Do not average or normalize individual hero win rates into a team win probability. Show early/late rates only when the source explicitly provides phase outcomes with sample/provenance; otherwise keep the strip unavailable.
- Responsive desktop/mobile experience; keyboard accessibility and clear focus/disabled states.

### ORDER 014 — Draft Intelligence V1
Read-only Rone Arena rank, counter and lane timeline data are authorized for the Draft Lab. Apply rank and time-window filters only where the provider supports them. Show raw provenance and missing sample/patch details. The current feature may provide descriptive hero baselines, role-slot coverage and individual matchup evidence; it does not produce draft win probability, model confidence, or a summed synergy/counter score. Commercial production use of Rone's hosted API remains subject to its by-arrangement terms.

Rank policy: **exclude Grandmaster and Epic from analysis**. Legend, Mythic, Mythical Honor, Mythical Glory, Mythical Immortal are separate analytical populations. Do not aggregate them into a global rank to produce an overall hero prediction. Segmentation should later additionally account for patch, time range, role, region, party configuration and sample size where sources allow.

### ORDER 015 — Full Draft Analysis
The Draft Lab may show a symmetric, non-probabilistic `Draft Advantage Score` once both teams have rank-scoped hero WR data. Its documented heuristic is `allied = clamp(50 + (mean allied hero WR - mean enemy hero WR) / 2, 0, 100)` and `enemy = 100 - allied`. For an incomplete draft, the means use only rated selected heroes and remain explicitly provisional; absent data on either side means no score. This is a relative display index derived only from provider hero baselines, not a team WR, match-outcome estimate, confidence value, or calibrated win probability.

Synergy and counter records remain directional individual observations and are shown separately, never summed into the index. Rank, statistics window, picks and bans are part of the analysis request key; bans also update the existing available-pair suggestions. Early/Mid/Late labels use the product-configured 0–8, 8–15 and 15+ minute bands. Only wholly contained source intervals are grouped; they remain per-hero/per-role observations because sample counts are absent. No team phase advantage is asserted.

### ORDER 016 — Fixed Draft Workspace
At desktop widths of 1280px and above, the Draft Lab uses the available viewport height below the existing top bar. Its compact header and matchup summary stay above the team columns and hero picker; only the hero catalog and the bounded `Details` popover scroll internally. The page shell suppresses its footer only while this fixed Draft Lab is active. Smaller viewports retain normal document scrolling and the existing responsive/mobile team selection. No other route receives the fixed-height behavior.

### ORDER 017 — Matchup Bar and Tactical Intelligence
The fixed summary presents the allied draft index on the left, VS centrally, the enemy index on the right, a two-color comparison bar, pick completion, unavailable Early/Mid/Late team indicators, and `Details`. Index values are shown only when both teams have rank-scoped selected-hero WR data; they are descriptive and never win probabilities. Per-hero interval counts must not be presented as phase advantage. When the source cannot support a phase comparison, show `—`. Calculation/request errors remain visible, and the active response must match the selected rank and statistics window before it is rendered.

`Details` contains Overview, Game Plan, Matchups and Data. Game Plan uses only selected, directional Rone counter records and selected teammate-pair records. A lane is an evidence-backed gank candidate only when it has a positive direct counter record and a positive allied Jungle/Roam pair record. A unique lane priority requires a complete 5v5 and complete counter coverage for both teams plus pair coverage for all allied heroes; otherwise show insufficient evidence or multiple candidates without ranking them. These records are not a prediction that a gank will succeed. Turtle/Lord prompts remain conditional on live confirmation because VAYRAN has no match state, ability metadata, objective damage, wave state, hero levels or player positions. Do not invent skill properties or phase strength. Raw phase intervals remain per-hero records with their source limitations.

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
