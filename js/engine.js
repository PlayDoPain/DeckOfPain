/* Deck of Pain III - rules engine (no DOM). Rules follow poster v3.3 (Patch 3). */
window.DOP = window.DOP || {};
DOP.engine = (function () {
  const SUIT_NAME = { S: 'SPADE', H: 'HEART', D: 'DIAMOND', C: 'CLUB' };
  const SUIT_SYMBOL = { S: '♠', H: '♥', D: '♦', C: '♣', J: '★' };
  const FACE_NAME = { 11: 'JACK', 12: 'QUEEN', 13: 'KING' };
  const RANK_LABEL = { 1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King' };

  const MERCY = {
    single:   { label: 'Single',      effect: 'Swats − card value' },
    pair:     { label: 'Pair',        effect: 'Re-roll: fresh draw' },
    flush:    { label: 'Flush',       effect: 'Choose implement' },
    straight: { label: 'Straight',    effect: 'Beg for Privilege' },
    trips:    { label: '3 of a Kind', effect: 'Revise Privilege' },
  };

  function buildDeck(jokers) {
    const deck = [];
    Object.keys(SUIT_NAME).forEach((s) => {
      for (let r = 1; r <= 13; r++) {
        const face = FACE_NAME[r] ? '-' + FACE_NAME[r] : '';
        deck.push({ id: s + r, suit: s, rank: r, file: `${SUIT_NAME[s]}-${r}${face}.svg` });
      }
    });
    for (let j = 1; j <= jokers; j++) deck.push({ id: 'J' + j, suit: 'J', rank: 0, file: `JOKER-${j}.svg` });
    return deck;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const isJoker = (c) => c.suit === 'J';
  const isFace = (c) => isJoker(c) || c.rank >= 11;
  const value = (c) => (c.rank > 10 || isJoker(c) ? 10 : c.rank);
  const cardName = (c) => (isJoker(c) ? 'Joker' : `${RANK_LABEL[c.rank] || c.rank} of ${SUIT_NAME[c.suit].toLowerCase()}s`);

  /* Punishment from Sir's cards: Ace +1, Number + value, Face/Joker +10 and one Clothes-1/Tie+1 effect. */
  function punishment(sirCards) {
    let swats = 0, faces = 0;
    sirCards.forEach((c) => {
      swats += isFace(c) ? 10 : value(c);
      if (isFace(c)) faces++;
    });
    return { swats, faces };
  }

  /* Which Mercy hands can these 1-3 cards make? Joker is wild. Returns array of keys. */
  function evaluate(cards) {
    const n = cards.length;
    if (n === 0) return [];
    if (n === 1) return ['single'];
    const real = cards.filter((c) => !isJoker(c));
    const wilds = n - real.length;
    const out = [];
    const sameRank = new Set(real.map((c) => c.rank)).size <= 1;
    if (n === 2) return sameRank ? ['pair'] : [];
    if (n === 3) {
      if (sameRank) out.push('trips');
      if (new Set(real.map((c) => c.suit)).size <= 1) out.push('flush');
      // Straight: three consecutive ranks, Ace low (A-2-3) or high (Q-K-A).
      const ranks = real.map((c) => c.rank);
      if (new Set(ranks).size === ranks.length) {
        for (let start = 1; start <= 12; start++) {
          const window = [start, start + 1, start + 2].map((r) => (r === 14 ? 1 : r));
          const winSet = new Set(window);
          if (ranks.every((r) => winSet.has(r)) && wilds >= 3 - window.filter((r) => ranks.includes(r)).length) {
            out.push('straight');
            break;
          }
        }
      }
    }
    return out;
  }

  function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const mm = String(m).padStart(h ? 2 : 1, '0'), ss = String(sec).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  return { MERCY, SUIT_SYMBOL, buildDeck, shuffle, isJoker, isFace, value, cardName, punishment, evaluate, fmtTime };
})();
