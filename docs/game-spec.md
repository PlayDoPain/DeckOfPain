# Build notes

How the app is specified and the choices made along the way (v3.4, Patch 4). The code and [`config/game.yaml`](../config/game.yaml) are the source of truth.

## Screens

### Cover
- Title and byline stay visible on every screen.
- A scrollable "how to play" panel shows a sample round built from the same pieces as the game (cards, icons, buttons) with small notes joined to each element by connector lines.
- A small adults-only box stays at the bottom of the page with the Enter button.

### Choose a game
After Enter, two big cards: **Spanking** (the card game, which continues to Setup) and **Inspection**. Every screen after this has a clear way back: Setup and Inspection have a "← Games" button, the stats screen has a "Games" button, and the browser's Back button (or a swipe on iPhone) steps back through the screens too. Pressing Back during a game asks "End the game?" first, so a stray swipe can't lose it.

### Setup
- All parameters live in `config/game.yaml`: the option list (each entry on or off by default), deck counts, hand sizes, default text, and default player names.
- Players: 1 or 2. Two players is only offered on a landscape screen at least `DUO_MIN_WIDTH` pixels wide.
- Options appear as tiles with an easy-to-recognize icon. Entries marked `yes` start selected, and All/None buttons are provided.
- Pressing Shuffle & Begin opens an "Assume the position" alert with a yellow warning sign: one Boy on hands and knees, or two Boys staggered side by side in two-player mode. The game, and its clock, starts when the Boy or Boys press Ready.
- Each Boy has two free-text fields (clothed and restrained). With two players each Boy also has a name box (defaults A and B), so there are four fields in total.

### Round
- Shared counters: game, round, intensity (starts at 3, +1 each replay), and pile. Clothes off and Restraints are per player.
- A 3D drawing pile that shrinks as cards are drawn.
- Each player has two switches: Clothed / Naked, and Free / Restrained / Max (Max means fully tied, so no more restraints can be added). The right switch cycles Free → Restrained → Max → Free. Allowed combinations: Clothed + Free, Naked + Free, Naked + Restrained, Naked + Max. Tying him up (Free → Restrained or Max) makes him Naked if he is not already, and getting dressed (Naked → Clothed) frees him. Face cards remove clothing while Clothed, add restraints while Restrained, and add only swats while Naked and Free (nothing left to remove, not yet tied, or a game without restraints) or at Max (nothing more to add). There is no cap on restraints. A switch shows the current state: white for Clothed and Free, purple for Naked and Restrained, black for Max.
- Each player has a board with two panels:
  1. **Sir:** the cards drawn for that player, then implement, swats, and effect icons, then the Privilege when earned and the Mercy note.
  2. **Boy:** the hand, quick-pick buttons for each Mercy, a status line, and the Counter button (plus Transfer in two-player mode). The hand scrolls inside the panel; the buttons stay put.
- Execute ends the round for everyone.
- When the pile is empty, a prompt offers a replay: game +1, intensity +1.
- An End game button, with an "Are you sure?" prompt, is available at any time.

### Game over
- Per-item totals with icons, plus totals for games, rounds, items removed, and items added.
- Number of times each combination was played, plus (two players) a Transfer tile counting Mercies passed to the other Boy. The six top tiles stay the same for one or two players.
- Privileges: one block for Clothed and one for Restrained. Inside each, every Boy's history of that Privilege, from his starting text through each Three of a Kind rewrite to what he ended with (Boy 1 above Boy 2). The picture includes them too.
- Elapsed time from pressing Ready to the end of the game.
- Two players: the same stats; every stat that belongs to a player also shows each player's share in his color.
- A button saves the summary, with the date, as a picture.

### Cover image
A button on the how-to-play panel saves the whole cover (title, sample round, and credits) as one long PNG, using the bundled html2canvas.

The footer shows "Last updated" with the date and time of the last deploy (stamped by the workflow; hidden on a local copy).

Nothing is stored: no cookies, local storage, or server.

## Inspection

A plain body figure covered by tiles, one per part (clinical names, no detail). Tapping a tile flies it to the **Order** list, which sits beside the figure in landscape and below it in portrait; tapping a number in the list puts the part back. **Front / Back** turns the figure around. Most parts (head, shoulders, hands, thighs, feet) appear on both sides and are one item, so taking the left hand from either side removes it from both. The chest, abdomen, and penis are front only; the back and the butt are back only. **Random pick** sends one random part, **Random order** sends 3, 5, 10, or all of the remaining parts in a random order, and **Reset** puts everything back. Nothing is stored.

## Layout

- Phones (portrait only): two stacked panels; the page never scrolls. A turn-your-phone message covers the screen in landscape.
- Tablets and laptops, one player: a 2 x 2 grid of panels that fits the viewport.
- Two players: landscape tablet or desktop only. Each side is a stacked board like the phone layout, with the player's name on top. The randomly chosen player has priority; his name strip is inverted. A turn-your-device message covers the screen in portrait or on narrow windows.

## Rules decisions

Where the original rules sheet is silent, the app follows these choices.

- A deck is 52 cards plus 2 Jokers. One player uses one deck; two players use two decks (108 cards) so both modes last about the same number of rounds.
- A Joker is worth 10 and is wild in a hand.
- Each Boy's hand starts with 3 cards and gains 1 per round. Sir draws first, so a nearly empty pile goes to Sir.
- One Mercy action per Boy per round. A straight flush offers both options.
- A single card cannot reduce swats below 0. A pair is unavailable when there is nothing to re-roll into.
- Straights allow Ace low or high, with no wrap-around.
- A flush lets someone pick the implement from the selected list. Three of a kind rewrites the Privilege for the target's current state (the restrained text applies once he is tied up, Restrained or Max; otherwise the clothed text applies, including while Naked and Free, since he is still free to move).
- Played and drawn cards go to the discard pile. A replay reshuffles only the discards, and each Boy keeps his hand.

### Two players
- Sir draws the full number of cards for each Boy, and each Boy has his own implement, hand, and Punishment.
- A random Boy is highlighted each round. It is only a hint: both boards stay live.
- Each Boy may play one Mercy per round, either a **Counter** (applies to his own Punishment) or a **Transfer** (applies to the other Boy's Punishment). Either can happen in either order, and a Boy's Punishment can still be changed after he has acted.
- Each Boy has his own color (blue and orange, used nowhere else in the game): name strip, setup box, and the player shares on the stats screen.
- Effects add up on the target: Singles accumulate, a Pair re-rolls the target's current cards (earlier Singles still apply), a Flush lets someone pick the target's implement, and a Straight or Three of a Kind shows the **giver's** own Privilege (the text matching the target's clothed/restrained state). A transferred Three of a Kind rewrites that Privilege. For a transferred Flush the Boy who played it picks the target's implement.
