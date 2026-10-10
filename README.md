# Deck of Pain III

A browser-based card game for one or two players. The app deals and scores the cards; players build poker-style hands.

**Play:** `https://playdopain.github.io/DeckOfPain/` (once Pages is enabled)

## Features

- Poker-style hands (Single, Pair, Flush, Straight, Three of a Kind), a wild Joker, and replayable rounds.
- One-player and two-player modes. Two players needs a landscape tablet or desktop screen.
- A how-to-play page with an annotated sample round.
- Game parameters set in [`config/game.yaml`](config/game.yaml).
- Responsive layout for phones, tablets, and desktops, including Safari on iOS and iPadOS.
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
| `poster.html` | Older standalone rules sheet (v3.3), no longer linked |
| `assets/cards/` | Playing-card SVGs, unmodified |
| `assets/credits/` | Card library authors, license text, changelog, Q&A |
| `vendor/` | html2canvas, used only by "Save as image" on the cover |
| `LICENSE`, `NOTICE`, `LICENSE-CONTENT-CC-BY-4.0.txt` | Licenses (see below) |
| `docs/` | Build notes |
| `tests/` | Engine tests |
| `.github/workflows/` | CI and GitHub Pages deployment |

## Deployment

Every push to `main` runs the tests and publishes the site to GitHub Pages through [`.github/workflows/pages.yml`](.github/workflows/pages.yml). Only the files the site needs are published.

## License

| What | License |
|---|---|
| Source code (`js/`, `css/`, `index.html`, `tests/`, workflow) | [Apache-2.0](LICENSE). Keep the license and the [NOTICE](NOTICE) file when you redistribute, and state your changes. |
| Game rules, written content, poster, and icon artwork | [CC BY 4.0](LICENSE-CONTENT-CC-BY-4.0.txt). Credit "Deck of Pain by u/PlayDoPain" and link back. |
| Playing-card artwork (`assets/cards/`) | **Not ours.** "Vector Playing Cards 3.2" by Chris Aguilar, [LGPL 3.0](assets/credits/). Used unmodified. |
| `vendor/html2canvas.min.js` | MIT, (c) Niklas von Hertzen. |

Copyright 2026 PlayDoPain (u/PlayDoPain). The name "Deck of Pain" is not licensed for use as the name of derived products.

## Credits

- **Game design, rules, icons, and app:** u/PlayDoPain.
- **Card artwork only:** [Vector Playing Cards 3.2](https://totalnonsense.com/open-source-vector-playing-cards/) by **Chris Aguilar**, licensed under the [GNU LGPL 3.0](https://www.gnu.org/licenses/lgpl-3.0.html). Alternate Joker by John Merrill, colored version by Chris Aguilar. The library's authors file, license text, changelog, and Q&A are in [`assets/credits/`](assets/credits/). Chris Aguilar is not the author of this game and has not endorsed it.
- The site footer carries the same credits on every page.
