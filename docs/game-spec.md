# Build notes

How the app was specified and the choices made along the way. The code and [`config/game.yaml`](../config/game.yaml) are the source of truth.

## Screens

### Cover
- Shows the title and byline, which stay visible on every screen.
- A short notice says the game is intended for adults and the site has no explicit content. An Enter button continues to setup.

### Setup
- All parameters live in `config/game.yaml`: the option list (each entry on or off by default), the maximum number of restraint-type effects, deck size, hand sizes and default text fields.
- Options appear as tiles with an easy-to-recognise icon. Entries marked `yes` start selected, and All/None buttons are provided.
- Two free-text fields hold the default text for each of the two modes (clothed and restrained).
- A button shuffles the deck and starts the game.

### Round
- Counters: game number, round number, intensity (starts at 3, +1 each replay), items removed, items added (capped by the configured maximum).
- A 3D drawing pile that shrinks as cards are drawn (52 cards plus 2 Jokers).
- A mode toggle (clothed or restrained) that can change at any time.
- Four panels:
  1. **Item:** a random pick from the selected options, shown with its icon and name.
  2. **Result:** the total from the drawn cards, shown large, with an icon for each side effect. A side effect is hidden once its cap has been reached. When a special hand is played, the matching text from setup appears here.
  3. **Dealer:** the cards drawn this round (as many as the intensity), not selectable.
  4. **Player:** the hand. Up to three cards can be selected, and a Counter button registers a valid combination.
- Execute ends the round and starts the next one.
- When the pile is empty, a prompt offers a replay: game +1, intensity +1.
- An End game button, with an "Are you sure?" prompt, is available at any time.

### Game over
- Per-item totals with icons, plus totals for games, rounds, items removed and items added.
- Number of times each combination was played.
- Elapsed time from the first shuffle to the end of the game.
- A button saves the summary as a picture.

Nothing is stored: no cookies, local storage or server.

## Layout

- Phones: single column, page scrolls.
- Tablets and laptops (at least 700 px wide and 620 px tall): the game screen fits the viewport without scrolling. A panel with too much content scrolls on its own.
- In landscape, the side-effect badges sit beside the total, and the Player panel keeps its Counter row pinned at the bottom.

## Rules decisions

Where the original rules sheet is silent, the app follows these choices.

- The deck is 52 cards plus 2 Jokers. A Joker is worth 10 and is wild in the player's hand.
- The hand starts with 3 cards and gains 1 per round. The dealer draws first, so a nearly empty pile goes to the dealer.
- One counter per round. A straight flush offers both options.
- A single card cannot reduce the total below 0. A pair is unavailable when the pile is empty.
- Straights allow Ace low or high, with no wrap-around.
- A flush lets the player pick the item from the selected list.
- Three of a kind lets the player rewrite the text for the current mode.
- Played and drawn cards go to the discard pile. A replay reshuffles only the discards, and the player keeps their hand.
