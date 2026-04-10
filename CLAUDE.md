# CLAUDE.md — frelo Intelligence

## Build Standard
vibe-stack: Next.js 14 + TypeScript + Tailwind + Supabase (pgvector) + Vercel + GitHub.

## Purpose
Living intelligence engine for frelo. Not a "research tool" — a brain that:
- Continuously ingests consumer voice from 10+ platforms
- Tests hypotheses against real evidence
- Discovers avatars grounded in source quotes
- Detects cultural/narrative shifts before competitors
- Answers any question with cited evidence
- Simulates synthetic personas to pre-test ads
- Hands off briefs directly to Creative Hub

## Architecture
3 layers:
1. **Ingestion** — Vercel Cron + workers → Supabase (with pgvector embeddings)
2. **Intelligence** — Claude Opus 4.6 (deep) + Haiku 4.5 (fast) agents that reason over the memory
3. **Interface** — Chat, Hypothesis workbench, Avatar explorer, Dashboard

## Brand data
`src/lib/brand.ts` — canonical BRAND_CONTEXT used in every LLM prompt. When the brand evolves, update here.

## Database
- Shared Supabase project with creative-hub
- All tables prefixed `intel_` to avoid collision
- Schema: `supabase/schema.sql` — run once in SQL editor
- Vector index: `intel_items.embedding` (1536d, OpenAI text-embedding-3-small)

## Phases
- **Phase 1 (Foundation, 4 days):** Scaffold, schema, ingestion workers, query generator, batched analyzer, clustering, basic avatar synth
- **Phase 2 (Intelligence, 5 days):** Chat RAG, Hypothesis engine, Delta detector, Narrative detection, Competitive war-gamer
- **Phase 3 (Loop, 3 days):** Persona simulator, Red-team, Creative Hub handoff
- **Phase 4 (Polish, 2 days):** Role-differentiated outputs, Strategic briefs

## Deployment
Push to GitHub → Vercel auto-deploys.

**⚠️ Git author:** Must commit with `adam554433@gmail.com` via `-c user.email=adam554433@gmail.com -c user.name=adam554433`. The default hostname email breaks Vercel deploys.

## Never
- Never use Groq for deep reasoning — always Claude Opus 4.6
- Never hallucinate quotes or stats — every claim must cite a source item
- Never regenerate the schema destructively — use ALTER TABLE / new migrations
- Never put PII in logs or LLM prompts
