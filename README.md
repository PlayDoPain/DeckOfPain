# Deck of Pain III

A browser-based card game. The app deals and scores the cards; players build poker-style hands.

**Play:** `https://playdopain.github.io/DeckOfPain/` (once Pages is enabled)

## Features

- Poker-style hands (Single, Pair, Flush, Straight, Three of a Kind), a wild Joker and replayable rounds.
- Game parameters set in [`config/game.yaml`](config/game.yaml).
- Responsive layout for phones, tablets and desktops, including Safari on iOS and iPadOS.
- CSS-only animations (they switch off for visitors who prefer reduced motion).
- Summary screen at the end of a game, which can be saved as a picture.
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
| `index.html`, `css/style.css` | Page layout and styling |
| `js/engine.js` | Deck, scoring, hand evaluation |
| `js/app.js` | UI, round flow, "save as picture" |
| `js/icons.js` | Vector icons |
| `js/yaml.js` | Minimal reader for `config/game.yaml` |
| `config/game.yaml` | All game parameters |
| `poster.html` | Standalone rules sheet |
| `assets/cards/` | Playing-card SVGs, unmodified |
| `assets/credits/` | Card library authors, license text, changelog, Q&A |
| `docs/` | Build notes |
| `tests/` | Engine tests |
| `.github/workflows/` | CI and GitHub Pages deployment |

## Deployment

Every push to `main` runs the tests and publishes the site to GitHub Pages through [`.github/workflows/pages.yml`](.github/workflows/pages.yml). Only the files the site needs are published.

## Credits and licenses

- **Game design:** Deck of Pain by u/PlayDoPain.
- **Playing cards:** [Vector Playing Cards 3.2](https://totalnonsense.com/open-source-vector-playing-cards/) by **Chris Aguilar** (totalnonsense.com), licensed under the [GNU LGPL 3.0](https://www.gnu.org/licenses/lgpl-3.0.html). The card artwork is used unmodified. Alternate Joker by John Merrill, colored version by Chris Aguilar. The library's authors file, license text, changelog and Q&A are in [`assets/credits/`](assets/credits/).
- The same attribution appears in the footer of every page of the site.
