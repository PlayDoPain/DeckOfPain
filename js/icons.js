/* SPDX-License-Identifier: Apache-2.0
   Copyright 2026 PlayDoPain (u/PlayDoPain). See NOTICE. */
/* Vector icons (64x64, drawn for this project). Color comes from currentColor;
   .cut parts punch through to the panel background. */
window.DOP = window.DOP || {};
DOP.icons = (function () {
  const S = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
  const svg = (inner) => `<svg viewBox="0 0 64 64" aria-hidden="true">${inner}</svg>`;

  const implement = {
    'hand': svg(`<g ${S} stroke-width="3"><path d="M20 36V17a3.5 3.5 0 017 0v15"/><path d="M27 31V11a3.5 3.5 0 017 0v21"/><path d="M34 32V13a3.5 3.5 0 017 0v22"/><path d="M41 35V20a3.5 3.5 0 017 0v22c0 11-7 18-17 18h-3c-8 0-12-4-16-10l-6-10a3.5 3.5 0 015.5-4L20 44"/></g>`),
    'hair brush': svg(`<ellipse cx="32" cy="21" rx="16" ry="18" fill="currentColor"/><rect x="27" y="38" width="10" height="22" rx="5" fill="currentColor"/><g fill="var(--icon-cut,#fff)"><circle cx="24" cy="14" r="2.2"/><circle cx="32" cy="12" r="2.2"/><circle cx="40" cy="14" r="2.2"/><circle cx="22" cy="22" r="2.2"/><circle cx="32" cy="21" r="2.2"/><circle cx="42" cy="22" r="2.2"/><circle cx="26" cy="29" r="2.2"/><circle cx="38" cy="29" r="2.2"/></g>`),
    'leather paddle': svg(`<rect x="12" y="6" width="40" height="30" rx="9" fill="currentColor"/><rect x="28" y="36" width="8" height="16" fill="currentColor"/><rect x="25" y="50" width="14" height="10" rx="4" fill="currentColor"/><rect x="17" y="11" width="30" height="20" rx="5" fill="none" stroke="var(--icon-cut,#fff)" stroke-width="1.6" stroke-dasharray="3 2.5"/>`),
    'belt': svg(`<path d="M3 24h50l8 8-8 8H3z" fill="currentColor"/><rect x="6" y="19" width="16" height="26" rx="3" fill="none" stroke="currentColor" stroke-width="3.5"/><rect x="12" y="27" width="10" height="10" fill="currentColor"/><g fill="var(--icon-cut,#fff)"><circle cx="32" cy="32" r="2"/><circle cx="39" cy="32" r="2"/><circle cx="46" cy="32" r="2"/></g>`),
    'shoe horn': svg(`<path d="M40 5C52 4 56 16 49 27L26 58c-2 3-7 1-6-2l2-8c1-3 4-6 9-12 4-6 5-14 4-23z" fill="currentColor"/><path d="M41 10c2 8 0 14-4 20" fill="none" stroke="var(--icon-cut,#fff)" stroke-width="2" stroke-linecap="round"/><circle cx="24" cy="53" r="2" fill="var(--icon-cut,#fff)"/>`),
    'wooden paddle': svg(`<rect x="19" y="2" width="26" height="42" rx="6" fill="currentColor"/><rect x="28" y="44" width="8" height="12" fill="currentColor"/><rect x="25" y="54" width="14" height="8" rx="3.5" fill="currentColor"/><g fill="var(--icon-cut,#fff)"><circle cx="27" cy="10" r="2.5"/><circle cx="37" cy="10" r="2.5"/><circle cx="32" cy="18" r="2.5"/><circle cx="27" cy="26" r="2.5"/><circle cx="37" cy="26" r="2.5"/><circle cx="32" cy="34" r="2.5"/></g>`),
    'fly swatter': svg(`<rect x="14" y="3" width="36" height="34" rx="5" fill="none" stroke="currentColor" stroke-width="4"/><g stroke="currentColor" stroke-width="1.8"><path d="M24 5v30M32 5v30M40 5v30M16 14h32M16 22h32M16 30h32"/></g><rect x="28.5" y="37" width="7" height="22" rx="3.5" fill="currentColor"/>`),
    'crop': svg(`<path d="M13 58L47 17" ${S} stroke-width="3.5"/><path d="M10 61l5-6-3-3-5 6z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M45 20l6-10c2-3 6-5 9-3 1 5-2 9-6 12l-9 5z" fill="currentColor"/><path d="M52 11c2 0 4 1 5 3" fill="none" stroke="var(--icon-cut,#fff)" stroke-width="1.6" stroke-linecap="round"/>`),
    'cane': svg(`<path d="M32 4V46" ${S} stroke-width="3.5"/><path d="M32 40v22" ${S} stroke-width="8"/><path d="M27.5 50h9M27.5 55h9" stroke="var(--icon-cut,#fff)" stroke-width="1.5" stroke-linecap="round" fill="none"/>`),
    'ping pong paddle': svg(`<circle cx="30" cy="23" r="19" fill="currentColor"/><circle cx="30" cy="23" r="14" fill="none" stroke="var(--icon-cut,#fff)" stroke-width="1.8"/><rect x="26" y="40" width="8" height="21" rx="3" fill="currentColor"/><circle cx="53" cy="50" r="5" fill="none" stroke="currentColor" stroke-width="3"/>`),
    'ruler': svg(`<rect x="3" y="20" width="58" height="24" rx="3" fill="currentColor"/><g stroke="var(--icon-cut,#fff)" stroke-width="2" stroke-linecap="round"><path d="M10 20v10M18 20v6M26 20v10M34 20v6M42 20v10M50 20v6M58 20v8"/></g>`),
  };

  const fallback = svg(`<circle cx="32" cy="32" r="22" ${S} stroke-width="3"/><path d="M24 32h16M32 24v16" ${S} stroke-width="3"/>`);

  const shorts = `<path d="M8 14h36l5 34H34l-8-17-8 17H3z" fill="currentColor"/><path d="M8 21h36" stroke="var(--icon-cut,#fff)" stroke-width="1.6"/>`;
  const rope = `<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><ellipse cx="28" cy="38" rx="17" ry="13"/><path d="M16 28c-4-8-1-14 4-17M40 27c6-6 8-12 5-17"/></g><g stroke="var(--icon-cut,#fff)" stroke-width="1.6" stroke-dasharray="2 3.4"><ellipse cx="28" cy="38" rx="17" ry="13" fill="none"/></g>`;
  const badge = (sign, color) => `<circle cx="48" cy="16" r="12" fill="${color}"/><path d="${sign}" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`;

  return {
    implement: (name) => implement[name.toLowerCase()] || fallback,
    clothesMinus: svg(shorts + badge('M42 16h12', '#7A2E8C')),
    restraintPlus: svg(rope + badge('M42 16h12M48 10v12', '#7A2E8C')),
    privilege: svg(`<path d="M32 56S6 40 6 22a14 14 0 0126-6 14 14 0 0126 6c0 18-26 34-26 34z" fill="currentColor"/>`),
  };
})();
