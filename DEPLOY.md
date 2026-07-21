# Turning on the "Ask" (AI chat) — one-time setup

The Baby Answers **site itself needs nothing** — browse and search already work, free and
offline, with no login. This is only for the optional **Ask** box (AI chat over the guides).

It runs on a tiny backend that holds your Gemini key. Everything here is **self-contained in
this repo** — it is not connected to any other project.

## What you need
- A **Firebase project** for this app (its own, separate from anything else). Create one at
  <https://console.firebase.google.com> — any name, e.g. `baby-answers`.
- **Blaze (pay-as-you-go)** billing on it (Cloud Functions require it). A few AI questions a
  day costs pennies; set a budget alert if you like.
- A **Gemini API key** from <https://aistudio.google.com/apikey> (reuses your Google billing).
- The Firebase CLI: `npm i -g firebase-tools` and `firebase login`.

## Steps (from a copy of this repo on your laptop)
1. **Point at your project:** open `.firebaserc` and replace `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID`
   with your project id (or run `firebase use --add`).
2. **Store the key:** `firebase functions:secrets:set AI_API_KEY` → paste your Gemini key.
3. **Deploy the function:** `firebase deploy --only functions`
   - Copy the printed URL for `askBaby` (looks like
     `https://us-central1-<project>.cloudfunctions.net/askBaby`).
4. **Enable sign-in:** Firebase console → **Authentication** → get started → enable **Google**.
5. **Authorize the site:** Authentication → **Settings** → **Authorized domains** → add
   `carolinebyrnes25.github.io`.
6. **Wire the app to it:** in `index.html`, find the `AI_CONFIG` block near the bottom and fill in:
   - `endpoint`: the `askBaby` URL from step 3.
   - `firebase`: your project's **web config** (Firebase console → Project settings → your web app →
     SDK config: `apiKey`, `authDomain`, `projectId`, etc.).
   Then commit & push — GitHub Pages redeploys automatically.

That's it. Open the site, tap **Ask**, sign in with Google (you and Luke are on the allow-list in
`functions/index.js`), and ask away.

## Costs & safety
- Only signed-in, allow-listed accounts (you + Luke) can reach the endpoint, so it can't be abused.
- Gemini Flash is very cheap; typical use is a few cents a month.
- To change who can use it, edit `ALLOW` in `functions/index.js` and redeploy.
