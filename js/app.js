/* Deck of Pain III - UI. The app plays Sir; Boy picks Mercy from his Hand.
   Nothing is stored: refresh or end the game and the session is gone. */
(function () {
  const E = DOP.engine, I = DOP.icons;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const cardImg = (c, cls = '') => `<img class="pcard ${cls}" src="assets/cards/${c.file}" alt="${esc(E.cardName(c))}" draggable="false">`;

  let cfg = null;
  let setup = { selected: new Set(), privClothed: '', privRestrained: '' };
  let S = null; // game state

  /* ---------- screens ---------- */
  function show(name) {
    ['cover', 'setup', 'game', 'over'].forEach((n) => ($('screen-' + n).hidden = n !== name));
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
  function renderTiles() {
    $('impl-tiles').innerHTML = Object.keys(cfg.IMPLEMENT_LIST).map((name) => {
      const on = setup.selected.has(name);
      return `<button type="button" class="tile ${on ? 'on' : ''}" data-impl="${esc(name)}" aria-pressed="${on}">
        <span class="tile-icon">${I.implement(name)}</span><span class="tile-name">${esc(titleCase(name))}</span></button>`;
    }).join('');
    $('impl-count').textContent = `${setup.selected.size} selected`;
    $('btn-start').disabled = setup.selected.size === 0;
  }

  function initSetup() {
    setup.selected = new Set(Object.keys(cfg.IMPLEMENT_LIST).filter((k) => cfg.IMPLEMENT_LIST[k] === true));
    $('priv-clothed').value = cfg.DEFAULT_PRIVILEGE_CLOTHED || 'Get a rub';
    $('priv-restrained').value = cfg.DEFAULT_PRIVILEGE_RESTRAINED || 'Get a rub';
    renderTiles();
  }

  /* ---------- game flow ---------- */
  function newGameState() {
    const deck = E.shuffle(E.buildDeck(cfg.JOKERS));
    S = {
      implements: Object.keys(cfg.IMPLEMENT_LIST).filter((k) => setup.selected.has(k)),
      privilege: { clothed: $('priv-clothed').value.trim() || 'Get a rub', restrained: $('priv-restrained').value.trim() || 'Get a rub' },
      mode: 'clothed',
      game: 1, round: 1, intensity: cfg.STARTING_INTENSITY,
      pile: deck, discard: [], sir: [], hand: [],
      sel: new Set(), optIndex: 0, counter: null, implement: null, pickImpl: false,
      clothes: 0, restraints: 0,
      newSir: false, newHand: new Set(),
      stats: { implSwats: {}, rounds: 0, clothes: 0, restraints: 0, mercies: {}, swats: 0 },
      start: Date.now(),
    };
    S.hand = S.pile.splice(0, cfg.BOY_STARTING_HAND);
    S.newHand = new Set(S.hand.map((c) => c.id));
    dealSir();
    pickImplement();
  }

  function dealSir() {
    S.sir = S.pile.splice(0, Math.min(S.intensity, S.pile.length));
    S.newSir = true;
  }
  function pickImplement() {
    S.implement = S.implements[Math.floor(Math.random() * S.implements.length)];
    S.pickImpl = false;
  }
  const restraintsLeft = () => Math.max(0, cfg.MAX_RESTRAINTS - S.restraints);

  function currentPunishment() {
    const p = E.punishment(S.sir);
    let reduce = 0;
    if (S.counter && S.counter.key === 'single') reduce = E.value(S.counter.cards[0]);
    const swats = Math.max(0, p.swats - reduce);
    const clothes = S.mode === 'clothed' ? p.faces : 0;
    const restraints = S.mode === 'restrained' ? Math.min(p.faces, restraintsLeft()) : 0;
    return { base: p.swats, reduce, swats, faces: p.faces, clothes, restraints };
  }

  function execute() {
    const p = currentPunishment();
    const st = S.stats;
    st.rounds++;
    st.swats += p.swats;
    st.implSwats[S.implement] = (st.implSwats[S.implement] || 0) + p.swats;
    st.clothes += p.clothes; st.restraints += p.restraints;
    S.clothes += p.clothes; S.restraints += p.restraints;
    S.discard.push(...S.sir);
    S.sir = [];
    S.round++;
    S.sel.clear(); S.optIndex = 0; S.counter = null;
    if (S.pile.length === 0) { promptNewGamePlus(); return; }
    startRound();
  }

  function startRound() {
    dealSir();
    const drawn = S.pile.splice(0, Math.min(cfg.BOY_CARDS_PER_ROUND, S.pile.length));
    S.hand.push(...drawn);
    S.newHand = new Set(drawn.map((c) => c.id));
    pickImplement();
    renderGame();
  }

  function promptNewGamePlus() {
    renderGame();
    modal(`<h3>The Drawing Pile is empty</h3><p>Start <b>New Game+</b>? The discards are reshuffled, Boy keeps his Hand, and Intensity goes up by 1.</p>`, [
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

  /* ---------- Boy's Mercy ---------- */
  const selectedCards = () => S.hand.filter((c) => S.sel.has(c.id));
  function mercyOptions() {
    let opts = E.evaluate(selectedCards());
    if (S.pile.length === 0 || S.sir.length === 0) opts = opts.filter((k) => k !== 'pair'); // nothing to re-roll into
    return opts;
  }

  function applyCounter() {
    const opts = mercyOptions();
    const key = opts[Math.min(S.optIndex, opts.length - 1)];
    if (!key || S.counter) return;
    const cards = selectedCards();
    S.hand = S.hand.filter((c) => !S.sel.has(c.id));
    S.discard.push(...cards);
    S.sel.clear(); S.optIndex = 0;
    S.counter = { key, cards };
    S.stats.mercies[key] = (S.stats.mercies[key] || 0) + 1;
    if (key === 'pair') {
      S.discard.push(...S.sir);
      dealSir();
      S.counter.rerolled = true;
    } else if (key === 'flush') {
      S.pickImpl = true;
    } else if (key === 'trips') {
      renderGame();
      return reviseDialog();
    }
    renderGame();
  }

  function reviseDialog() {
    const m = S.mode;
    modal(`<h3>Revise Privilege</h3><p>New Privilege while <b>${m}</b>:</p>
      <input type="text" id="revise-input" maxlength="120" value="${esc(S.privilege[m])}">`, [
      { label: 'Keep as is' },
      { label: 'Save', cls: 'btn-primary', onClick: () => {
        const v = $('revise-input').value.trim();
        if (v) S.privilege[m] = v;
        renderGame();
      } },
    ]);
  }

  /* ---------- rendering ---------- */
  function renderDeck() {
    const n = S.pile.length, stack = $('deck-stack');
    if (stack.childElementCount !== n + 0 || stack.dataset.n !== String(n)) {
      stack.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const d = document.createElement('div');
        d.className = 'deck-layer' + (i === n - 1 ? ' top' : '');
        d.style.transform = `translateZ(${i * 1.3}px)`;
        stack.appendChild(d);
      }
      stack.dataset.n = n;
    }
    $('deck-n').textContent = n;
    $('deck3d').classList.toggle('empty', n === 0);
  }

  function renderHud() {
    $('st-game').textContent = S.game;
    $('st-round').textContent = S.round;
    $('st-intensity').textContent = S.intensity;
    $('st-clothes').textContent = S.clothes;
    $('st-restraints').textContent = `${S.restraints}/${cfg.MAX_RESTRAINTS}`;
    $('mode-clothed').classList.toggle('on', S.mode === 'clothed');
    $('mode-restrained').classList.toggle('on', S.mode === 'restrained');
    $('mode-clothed').setAttribute('aria-pressed', S.mode === 'clothed');
    $('mode-restrained').setAttribute('aria-pressed', S.mode === 'restrained');
  }

  function renderImplement() {
    const el = $('p-implement');
    if (S.pickImpl) {
      el.innerHTML = `<h3 class="ph">Implement <span class="tag mercy">Flush: Boy chooses</span></h3>
        <div class="impl-pick">${S.implements.map((n) => `<button type="button" class="tile mini" data-pick="${esc(n)}"><span class="tile-icon">${I.implement(n)}</span><span class="tile-name">${esc(titleCase(n))}</span></button>`).join('')}</div>`;
      return;
    }
    el.innerHTML = `<h3 class="ph">Implement</h3>
      <div class="impl-show" key="${esc(S.implement)}"><div class="impl-icon">${I.implement(S.implement)}</div>
      <div class="impl-name">${esc(titleCase(S.implement))}</div></div>`;
  }

  function renderPunish() {
    const p = currentPunishment(), c = S.counter;
    let effects = '';
    if (p.clothes) effects += `<div class="effect"><span class="eicon">${I.clothesMinus}</span><span class="ecount">×${p.clothes}</span><span class="elabel">Clothing</span></div>`;
    if (p.restraints) effects += `<div class="effect"><span class="eicon">${I.restraintPlus}</span><span class="ecount">×${p.restraints}</span><span class="elabel">Restraint</span></div>`;
    if (S.mode === 'restrained' && p.faces && !p.restraints) effects += `<div class="note">Restraint limit reached (${cfg.MAX_RESTRAINTS}).</div>`;
    let priv = '';
    if (c && (c.key === 'straight' || c.key === 'trips')) {
      priv = `<div class="privilege"><span class="eicon small">${I.privilege}</span><div><div class="elabel">Privilege (${S.mode})</div><div class="ptext">${esc(S.privilege[S.mode])}</div></div></div>`;
    }
    let mercy = '';
    if (c) {
      const m = E.MERCY[c.key];
      mercy = `<div class="mercy-line">Mercy: <b>${m.label}</b> — ${m.effect}${c.key === 'single' ? ` (−${p.reduce})` : ''}</div>`;
    }
    $('p-punish').innerHTML = `<h3 class="ph">Punishment</h3>
      <div class="swats"><span class="swat-num" key="${p.swats}">${p.swats}</span><span class="swat-word">swats</span></div>
      <div class="effects">${effects}</div>${priv}${mercy}`;
    const num = $('p-punish').querySelector('.swat-num');
    if (num && S.lastSwats !== undefined && S.lastSwats !== p.swats) { num.classList.add('pop'); }
    S.lastSwats = p.swats;
  }

  function renderSir() {
    const cards = S.sir.map((c, i) => `<div class="cardwrap ${S.newSir ? 'deal' : ''}" style="--i:${i}">${cardImg(c)}</div>`).join('');
    $('p-sir').innerHTML = `<h3 class="ph">Sir <span class="tag">draws ${S.sir.length}${S.sir.length < S.intensity ? ' (pile exhausted)' : ''}</span></h3>
      <div class="cards">${cards || '<p class="muted">No cards left.</p>'}</div>`;
    S.newSir = false;
  }

  function renderBoy() {
    const sorted = S.hand.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99) || a.suit.localeCompare(b.suit));
    const cards = sorted.map((c) => {
      const on = S.sel.has(c.id);
      return `<button type="button" class="cardbtn ${on ? 'sel' : ''} ${S.newHand.has(c.id) ? 'deal' : ''}" data-card="${c.id}" aria-pressed="${on}" ${S.counter ? 'disabled' : ''}>${cardImg(c)}</button>`;
    }).join('');
    const opts = mercyOptions();
    const selN = S.sel.size;
    let status;
    if (S.counter) status = `<span class="muted">Mercy already played this round.</span>`;
    else if (selN === 0) status = `<span class="muted">Select up to ${cfg.MAX_MERCY_CARDS} cards to counter.</span>`;
    else if (!opts.length) status = `<span class="bad">No Mercy with these cards.</span>`;
    else status = opts.map((k, i) => `<label class="opt ${i === Math.min(S.optIndex, opts.length - 1) ? 'on' : ''}"><input type="radio" name="opt" value="${i}" ${i === Math.min(S.optIndex, opts.length - 1) ? 'checked' : ''}><b>${E.MERCY[k].label}</b> — ${E.MERCY[k].effect}</label>`).join('');
    $('p-boy').innerHTML = `<h3 class="ph">Boy <span class="tag mercy">Hand: ${S.hand.length}</span></h3>
      <div class="cards hand">${cards || '<p class="muted">Hand is empty.</p>'}</div>
      <div class="mercy-status">${status}</div>
      <button type="button" class="btn btn-mercy" id="btn-counter" ${(!opts.length || S.counter) ? 'disabled' : ''}>Counter</button>`;
    S.newHand = new Set();
  }

  function renderGame() {
    renderHud(); renderDeck(); renderImplement(); renderPunish(); renderSir(); renderBoy();
    const ex = $('btn-execute');
    ex.disabled = S.pickImpl;
    ex.textContent = S.pickImpl ? 'Choose an implement first' : 'Execute';
  }

  /* ---------- game over ---------- */
  function gameOver() {
    closeModal();
    const st = S.stats, elapsed = Date.now() - S.start;
    S.elapsed = elapsed;
    const impl = Object.keys(st.implSwats).sort((a, b) => st.implSwats[b] - st.implSwats[a]);
    const mercyKeys = Object.keys(E.MERCY);
    $('over-box').innerHTML = `<h2>Game over</h2>
      <div class="big-stats">
        <div><b>${S.game}</b><span>Games</span></div><div><b>${st.rounds}</b><span>Rounds</span></div>
        <div><b>${st.swats}</b><span>Total swats</span></div><div><b>${st.clothes}</b><span>Clothing removed</span></div>
        <div><b>${st.restraints}</b><span>Restraints added</span></div><div><b>${E.fmtTime(elapsed)}</b><span>Elapsed</span></div>
      </div>
      <h3>Swats by implement</h3>
      <div class="impl-stats">${impl.length ? impl.map((n) => `<div class="istat"><span class="tile-icon">${I.implement(n)}</span><span class="iname">${esc(titleCase(n))}</span><b>${st.implSwats[n]}</b></div>`).join('') : '<p class="muted">No rounds were played.</p>'}</div>
      <h3>Mercy invoked</h3>
      <div class="mercy-stats">${mercyKeys.map((k) => `<div class="mstat"><span>${E.MERCY[k].label}</span><b>${st.mercies[k] || 0}</b></div>`).join('')}</div>`;
    show('over');
  }

  /* Draw the stats onto a canvas and download it as a PNG. */
  async function savePicture() {
    const st = S.stats;
    const impl = Object.keys(st.implSwats).sort((a, b) => st.implSwats[b] - st.implSwats[a]);
    const W = 1080, rowH = 90;
    const H = 520 + Math.max(1, impl.length) * rowH + 360;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    try { await Promise.all(['64px Anton', '600 28px "IBM Plex Mono"', '700 30px Inter'].map((f) => document.fonts.load(f))); } catch (e) { /* fall back to system fonts */ }
    g.fillStyle = '#FBFAF8'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#141414'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
    g.textAlign = 'center';
    g.font = '96px Anton, Impact, sans-serif'; g.fillStyle = '#141414';
    const t1 = 'DECK OF ', t2 = 'PAIN ', t3 = 'III';
    const w = [t1, t2, t3].map((t) => g.measureText(t).width);
    let x = W / 2 - (w[0] + w[1] + w[2]) / 2; g.textAlign = 'left';
    g.fillStyle = '#141414'; g.fillText(t1, x, 130);
    g.fillStyle = '#DF1430'; g.fillText(t2, x + w[0], 130);
    g.fillStyle = '#0E8C8A'; g.fillText(t3, x + w[0] + w[1], 130);
    g.textAlign = 'center'; g.fillStyle = '#6E6A66'; g.font = '700 26px Inter, sans-serif';
    g.fillText('BY U/PLAYDOPAIN', W / 2, 175);

    const cells = [[S.game, 'Games'], [st.rounds, 'Rounds'], [st.swats, 'Total swats'], [st.clothes, 'Clothing removed'], [st.restraints, 'Restraints added'], [E.fmtTime(S.elapsed), 'Elapsed']];
    cells.forEach((c, i) => {
      const cx = 40 + (i % 3) * 335, cy = 215 + Math.floor(i / 3) * 135;
      g.fillStyle = '#fff'; g.strokeStyle = '#141414'; g.lineWidth = 3;
      g.fillRect(cx, cy, 320, 115); g.strokeRect(cx, cy, 320, 115);
      g.fillStyle = '#DF1430'; g.font = '56px Anton, Impact, sans-serif'; g.textAlign = 'center';
      g.fillText(String(c[0]), cx + 160, cy + 68);
      g.fillStyle = '#6E6A66'; g.font = '700 22px Inter, sans-serif'; g.fillText(c[1].toUpperCase(), cx + 160, cy + 100);
    });

    let y = 520;
    g.textAlign = 'left'; g.fillStyle = '#141414'; g.font = '40px Anton, Impact, sans-serif';
    g.fillText('SWATS BY IMPLEMENT', 40, y); y += 20;
    if (!impl.length) { g.font = '600 28px "IBM Plex Mono", monospace'; g.fillStyle = '#6E6A66'; g.fillText('No rounds played.', 40, y + 55); y += rowH; }
    for (const n of impl) {
      const svgText = I.implement(n).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ').replace(/currentColor/g, '#141414').replace(/var\(--icon-cut,#fff\)/g, '#FBFAF8');
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.onerror = res; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText); });
      g.drawImage(img, 40, y + 8, 72, 72);
      g.fillStyle = '#141414'; g.font = '700 32px Inter, sans-serif'; g.textAlign = 'left'; g.fillText(titleCase(n), 135, y + 56);
      g.fillStyle = '#DF1430'; g.font = '48px Anton, Impact, sans-serif'; g.textAlign = 'right'; g.fillText(String(st.implSwats[n]), W - 40, y + 60);
      g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 2; g.beginPath(); g.moveTo(40, y + rowH - 2); g.lineTo(W - 40, y + rowH - 2); g.stroke();
      y += rowH;
    }
    y += 50;
    g.textAlign = 'left'; g.fillStyle = '#141414'; g.font = '40px Anton, Impact, sans-serif'; g.fillText('MERCY INVOKED', 40, y); y += 30;
    Object.keys(E.MERCY).forEach((k, i) => {
      g.fillStyle = '#EAF6F5'; g.fillRect(40 + i * 200, y, 190, 100);
      g.strokeStyle = '#0E8C8A'; g.lineWidth = 3; g.strokeRect(40 + i * 200, y, 190, 100);
      g.textAlign = 'center'; g.fillStyle = '#0E8C8A'; g.font = '48px Anton, Impact, sans-serif'; g.fillText(String(st.mercies[k] || 0), 135 + i * 200, y + 55);
      g.fillStyle = '#141414'; g.font = '700 20px Inter, sans-serif'; g.fillText(E.MERCY[k].label, 135 + i * 200, y + 86);
    });
    y += 150;
    g.fillStyle = '#6E6A66'; g.font = '600 18px "IBM Plex Mono", monospace'; g.textAlign = 'center';
    g.fillText('Cards: Vector Playing Cards 3.2 by Chris Aguilar, totalnonsense.com (LGPL 3.0)', W / 2, H - 40);

    cv.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'deck-of-pain-session.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }, 'image/png');
  }

  /* ---------- events ---------- */
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
    $('btn-start').addEventListener('click', () => { newGameState(); show('game'); renderGame(); });

    $('mode-clothed').addEventListener('click', () => { S.mode = 'clothed'; renderGame(); });
    $('mode-restrained').addEventListener('click', () => { S.mode = 'restrained'; renderGame(); });
    $('btn-end').addEventListener('click', confirmEnd);
    $('btn-execute').addEventListener('click', () => { if (!S.pickImpl) execute(); });

    $('p-implement').addEventListener('click', (e) => {
      const t = e.target.closest('[data-pick]'); if (!t) return;
      S.implement = t.dataset.pick; S.pickImpl = false; renderGame();
    });
    $('p-boy').addEventListener('click', (e) => {
      const card = e.target.closest('[data-card]');
      if (card && !S.counter) {
        const id = card.dataset.card;
        if (S.sel.has(id)) S.sel.delete(id);
        else if (S.sel.size < cfg.MAX_MERCY_CARDS) S.sel.add(id);
        S.optIndex = 0; renderBoy(); return;
      }
      if (e.target.closest('#btn-counter')) applyCounter();
    });
    $('p-boy').addEventListener('change', (e) => {
      if (e.target.name === 'opt') { S.optIndex = Number(e.target.value); renderBoy(); }
    });

    $('btn-save-pic').addEventListener('click', savePicture);
    $('btn-again').addEventListener('click', () => { S = null; initSetup(); show('setup'); });
  }

  async function init() {
    try {
      const res = await fetch('config/game.yaml');
      if (!res.ok) throw new Error(res.status);
      cfg = DOP.parseYaml(await res.text());
    } catch (err) {
      $('screen-cover').querySelector('.cover-box').insertAdjacentHTML('beforeend',
        '<p class="bad">Could not load config/game.yaml. Open this page from a web server (e.g. GitHub Pages or <code>python3 -m http.server</code>), not from a file.</p>');
      $('btn-enter').disabled = true;
      return;
    }
    bind();
    initSetup();
  }
  init();
})();
