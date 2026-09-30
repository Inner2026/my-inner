# My Inner — Testing Platform

A self-discovery testing platform. Users buy a test ($4.99), take it, and get a
deterministic, backend-calculated result. Zero AI anywhere in the pipeline.

## Stack

- **Backend:** Node.js, TypeScript, Express, MongoDB Atlas + Mongoose, JWT, bcrypt, PayPal
- **Frontend:** React, TypeScript, Vite, Tailwind CSS v4, React Router

## Repository layout

```
my-inner/
├── backend/    Express API (see backend/README.md)
└── frontend/   React SPA (see frontend/README.md)
```

## Quick start (local development)

### 1. Backend

```bash
cd backend
cp .env.example .env      # fill in MONGODB_URI, JWT_SECRET, PAYPAL_* keys
npm install
npm run seed               # seeds the 4 complete tests (published) + 3 draft tests (see below)
npm run dev                # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:4000/api
npm install
npm run dev                 # http://localhost:5173
```

### 3. Create an admin user

There is no admin sign-up flow by design (admins are not self-serve). After
registering a normal account through the app, promote it manually:

```js
// in a mongosh session connected to your database
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

## What's seeded out of the box

Running `npm run seed` in `backend/` creates all 7 tests from the specification:

| Test | Status after seeding | Why |
|---|---|---|
| MBTI-style (93 Q) | Draft/inactive -- questions and scoring are complete, but blocked by the placeholder-content gate | Result copy is seeded `[PLACEHOLDER TEXT ...]` (see below) |
| Inner Child (30 Q) | Draft/inactive -- same reason | Result copy is seeded placeholder text |
| Five Love Languages (25 Q) | Draft/inactive -- same reason | Result copy is seeded placeholder text |
| Relationship/Compatibility (30 Q) | Draft/inactive -- same reason | Result copy is seeded placeholder text |
| Spirit Animal | Draft/inactive | Spec requires 30 questions, only 10 exist -- the other 20 were intentionally **not** invented |
| Cognitive Reasoning / IQ-style | Draft/inactive | Only 10 sample questions given; final question count was never confirmed |
| Cube Personality | Draft/inactive, **no questions seeded** | Spec's answer option lists are marked "e.g." (illustrative), not confirmed final content |

None of the 7 seeded tests are purchasable out of the box. The first four have
complete questions and scoring logic, but `validateTestVersionForActivation()`
generically scans every `ResultDefinition` text field for placeholder markers
(`[PLACEHOLDER`, `TODO`, `TBD`, `FIXME`, `lorem ipsum` -- see
`backend/src/utils/placeholderContent.ts`) and refuses to publish a version
that still contains one. This check is not keyed to any specific test: it
applies uniformly, so any test (current or future) is blocked from going live
while its result copy is still a placeholder. To take one of these four tests
live, replace its `ResultDefinition` copy with real, approved text via the
admin panel (`upsertResultDefinition`) and then publish the version -- at that
point `npm run seed` will no longer overwrite it (published versions are
immutable) and the admin publish flow will succeed once no placeholder text
remains.

The other three drafts (Spirit Animal, IQ/Cognitive, Cube Personality) are
additionally blocked by incomplete questions / `pendingContentConfirmation`,
same as before.

## Verification performed in this environment

Two rounds of verification happened, both **while the payment provider was
still Stripe**. The payment gateway has since been switched to **PayPal**
(see backend/README.md) -- the Stripe-specific bullets below are kept as an
accurate record of what that round covered, but the payment code they refer
to no longer exists; PayPal's equivalent has NOT been re-verified the same
way (no PayPal sandbox credentials in this environment) and is called out
separately below.

The first (unit-test-only) round ran in a sandboxed environment with no
MongoDB/Stripe network access. A second, later round had access to a real
local MongoDB and re-verified almost everything against it over real HTTP --
both are broken out below so it's clear which is which.

**Actually tested end-to-end, over real HTTP, against a real MongoDB
(single-node replica set, required for transactions -- see backend/README.md)
and a real running server + Vite dev server, using disposable test
accounts/data only:**
- Registration (email+password and phone+password), duplicate-identifier rejection, weak-password rejection, login (success/failure/no-enumeration), JWT-protected and admin-only route gating
- Public catalog correctly empty until a test is both `active` and has a `published` current version; a draft test 404s by slug
- Admin flow: create test/version/questions/result definitions, validation reject→fix→pass, publish, activate -- including publishing rejected on the REAL seeded Relationship version (placeholder text) and the REAL seeded Spirit Animal version (incomplete questions), not just synthetic fixtures
- Purchase → Attempt funding, including under real concurrent requests (one 201, one 409, exactly one `TestAttempt` created) -- this required fixing a real `Purchase.attemptId` sparse-index bug (see backend/README.md) that made the *second* purchase ever created throw a duplicate-key error
- Attempt lifecycle: unpaid-purchase rejection, cross-user ownership rejection (404s), purchase reuse rejection (409), sanitized question payload (no scoring internals leaked), missing/duplicate/foreign-question/wrong-option answer rejection
- A full valid submission through `CATEGORY_AVERAGE_BAND` (Relationship-style), confirming the multi-result assembly fix for real: independent per-category matching, deterministic combined `resultKey`, full `resultDefinitionIds` traceability, and a `snapshot.results[]` breakdown the result page renders
- Concurrent submission of the same attempt: exactly one of two simultaneous requests wins (200), the other is rejected (409), with no double-scoring
- Result history and individual result retrieval, including confirming the historical result is byte-for-byte unchanged after its `ResultDefinition`s are deleted entirely (no live dependency)
- *(Stripe, now removed)* Webhook signature verification and delivery idempotency (invalid signature rejected, valid signature accepted, redelivery of the same event is a no-op) -- this required fixing a real bug where signature verification was needlessly coupled to `STRIPE_SECRET_KEY`. See backend/README.md for why this specific bug class doesn't apply to PayPal.
- CORS (configured origin allowed, arbitrary origins not echoed back), helmet security headers present, no stack traces on error, malformed JSON returns a clean 400 (this last one was also a real bug, now fixed)
- `npm run seed` run twice back-to-back produced identical document counts (idempotent, no duplication) both before and after all fixes

**Unit-tested (mocked models, no real database):**
- All 7 scoring strategies (`backend/src/modules/scoring/scoring.test.ts`)
- Multi-result assembly determinism and traceability in isolation (`scoringEngine.test.ts`)
- The concurrent-submission claim/release logic in isolation (`attempts.service.test.ts`)
- The placeholder-content activation gate in isolation (`validation.service.test.ts`), cross-checked against actual seeded content (`builders.test.ts`)
- `npm test -- --runInBand` passes clean on the backend (29 tests, 5 suites); `npx tsc --noEmit` and `npm run build` pass clean on both backend and frontend
- Server correctly fails fast (exit code 1) when MongoDB is unreachable or when booting in production with the default JWT secret -- actually invoked, not just read

**NOT verified (genuinely needs your environment):**
- **The entire PayPal integration** (order creation, buyer approval redirect, capture, and webhook signature verification) has not been exercised against PayPal's real API at all -- no sandbox credentials were available in this environment. It was statically reviewed against PayPal's documented Orders v2 / Webhooks v1 API contracts only. Get sandbox credentials from developer.paypal.com and test the full purchase flow before relying on this in production.
- MongoDB Atlas specifically (a local single-node replica set was used to exercise the same transaction code path Atlas provides by default -- behaviorally equivalent for this purpose, but not Atlas itself)
- Interactive browser testing (no headless browser/Playwright available in this environment) -- routes were confirmed to load in a real Vite dev server via HTTP, and every API call each page makes was independently verified above, but no JS-executing browser click-through was performed

## Deployment notes

- **MongoDB Atlas:** create a cluster, add your deployment's IP (or `0.0.0.0/0` if fronted by a proper auth layer) to network access, and use the SRV connection string as `MONGODB_URI`.
- **PayPal:** create a Live app at developer.paypal.com to get `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET`, set `PAYPAL_API_BASE=https://api-m.paypal.com`, subscribe a webhook to `PAYMENT.CAPTURE.COMPLETED` pointing at `https://<your-api>/api/purchases/webhook` and set `PAYPAL_WEBHOOK_ID` from it, and point `PAYPAL_RETURN_URL`/`PAYPAL_CANCEL_URL` at your deployed frontend.
- **CORS:** set `CLIENT_ORIGIN` on the backend to your deployed frontend's origin.
- **Frontend:** set `VITE_API_BASE_URL` to your deployed backend's `/api` URL, then `npm run build` and serve `dist/` as static files (Vercel/Netlify/S3+CloudFront all work).
- **Backend:** `npm run build && npm start`, behind a process manager (pm2/systemd) or a container platform (Render/Railway/Fly/ECS). Ensure `JWT_SECRET` is a long random value in production — the server refuses to boot in production with the default dev secret.

## Known specification gaps (see backend/README.md for detail)

- Spirit Animal, IQ/Cognitive, and Cube Personality tests have incomplete content in the specification and are intentionally left as unpublishable drafts. Real content must be added through the admin panel.
- Inner Child's 30 questions are not mapped to their 7 categories in the specification (no per-question tag given, unlike MBTI/Five Love/Relationship). Total-score-based scoring is unaffected; category-level breakdown is not currently populated. Category descriptions and psychological result copy for MBTI/Inner Child/Five Love/Relationship are seeded as clearly-labeled **placeholder text** (search for `[PLACEHOLDER TEXT` in `backend/src/seed/builders.ts`) since the specification does not provide the actual admin-authored copy -- replace via the admin panel before real use.
