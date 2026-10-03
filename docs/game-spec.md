# Deck of Pain III: Original build spec

The design brief the app was built from. Kept for reference; the code and `config/game.yaml` are the source of truth.

## Cover Page

- Use v3.3's title on top: DECK OF PAIN III and BY U/PLAYDOPAIN. Keep the title persistent throughout.
- A disclaimer to say that this is a game for adults, but there's no explicit content on the website. Click Enter to go to the setup page.

## Setup

- Create a yaml file to store all game parameters:
	- IMPLEMENT_LIST: hand:yes, hair brush:yes, leather paddle:no, belt:yes, shoe horn:yes, wooden paddle:yes, fly swatter:no, crop:no, cane:yes, ping pong paddle:yes, ruler:yes
	- MAX_RESTRAINTS: 4
- A Sir panel on the left or on top depending on the browser dimensions. Tile all available implements based on IMPLEMENT_LIST and pre-select the ones with a yes value as default, add a All/None option, too. Each implement should have a vector art icon associated with it that is easy to identify.
- A Boy panel next or below the Sir panel that has two free text fields:
	- Privilege (clothed): default text is "Get a rub"
	- Privilege (restrained): default text is "Get a rub"
- A button to shuffle the deck and begin the game.

## Round

- Add a counter that shows
	- Game: 1, 2, ... (+1 in NG+)
	- Round: 1, 2, ...
	- Intensity: 3, 4, ... (+1 in NG+)
	- A 3D illustration of a deck/draw pile that becomes shorter/thinner based on how many cards left in the deck (full deck has 52 cards + 2 jokers).
	- Number of clothing removed: 0, 1, ...
	- Number of restraints added: 0, 1, ... (no more than MAX_RESTRAINTS)
- There should be a toggle between Clothed and Restrained that initialize as Clothed and can be changed at any point in the game.
- Create a panel with 2 by 2 sub-panels
	- Top 2
		- Implement: randomized from the selected implements (use both vector art and text)
		- Punishment: effect from Sir's cards. Refresh after Counter. Use big font for number of swats. If it's removing closing, display an icon like a combination of the minus icon and a pair of shorts icon, if it's adding restraint, display an icon like a combination of a plus icon and a rope. If MAX_RESTRAINTS restraints have already been added, do not show add restraint icon. Show clothing or restraint icon based on the Clothed/Restrained toggle. If Privilege is invoked, based on the toggle, show the text previously entered during setup.
	- Bottom 2
		- Sir (unmutable): drawing Intensity number of cards from the remaining pile (if remaining pile < Intensity, exhaust the remaining pile)
		- Boy: can select up to 3 with an allowable Mercy counter (single, pair, ...), click Counter to register.
- Button: Execute.
	- Round +1.
	- Repeat.
- When all cards from the pile are exhausted, prompt to Start NewGame+.
	- Game +1.
	- Intensity +1.
- There should be a button to end the game at any time. Just need an "Are you sure?" prompt.

## Game Over

- Show the following statistics:
	- Each implement icon that's used with the total number of swats next to each.
	- Total numbers of games, rounds, clothing removed, restraint added.
	- Each mercy with the total times of revoking each.
	- Total elapsed time (from button to shuffle to end the game).
- A button to save the session statistics in a picture.

## Rules decisions

Where the poster is silent, the app follows these choices.

- The deck is 52 cards plus 2 Jokers. A Joker is worth 10 and is wild in Boy's Hand.
- Boy's Hand starts with 3 cards and gains 1 per round. Sir draws first, so a nearly empty pile goes to Sir.
- Boy gets one Mercy counter per round. A Straight Flush offers both options.
- A Single cannot reduce swats below 0. A Pair is unavailable when the pile is empty.
- Straights allow Ace low or high, with no wrap-around.
- Flush: Boy picks the implement from the selected list.
- Three of a Kind: Boy rewrites the Privilege for the current mode.
- Played Mercy cards and Sir's cards go to the discard pile. New Game+ reshuffles only the discards, and Boy keeps his Hand.

