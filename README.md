# Baby Answers

A tiny, installable web app (PWA) that answers baby-care questions from **newborn to toddler**.
Every answer is drawn from just two sources:

- **Moms on Call** — the guides and books (daily routine & "Typical Day" schedules, sleep,
  swaddling, safe sleep, feeding amounts, naps, starting solids, health, safety, toddler).
- **Cribsheet** by Emily Oster — chapter takeaways on what the research does and doesn't show
  (breastfeeding, back-sleeping/SIDS, bed-sharing, sleep training, vaccines, early allergens, …).

Ask a question in one box. Signed in, you get an **AI-synthesized answer** compiled from the whole
library; otherwise it falls back to the closest guide cards. All guides are also **browsable by
topic**. It works offline and can be added to a phone's home screen. Light and dark themes.

> **Not medical advice.** A personal quick-reference/memory aid, not a substitute for your
> pediatrician. For anything urgent — or any fever in a baby under 3 months — call your doctor, and
> always follow current AAP safe-sleep guidance.

## Live site

GitHub Pages: **https://carolinebyrnes25.github.io/baby-answers/** (deploys from `main` on push).

Add to a phone: open that URL in Safari (iPhone) or Chrome (Android) → **Share → Add to Home
Screen**. It then opens full-screen and works offline.

## How answering works

- The **browse** view and keyword **fallback** are pure static HTML/JS — no login, no backend.
- The **AI "Ask"** box calls a small **Firebase Cloud Function** (`functions/askBaby`) that holds a
  Gemini key server-side. It's gated to a Google sign-in **allow-list** (Caroline + Luke) and
  CORS-locked to the Pages origin, so the paid endpoint can't be abused.
- On each question the app sends its **entire source library** (~14k tokens, most-relevant-first) to
  the model, which **compiles a complete answer across all sources** — see `contextFor` and
  `BASE_SYS` in `index.html`. No keyword-retrieval gaps.

See **`DEPLOY.md`** for the backend (it's already deployed; that doc also covers how changes ship).

## What's in here

| Path | Purpose |
|------|---------|
| `index.html` | The entire front-end — UI, styling, and all content inline (`var MOC`, `var CRIB`). |
| `functions/` | The `askBaby` Cloud Function (Gemini proxy, allow-list, CORS) + its config. |
| `firebase.json`, `.firebaserc` | Firebase project config (project id `baby-answers`). |
| `.github/workflows/deploy-functions.yml` | CI that auto-deploys the function on `functions/**` changes. |
| `manifest.webmanifest` | Makes it installable (name, icons, colors). |
| `sw.js` | Service worker for offline support (bump `CACHE` on every change). |
| `icons/` | App icons (192, 512, 512-maskable, apple-touch, favicon). |
| `sources/` | The free Moms on Call handout PDFs that answers link out to. |

**Never commit secrets.** The only key (Gemini) lives in Cloud Functions Secret Manager, not the
repo. The Firebase *web* config in `AI_CONFIG` is a public client identifier and is safe to commit.

## Editing the content

All answers live inline in `index.html`, in two arrays near the bottom:

- `var MOC = [ … ]` — Moms on Call. Each: `{ topic, q, tags:[…], a:[…bullets], bl }`.
- `var CRIB = [ … ]` — Cribsheet. Each: `{ topic, q, tags:[…], chunks:[…bullets], bl:[…] }`.

Safest edit is a small Node script: regex-extract the array, `JSON.parse`, modify, `JSON.stringify`,
write back. Then **bump `CACHE` in `sw.js`**, commit, and push:

```bash
git add . && git commit -m "update content" && git push
```

GitHub Pages auto-updates within a minute or two.

### Formatting answers

The renderer understands a light markup in answer bullets and AI output:

- `- ` bullets and `**bold**` labels.
- `§ Section label` on its own line → a sub-heading.
- `7 am — activity` (a clock time, an em dash, then text) → an aligned schedule row.
- A final `Bottom line: …` line → a boxed summary.
- A final `Note: …` line (AI answers) → a small "Disclaimer" tooltip.

## Copyright

The free handout PDFs are public (kept in `sources/`, linked). The Moms on Call **book** is
copyrighted — the app stores only **paraphrased factual guidance**, never verbatim book text or the
page photos.
