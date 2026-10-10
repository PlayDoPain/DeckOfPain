/* SPDX-License-Identifier: Apache-2.0
   Copyright 2026 PlayDoPain (u/PlayDoPain). See NOTICE. */
/* Deck of Pain III (v3.4) - UI. The app plays Sir. One or two Boys each hold a Hand and can counter with Mercy.
   Nothing is stored: refresh or end the game and the session is gone. */
(function () {
  const E = DOP.engine, I = DOP.icons;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const cardImg = (c) => `<img class="pcard" src="assets/cards/${c.file}" alt="${esc(E.cardName(c))}" draggable="false">`;
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const STATES = [['clothed', 'Clothed'], ['restrained', 'Restrained'], ['max', 'Max']];

  let cfg = null;
  let setup = { selected: new Set(), players: 1, names: ['A', 'B'], priv: [{}, {}] };
  let S = null; // game state

  /* ---------- screens ---------- */
  function show(name) {
    ['cover', 'setup', 'game', 'over'].forEach((n) => ($('screen-' + n).hidden = n !== name));
    const b = document.body;
    b.classList.toggle('game-active', name === 'game');
    b.classList.toggle('cover-active', name === 'cover');
    b.classList.toggle('mode-duo', !!(S && S.duo) && name === 'game');
    b.classList.toggle('mode-solo', !(S && S.duo) && name === 'game');
    window.scrollTo(0, 0);
  }

  /* ---------- modal ---------- */
  function modal(bodyHtml, buttons) {
    $('modal-body').innerHTML = bodyHtml;
    const box = $('modal-actions');
    box.innerHTML = '';
    buttons.forEach((b) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'btn ' + (b.cls || '');
      el.textContent = b.label;
      el.addEventListener('click', () => { if (b.onClick && b.onClick() === false) return; closeModal(); });
      box.appendChild(el);
    });
    $('modal').hidden = false;
    const first = $('modal-body').querySelector('input');
    if (first) first.focus();
  }
  const closeModal = () => ($('modal').hidden = true);

  /* ---------- setup ---------- */
  const canDuo = () => window.matchMedia(`(min-width:${cfg.DUO_MIN_WIDTH || 900}px) and (orientation:landscape)`).matches;

  function renderTiles() {
    $('impl-tiles').innerHTML = Object.keys(cfg.IMPLEMENT_LIST).map((name) => {
      const on = setup.selected.has(name);
      return `<button type="button" class="tile ${on ? 'on' : ''}" data-impl="${esc(name)}" aria-pressed="${on}">
        <span class="tile-icon">${I.implement(name)}</span><span class="tile-name">${esc(titleCase(name))}</span></button>`;
    }).join('');
    $('impl-count').textContent = `${setup.selected.size} selected`;
    $('btn-start').disabled = setup.selected.size === 0;
  }

  function renderBoyBoxes() {
    const duo = setup.players === 2;
    $('boy-boxes').className = 'boy-boxes ' + (duo ? 'two' : 'one');
    $('boy-boxes').innerHTML = [0, 1].slice(0, duo ? 2 : 1).map((i) => `
      <div class="card-box boy-box pc${i}">
        <h2><span class="role">BOY</span>${duo ? `<input type="text" class="name-in" data-name="${i}" maxlength="10" autocomplete="off" aria-label="Name of Boy ${i + 1}" value="${esc(setup.names[i])}">` : ' Privileges'}</h2>
        <label class="field">Privilege (clothed)
          <input type="text" data-priv="clothed" data-i="${i}" maxlength="120" autocomplete="off" value="${esc(setup.priv[i].clothed)}">
        </label>
        <label class="field">Privilege (restrained)
          <input type="text" data-priv="restrained" data-i="${i}" maxlength="120" autocomplete="off" value="${esc(setup.priv[i].restrained)}">
        </label>
        ${i === (duo ? 1 : 0) ? '<p class="muted">Negotiate before you start. Boy can earn them with a Straight or revise them with a Three of a Kind.</p>' : ''}
      </div>`).join('');
  }

  function renderPlayersToggle() {
    const duoOk = canDuo();
    if (!duoOk && setup.players === 2) { setup.players = 1; renderBoyBoxes(); }
    $('players-1').classList.toggle('on', setup.players === 1);
    $('players-2').classList.toggle('on', setup.players === 2);
    $('players-1').setAttribute('aria-pressed', setup.players === 1);
    $('players-2').setAttribute('aria-pressed', setup.players === 2);
    $('players-2').disabled = !duoOk;
    $('duo-note').hidden = duoOk;
  }

  function initSetup() {
    setup.selected = new Set(Object.keys(cfg.IMPLEMENT_LIST).filter((k) => cfg.IMPLEMENT_LIST[k] === true));
    setup.players = 1;
    setup.names = [String(cfg.DUO_NAME_1 || 'A'), String(cfg.DUO_NAME_2 || 'B')];
    setup.priv = [0, 1].map(() => ({ clothed: cfg.DEFAULT_PRIVILEGE_CLOTHED || 'Get a rub', restrained: cfg.DEFAULT_PRIVILEGE_RESTRAINED || 'Get a rub' }));
    renderTiles(); renderBoyBoxes(); renderPlayersToggle();
  }

  /* ---------- game state ---------- */
  function makePlayer(i, duo) {
    const defaults = [String(cfg.DUO_NAME_1 || 'A'), String(cfg.DUO_NAME_2 || 'B')];
    const clean = (v, d) => (String(v || '').trim() || d);
    return {
      i, name: duo ? clean(setup.names[i], defaults[i]).toUpperCase() : 'BOY',
      privilege: { clothed: clean(setup.priv[i].clothed, 'Get a rub'), restrained: clean(setup.priv[i].restrained, 'Get a rub') },
      state: 'clothed', hand: [], sir: [], implement: null, pickImpl: false,
      sel: new Set(), optIndex: 0, acted: null, reduce: 0, mercyLog: [], privs: [], pickBy: null,
      clothes: 0, restraints: 0, newSir: false, newHand: new Set(), lastSwats: undefined,
      stats: { swats: 0, clothes: 0, restraints: 0, implSwats: {}, mercies: {}, transfers: 0 },
    };
  }

  function newGameState() {
    const duo = setup.players === 2 && canDuo();
    const deck = E.shuffle(E.buildDeck(cfg.JOKERS, duo ? cfg.DECKS_DUO : cfg.DECKS_SOLO));
    S = {
      duo, implements: Object.keys(cfg.IMPLEMENT_LIST).filter((k) => setup.selected.has(k)),
      game: 1, round: 1, rounds: 0, intensity: cfg.STARTING_INTENSITY, priority: 0,
      pile: deck, discard: [], start: Date.now(), players: [],
    };
    for (let i = 0; i < (duo ? 2 : 1); i++) S.players.push(makePlayer(i, duo));
    S.players.forEach((p) => { p.hand = S.pile.splice(0, cfg.BOY_STARTING_HAND); p.newHand = new Set(p.hand.map((c) => c.id)); });
    S.players.forEach((p) => { dealSir(p); pickImplement(p); });
    pickPriority();
  }

  const other = (p) => S.players[1 - p.i];
  function dealSir(p) {
    p.sir = S.pile.splice(0, Math.min(S.intensity, S.pile.length));
    p.newSir = true;
  }
  function pickImplement(p) {
    p.implement = S.implements[Math.floor(Math.random() * S.implements.length)];
    p.pickImpl = false; p.pickBy = null;
  }
  function pickPriority() { S.priority = S.duo ? Math.floor(Math.random() * 2) : 0; }
  const privKey = (p) => (p.state === 'clothed' ? 'clothed' : 'restrained'); // Max uses the restrained text

  function currentPunishment(p) {
    const b = E.punishment(p.sir);
    return {
      base: b.swats, reduce: p.reduce, swats: Math.max(0, b.swats - p.reduce), faces: b.faces,
      clothes: p.state === 'clothed' ? b.faces : 0,
      restraints: p.state === 'restrained' ? b.faces : 0, // Max: nothing left to remove or add
    };
  }

  function resetRound(p) {
    p.sel.clear(); p.optIndex = 0; p.acted = null; p.reduce = 0; p.mercyLog = []; p.privs = [];
  }

  function execute() {
    S.players.forEach((p) => {
      const pn = currentPunishment(p), st = p.stats;
      st.swats += pn.swats;
      st.implSwats[p.implement] = (st.implSwats[p.implement] || 0) + pn.swats;
      st.clothes += pn.clothes; st.restraints += pn.restraints;
      p.clothes += pn.clothes; p.restraints += pn.restraints;
      S.discard.push(...p.sir);
      p.sir = [];
      resetRound(p);
    });
    S.rounds++; S.round++;
    if (S.pile.length === 0) { promptNewGamePlus(); return; }
    startRound();
  }

  function startRound() {
    S.players.forEach((p) => dealSir(p));
    S.players.forEach((p) => {
      const drawn = S.pile.splice(0, Math.min(cfg.BOY_CARDS_PER_ROUND, S.pile.length));
      p.hand.push(...drawn);
      p.newHand = new Set(drawn.map((c) => c.id));
      pickImplement(p);
    });
    pickPriority();
    renderGame();
  }

  function promptNewGamePlus() {
    renderGame();
    modal(`<h3>The Drawing Pile is empty</h3><p>Start <b>New Game+</b>? The discards are reshuffled, ${S.duo ? 'the Boys keep their Hands' : 'Boy keeps his Hand'}, and Intensity goes up by 1.</p>`, [
      { label: 'End game', onClick: () => { setTimeout(gameOver, 0); } },
      { label: 'Start New Game+', cls: 'btn-primary', onClick: () => {
        S.game++; S.intensity++;
        S.pile = E.shuffle(S.discard); S.discard = [];
        startRound();
      } },
    ]);
  }

  function confirmEnd() {
    modal(`<h3>End the game?</h3><p>This ends the session and shows your statistics.</p>`, [
      { label: 'Keep playing' },
      { label: 'End game', cls: 'btn-danger', onClick: () => { setTimeout(gameOver, 0); } },
    ]);
  }

  /* ---------- Mercy ---------- */
  const selectedCards = (p) => p.hand.filter((c) => p.sel.has(c.id));
  const pairOk = (t) => S.pile.length > 0 && t.sir.length > 0; // something to re-roll into
  const pairPossible = (p) => pairOk(p) || (S.duo && pairOk(other(p)));
  const chosenKey = (p) => { const o = mercyOptions(p); return p.sel.size && o.length ? o[Math.min(p.optIndex, o.length - 1)] : null; };

  function mercyOptions(p) {
    let opts = E.evaluate(selectedCards(p));
    if (!pairPossible(p)) opts = opts.filter((k) => k !== 'pair');
    return opts;
  }

  /* For each Mercy: the cards the Boy would play, or null when his Hand can't make it. */
  function mercyPicks(p) {
    const out = {};
    Object.keys(E.MERCY).forEach((k) => { out[k] = (k === 'pair' && !pairPossible(p)) ? null : E.bestFor(p.hand, k); });
    return out;
  }

  /* Actor p plays his chosen Mercy on target t (t === p is a Counter; the other Boy is a Transfer). */
  function applyMercy(p, t) {
    if (p.acted) return;
    const key = chosenKey(p);
    if (!key) return;
    if (key === 'pair' && !pairOk(t)) return;
    const cards = selectedCards(p);
    p.hand = p.hand.filter((c) => !p.sel.has(c.id));
    S.discard.push(...cards);
    p.sel.clear(); p.optIndex = 0;
    p.acted = { key, cards, target: t.i };
    p.stats.mercies[key] = (p.stats.mercies[key] || 0) + 1;
    if (t !== p) p.stats.transfers++;
    const log = { key, from: p.i };
    if (key === 'single') { log.reduce = E.value(cards[0]); t.reduce += log.reduce; }
    else if (key === 'pair') { S.discard.push(...t.sir); dealSir(t); }
    else if (key === 'flush') { t.pickImpl = true; t.pickBy = p.i; } // the Boy who played it picks
    else { t.privs.push({ from: p.i }); } // straight / three of a kind: the giver's own Privilege
    t.mercyLog.push(log);
    renderGame();
    if (key === 'trips') reviseDialog(p, t);
  }

  /* src's Privilege (the text used while t is in his current state) can be rewritten by whoever plays Three of a Kind. */
  function reviseDialog(src, t) {
    const k = privKey(t);
    const who = S.duo ? (src === t ? esc(t.name) : `${esc(src.name)} → ${esc(t.name)}`) : '';
    modal(`<h3>Revise Privilege${who ? ` — ${who}` : ''}</h3><p>New Privilege while ${S.duo ? `${esc(t.name)} is ` : ''}<b>${esc(k)}</b>:</p>
      <input type="text" id="revise-input" maxlength="120" value="${esc(src.privilege[k])}">`, [
      { label: 'Keep as is' },
      { label: 'Save', cls: 'btn-primary', onClick: () => {
        const v = $('revise-input').value.trim();
        if (v) src.privilege[k] = v;
        renderGame();
      } },
    ]);
  }

  /* ---------- rendering ---------- */
  function layout() {
    const b = $('boards');
    if (!S || !b) return;
    const phone = !S.duo && window.innerWidth < 700;
    b.classList.toggle('wide', !S.duo && !phone);
    b.classList.toggle('phone-ui', phone || S.duo);
    b.classList.toggle('compact', phone ? window.innerHeight < 700 : S.duo ? window.innerHeight < 900 : false);
  }

  function buildBoards() {
    const wrap = $('boards');
    wrap.innerHTML = '';
    wrap.className = 'boards ' + (S.duo ? 'duo' : 'solo');
    S.players.forEach((p) => {
      const b = document.createElement('div');
      b.className = 'board pc' + p.i;
      b.dataset.p = p.i;
      b.innerHTML = `${S.duo ? '<div class="board-head"></div>' : ''}
        <div class="group sir-group"><div class="panel p-implement"></div><div class="panel p-punish"></div><div class="panel p-sir"></div></div>
        <div class="group boy-group"><div class="panel p-boy"></div></div>`;
      wrap.appendChild(b);
      p.el = { board: b, head: b.querySelector('.board-head'), impl: b.querySelector('.p-implement'), punish: b.querySelector('.p-punish'), sir: b.querySelector('.p-sir'), boy: b.querySelector('.p-boy') };
    });
    layout();
  }

  function renderDeck() {
    const n = S.pile.length, stack = $('deck-stack');
    if (stack.dataset.n !== String(n)) {
      stack.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const d = document.createElement('div');
        d.className = 'deck-layer' + (i === n - 1 ? ' top' : '');
        d.style.transform = `translateZ(${i * (n > 60 ? 0.8 : 1.3)}px)`;
        stack.appendChild(d);
      }
      stack.dataset.n = n;
    }
    $('deck-n').textContent = n;
    $('deck3d').classList.toggle('empty', n === 0);
  }

  const toggleHtml = (p) => `<div class="toggle" role="group" aria-label="State">${STATES.map(([k, label]) =>
    `<button type="button" data-state="${k}" class="${k}${p.state === k ? ' on' : ''}" aria-pressed="${p.state === k}">${label}</button>`).join('')}</div>`;

  function renderHud() {
    $('st-game').textContent = S.game;
    $('st-round').textContent = S.round;
    $('st-intensity').textContent = S.intensity;
    $('st-pile').textContent = S.pile.length;
    const p0 = S.players[0];
    $('st-clothes').textContent = p0.clothes;
    $('st-restraints').textContent = p0.restraints;
    $('hud-toggle').innerHTML = S.duo ? '' : toggleHtml(p0);
  }

  function renderHead(p) {
    if (!p.el.head) return;
    p.el.head.innerHTML = `<span class="bname">${esc(p.name)}</span>
      <span class="bchip">Clothes off <b>${p.clothes}</b></span><span class="bchip">Restraints <b>${p.restraints}</b></span>${toggleHtml(p)}`;
    p.el.board.classList.toggle('priority', S.priority === p.i);
  }

  function renderImplement(p) {
    const el = p.el.impl;
    el.parentElement.classList.toggle('picking', p.pickImpl);
    if (p.pickImpl) {
      const by = S.duo && p.pickBy !== null ? S.players[p.pickBy] : null;
      el.innerHTML = `<h3 class="ph">Implement <span class="tag mercy ${by ? 'pc' + by.i : ''}">${by ? `Flush: ${esc(by.name)} picks` : 'Flush: pick one'}</span></h3>
        <div class="impl-pick">${S.implements.map((n) => `<button type="button" class="tile mini" data-pick="${esc(n)}"><span class="tile-icon">${I.implement(n)}</span><span class="tile-name">${esc(titleCase(n))}</span></button>`).join('')}</div>`;
      return;
    }
    el.innerHTML = `<h3 class="ph">Implement</h3>
      <div class="impl-show"><div class="impl-icon">${I.implement(p.implement)}</div>
      <div class="impl-name">${esc(titleCase(p.implement))}</div></div>`;
  }

  function renderPunish(p) {
    const pn = currentPunishment(p);
    let effects = '';
    if (pn.clothes) effects += `<div class="effect"><span class="eicon">${I.clothesMinus}</span><span class="ecount">×${pn.clothes}</span><span class="elabel">Clothing</span></div>`;
    if (pn.restraints) effects += `<div class="effect"><span class="eicon">${I.restraintPlus}</span><span class="ecount">×${pn.restraints}</span><span class="elabel">Restraint</span></div>`;
    const priv = p.privs.length ? `<div class="privs">${p.privs.map((v) => {
      const src = S.players[v.from];
      return `<div class="privilege"><span class="eicon small">${I.privilege}</span><div><div class="elabel">Privilege (${privKey(p)})${src !== p ? ` · from ${esc(src.name)}` : ''}</div><div class="ptext">${esc(src.privilege[privKey(p)])}</div></div></div>`;
    }).join('')}</div>` : '';
    const lines = p.mercyLog.map((l) => {
      const m = E.MERCY[l.key];
      const from = l.from !== p.i ? ` <i>from ${esc(S.players[l.from].name)}</i>` : '';
      return `Mercy: <b>${m.label}</b> — ${m.effect}${l.key === 'single' ? ` (−${l.reduce})` : ''}${from}`;
    });
    const mercy = lines.length ? `<div class="mercy-line">${lines.join('<br>')}</div>` : '';
    p.el.punish.innerHTML = `<h3 class="ph">Punishment</h3>
      <div class="swats"><span class="swat-num">${pn.swats}</span><span class="swat-word">swats</span></div>
      <div class="effects">${effects}</div>${priv}${mercy}`;
    if (p.lastSwats !== undefined && p.lastSwats !== pn.swats) p.el.punish.querySelector('.swat-num').classList.add('pop');
    p.lastSwats = pn.swats;
  }

  function renderSir(p) {
    const cards = p.sir.map((c, i) => `<div class="cardwrap ${p.newSir ? 'deal' : ''}" style="--i:${i}">${cardImg(c)}</div>`).join('');
    p.el.sir.innerHTML = `<h3 class="ph">Sir <span class="tag">${plural(p.sir.length, 'card')}</span></h3>
      <div class="cards">${cards || '<p class="muted">No cards left.</p>'}</div>`;
    p.newSir = false;
  }

  function renderBoy(p) {
    const sorted = p.hand.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99) || a.suit.localeCompare(b.suit));
    const cards = sorted.map((c) => {
      const on = p.sel.has(c.id);
      return `<button type="button" class="cardbtn ${on ? 'sel' : ''} ${p.newHand.has(c.id) ? 'deal' : ''}" data-card="${c.id}" aria-pressed="${on}" ${p.acted ? 'disabled' : ''}>${cardImg(c)}</button>`;
    }).join('');
    const opts = mercyOptions(p);
    const idx = Math.min(p.optIndex, Math.max(0, opts.length - 1));
    let status;
    if (p.acted) {
      const m = E.MERCY[p.acted.key], to = p.acted.target !== p.i ? ` → ${esc(S.players[p.acted.target].name)}` : '';
      status = `<span class="muted">Played <b>${m.label}</b>: ${m.effect}${to}</span>`;
    } else if (!p.sel.size) status = `<span class="muted">Select up to ${cfg.MAX_MERCY_CARDS} cards to counter.</span>`;
    else if (!opts.length) status = `<span class="bad">No Mercy with these cards.</span>`;
    else status = opts.map((k, i) => `<label class="opt ${i === idx ? 'on' : ''}"><input type="radio" name="opt${p.i}" value="${i}" ${i === idx ? 'checked' : ''}><b>${E.MERCY[k].label}</b> — ${E.MERCY[k].effect}</label>`).join('');
    const picks = mercyPicks(p), active = chosenKey(p);
    const pickBtns = Object.keys(E.MERCY).map((k) => {
      let cls = 'gray', dis = ' disabled';
      if (!p.acted) {
        if (active === k) { cls = 'on'; dis = ''; }
        else if (!active && picks[k]) { cls = 'avail'; dis = ''; }
      }
      return `<button type="button" class="pickbtn ${cls}" data-mercy="${k}"${dis} aria-pressed="${active === k}">${E.MERCY[k].label}</button>`;
    }).join('');
    const blocked = (t) => !opts.length || !!p.acted || (active === 'pair' && !pairOk(t));
    const buttons = `<div class="act-btns"><button type="button" class="btn btn-mercy js-counter" ${blocked(p) ? 'disabled' : ''}>Counter</button>${
      S.duo ? `<button type="button" class="btn btn-transfer js-transfer" ${blocked(other(p)) ? 'disabled' : ''}>Transfer</button>` : ''}</div>`;
    p.el.boy.innerHTML = `<h3 class="ph">Boy <span class="tag mercy">${plural(p.hand.length, 'card')}</span></h3>
      <div class="cards hand ${p.hand.length > 16 ? 'denser' : p.hand.length > 9 ? 'dense' : ''}">${cards || '<p class="muted">Hand is empty.</p>'}</div>
      <div class="mercy-picks" aria-label="Quick-select a Mercy">${pickBtns}</div>
      <div class="boy-actions"><div class="mercy-status">${status}</div>${buttons}</div>`;
    p.newHand = new Set();
  }

  function renderPlayer(p) {
    renderHead(p); renderImplement(p); renderPunish(p); renderSir(p); renderBoy(p);
  }

  function renderGame() {
    layout();
    renderHud(); renderDeck();
    S.players.forEach(renderPlayer);
    const ex = $('btn-execute'), blocked = S.players.some((p) => p.pickImpl);
    ex.disabled = blocked;
    ex.textContent = blocked ? 'Choose an implement first' : 'Execute';
  }

  /* ---------- game over ---------- */
  const statSum = () => {
    const t = { swats: 0, clothes: 0, restraints: 0, transfers: 0, implSwats: {}, mercies: {} };
    S.players.forEach((p) => {
      ['swats', 'clothes', 'restraints', 'transfers'].forEach((k) => (t[k] += p.stats[k]));
      Object.keys(p.stats.implSwats).forEach((n) => (t.implSwats[n] = (t.implSwats[n] || 0) + p.stats.implSwats[n]));
      Object.keys(p.stats.mercies).forEach((k) => (t.mercies[k] = (t.mercies[k] || 0) + p.stats.mercies[k]));
    });
    return t;
  };
  const sortedImpl = (m) => Object.keys(m).sort((a, b) => m[b] - m[a]);
  /* Two players: each stat also shows every player's own share, in that player's color. */
  const subsHtml = (get) => (S.duo ? `<span class="subs">${S.players.map((p) => `<i class="sub pc${p.i}">${esc(p.name)} ${get(p)}</i>`).join('')}</span>` : '');

  function gameOver() {
    closeModal();
    const t = statSum(), elapsed = Date.now() - S.start;
    S.elapsed = elapsed;
    S.endDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const tile = (val, label, get) => `<div><b>${val}</b><span>${label}</span>${get ? subsHtml(get) : ''}</div>`;
    const impl = sortedImpl(t.implSwats);
    $('over-box').innerHTML = `<h2>Game over</h2><p class="muted over-date">${esc(S.endDate)}</p>
      <div class="big-stats">
        ${tile(S.game, 'Games')}${tile(S.rounds, 'Rounds')}
        ${tile(t.swats, 'Total swats', (p) => p.stats.swats)}${tile(t.clothes, 'Clothing removed', (p) => p.stats.clothes)}
        ${tile(t.restraints, 'Restraints added', (p) => p.stats.restraints)}${S.duo ? tile(t.transfers, 'Mercy transferred', (p) => p.stats.transfers) : ''}
        ${tile(E.fmtTime(elapsed), 'Elapsed')}
      </div>
      <h3>Swats by implement</h3>
      <div class="impl-stats">${impl.length ? impl.map((n) => `<div class="istat"><span class="tile-icon">${I.implement(n)}</span><span class="iname">${esc(titleCase(n))}${subsHtml((p) => p.stats.implSwats[n] || 0)}</span><b>${t.implSwats[n]}</b></div>`).join('') : '<p class="muted">No rounds were played.</p>'}</div>
      <h3>Mercy invoked</h3>
      <div class="mercy-stats">${Object.keys(E.MERCY).map((k) => `<div class="mstat"><span>${E.MERCY[k].label}</span><b>${t.mercies[k] || 0}</b>${subsHtml((p) => p.stats.mercies[k] || 0)}</div>`).join('')}</div>`;
    show('over');
  }

  /* Draw the stats onto a canvas and download it as a PNG. */
  async function savePicture() {
    const t = statSum(), duo = S.duo, W = 1080, o = 34, rowH = duo ? 100 : 90;
    const col = (i) => getComputedStyle(document.documentElement).getPropertyValue(i ? '--p1' : '--p0').trim();
    const impl = sortedImpl(t.implSwats);
    const cols = duo ? 4 : 3, cellH = duo ? 150 : 115, nT = duo ? 7 : 6, rowsT = Math.ceil(nT / cols);
    const yImpl = 215 + o + rowsT * (cellH + 20) + 40;
    const yMercy = yImpl + 20 + Math.max(1, impl.length) * rowH + 50;
    const mercyH = duo ? 140 : 100;
    const H = yMercy + 30 + mercyH + 50;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    try { await Promise.all(['64px Anton', '600 28px "IBM Plex Mono"', '700 30px Inter'].map((f) => document.fonts.load(f))); } catch (e) { /* fall back to system fonts */ }
    const iconImg = async (n, size) => {
      const svgText = I.implement(n).replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" `).replace(/currentColor/g, '#141414').replace(/var\(--icon-cut,#fff\)/g, '#FBFAF8');
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.onerror = res; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText); });
      return img;
    };
    const roundRect = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    /* a row of small color-coded chips ("ALEX 12  BEN 7"), aligned left/center/right of x */
    const chips = (x, y, vals, align) => {
      if (!duo) return;
      g.font = '700 17px Inter, sans-serif';
      const items = S.players.map((p, i) => ({ txt: `${p.name} ${vals[i]}`, c: col(i) }));
      items.forEach((it) => (it.w = g.measureText(it.txt).width + 16));
      const total = items.reduce((s, it) => s + it.w, 0) + (items.length - 1) * 6;
      let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
      items.forEach((it) => {
        g.fillStyle = it.c; roundRect(cx, y, it.w, 26, 7); g.fill();
        g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(it.txt, cx + 8, y + 19);
        cx += it.w + 6;
      });
    };
    const cell = (x, y, w, h, val, label, big, subs) => {
      g.fillStyle = '#fff'; g.strokeStyle = '#141414'; g.lineWidth = 3; g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h);
      g.fillStyle = '#DF1430'; g.font = `${big}px Anton, Impact, sans-serif`; g.textAlign = 'center'; g.fillText(String(val), x + w / 2, y + (subs ? 62 : h * 0.6));
      if (subs) chips(x + w / 2, y + 76, subs, 'center');
      g.fillStyle = '#6E6A66'; g.font = '700 20px Inter, sans-serif'; g.textAlign = 'center'; g.fillText(label.toUpperCase(), x + w / 2, y + h - 14);
    };
    g.fillStyle = '#FBFAF8'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#141414'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
    g.font = '96px Anton, Impact, sans-serif';
    const parts = ['DECK OF ', 'PAIN ', 'III'], w = parts.map((s) => g.measureText(s).width);
    const x0 = W / 2 - (w[0] + w[1] + w[2]) / 2; g.textAlign = 'left';
    g.fillStyle = '#141414'; g.fillText(parts[0], x0, 130);
    g.fillStyle = '#DF1430'; g.fillText(parts[1], x0 + w[0], 130);
    g.fillStyle = '#0E8C8A'; g.fillText(parts[2], x0 + w[0] + w[1], 130);
    g.textAlign = 'center'; g.fillStyle = '#6E6A66'; g.font = '700 26px Inter, sans-serif';
    g.fillText('BY U/PLAYDOPAIN', W / 2, 175);
    g.fillStyle = '#141414'; g.font = '600 26px "IBM Plex Mono", monospace';
    g.fillText(S.endDate.toUpperCase(), W / 2, 175 + o);

    const per = (get) => S.players.map(get);
    const tiles = [[S.game, 'Games'], [S.rounds, 'Rounds'], [t.swats, 'Total swats', per((p) => p.stats.swats)], [t.clothes, 'Clothing removed', per((p) => p.stats.clothes)],
      [t.restraints, 'Restraints added', per((p) => p.stats.restraints)]];
    if (duo) tiles.push([t.transfers, 'Mercy transferred', per((p) => p.stats.transfers)]);
    tiles.push([E.fmtTime(S.elapsed), 'Elapsed']);
    const cw = (W - 80 - (cols - 1) * 15) / cols;
    tiles.forEach((c, i) => cell(40 + (i % cols) * (cw + 15), 215 + o + Math.floor(i / cols) * (cellH + 20), cw, cellH, c[0], c[1], 56, c[2]));

    let y = yImpl;
    g.textAlign = 'left'; g.fillStyle = '#141414'; g.font = '40px Anton, Impact, sans-serif';
    g.fillText('SWATS BY IMPLEMENT', 40, y); y += 20;
    if (!impl.length) { g.font = '600 28px "IBM Plex Mono", monospace'; g.fillStyle = '#6E6A66'; g.fillText('NO ROUNDS PLAYED.', 40, y + 55); y += rowH; }
    for (const n of impl) {
      g.drawImage(await iconImg(n, 128), 40, y + 8, 72, 72);
      g.fillStyle = '#141414'; g.font = '700 32px Inter, sans-serif'; g.textAlign = 'left'; g.fillText(titleCase(n).toUpperCase(), 135, duo ? y + 44 : y + 56);
      if (duo) chips(135, y + 56, per((p) => p.stats.implSwats[n] || 0), 'left');
      g.fillStyle = '#DF1430'; g.font = '48px Anton, Impact, sans-serif'; g.textAlign = 'right'; g.fillText(String(t.implSwats[n]), W - 40, y + 60);
      g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 2; g.beginPath(); g.moveTo(40, y + rowH - 2); g.lineTo(W - 40, y + rowH - 2); g.stroke();
      y += rowH;
    }
    y = yMercy;
    g.textAlign = 'left'; g.fillStyle = '#141414'; g.font = '40px Anton, Impact, sans-serif'; g.fillText('MERCY INVOKED', 40, y); y += 30;
    const keys = Object.keys(E.MERCY), bw = (W - 80 - (keys.length - 1) * 8) / keys.length;
    keys.forEach((k, i) => {
      const bx = 40 + i * (bw + 8);
      g.fillStyle = '#EAF6F5'; g.fillRect(bx, y, bw, mercyH); g.strokeStyle = '#0E8C8A'; g.lineWidth = 3; g.strokeRect(bx, y, bw, mercyH);
      g.textAlign = 'center'; g.fillStyle = '#0E8C8A'; g.font = '48px Anton, Impact, sans-serif'; g.fillText(String(t.mercies[k] || 0), bx + bw / 2, y + 52);
      if (duo) {
        // one chip per line so five boxes stay narrow enough
        S.players.forEach((p, pi) => {
          g.fillStyle = col(pi); roundRect(bx + 8, y + 62 + pi * 28, bw - 16, 24, 6); g.fill();
          g.fillStyle = '#fff'; g.font = '700 15px Inter, sans-serif'; g.textAlign = 'center'; g.fillText(`${p.name} ${p.stats.mercies[k] || 0}`, bx + bw / 2, y + 79 + pi * 28);
        });
      }
      g.fillStyle = '#141414'; g.font = '700 18px Inter, sans-serif'; g.textAlign = 'center'; g.fillText(E.MERCY[k].label.toUpperCase(), bx + bw / 2, y + mercyH - 8);
    });

    cv.toBlob((blob) => download(blob, 'deck-of-pain-session.png'), 'image/png');
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  /* Save the cover's how-to-play page as one long PNG for sharing offline. */
  let h2cPromise = null;
  function loadHtml2canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (!h2cPromise) h2cPromise = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'vendor/html2canvas.min.js';
      s.onload = () => res(window.html2canvas); s.onerror = () => rej(new Error('html2canvas failed to load'));
      document.head.appendChild(s);
    });
    return h2cPromise;
  }

  async function saveCover() {
    const btn = $('btn-save-cover');
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'Making image…';
    try {
      const h2c = await loadHtml2canvas();
      try { await document.fonts.ready; } catch (e) { /* ignore */ }
      const wrap = document.createElement('div');
      wrap.className = 'cover-export';
      wrap.appendChild(document.querySelector('.masthead').cloneNode(true));
      const rules = $('rules').cloneNode(true);
      rules.removeAttribute('id');
      rules.querySelectorAll('.no-export').forEach((n) => n.remove());
      wrap.appendChild(rules);
      wrap.appendChild(document.querySelector('.credits').cloneNode(true));
      document.body.appendChild(wrap);
      const canvas = await h2c(wrap, { scale: 2, backgroundColor: '#E7E4DE', useCORS: true, logging: false });
      wrap.remove();
      await new Promise((res) => canvas.toBlob((blob) => { download(blob, 'deck-of-pain-how-to-play.png'); res(); }, 'image/png'));
    } catch (err) {
      modal(`<h3>Could not make the image</h3><p>Your browser blocked it. You can still take a screenshot of the page.</p>`, [{ label: 'OK' }]);
      const stray = document.querySelector('.cover-export'); if (stray) stray.remove();
    }
    btn.textContent = label;
    btn.disabled = false;
  }

  /* ---------- events ---------- */
  const playerOf = (el) => { const b = el.closest('.board'); return S.players[b ? Number(b.dataset.p) : 0]; };

  function onBoardClick(e) {
    const p = playerOf(e.target);
    if (!p) return;
    const st = e.target.closest('[data-state]');
    if (st) { p.state = st.dataset.state; renderGame(); return; }
    const pickImpl = e.target.closest('[data-pick]');
    if (pickImpl) { p.implement = pickImpl.dataset.pick; p.pickImpl = false; p.pickBy = null; renderGame(); return; }
    const card = e.target.closest('[data-card]');
    if (card && !p.acted) {
      const id = card.dataset.card;
      if (p.sel.has(id)) p.sel.delete(id);
      else if (p.sel.size < cfg.MAX_MERCY_CARDS) p.sel.add(id);
      p.optIndex = 0; renderBoy(p); return;
    }
    const pick = e.target.closest('[data-mercy]');
    if (pick && !p.acted) {
      const key = pick.dataset.mercy;
      if (chosenKey(p) === key) { p.sel.clear(); p.optIndex = 0; }
      else {
        const cards = mercyPicks(p)[key];
        if (!cards) return;
        p.sel = new Set(cards.map((c) => c.id));
        p.optIndex = Math.max(0, mercyOptions(p).indexOf(key));
      }
      renderBoy(p); return;
    }
    if (e.target.closest('.js-counter')) applyMercy(p, p);
    else if (e.target.closest('.js-transfer')) applyMercy(p, other(p));
  }

  function bind() {
    $('btn-enter').addEventListener('click', () => show('setup'));
    $('impl-all').addEventListener('click', () => { setup.selected = new Set(Object.keys(cfg.IMPLEMENT_LIST)); renderTiles(); });
    $('impl-none').addEventListener('click', () => { setup.selected.clear(); renderTiles(); });
    $('impl-tiles').addEventListener('click', (e) => {
      const t = e.target.closest('[data-impl]'); if (!t) return;
      const n = t.dataset.impl;
      setup.selected.has(n) ? setup.selected.delete(n) : setup.selected.add(n);
      renderTiles();
    });
    $('players-1').addEventListener('click', () => { setup.players = 1; renderBoyBoxes(); renderPlayersToggle(); });
    $('players-2').addEventListener('click', () => { if (canDuo()) { setup.players = 2; renderBoyBoxes(); renderPlayersToggle(); } });
    $('boy-boxes').addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.name !== undefined) setup.names[Number(t.dataset.name)] = t.value;
      else if (t.dataset.priv) setup.priv[Number(t.dataset.i)][t.dataset.priv] = t.value;
    });
    window.addEventListener('resize', () => { if (cfg && !$('screen-setup').hidden) renderPlayersToggle(); layout(); });
    $('btn-start').addEventListener('click', () => { newGameState(); show('game'); buildBoards(); renderGame(); });

    $('boards').addEventListener('click', onBoardClick);
    $('hud-toggle').addEventListener('click', onBoardClick);
    $('boards').addEventListener('change', (e) => {
      if (e.target.name && e.target.name.startsWith('opt')) { const p = playerOf(e.target); p.optIndex = Number(e.target.value); renderBoy(p); }
    });
    $('btn-end').addEventListener('click', confirmEnd);
    $('btn-execute').addEventListener('click', () => { if (!S.players.some((p) => p.pickImpl)) execute(); });

    $('btn-save-pic').addEventListener('click', savePicture);
    $('btn-save-cover').addEventListener('click', saveCover);
    $('btn-again').addEventListener('click', () => { S = null; initSetup(); show('setup'); });
  }

  /* fill the sample round on the cover with the same vector icons the game uses */
  function fillDemoIcons() {
    document.querySelectorAll('[data-icon]').forEach((el) => {
      const k = el.dataset.icon;
      el.innerHTML = k === 'clothes' ? I.clothesMinus : k === 'privilege' ? I.privilege : I.implement(k);
    });
  }

  async function init() {
    show('cover');
    fillDemoIcons();
    try {
      const res = await fetch('config/game.yaml');
      if (!res.ok) throw new Error(res.status);
      cfg = DOP.parseYaml(await res.text());
    } catch (err) {
      $('adults-note').insertAdjacentHTML('afterend',
        '<p class="bad">Could not load config/game.yaml. Open this page from a web server (e.g. GitHub Pages or <code>python3 -m http.server</code>), not from a file.</p>');
      $('btn-enter').disabled = true;
      return;
    }
    bind();
    initSetup();
  }
  init();
})();
