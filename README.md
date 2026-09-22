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
5. [MongoDB setup](#mongodb-setup)
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
  └─ storage driver (local disk or Cloudinary)
  │
  ▼
DataStore interface  (src/lib/db/types.ts)
  ├─ MongoDB driver   ← MONGODB_URI configured (production / Atlas)
  └─ in-memory driver ← MONGODB_URI missing (development, clearly-labelled placeholders)
```

**Key decision:** every page and endpoint talks to a single `DataStore` interface. Swapping the
database or running without one never touches a component. The frontend only ever receives URL
strings for images, so the storage driver can change without touching any form.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript (strict) |
| Styling | Tailwind CSS 3 with a custom brand token set |
| UI | Radix primitives (Dialog, Select, Label) + CVA variants, heavily customised |
| 3D | Three.js + React Three Fiber 9 (+ drei), procedural GLTF-free model |
| Database | MongoDB (official driver), zod-validated documents |
| Auth | scrypt password hashing, HMAC-signed httpOnly session cookie |
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
    db/         store contract, MongoDB driver, memory driver, placeholder data
    auth/       password · session · guard · page-guard
    storage/    local + Cloudinary drivers
    admin/      fetch wrapper with upload progress
    site.ts  whatsapp.ts  data.ts  validation.ts  images.ts  utils.ts
  models/       types.ts (Kitten/Product/Gallery/AdminUser) · schemas.ts (zod)
scripts/        seed.mjs · hash-password.mjs
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

Without `MONGODB_URI` the app still runs end-to-end (public pages, API and admin CRUD) using an
in-memory store seeded with clearly-labelled placeholder records.

## MongoDB setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Add a database user and allow your network (or `0.0.0.0/0` for serverless/Vercel).
3. Copy the connection string into `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/
   MONGODB_DB=mohammed_fazil_cattery
   ```
4. Seed content + indexes (optional — the app also auto-seeds empty collections on first read):
   ```bash
   node scripts/hash-password.mjs "your-strong-password"   # prints ADMIN_PASSWORD_HASH (scrypt:…)
   MONGODB_URI="..." ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD_HASH="scrypt:..." node scripts/seed.mjs
   ```

**Collections:** `kittens`, `products`, `gallery`, `users`.
Indexes: `kittens{status,createdAt}`, `products{animal,category}`, `gallery{sortOrder}`,
`users{email unique}`.

### Data models

```ts
Kitten   { name, breed, gender, dateOfBirth, description, status(available|reserved|sold),
           price, images[], featured, placeholder, createdAt, updatedAt }
Product  { name, animal(cat|dog), category(dry|wet), foodType, brand, packSize, price,
           description, image, available, placeholder, createdAt, updatedAt }
Gallery  { image, category(kittens|cats|pet-food|cattery), caption, sortOrder, placeholder, createdAt }
User     { email, name, passwordHash(scrypt), role: "admin", createdAt }
```

Empty/unknown fields are **never rendered** — the site shows only what actually exists.

## Admin setup

1. Generate a hash: `node scripts/hash-password.mjs "a-strong-password"` (minimum 8 chars).
2. Either set `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` (and optionally `OWNER_EMAIL` +
   `OWNER_PASSWORD_HASH` for a second account) in your environment (works even before the
   database has users), or insert a document into `users` (the seed script does this for you).
3. Set `AUTH_SECRET` (required in production): `openssl rand -hex 32`.
4. Visit **`/admin`** → redirected to `/admin/login` → dashboard at `/admin/dashboard`.

Admin capabilities: dashboard statistics, kitten CRUD, product CRUD, gallery upload / caption /
category / reorder / delete. Every admin route and write endpoint is protected.

## Image upload setup

**Development** — `IMAGE_STORAGE_DRIVER=local` writes to `public/uploads/YYYY/MM/…`.

**Production** — the serverless filesystem is read-only/ephemeral, so switch to the built-in
Cloudinary driver:

```bash
IMAGE_STORAGE_DRIVER=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...      # or CLOUDINARY_UPLOAD_PRESET for unsigned uploads
```

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
| `MONGODB_URI` | Database. Unset → in-memory development store. |
| `AUTH_SECRET` | Session cookie signing (mandatory in production). |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` | Environment admin fallback. |
| `OWNER_EMAIL` / `OWNER_PASSWORD_HASH` | Optional second (owner) env account. |
| `IMAGE_STORAGE_DRIVER` | `local` \| `cloudinary`. |

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
| POST | `/api/auth/login` | – | rate-limited 5 / 10 min / IP |
| POST | `/api/auth/logout` | session | clears cookie |
| GET | `/api/auth/me` | – | session + environment info |
| GET | `/api/admin/stats` | admin | dashboard counts |
| POST | `/api/upload` | admin | multipart, fully validated |

## Vercel deployment

1. Push the repository and import it into Vercel (Next.js is auto-detected).
2. Add environment variables: `MONGODB_URI`, `MONGODB_DB`, `AUTH_SECRET`,
   `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `NEXT_PUBLIC_SITE_URL` (your real domain),
   `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_INSTAGRAM_URL`,
   `IMAGE_STORAGE_DRIVER=cloudinary` + the Cloudinary keys.
3. Allow Atlas network access for Vercel's outbound IPs (or `0.0.0.0/0`).
4. Deploy. Build command default: `next build`; output handled by the Next.js runtime.
5. Sign in at `/admin` and replace the placeholder records with real content
   (or set `SEED_ON_EMPTY=false` before the first deploy if you prefer empty collections).

## Security

- scrypt password hashing (N=16384, r=8, p=1) — plaintext passwords are never stored.
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
| MongoDB connectivity | ✅ Atlas driver with connection caching + graceful in-memory fallback |

## Known limitations

1. **In-memory fallback is per-process** — without `MONGODB_URI`, admin changes reset on restart
   (by design; it keeps development possible).
2. **Rate limiting is per-instance** — on serverless this is per-lambda, not global. Move to
   Redis/Upstash for hard guarantees.
3. **Local image storage is ephemeral on serverless** — use the Cloudinary driver in production.
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

- [ ] `MONGODB_URI` + `MONGODB_DB` set; Atlas network access allows the deployment
- [ ] `AUTH_SECRET` set (32+ chars) — app refuses sessions without it in production
- [ ] Admin credentials created (`npm run seed` or `ADMIN_*` env vars); default password changed
- [ ] `NEXT_PUBLIC_SITE_URL` set to the real domain (sitemap/OG/canonical)
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_INSTAGRAM_URL` filled in
- [ ] `NEXT_PUBLIC_BUSINESS_ADDRESS` set only if verified — otherwise leave empty
- [ ] `IMAGE_STORAGE_DRIVER=cloudinary` + Cloudinary keys configured
- [ ] Placeholder records replaced or deleted; `SEED_ON_EMPTY=false`
- [ ] `tsc --noEmit` passes; `next build` succeeds
- [ ] Checked at 320 / 375 / 390 / 430 / 768 / 1024 / 1440 px
- [ ] Keyboard-only pass + reduced-motion pass
- [ ] 404, empty states, upload failure states reviewed
- [ ] `robots.txt` blocks `/admin` and `/api`; admin pages `noindex`
