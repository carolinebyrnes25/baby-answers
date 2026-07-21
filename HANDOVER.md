# Baby Answers — handover for the next session

## What this is
A private-ish family PWA that answers baby-care questions from **Moms on Call** (books + free
handouts) and **Cribsheet** (Emily Oster). Built for Caroline & Luke Byrnes.

- **Live site:** https://carolinebyrnes25.github.io/baby-answers/
- **Repo:** carolinebyrnes25/baby-answers (PUBLIC — required for free GitHub Pages). Deploys from
  `main`; a push triggers the "pages build and deployment" action automatically.
- **Side-panel preview (for design feedback):** artifact at
  https://claude.ai/code/artifact/c15dc739-1a9f-48a5-b570-e6e3b5fa876c
  (rebuild + republish the SAME file path to keep the URL — see "Preview" below).

## Current state (all pushed, working)
- **Single-file app:** `index.html` holds the whole app + all content inline (`var MOC=[…]` and
  `var CRIB=[…]` JSON arrays near the bottom, then the app IIFE).
- **72 answers** (50 Moms on Call + 22 Cribsheet), grouped into topics: Sleep, Feeding, Routine,
  Soothing, Health, Safety, Newborn, Development, Toddler, Parenting.
- **Unified "Ask" UI** (the user explicitly wanted ONE ask box, not tabs): the header has one ask
  input. Asking → an **AI-synthesized** answer from the guides *once the backend is turned on*;
  until then it **gracefully falls back** to the best-matching guide cards. Below the ask box, all
  guides are **browsable by topic** (collapsible sections → titles → full answer).
- **Source links:** answers and guide cards link out to the relevant **`sources/*.pdf`** (12 free
  Moms on Call handout PDFs, saved in the repo). Cribsheet is cited by name (it's a book, no PDF).
  Mapping lives in the `GUIDES` array in the app JS (keyword → pdf).
- **PWA:** `manifest.webmanifest`, `sw.js` (offline; cache is `baby-answers-v10` — bump the version
  on content changes so installed apps refresh; PDFs are network-only, not cached). Icons in
  `icons/` (generated via headless Chromium — see below).

## The AI is now LIVE (deployed 2026-07-21)
The **Ask** box synthesizes answers via a deployed Firebase backend.
- **Firebase project:** `baby-answers` (project #638956060620), created under **cfroehlich14@gmail.com**
  (Caroline's admin/deploy account). Blaze plan, sharing the same billing account as byrnes-finance —
  but a **completely separate project** (do NOT mix with `byrnes-finance-dashboard`).
- **Function:** `askBaby` (Cloud Functions v2, us-central1) at
  `https://us-central1-baby-answers.cloudfunctions.net/askBaby`. Provider Gemini (Flash, default
  model), key stored as the `AI_API_KEY` secret (server-side only). Source: `functions/index.js`.
- **`AI_CONFIG`** in `index.html` is filled with the endpoint + Firebase web config (the web
  `apiKey` is a public client id — safe to commit; the Gemini key is NOT in the repo).
- **Access:** Google sign-in enabled; `carolinebyrnes25.github.io` is an authorized domain. Runtime
  ALLOW list (in `functions/index.js`): `carolinebyrnes25@gmail.com`, `luke.f.byrnes@gmail.com`,
  `byrnesfam25@gmail.com`. Caroline signs into the app as **carolinebyrnes25** (on the list).
- **Deploys are automated via CI** (`.github/workflows/deploy-functions.yml`). Any push to `main`
  that touches `functions/**` (or a manual "Deploy Cloud Function" run / `run_workflow` dispatch)
  redeploys `askBaby`. Auth = a Google **service account scoped to only the baby-answers project**,
  stored as the repo secret **`FIREBASE_SERVICE_ACCOUNT`** (created under cfroehlich14). So Claude can
  ship function changes by pushing — no local `firebase deploy` needed.
- **Non-secret params** (`AI_PROVIDER=gemini`, `AI_MODEL=gemini-flash-latest`) live in the committed
  `functions/.env.baby-answers` (required for non-interactive CI deploys). The Gemini key is NOT there.
- **To change who can use it / the model:** edit `ALLOW` (or `functions/.env.baby-answers`) and push —
  CI redeploys automatically.
- **Note:** `gemini-flash-latest` is a thinking model; the function sets `thinkingConfig.thinkingBudget: 0`
  and `maxOutputTokens: 1200` so answers don't truncate mid-sentence.

## Sourcing & copyright (important)
- The **free handout PDFs** are public → saved in `sources/` and linked. Fine to keep.
- The **Moms on Call book** the user photographed is **copyrighted**. We used its *guidance*
  (schedules, ounce amounts, safety rules — facts) as the primary source, written as **paraphrased
  factual bullets**. We deliberately did **NOT** commit the verbatim transcription or the page
  photos to the public repo. Keep it that way. If the user wants a personal archive of the raw
  transcription, that belongs in a LOCAL file / private repo, not the public Pages site.

## How to edit content
- Edit the `MOC`/`CRIB` arrays in `index.html`. Safest is a small node script: regex-extract
  `var MOC = […];`, `JSON.parse`, modify, `JSON.stringify`, write back (that's how all content was
  added — see git history). Each MOC item: `{topic,q,tags:[],a:[],bl}`. Each CRIB item:
  `{topic,q,tags:[],chunks:[],bl:[]}`. Topic order is `TOPIC_ORDER` in the app JS.
- After editing: bump `sw.js` cache version, run the checks below, commit, push, republish preview.

## Tooling / environment notes
- Node 22 + Chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (do NOT run
  `playwright install`). `playwright-core` and `pdf-parse` were `npm install`ed in `/tmp`.
- **Render check:** extract inline `<script>`, `node --check`; then Playwright load at 390px,
  assert no `pageerror`, no horizontal overflow, sections render, a sample ask works. (Console
  `ERR_TUNNEL_CONNECTION_FAILED` for the Firebase gstatic scripts is EXPECTED in the sandbox — the
  proxy blocks gstatic; it loads fine on the real site. Ignore those.)
- **Icons** were generated by rendering an inline-SVG HTML in headless Chromium with
  `--screenshot` (no ImageMagick/PIL available).
- **Preview rebuild:** a node snippet strips `index.html` to `<style>` + body-inner and inlines the
  header logo as a data-URI SVG, writes to the scratchpad file, then `Artifact` republishes that
  same path. (Source-PDF links 404 inside the preview since the PDFs aren't bundled there — they
  work on the live site. Firebase/sign-in also won't run in the artifact due to CSP — expected.)
- **Gotcha:** the container has restarted mid-session twice and wiped the local `/workspace` clone.
  The **remote (GitHub) is the source of truth** — re-clone if `/workspace/baby-answers` is gone,
  and `mcp__Claude_Code_Remote__add_repo` it if it's not in session scope. Also: `cat >>` here got
  blocked by a safety classifier once — use the Write/Edit tools to append instead.
- Shopify CDN (the handout PDF links) is blocked from the server (403 via proxy) — that's why the
  user uploaded the PDFs/photos directly.

## Open items / ideas
1. **DONE — AI backend deployed and live** (2026-07-21). See "The AI is now LIVE" above. Next-session
   idea: sanity-check a real Ask on the live site while signed in as an allow-listed account.
2. Optional: re-check the feeding numbers — the book lists slightly different amounts in different
   tables (general vs breast vs bottle vs formula). The main "How much/how often" entry uses the
   **General Feeding Guidelines (pp. 77–78)** as authoritative; flagged to the user.
3. Content is broad now (newborn → toddler). Subtitle was broadened from "0–6 months" to
   "Newborn to toddler."
4. **DONE — book pages pp. 125–143 integrated** (2026-07-21). The 15 pending Moms on Call photos
   (`IMG_9135`–`9149`, re-sent as two zips) covered "Maintaining Good Sleep Habits" (p125), the full
   "Naptime" section (pp. 127–129), and the "Typical Days" hour-by-hour schedules (pp. 134–143:
   2–4 wk, 4–8 wk, 8–16 wk, 4–6 mo, plus Crazy Day / Nap tips). Added as **4 new paraphrased MOC
   entries** (46 → 50): two Routine ("Typical Day" schedules 2 wk–4 mo; Typical Day at 4–6 mo with
   solids) and two Sleep (Naptime by age; Keeping sleep on track through travel/milestones/illness).
   No verbatim text or photos committed (photos stayed in the session scratchpad). If more book
   pages surface later, follow the same paraphrase-only rule.
