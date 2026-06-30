# CreatorLedger — Product Requirements Document

## Original Problem Statement (verbatim)
> Build an AI Finance Copilot for Influencer Marketing Agencies. Agencies receive dozens or hundreds of invoices from creators every month in random formats (Canva, Word, PDF). Finance teams manually verify creator names, campaign rates, PAN, GSTIN, bank details and compute deductions / TDS / payouts. CreatorLedger reduces this workflow to minutes. Core promise: **Upload → Verify → Pay.**

The product should feel like a premium YC-backed B2B SaaS (Stripe / Linear / Notion / Ramp / Mercury polish).

## User Personas
1. **Finance Manager** at an influencer agency — owns payout cycles, hates re-keying invoice data.
2. **Campaign Manager** — owns the campaign master sheet, needs to flag discrepancies fast.
3. **Agency Owner** — wants a high-level view of money in / money out per cycle.

## Core Requirements
- Bulk invoice upload (PDF, PNG, JPG) with AI extraction (Gemini 3 Flash) → structured JSON
- Campaign master Excel upload
- AI reconciliation engine that detects: rate mismatch, duplicate invoice, unknown creator, missing campaign, missing PAN, missing GSTIN, missing bank details, bank account changed, total mismatch, campaign mismatch, low confidence
- Explainable AI ("why is this flagged?") via GPT-5.2
- Review screen: approve / reject / edit each invoice
- Configurable finance calculator (GST, TDS, agency commission, platform fee)
- Bulk payout-ready CSV export
- AI insights cards (overbilling totals, missing PAN counts, duplicates, etc.)
- Global search (creators, campaigns, PAN, invoice numbers)
- Filters (status, severity)
- Premium landing page with Hero / Problem / How / Features / AI / Security / Pricing / FAQ
- Auth: email + password (JWT, httpOnly cookies) + Google demo login

## Tech Stack
- Frontend: React 19 + Tailwind + shadcn/ui + framer-motion + lucide-react. Outfit (headings) + Manrope (body) + JetBrains Mono.
- Backend: FastAPI + Motor (MongoDB) + bcrypt + PyJWT + emergentintegrations
- AI:
  - **Gemini 3 Flash** — multimodal extraction from PDF / image invoices (FileContentWithMimeType)
  - **GPT-5.2 (OpenAI)** — explainability ("why is this flagged?") + dashboard insight cards
  - Powered by Emergent Universal LLM Key

## What's Been Implemented (Feb 2026)
- ✅ Premium landing page with Hero, Stats, Problem, How-it-works, Features, AI showcase (dark section), Security, Pricing tiers, FAQ accordion, CTA
- ✅ Auth: email/password (JWT in httpOnly cookies), Google demo login that signs in as the seeded demo account
- ✅ Auto-seeded demo workspace per user: 30 creators, 39 campaigns, 41 invoices, ~14 flagged invoices with realistic discrepancies
- ✅ Dashboard with 8 stat cards (Bento grid) + AI insights grid + Top flagged invoices list
- ✅ Campaigns page (list + manual add + Excel/CSV bulk upload)
- ✅ Invoices page (list + filter by status/severity + search + bulk PDF/PNG/JPG upload → Gemini extraction → auto reconciliation)
- ✅ Invoice drawer (review screen): anomalies with reasons, editable extracted fields, approve / reject / reviewer notes, live net-payable estimate
- ✅ Reconciliation page with severity-tabbed view of every flagged invoice + AI explanation cards
- ✅ AI Insights page with both deterministic and GPT-5.2-augmented insight cards
- ✅ Finance Calculator with sliders for GST/TDS/commission/platform fee + live payout preview
- ✅ Bulk CSV export with calculated net payable per invoice
- ✅ Global search across creators / campaigns / invoices / PAN
- ✅ Beautiful loading skeletons, framer-motion micro-animations, glassmorphism header, AI-explainability badges with confidence %

## Backlog (P1)
- Real Google OAuth (currently demo-only — signs into seeded account)
- Multi-workspace / team invites
- Audit log timeline per invoice
- Real PDF→image fallback for invoices that Gemini can't parse
- Razorpay / Cashfree payout API integration

## Backlog (P2)
- SAML / SSO
- Email notifications for flagged invoices
- Mobile app
- Dark mode (currently light-only, by design)

## Test Credentials
See `/app/memory/test_credentials.md` — demo@creatorledger.com / demo1234
