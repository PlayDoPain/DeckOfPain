/* SPDX-License-Identifier: Apache-2.0
   Copyright 2026 PlayDoPain (u/PlayDoPain). See NOTICE. */
/* Deck of Pain III: Inspection. A plain body figure covered by tiles, one per part. Tapping a tile sends it
   to the Order list (beside the figure in landscape, below it in portrait). Parts are shared between the
   front and the back view, so taking one removes it from both. Nothing is stored. */
window.DOP = window.DOP || {};
DOP.inspection = (function () {
  const $ = (id) => document.getElementById(id);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = (ms) => (reduce ? 0 : ms);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* Play an animation, but never wait on it for longer than it should take (a paused or hidden tab would stall otherwise). */
  async function play(el, frames, opts) {
    const a = el.animate(frames, opts);
    await Promise.race([a.finished.catch(() => {}), wait(opts.duration + 120)]);
    return a;
  }

  /* Parts of the body. Each part is one item to inspect, wherever it is shown.
     Most parts appear on both the front and the back (take the left hand from either side and it is gone from both).
     Only the chest, abdomen and penis are front-only, and only the back and the butt are back-only.
     Grid: 4 columns by 10 rows. Each placement is [column, row, columns spanned, rows spanned].
     Front: the viewer's left is the man's right. Back: the viewer's left is the man's left. */
  const PARTS = [
    { id: 'head',   label: 'Head',           cls: 't-head', front: [2, 1, 2, 2], back: [2, 1, 2, 2] },
    { id: 'rsh',    label: 'Right shoulder',                 front: [1, 2, 1, 2], back: [4, 2, 1, 2] },
    { id: 'lsh',    label: 'Left shoulder',                  front: [4, 2, 1, 2], back: [1, 2, 1, 2] },
    { id: 'chest',  label: 'Chest',                          front: [2, 3, 2, 2] },
    { id: 'back',   label: 'Back',                           back:  [2, 3, 2, 2] },
    { id: 'rhand',  label: 'Right hand',                     front: [1, 4, 1, 2], back: [4, 4, 1, 2] },
    { id: 'lhand',  label: 'Left hand',                      front: [4, 4, 1, 2], back: [1, 4, 1, 2] },
    { id: 'abd',    label: 'Abdomen',                        front: [2, 5, 2, 1] },
    { id: 'butt',   label: 'Butt',                           back:  [2, 5, 2, 2] },
    { id: 'penis',  label: 'Penis',                          front: [2, 6, 2, 1] },
    { id: 'rthigh', label: 'Right thigh',                    front: [2, 7, 1, 2], back: [3, 7, 1, 2] },
    { id: 'lthigh', label: 'Left thigh',                     front: [3, 7, 1, 2], back: [2, 7, 1, 2] },
    { id: 'rfoot',  label: 'Right foot',                     front: [2, 9, 1, 2], back: [3, 9, 1, 2] },
    { id: 'lfoot',  label: 'Left foot',                      front: [3, 9, 1, 2], back: [2, 9, 1, 2] },
  ];

  let built = false, view = 'front', busy = false, counter = 0;
  let grids, figure, order;
  const remaining = () => PARTS.filter((p) => !p.sent);
  const viewOf = (p) => (p.els[view] ? view : (view === 'front' ? 'back' : 'front')); // the side to send it from

  function build() {
    grids = { front: $('in-grid-front'), back: $('in-grid-back') };
    figure = $('in-figure'); order = $('in-order');
    PARTS.forEach((p) => {
      p.sent = false; p.n = 0; p.els = {};
      ['front', 'back'].forEach((side) => {
        const at = p[side];
        if (!at) return;
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'in-tile ' + (p.cls || '');
        el.textContent = p.label;
        el.style.gridColumn = `${at[0]} / span ${at[2]}`;
        el.style.gridRow = `${at[1]} / span ${at[3]}`;
        el.setAttribute('aria-label', `Inspect ${p.label}`);
        el.addEventListener('click', () => { if (!busy) send(p); });
        grids[side].appendChild(el);
        p.els[side] = el;
      });
    });
    $('in-front').addEventListener('click', () => { if (!busy) setView('front'); });
    $('in-back').addEventListener('click', () => { if (!busy) setView('back'); });
    $('in-pick').addEventListener('click', randomPick);
    $('in-random').addEventListener('click', randomOrder);
    $('in-reset').addEventListener('click', reset);
    built = true;
  }

  function updateInfo() {
    $('in-left').textContent = remaining().length;
    $('in-empty').hidden = order.children.length > 0;
    $('in-pick').disabled = $('in-random').disabled = remaining().length === 0;
    $('in-front').classList.toggle('on', view === 'front'); $('in-back').classList.toggle('on', view === 'back');
    $('in-front').setAttribute('aria-pressed', view === 'front'); $('in-back').setAttribute('aria-pressed', view === 'back');
  }

  /* turn the figure around: squash to a line, swap the sides, open again */
  async function setView(v) {
    if (v === view) return;
    busy = true; figure.classList.add('busy');
    const a = await play(figure, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0.02)' }], { duration: dur(190), easing: 'ease-in', fill: 'forwards' });
    view = v;
    grids.front.hidden = v !== 'front'; grids.back.hidden = v !== 'back';
    const b = figure.animate([{ transform: 'scaleX(0.02)' }, { transform: 'scaleX(1)' }], { duration: dur(190), easing: 'ease-out' });
    a.cancel();
    await Promise.race([b.finished.catch(() => {}), wait(dur(190) + 120)]);
    b.finish();
    busy = false; figure.classList.remove('busy');
    updateInfo();
  }

  /* send a part to the order list, flying from its tile to where it lands */
  async function send(part) {
    if (part.sent) return;
    const side = viewOf(part);
    if (side !== view) await setView(side);
    busy = true;
    const first = part.els[view].getBoundingClientRect();
    part.sent = true; part.n = ++counter;
    const li = makeItem(part);
    order.appendChild(li);
    Object.values(part.els).forEach((el) => (el.hidden = true));
    updateInfo();
    const last = li.getBoundingClientRect();
    if (!reduce && first.width) {
      const dx = first.left - last.left, dy = first.top - last.top, sx = first.width / last.width, sy = first.height / last.height;
      const fly = await play(li, [{ transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.85 }, { transformOrigin: 'top left', transform: 'none', opacity: 1 }],
        { duration: 440, easing: 'cubic-bezier(.2,.8,.3,1)' });
      fly.finish();
    }
    li.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    busy = false;
  }

  function makeItem(part) {
    const li = document.createElement('li');
    li.className = 'in-ord';
    li.title = 'Tap to put back';
    li.innerHTML = `<b>${part.n}</b><span>${part.label}</span>`;
    li.addEventListener('click', () => { if (!busy) putBack(part); });
    part.li = li;
    return li;
  }

  /* put a part back on the body (on every side it appears) and renumber what is left */
  function putBack(part) {
    part.sent = false; part.li.remove(); part.li = null;
    Object.values(part.els).forEach((el) => (el.hidden = false));
    const sent = PARTS.filter((p) => p.sent).sort((x, y) => x.n - y.n);
    sent.forEach((p, i) => { p.n = i + 1; p.li.querySelector('b').textContent = p.n; });
    counter = sent.length;
    updateInfo();
  }

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  async function randomPick() { const r = remaining(); if (r.length && !busy) await send(pickRandom(r)); }
  async function randomOrder() {
    if (busy) return;
    const r = remaining().sort(() => Math.random() - 0.5);
    const want = $('in-n').value === 'all' ? r.length : Math.min(Number($('in-n').value), r.length);
    for (const p of r.slice(0, want)) { await send(p); await wait(dur(140)); }
  }
  function reset() {
    if (busy) return;
    PARTS.forEach((p) => { p.sent = false; p.n = 0; if (p.li) p.li.remove(); p.li = null; Object.values(p.els).forEach((el) => (el.hidden = false)); });
    counter = 0; updateInfo();
  }

  /* open the inspection screen: build it the first time, and start fresh every time */
  function enter() {
    if (!built) build();
    busy = false; figure.classList.remove('busy');
    reset();
    if (view !== 'front') { view = 'front'; grids.front.hidden = false; grids.back.hidden = true; }
    updateInfo();
  }

  return { enter };
})();
