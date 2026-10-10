# LiberRated MVP demo

A working prototype of LiberRated, a web app that makes it easy to find accessible, allergen-friendly businesses and helps businesses become more accessible.

**Stack:** React (Vite), Express, MongoDB.

## Run it

```sh
npm install
npm start          # builds the client and serves everything on http://localhost:3001
```

With no `MONGODB_URI` set, the server starts a local MongoDB that saves to `server/.data` and loads fictional demo businesses the first time it runs. Delete that folder to reset the demo. To use a real database instead:

```sh
MONGODB_URI="mongodb+srv://..." npm start
```

To turn on the AI summary, also set `ANTHROPIC_API_KEY`.

For development, run `npm run dev -w server` and `npm run dev -w client` in two terminals (Vite proxies `/api` to the server).

Tests: `npm test`

## What it does

- **Set your needs once.** Choose from 17 needs across mobility, sight, hearing and communication, cognitive and sensory comfort, and allergens. Places are ranked by how many of your needs they meet. Your needs are saved on the device only, so there's no account to create.
- **"How it fits you".** Every place page checks each of your needs: confirmed by visitors, listed but not yet confirmed, or not offered.
- **AI summary (optional).** With `ANTHROPIC_API_KEY` set, Claude reads the reviews and writes a 2–3 sentence summary for *your* needs, including any warnings reviewers raised. Without a key, everything else still works.
- **Ask for an upgrade.** If a need isn't met, ask the business for it in one tap. Each place shows the most-requested upgrades alongside a practical, low-cost tip for the owner.
- **Community verification.** A business *lists* a feature, and visitors *confirm* it in their reviews.
- **Map and "Near me".** Results appear on an OpenStreetMap map with numbered pins that match the list. "Near me" sorts places by distance, among places that meet the same number of your needs. Your location is never stored or sent to the server.
- **For businesses.** List your place and get a live accessibility snapshot with quick wins. New addresses are geocoded with OpenStreetMap so they show up on the map.
- **Owner dashboard with no accounts.** Publishing a listing returns a private owner link that holds a random key. The server stores only a hash of that key. The key is in the URL fragment (after the #), which browsers never send to servers. The dashboard shows the requests, the rating and the feature count, and the owner can mark requests as done, which updates the public listing. To try it, open the demo dashboard at `/#/owner/6a0000000000000000000001/demo-owner`.
- **The app itself is accessible.** Every page passes axe-core WCAG 2.2 AA checks with 0 violations. Semantic forms (fieldsets and legends), a skip link, focus moved to the new page on each route change, live regions for results and status messages, toggle chips that stay real checkboxes underneath, map pins kept out of the tab order (the numbered list is the accessible equivalent), 44px touch targets, text contrast of at least 7:1, and support for reduced motion and Windows high-contrast mode.

## Layout

```
shared/features.js   feature list used by both client and server
server/app.js        API: places, reviews, upgrade requests, insight
server/insight.js    Claude summary of reviews for a visitor's needs (claude-opus-5-5)
server/geocode.js    address to coordinates via OpenStreetMap Nominatim
server/seed.js       fictional demo data
client/src/          React views: Search (with MapView), Place, ListBusiness, Owner
```
