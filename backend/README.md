# My Inner — Backend

Express + TypeScript + MongoDB (Mongoose) API.

## Scripts

- `npm run dev` — dev server with auto-reload
- `npm run build` — compile to `dist/`
- `npm start` — run compiled `dist/server.js`
- `npm run typecheck` — `tsc --noEmit`
- `npm run seed` — seed all 7 tests (see root README for what gets published vs. left draft)
- `npm test` — run the Jest unit test suite (scoring engine, multi-result assembly, concurrent-submission handling, activation validation, seed content fidelity)

## Architecture

```
src/
├── config/         env, MongoDB connection
├── middleware/     auth (JWT), error handling
├── models/         7 Mongoose models (User, Test, TestVersion, Question, ResultDefinition, Purchase, TestAttempt)
├── modules/
│   ├── auth/       register/login/JWT
│   ├── tests/      public test catalog (read-only)
│   ├── admin/      test/version/question/result CRUD + validateTestVersionForActivation()
│   ├── scoring/    strategy-pattern scoring engine (7 strategies, zero test-ID branching)
│   ├── attempts/   purchase-gated attempt creation, sanitized questions, submission
│   ├── results/    result history + individual result (rendered from frozen snapshot)
│   └── purchases/  PayPal order/capture flow + webhook
├── seed/           spec-fidelity content extraction + DB seeding
├── app.ts          Express app wiring
└── server.ts       process entrypoint, graceful shutdown
```

## Security model

- Backend is authoritative for scoring, pricing, and access — the frontend never computes a score or asserts payment success.
- Passwords are bcrypt-hashed (cost 12); JWT is the only auth token; `requireAuth`/`requireAdmin` middleware gate every protected route.
- Answer options' scoring-relevant fields (`isCorrect`, `scoringCategory`, `scoringDirection`, `resultMapping`, `numericalValue`) are stripped before questions are ever sent to a test-taking client (`attempts.service.ts::getAttemptQuestions`).
- A `Purchase` can fund at most one `TestAttempt`, enforced by a MongoDB transaction plus a unique sparse index on `Purchase.attemptId` (belt-and-suspenders against race conditions).
- Concurrent submissions of the same `TestAttempt` cannot both score/write a result: `submitAttempt` atomically claims the attempt (`in_progress` -> `scoring`) via a single conditional `findOneAndUpdate`; only the caller that wins the claim scores and writes `submitted`, every other concurrent or repeat call is rejected, and a scoring failure releases the claim back to `in_progress` rather than ever marking a not-yet-scored attempt `submitted` (`attempts/attempts.service.ts`).
- Payment confirmation is never taken on the frontend's word: PayPal's Orders API requires an explicit server-side capture call, and only PayPal's response to that call (or a signature-verified webhook) flips a `Purchase` to `paid`. Both paths are idempotent (safe against duplicate webhook delivery or a repeated capture call) and race-protected the same way attempt submission is (atomic conditional updates, see `purchases.service.ts::capturePurchase`).
- A `TestVersion` cannot be edited once `published`/`archived` — only `draft` versions accept content changes. This is what keeps historical results reproducible.

## Scoring engine

Every test's `scoringMethod` selects one of 7 registered strategies
(`src/modules/scoring/registry.ts`). Adding a future test means reusing one of
these or adding exactly one new strategy — never a test-ID branch. See
`src/modules/scoring/scoring.test.ts` for behavioral tests of every strategy.

Two scoring formulas involved assumptions not fully specified in the source
document (flagged in code comments, not silently decided):

- **WEIGHTED_DICHOTOMY** (MBTI-style): the spec doesn't give the exact
  percentage-normalization formula, only a worked example. See the comment in
  `strategies/weightedDichotomy.ts`.
- **CATEGORY_AVERAGE_BAND** (Relationship-style): the spec doesn't define
  numeric band thresholds (only Inner Child gives explicit ranges). A default
  3-band split is used via `scoringConfig.bands`, overridable per version. See
  `strategies/categoryAverageBand.ts`.

A strategy may return one or many `resultKeys` (`ScoringOutput.resultKeys`).
`CATEGORY_AVERAGE_BAND` returns one key per category (e.g. `communication:high`,
`trust:medium`, ...) and `FRAMEWORK_SNIPPET_ASSEMBLY` one per selected snippet.
`scoringEngine.ts` matches every key independently against its own
`ResultDefinition` -- never a joined/combined lookup key, and never a
pre-generated cross-product of definitions -- then assembles whatever matched
into one generic result payload: a stable, order-independent `resultKey`; the
full list of matched `ResultDefinition._id`s (`resultDefinitionIds`) for
traceability, alongside a primary `resultDefinitionId` (the first match, kept
for simple single-result lookups); and a frozen `snapshot.results[]` array (one
entry per matched definition, always populated) that the result page renders
category-level interpretations from without ever depending on a live
`ResultDefinition`. See `scoringEngine.test.ts` for the Relationship-style
walkthrough.

## Deployment requirement: MongoDB must be a replica set

`createAttemptFromPurchase` (Purchase → Attempt funding) uses a MongoDB
multi-document transaction (`mongoose.startSession().withTransaction(...)`),
which **requires MongoDB to be a replica set** (Atlas provides this by
default on every tier, including the free/shared ones). Pointing
`MONGODB_URI` at a standalone `mongod` will make every attempt-creation
request fail. For local development against a standalone install, initiate a
single-node replica set once (`mongosh --eval "rs.initiate()"`, or start
`mongod` with `--replSet` and run `rs.initiate()`), then connect with
`?replicaSet=<name>` in the URI.

## Payment provider: PayPal

The payment gateway is **PayPal** (Orders v2 API), not Stripe. The flow:

1. `POST /api/purchases` (`purchases.service.ts::initiatePurchase`) creates a
   `pending` `Purchase`, then calls PayPal to create an Order (`intent:
   CAPTURE`, `purchase_units[0].custom_id` = the Purchase id) and returns its
   `approveUrl` (PayPal's hosted approval page) to the frontend, which
   redirects the browser there.
2. After the buyer approves, PayPal redirects back to `PAYPAL_RETURN_URL`
   with our own `purchaseId` query param plus PayPal's own `token`
   (order id) and `PayerID`. Landing there is **not** treated as proof of
   payment -- the frontend calls `POST /api/purchases/:id/capture`
   (`purchases.service.ts::capturePurchase`), which calls PayPal's Capture
   Order endpoint server-side; only a `COMPLETED` response flips the
   Purchase to `paid`.
3. A PayPal webhook (`PAYMENT.CAPTURE.COMPLETED`, verified via PayPal's
   `/v1/notifications/verify-webhook-signature` API -- there is no local-HMAC
   option like Stripe's) is a reliability backup that can complete the same
   transition independently (e.g. if the buyer closes the tab before
   returning, or the capture call races the webhook). Both paths use the
   same atomic conditional updates (`pending -> capturing -> paid`) so
   exactly one of them wins and neither can double-capture or leave the
   purchase stuck.
4. `initiatePurchase`'s Purchase→Attempt funding step is unrelated to which
   payment provider is used and unchanged: a `Purchase` still funds at most
   one `TestAttempt` (transaction + unique sparse index on `attemptId`).

PayPal credentials (sandbox by default): `PAYPAL_CLIENT_ID`,
`PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` (from a webhook subscribed to
`PAYMENT.CAPTURE.COMPLETED` in the PayPal developer dashboard),
`PAYPAL_RETURN_URL`, `PAYPAL_CANCEL_URL`. See `.env.example`.

Configuration uses the real PayPal flow by default:

```env
PAYMENTS_MODE=paypal
PAYPAL_MODE=sandbox
PAYPAL_CURRENCY=USD
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
```

For local/demo video recording only, the backend may use:

```env
NODE_ENV=development
PAYMENTS_MODE=demo
```

Demo mode creates a backend-controlled `Purchase` with `paymentProvider=demo`
and `paid` status without calling PayPal. The frontend cannot submit a paid
status or select the provider; the backend environment decides the mode.
Demo mode is rejected at startup when `NODE_ENV=production`.

In the current Sandbox environment, OAuth, order creation, and buyer approval
work, but PayPal Capture has returned `422 UNPROCESSABLE_ENTITY` with
`COMPLIANCE_VIOLATION`, including for a minimal USD 1.00 diagnostic order.
The application handles this safely: it logs only sanitized payment metadata,
marks the purchase failed, shows a generic user-facing error, never marks the
purchase paid, and never grants test access. An approved PayPal order is never
treated as a successful payment; only a validated server-side Capture response
with `COMPLETED` status and a capture id can create the successful entitlement.

The production deployment must use valid PayPal Live credentials and the Live
API base URL. Never put PayPal secrets in frontend environment variables or
source code.

## Bugs found and fixed via real end-to-end verification (pre-PayPal)

The following were caught by actually running the app against a real
MongoDB instance under real HTTP traffic, back when the payment provider was
still Stripe (unit tests with mocked models could not have caught any of
these, since each is a real index/driver/library interaction). The first two
are provider-independent and still apply as-is; the Stripe-specific one is
listed for history since that code has since been replaced by PayPal above.

- **`Purchase.attemptId` sparse unique index was not actually sparse in
  practice.** The schema set `default: null` on `attemptId`, so every new
  Purchase document got the field explicitly set to `null` rather than left
  absent. MongoDB's sparse-index exclusion only skips documents where a field
  is truly *missing* -- an explicit `null` still counts as an indexed value --
  so the second purchase ever created in the database would fail outright
  with an `E11000 duplicate key` error. Fixed by removing the default
  (`models/Purchase.ts`); every read of `attemptId` already treats "absent"
  and "explicit null" the same way, so this required no other code changes.
- **`scoringConfig` empty-object check blocked publishing for almost every
  strategy, forever, regardless of content completeness.** The old check
  failed activation whenever `scoringConfig` was `{}`, but 5 of the 7
  strategies never read `scoringConfig` at all, and `CATEGORY_AVERAGE_BAND`
  has a documented built-in default when it's omitted. Only
  `WEIGHTED_DICHOTOMY` actually needs it (`scoringConfig.dichotomies`). Fixed
  by moving that requirement into `validateByScoringMethod`'s
  `WEIGHTED_DICHOTOMY` case, where it belongs, and removing the blanket check
  (`modules/admin/validation.service.ts`).
- **Malformed JSON request bodies returned 500, not 400.** `express.json()`'s
  underlying body-parser throws a plain `SyntaxError` (not an `AppError`) on
  invalid JSON, which fell through to the generic 500 handler. Fixed by
  recognizing `err.type === 'entity.parse.failed'` in `errorHandler.ts` and
  returning a clean 400.
- *(Historical, Stripe-only, no longer applicable)* Stripe webhook signature
  verification was needlessly coupled to `STRIPE_SECRET_KEY` even though it
  was pure local HMAC verification against a different secret. This class of
  bug does not apply to the PayPal integration: PayPal's verify call
  legitimately requires an OAuth token from the client id/secret, since
  there is no local-only verification path at all.

## Known incomplete content

`npm run seed` seeds all 7 tests, but **none of them auto-publish**. Spirit
Animal, IQ/Cognitive, and Cube Personality are seeded as `draft` with
`scoringConfig.pendingContentConfirmation: true`, which
`validateTestVersionForActivation()` explicitly checks for and refuses to
clear. MBTI, Inner Child, Five Love Languages, and Relationship have complete
questions and scoring, but their `ResultDefinition` copy is seeded as
placeholder text (`[PLACEHOLDER TEXT ...]`, see `src/seed/builders.ts`) --
`validateTestVersionForActivation()` generically scans every result text field
for placeholder markers (`src/utils/placeholderContent.ts`) and refuses to
publish while one is present, regardless of which test it is. None of the 7
can accidentally go live. See root `README.md` for the full breakdown.
