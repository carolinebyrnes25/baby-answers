# The "Ask" AI backend — status & how it deploys

**Status: LIVE (set up 2026-07-21).** The Ask box works. This doc records how it's wired and how to
change it. The site's browse/search work with no backend or login; only the AI answer uses this.

Everything here is **self-contained in this repo** and **separate from any other project**.

## What's deployed

- **Firebase project:** `baby-answers` (project #638956060620), on the **Blaze** plan. Created and
  owned by the admin Google account (**cfroehlich14@gmail.com**), sharing the same billing account as
  other projects but fully isolated from them.
- **Function:** `askBaby` — Cloud Functions v2, `us-central1`, at
  `https://us-central1-baby-answers.cloudfunctions.net/askBaby`. Source: `functions/index.js`. It's a
  thin proxy: the browser does retrieval and sends the source library in `system`; the function holds
  the key and enforces auth.
- **Model:** Gemini via the `gemini-flash-latest` alias (auto-tracks the current stable Flash). Set
  in `functions/.env.baby-answers` (`AI_PROVIDER=gemini`, `AI_MODEL=gemini-flash-latest`) — these are
  **non-secret** params, committed so CI can deploy non-interactively.
- **Secret:** the Gemini API key is stored as the `AI_API_KEY` Cloud Functions secret (Secret
  Manager) — **not** in the repo.
- **Auth:** Google sign-in enabled; `carolinebyrnes25.github.io` is an Authorized Domain. Runtime
  **allow-list** (in `functions/index.js` → `ALLOW`): `carolinebyrnes25@gmail.com`,
  `luke.f.byrnes@gmail.com`, `byrnesfam25@gmail.com`, `hlbyrnes@aol.com`,
  `elise.byrnes@gmail.com`. Caroline signs into the app as `carolinebyrnes25`.
- **App wiring:** `AI_CONFIG` in `index.html` holds the endpoint URL + the Firebase **web** config
  (public client id — safe to commit).

## Deploys are automatic (CI)

`.github/workflows/deploy-functions.yml` redeploys `askBaby` whenever `functions/**` changes on
`main` (or via a manual "Deploy Cloud Function" run in the Actions tab). It authenticates with a
**Google service account scoped to only the baby-answers project**, stored as the repo secret
`FIREBASE_SERVICE_ACCOUNT`. So **function changes ship by pushing** — no local `firebase deploy`.

Front-end changes (`index.html`, etc.) ship via **GitHub Pages** on any push to `main`.

## Common changes

- **Change who can use the AI:** edit `ALLOW` in `functions/index.js`, push → CI redeploys.
- **Change the model/provider:** edit `functions/.env.baby-answers`, push → CI redeploys. (Options in
  code: `gemini`, `anthropic`, `openai` — each needs its own key in the `AI_API_KEY` secret.)
- **Rotate the Gemini key:** `firebase functions:secrets:set AI_API_KEY` (needs the Firebase CLI +
  the owner login), then trigger a redeploy.
- **Answer completeness/length:** the function sends the whole library; `MAX_TOKENS` (output cap) and
  the 200k-char `system` input cap are in `functions/index.js`.

## Costs & safety

- Only signed-in, allow-listed accounts can reach the endpoint (auth + CORS), so it can't be abused.
- Full-library context is ~14k input tokens/question on Gemini Flash — a fraction of a cent each;
  typical use is a few cents a month. Set a Blaze budget alert if you want.

---

## Appendix — how it was set up from scratch (for reference / disaster recovery)

1. Create the Firebase project; enable **Blaze** (reuse an existing billing account is fine).
2. Get a **Gemini API key** at <https://aistudio.google.com/apikey>.
3. `npm i -g firebase-tools && firebase login`; `firebase use baby-answers`.
4. `firebase functions:secrets:set AI_API_KEY` → paste the key.
5. First deploy from a clone: `cd functions && npm install && cd .. && firebase deploy --only functions`.
6. Firebase console → **Authentication** → enable **Google**; **Settings → Authorized domains** → add
   `carolinebyrnes25.github.io`.
7. Register a **web app** (Project settings → Your apps → `</>`) and put its config + the `askBaby`
   URL into `AI_CONFIG` in `index.html`.
8. For CI: create a service account with project access, download a JSON key, and store it as the
   `FIREBASE_SERVICE_ACCOUNT` GitHub Actions secret.
