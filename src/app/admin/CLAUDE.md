# Szalon Foglalási SaaS — CLAUDE.md

## Mi ez a projekt?
Magyar szalonoknak (pillás, köröm, fodrász) épített multi-tenant foglalási SaaS webapp.

## Tech stack
- Next.js 14 + TypeScript + Tailwind CSS
- Supabase (auth + PostgreSQL + storage)
- Stripe (előleg-fizetés + SaaS subscription)
- Resend (email értesítések)
- Twilio (SMS — v2)
- Upstash Redis (cache)
- Vercel (deploy) + Cloudflare R2 (fájlok)

## Projekt struktúra