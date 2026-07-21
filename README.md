# Baby Answers

A tiny, installable web app (PWA) that answers common baby-care questions for the
**0–6 month** stage. Every answer is drawn from just two sources:

- **Moms on Call** — the free 0–6 month guides (daily routine, sleep, swaddling, safe sleep, feeding, starting solids).
- **Cribsheet** by Emily Oster — chapter takeaways on what the research does and doesn't show (breastfeeding, back-sleeping/SIDS, bed-sharing, sleep training, vaccines, early allergens, and more).

Type a question (e.g. *sleep*, *feeding*, *swaddle*, *fever*) and it filters live. You can also
filter by source. It works offline and can be added to a phone's home screen.

> **Not medical advice.** This is a personal quick-reference/memory aid, not a substitute for your
> pediatrician. For anything urgent — or any fever in a baby under 3 months — call your doctor, and
> always follow current AAP safe-sleep guidance.

## Live site

Served from GitHub Pages: **https://carolinebyrnes25.github.io/baby-answers/**

Add to a phone: open that URL in Safari (iPhone) or Chrome (Android) → **Share → Add to Home Screen**.
It then opens full-screen and works offline. The same URL works on any phone.

## What's in here

| File | Purpose |
|------|---------|
| `index.html` | The entire app — search UI, styling, and all content inline. |
| `manifest.webmanifest` | Makes it installable (name, icons, colors). |
| `sw.js` | Service worker for offline support. |
| `icons/` | App icons (192, 512, 512-maskable, apple-touch, favicon). |

There is **no build step and no backend** — it's a static site. Never add secrets.

## Editing the content

All answers live inline in `index.html`, in two arrays near the bottom of the file:

- `var MOC = [ … ]` — Moms on Call entries. Each: `{ topic, q, tags:[…], a:[…bullets], bl }`.
- `var CRIB = [ … ]` — Cribsheet chapter takeaways. Each: `{ topic, q, tags:[…], chunks:[…bullets], bl:[…] }`.

`tags` are extra keywords the search should match (they aren't shown). To add or fix an answer, edit the
array, then commit and push:

```bash
git add . && git commit -m "update content" && git push
```

The live site auto-updates within a minute or two. To force phones to drop cached content, bump the
version string in `sw.js` (`baby-answers-v1` → `baby-answers-v2`), then commit and push.

## Deploy

GitHub Pages serves `main` at the repo root (`/`). Pushing to `main` republishes the site.
Because the app is loaded from the `/baby-answers/` sub-path, all links inside it are **relative** —
keep them that way if you add files.
