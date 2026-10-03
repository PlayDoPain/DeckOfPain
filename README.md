# Deck of Pain III

A card-based game for consenting adults, playable in the browser. The app plays **Sir**: it shuffles the deck, picks an implement and draws the Punishment. **Boy** holds a Hand of cards and can counter with Mercy.

> **Adults only (18+).** The site contains no explicit content: playing cards, rules text and simple icons only.

**Play:** `https://playdopain.github.io/DeckOfPain/` (once Pages is enabled)

## Features

- Rules from the v3.3 (Patch 3) poster: Punishment, five Mercy hands (Single, Pair, Flush, Straight, Three of a Kind), wild Joker, New Game+, restraints and clothing.
- Configurable implements, Privileges and game parameters via [`config/game.yaml`](config/game.yaml).
- Responsive layout for phones, tablets and desktops, including Safari on iOS and iPadOS.
- CSS-only animations (they switch off for visitors who prefer reduced motion).
- End-of-game statistics, with an option to save them as a picture.
- **Privacy:** nothing is stored. No cookies, no local storage, no analytics, no server.

## Run locally

No build step or dependencies. The page loads its configuration with `fetch`, so serve it over HTTP rather than opening the file directly:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Tests

The rules engine has plain Node tests (Node 18+):

```bash
node tests/engine.test.js
```

## Project layout

| Path | Purpose |
|---|---|
| `index.html`, `css/style.css` | Cover, setup, round and game-over screens |
| `js/engine.js` | Rules: deck, Punishment, Mercy hand evaluation |
| `js/app.js` | UI, round flow, "save as picture" |
| `js/icons.js` | Vector icons for implements, clothing and restraints |
| `js/yaml.js` | Minimal reader for `config/game.yaml` |
| `config/game.yaml` | All game parameters |
| `poster.html` | Standalone v3.3 rules poster |
| `assets/cards/` | Playing-card SVGs, unmodified |
| `assets/credits/` | Card library authors, license text, changelog, Q&A |
| `docs/` | Original build spec and rules decisions |
| `tests/` | Engine tests |
| `.github/workflows/` | CI and GitHub Pages deployment |

## Deployment

Every push to `main` runs the tests and publishes the site to GitHub Pages through [`.github/workflows/pages.yml`](.github/workflows/pages.yml). Only the files the site needs are published.

## Rules decisions

Where the poster is silent, the app follows these choices. See [`docs/game-spec.md`](docs/game-spec.md) for the original brief.

- The deck is 52 cards plus 2 Jokers. A Joker is worth 10 and is wild in Boy's Hand.
- Boy's Hand starts with 3 cards and gains 1 per round. Sir draws first, so a nearly empty pile goes to Sir.
- Boy gets one Mercy counter per round. A Straight Flush offers both options.
- A Single cannot reduce swats below 0. A Pair is unavailable when the pile is empty.
- Straights allow Ace low or high, with no wrap-around.
- Flush: Boy picks the implement from the selected list.
- Three of a Kind: Boy rewrites the Privilege for the current mode.
- Played Mercy cards and Sir's cards go to the discard pile. New Game+ reshuffles only the discards, and Boy keeps his Hand.

## Credits and licenses

- **Game design:** Deck of Pain by u/PlayDoPain.
- **Playing cards:** [Vector Playing Cards 3.2](https://totalnonsense.com/open-source-vector-playing-cards/) by **Chris Aguilar** (totalnonsense.com), licensed under the [GNU LGPL 3.0](https://www.gnu.org/licenses/lgpl-3.0.html). The card artwork is used unmodified. Alternate Joker by John Merrill, colored version by Chris Aguilar. The library's authors file, license text, changelog and Q&A are in [`assets/credits/`](assets/credits/).
- The same attribution appears in the footer of every page of the site.
