# Mohammed Fazil Cattery

A production-ready website for **Mohammed Fazil Cattery** — a small, owner-run cattery in
**Madurai, Tamil Nadu** that raises **Persian kittens** and supplies **pet food for cats and
dogs**.

The site's signature feature is an **interactive 3D Persian cat** that acts as a persistent UI
companion: it breathes, blinks, moves its ears and tail, tracks the cursor, reacts when you click
or tap it, runs away and comes back — and it degrades to an illustrated fallback when WebGL or
motion effects are unavailable.

---

## Table of contents

1. [Architecture](#architecture)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Local development](#local-development)
5. [Supabase setup](#supabase-setup)
6. [Admin setup](#admin-setup)
7. [Image upload setup](#image-upload-setup)
8. [Environment variables](#environment-variables)
9. [3D cat architecture](#3d-cat-architecture)
10. [API reference](#api-reference)
11. [Vercel deployment](#vercel-deployment)
12. [Security](#security)
13. [Accessibility](#accessibility)
14. [Performance](#performance)
15. [Testing report](#testing-report)
16. [Known limitations](#known-limitations)
17. [Future enhancements](#future-enhancements)
18. [Production checklist](#production-checklist)

---

## Architecture

```
Browser
  │  React 19 (App Router, Server Components by default)
  │  ├─ Public pages        → server-rendered, force-dynamic (fresh availability)
  │  ├─ Admin pages         → server-rendered behind a signed httpOnly session cookie
  │  └─ 3D companion        → client-only, lazy, WebGL-gated, non-essential
  │
  ▼
Next.js 15 Route Handlers  (/api/*)
  ├─ zod validation on every write
  ├─ session guard + same-origin check + rate limits
  └─ Cloudinary (image storage · server-side signed uploads)
  │
  ▼
DataStore interface  (src/lib/db/types.ts)
  ├─ PostgreSQL (Supabase) driver  ← Supabase secret key set (production)
  └─ in-memory driver              ← not configured (development, clearly-labelled placeholders)
```

**Key decision:** every page and endpoint talks to a single `DataStore` interface. Swapping the
database or running without one never touches a component — the Firebase → Supabase migration
changed zero pages, zero sections and none of the 3D cat code. The frontend only ever receives URL
strings for images, so the storage driver can change without touching any form.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript (strict) |
| Styling | Tailwind CSS 3 with a custom brand token set |
| UI | Radix primitives (Dialog, Select, Label) + CVA variants, heavily customised |
| 3D | Three.js + React Three Fiber 9 (+ drei), procedural GLTF-free model |
| Database | PostgreSQL on Supabase (privileged server client), zod-validated writes, Row Level Security |
| Auth | Supabase Auth (access-token exchange) with signed httpOnly session cookie |
| Images | Cloudinary (kittens/ products/ gallery/ folders, signed server-side uploads); local disk (dev only) |
| Deployment | Vercel (or Freebuff-managed hosting) |

Brand tokens live in `tailwind.config.ts` + `src/app/globals.css`:
cream `#F8F3EA`, navy `#102A43`, brown `#7A451E`, green `#245C3A`, ink `#18212B`;
Playfair Display (headings) + Manrope (body) via `next/font`.

## Project structure

```
src/
  app/
    (site)/                 public shell: announcement bar, header, footer, sticky bar
      page.tsx              Home (13 sections)
      kittens/              listing + [id] detail
      pet-food/ about/ gallery/ contact/
    admin/
      login/ dashboard/ kittens/ products/ gallery/
    api/
      kittens/ products/ gallery/ auth/ upload/ admin/stats/
    layout.tsx  globals.css  sitemap.ts  robots.ts  not-found.tsx  error.tsx
  components/
    cat/        CatCompanion · CatScene · CatModel · CatAnimationController
                CatInteractionController · CatFallback · catSignals
    providers/  AppProviders · IntroProvider · CatMoodProvider
    hero/ sections/ kittens/ products/ gallery/ contact/ layout/ brand/ images/ admin/ ui/ seo/
  lib/
    db/         store contract, PostgreSQL driver, memory driver, placeholder data
    supabase/   browser client · RLS-scoped server client · privileged client · authorization
    auth/       session · guard · page-guard
    storage/    Cloudinary driver + local (dev) driver
    admin/      fetch wrapper with upload progress
    site.ts  whatsapp.ts  data.ts  validation.ts  images.ts  utils.ts
  models/       types.ts (Kitten/Product/Gallery/AdminUser) · schemas.ts (zod)
scripts/        supabase-setup.mjs (two admin accounts)
supabase/schema.sql  tables + Row Level Security policies
env.example     environment template (copy to .env.local)
```

## Local development

```bash
bun install            # or: npm install
cp env.example .env.local
bun run dev            # http://localhost:3000 (binds 0.0.0.0, honours $PORT)
bun run typecheck      # tsc --noEmit
bun run build          # production build
```

Without Supabase credentials the app still runs end-to-end (public pages, API and admin CRUD)
using an in-memory store seeded with clearly-labelled placeholder records.

## Supabase setup

The backend uses **Supabase Auth** (admin sign-in), **PostgreSQL** (content, protected by Row
Level Security) and **Cloudinary** (images). The free tier covers the Supabase side.

> Images are stored in **Cloudinary**, not Supabase Storage. PostgreSQL keeps only metadata
> (URLs + Cloudinary public_ids).

1. Create a project at [supabase.com](https://supabase.com) (e.g. `mohammed-fazil-cattery`).
2. Open **SQL Editor → New query**, paste the full contents of `supabase/schema.sql`, and run it.
   It creates the four tables (`admins`, `kittens`, `products`, `gallery`), the RLS policies and
   an optional placeholder seed.
3. Copy from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - publishable (anon) key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - secret key (`sb_secret_…`, or the legacy `service_role` JWT) → `SUPABASE_SECRET_KEY`
     — **server-only, never `NEXT_PUBLIC_`**.
4. Provision the **two admin accounts** (see [Admin setup](#admin-setup)).

Fill these in `.env.local` (see `env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   (or the legacy anon JWT)
SUPABASE_SECRET_KEY=sb_secret_...                        (or SUPABASE_SERVICE_ROLE_KEY=...)
```

**Tables:** `admins`, `kittens`, `products`, `gallery`.

### Row Level Security

- Public (anonymous **and** ordinary authenticated users): `SELECT` on `kittens`, `products`,
  `gallery` only.
- Writes on content tables require an authenticated Supabase user with an **active `admins` row**
  (`admins.id = auth.users.id`, `role = 'admin'`, `active = true`) — checked server-side, never a
  client-supplied flag.
- The `admins` registry is not readable or writable by clients; only the privileged server
  connection and the console manage it.

### Data models

```sql
admins   { id uuid PK → auth.users.id, email unique, name, role 'admin', active,
           created_at, updated_at }
kittens  { id uuid PK, name, breed, gender(male|female|unknown), date_of_birth, description,
           status(available|reserved|sold), price, images jsonb, image_ids jsonb, featured,
           placeholder, created_at, updated_at }
products { id uuid PK, name, animal(cat|dog), category(dry|wet), food_type, brand, pack_size,
           price, description, image, image_id, available, placeholder, created_at, updated_at }
gallery  { id uuid PK, image, image_id, category(kittens|cats|pet-food|cattery), caption,
           sort_order, placeholder, created_at }
```

`images`/`image_ids` hold Cloudinary delivery URLs and public_ids (index-aligned). Empty/unknown
fields are **never rendered** — the site shows only what actually exists.

## Admin setup

The site supports **two administrator accounts** (Administrator + Owner) with identical
permissions. Provision both in one step (run locally, never in CI):

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co" SUPABASE_SECRET_KEY="sb_secret_..." \
ADMIN_EMAIL="first-admin@example.com"  ADMIN_PASSWORD="a-strong-password" \
OWNER_EMAIL="second-admin@example.com" OWNER_PASSWORD="another-strong-password" \
npm run supabase-setup
```

The script creates/updates both Supabase Auth users (idempotent — it reuses existing users by
email, never duplicating) and writes the matching `admins` rows. Passwords are used at run time
only — they are never stored in the repo or in the database.

1. Set `AUTH_SECRET` (required in production): `openssl rand -hex 32`.
2. Visit **`/admin`** → redirected to `/admin/login` → dashboard at `/admin/dashboard`.

Admin capabilities: dashboard statistics, kitten CRUD, product CRUD, gallery upload / caption /
category / reorder / delete. Every admin route and write endpoint is protected server-side, and
RLS policies enforce authorisation at the database layer too. A signed-in Supabase user **without**
an active `admins` row gets no admin access anywhere.

## Image upload setup

**Development** — `IMAGE_STORAGE_DRIVER=local` writes to `public/uploads/YYYY/MM/…`.

**Production** — Cloudinary (the default once `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` — or `CLOUDINARY_URL` — are set).
Uploads are **server-side signed** (the API secret never reaches the browser) and land
in the managed folders `kittens/`, `products/`, `gallery/`. Deleting or replacing a
record destroys the corresponding Cloudinary asset best-effort. `CLOUDINARY_URL`
(cloudinary://key:secret@cloud) is accepted as a single-variable alternative and stays
server-only.

Changing the driver requires **no frontend changes** — forms emit URL strings only.

Validation performed server-side (`src/lib/images.ts`): magic-byte MIME sniffing (JPEG/PNG/WEBP/
AVIF), declared-vs-actual type match, header dimension parsing (corruption detection), size limit
(`MAX_UPLOAD_BYTES`, default 8 MB), minimum/maximum dimensions and aspect-ratio sanity. The client
adds a friendly pre-check, a live progress bar, preview, retry and removal.

## Environment variables

See `env.example` for the complete, commented list. Highlights:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp CTA (`919876543210` style). Unset → CTAs fall back to `/contact`. |
| `NEXT_PUBLIC_PHONE` | `tel:` links. Unset → call buttons fall back to `/contact`. |
| `NEXT_PUBLIC_INSTAGRAM_URL` | Instagram section renders **only** when set. |
| `NEXT_PUBLIC_BUSINESS_ADDRESS` | Directions link renders **only** when set. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public identifier). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon key (safe for the browser; RLS is the gate). |
| `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) | Server-only privileged key for the API layer. Unset → in-memory development store. |
| `AUTH_SECRET` | Session cookie signing (mandatory in production). |
| `IMAGE_STORAGE_DRIVER` | `cloudinary` \| `local` (auto-detects Cloudinary when unset). |

## 3D cat architecture

```
CatCompanion (fixed dock, lazy, aria-hidden, decorative)
 ├─ CatInteractionController  → pointer, proximity, tap-vs-scroll (signals only, no re-renders)
 ├─ CatErrorBoundary          → any WebGL/scene crash → CatFallback illustration
 └─ CatScene (next/dynamic, ssr:false, requestIdleCallback)
      ├─ lights + camera aim + device-aware DPR
      ├─ CatModel            → procedural Persian cat (rig refs, no binary assets)
      └─ CatAnimationController → state machine, driven by catSignals
```

- **States:** `IDLE · BLINK · LOOK · EAR_TWITCH · TAIL_MOVEMENT · REACT · WALK · RUN · RETURN`.
- **Idle behaviour** is randomised and sparse: breathing, blinks every 2.5–7 s (occasionally
  doubled), ear twitches every 3.5–9.5 s, a lazily waving tail, soft head tracking with
  wander noise, and an occasional tiny shuffle (`WALK`).
- **Interaction:** cursor proximity raises tracking gain and perks the ears; click/tap triggers
  `REACT → RUN → (fade out) → RETURN → IDLE`. A tap travelling more than 12 px is treated as a
  scroll, so the cat never steals a swipe.
- **Section awareness:** sections declare `data-cat-mood="relaxed|curious|attentive|calm"` and a
  `CatMoodProvider` mutates a shared signal (no React re-renders).
- **Performance:** lazy-loaded after first paint (idle callback), `dpr` capped per device,
  no shadow maps (a painted contact shadow instead), pointer events at the DOM layer only,
  hidden on `/admin` and while dialogs are open.
- **Fallbacks:** reduced motion → single static pose; no WebGL → SVG illustration; scene crash →
  error boundary → SVG illustration. The site is fully usable without any of it.
- **Swapping in a real GLB later:** replace the body of `CatModel` with
  `<primitive object={gltf.scene} />` and map bone names onto the same rig — no UI changes.

## API reference

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/kittens?status=&featured=` | – | public list |
| GET | `/api/kittens/:id` | – | public detail |
| POST | `/api/kittens` | admin | zod-validated create |
| PUT | `/api/kittens/:id` | admin | zod-validated update |
| DELETE | `/api/kittens/:id` | admin | |
| GET | `/api/products?animal=&category=` | – | public list |
| GET/PUT/DELETE | `/api/products/:id` | admin for writes | |
| POST | `/api/products` | admin | |
| GET | `/api/gallery?category=` | – | ordered list |
| POST | `/api/gallery` | admin | |
| PATCH/DELETE | `/api/gallery/:id` | admin | delete also removes the stored file |
| POST | `/api/gallery/reorder` | admin | `{ orderedIds: string[] }` |
| POST | `/api/auth/login` | – | Supabase access-token exchange; rate-limited 5 / 10 min / IP |
| GET | `/api/auth/mode` | – | reports whether the Supabase flow is active |
| POST | `/api/auth/logout` | session | clears cookie |
| GET | `/api/auth/me` | – | session + environment info |
| GET | `/api/admin/stats` | admin | dashboard counts |
| POST | `/api/upload` | admin | multipart, fully validated |

## Vercel deployment

1. Push the repository and import it into Vercel (Next.js is auto-detected).
2. Add environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SECRET_KEY` (server-only), `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL` (your real domain),
   `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_INSTAGRAM_URL`, plus the
   Cloudinary set. Storage defaults to Cloudinary automatically.
3. Run `supabase/schema.sql` in the Supabase SQL editor and `npm run supabase-setup` once
   (locally, with the same credentials) to create the two admins.
4. Deploy. Build command default: `next build`; output handled by the Next.js runtime.
5. Sign in at `/admin` and replace the placeholder records with real content
   (or set `SEED_ON_EMPTY=false` before the first deploy if you prefer empty tables).

## Security

- Supabase Auth signs admins in; the server verifies the access token with the privileged key
  and re-checks authorisation against the `admins` table before issuing the session. The Supabase
  secret key is **server-only** (never `NEXT_PUBLIC_*`).
- PostgreSQL Row Level Security enforces authorisation at the database layer: public read-only
  content, admin-only writes keyed on `auth.uid()` + an active `admins` row, and an `admins`
  registry that clients cannot read or modify. No `USING (true)`/`WITH CHECK (true)` admin
  policies exist.
- HMAC-SHA256 signed, `httpOnly`, `SameSite=Lax`, `Secure` session cookie (7 days).
- `AUTH_SECRET` is **required in production** — the app fails closed without it.
- zod validation on every write payload; string length caps; sanitisation by construction
  (no `dangerouslySetInnerHTML` anywhere).
- Same-origin (Origin/Host) check on all state-changing requests.
- Rate limiting: login 5/10 min/IP, uploads and writes limited per IP.
- Upload hardening: magic-byte sniffing, type match, size, dimensions, corruption checks;
  stored filenames are randomised; deletions are restricted to the uploads root.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, HSTS; `poweredByHeader: false`.
- `/admin` and `/api` are disallowed in `robots.txt`, and admin pages are `noindex`.
- No secrets in client code: only `NEXT_PUBLIC_*` values reach the browser.

## Accessibility

- Semantic landmarks (`header`, `nav`, `main`, `footer`, `section` with `aria-labelledby`),
  a skip link, real headings in order, definition lists for facts.
- Visible focus outlines (light + dark surfaces), `aria-current` navigation states,
  labelled form controls with `role="alert"` errors.
- Touch targets ≥ 40–44 px; mobile menu closes on Escape and moves focus into the panel.
- Lightbox: Radix focus trap, arrow-key navigation, swipe gestures, dot indicators with labels.
- `prefers-reduced-motion`: intro skipped, 3D frozen to a static pose, CSS motion disabled.
- The cat is `aria-hidden` and decorative — never required to use the site.
- Contrast: navy/70+ on cream, cream/70+ on navy — all above WCAG AA for their sizes.

## Performance

- Server Components by default; client components are limited to interaction islands.
- `force-dynamic` only where freshness matters (availability data).
- `next/font` self-hosted fonts with `display: swap`; no render-blocking third-party requests.
- 3D bundle is dynamically imported and only fetched after the page is idle.
- Image component with responsive `sizes`, lazy loading (priority only for above-the-fold),
  AVIF/WebP output.
- No analytics, no tag managers, no third-party widgets.

## Testing report

| Area | Result |
| --- | --- |
| `tsc --noEmit` (strict) | ✅ 0 errors |
| Navigation / all routes | ✅ `/`, `/kittens`, `/kittens/[id]`, `/pet-food`, `/about`, `/gallery`, `/contact`, `/admin/*` |
| Responsive 320 → 1440+ | ✅ fluid type scale, grids collapse, no horizontal overflow |
| Mobile bar vs cat vs FAB | ✅ z-index layering keeps cat under CTAs, bar at bottom |
| 3D load / fallback | ✅ lazy load, WebGL check, error boundary, reduced-motion static pose |
| Cat blink / ears / tail / click-run-return | ✅ state machine with randomised timers |
| Touch tap vs swipe | ✅ 12 px movement threshold, `touch-action: pan-y` |
| Placeholders | ✅ branded, correct aspect ratios, clearly labelled "Placeholder" |
| Image upload | ✅ validation, progress, preview, retry, removal, failure states |
| Kitten / product / gallery CRUD | ✅ admin UI + guarded API |
| Admin auth | ✅ login rate limit, httpOnly cookie, guard on every write, `noindex` |
| WhatsApp / phone / Instagram links | ✅ configured → deep link; unconfigured → graceful fallback to `/contact` |
| SEO metadata | ✅ per-page titles/descriptions, canonical, sitemap, robots, JSON-LD (no fake reviews) |
| Keyboard navigation & focus | ✅ skip link, focus-visible, dialog focus trap |
| Reduced motion | ✅ intro skipped, 3D static, animations disabled |
| Error states | ✅ loading, empty, 404, global error, upload failure, WebGL failure |
| PostgreSQL connectivity | ✅ privileged server client with cached app + graceful in-memory fallback; RLS policies shipped in-repo |

## Known limitations

1. **In-memory fallback is per-process** — without Supabase credentials, admin changes reset on
   restart (by design; it keeps development possible).
2. **Rate limiting is per-instance** — on serverless this is per-lambda, not global. Move to
   Redis/Upstash for hard guarantees.
3. **Local image storage is ephemeral on serverless** — configure Cloudinary for
   production uploads (the upload API fails closed with 503 without it).
4. **No GraphQL/tRPC** — plain route handlers keep the API Vercel-friendly but untyped end-to-end.
5. **No email channel** — the business communicates by WhatsApp/phone, so there is no contact
   form backend (and no invented inbox).
6. **The 3D cat is procedural** — a bespoke GLB can be dropped in later for more realism.
7. **Instagram feed is a link, not an embed** — avoids third-party scripts and cookie overhead.
8. **No automated browser tests** — see below for the recommended next step.

## Future enhancements

- Cloudinary/S3 image transformations + automatic thumbnails and blur placeholders.
- Upstash rate limiting shared across serverless instances.
- Next.js `revalidateTag` cache invalidation instead of `force-dynamic`.
- A real GLB Persian cat with morph targets (realistic blink + ear rigs).
- WhatsApp Cloud API click-to-chat tracking (with consent) for enquiries.
- Tamil-language locale (`ta_IN`) alongside English.
- Playwright end-to-end suite covering CRUD, auth and the companion states.
- Structured `Offer` pricing once real prices exist.

## Production checklist

- [ ] Supabase project created; `supabase/schema.sql` executed (tables + RLS)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set
- [ ] `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) set (server-only)
- [ ] Both admin accounts provisioned (`npm run supabase-setup`); passwords are strong
- [ ] RLS verified: anonymous read OK, anonymous write denied, non-admin user write denied
- [ ] `AUTH_SECRET` set (32+ chars) — app refuses sessions without it in production
- [ ] `NEXT_PUBLIC_SITE_URL` set to the real domain (sitemap/OG/canonical)
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_INSTAGRAM_URL` filled in
- [ ] `NEXT_PUBLIC_BUSINESS_ADDRESS` set only if verified — otherwise leave empty
- [ ] Cloudinary credentials set (`CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` /
      `CLOUDINARY_API_SECRET`, or `CLOUDINARY_URL`) — server-only
- [ ] Placeholder records replaced or deleted; `SEED_ON_EMPTY=false`
- [ ] `tsc --noEmit` passes; `next build` succeeds
- [ ] Checked at 320 / 375 / 390 / 430 / 768 / 1024 / 1440 px
- [ ] Keyboard-only pass + reduced-motion pass
- [ ] 404, empty states, upload failure states reviewed
- [ ] `robots.txt` blocks `/admin` and `/api`; admin pages `noindex`
