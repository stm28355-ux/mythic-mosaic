// 登場と行動のエフェクト（判定表 第14回：生き物が出た時と、効果を当てる時を凝る）。
// 盤の SVG（view.js が手ごとに描き直す）の上に、同じ viewBox の別の SVG を重ね、そこに描いて時間がたったら消す。
// ルールは持たない。段（place() の steps の1つ）の前後の盤をくらべて、何が起きたかを絵にするだけ。
import { toPixel, parseKey, distance } from '../core/hex.js';
import { CREATURES } from '../core/creatures.js';
import { SIZE, LIFT, ART, CREATURE_LOOK } from './view.js';
import { creatureSvg } from '../art/creatures.js';

const NS = 'http://www.w3.org/2000/svg';
const byId = Object.fromEntries(CREATURES.map((c) => [c.id, c]));
const el = (name, attrs = {}) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

// 変わった物の色（地面・上に乗る物・高さ・帰す）
const KIND_COLOR = {
  grass: '#8fd36a', water: '#6ab8ff', sand: '#f0d08a', marsh: '#6fb39a', barren: '#b89c84',
  tree: '#4fb35f', flower: '#ff9cc2', rock: '#c4bfb7', nest: '#c08e5c', clear: '#ffffff',
  up: '#ffe07a', down: '#a7c4ff', release: '#eef6ff',
  // 第2の島：灰・溶岩・薪・種・炎、押す風
  ash: '#d2ccd0', lava: '#ff7a3c', firewood: '#c08e5c', seed: '#d8a56c', fire: '#ffb347', push: '#e3ecf8',
};

// 盤の上に重ねる SVG を用意する（なければ作る）。viewBox は盤と同じにする
export function fxLayer(boardSvg) {
  let fx = document.getElementById('fx');
  if (!fx) {
    fx = el('svg', { id: 'fx', 'aria-hidden': 'true' });
    boardSvg.after(fx);
  }
  fx.setAttribute('viewBox', boardSvg.getAttribute('viewBox'));
  return fx;
}

export function clearFx() {
  document.getElementById('fx')?.replaceChildren();
}

// マスの中心（高さの持ち上げ込み）
const center = (board, k) => {
  const [q, r] = parseKey(k);
  const [x, y] = toPixel(q, r, SIZE);
  return [x, y - (board.cells[k]?.height ?? 0) * LIFT];
};

// 描いて、ms たったら消す
const add = (fx, node, ms) => { fx.append(node); setTimeout(() => node.remove(), ms); return node; };
const anim = (node, frames, ms, delay = 0, easing = 'ease-out') => node.animate(frames, { duration: ms, delay, easing, fill: 'both' });

// 4つ角の星（きらめき）
const star = (s) => `0,${-s} ${s * 0.28},${-s * 0.28} ${s},0 ${s * 0.28},${s * 0.28} 0,${s} ${-s * 0.28},${s * 0.28} ${-s},0 ${-s * 0.28},${-s * 0.28}`;

// ---- 登場：光の柱・広がる輪・飛び散るきらめき ----
export function spawnFx(fx, board, spawned, found = []) {
  const named = new Set();
  for (const s of spawned) {
    const [x, y] = center(board, s.key);
    const color = CREATURE_LOOK[s.id]?.color ?? '#fff';
    // 光の柱（上から差す）
    const beam = add(fx, el('rect', { x: x - SIZE * 0.45, y: y - SIZE * 3, width: SIZE * 0.9, height: SIZE * 3.2, rx: SIZE * 0.45, fill: 'url(#fx-beam)' }), 900);
    anim(beam, [{ opacity: 0, transform: 'scaleX(0.3)' }, { opacity: 0.9, transform: 'scaleX(1)', offset: 0.3 }, { opacity: 0, transform: 'scaleX(0.6)' }], 900);
    beam.style.transformBox = 'fill-box';
    beam.style.transformOrigin = '50% 100%';
    // 白い光（出た瞬間にぱっと光る）
    const flash = add(fx, el('circle', { cx: x, cy: y, r: SIZE * 0.9, fill: 'url(#fx-flash)' }), 700);
    anim(flash, [{ opacity: 0, transform: 'scale(0.4)' }, { opacity: 1, transform: 'scale(1.1)', offset: 0.25 }, { opacity: 0, transform: 'scale(1.4)' }], 600);
    flash.style.transformBox = 'fill-box';
    flash.style.transformOrigin = '50% 50%';
    // 広がる輪（2重）
    for (const [i, w] of [[0, 3], [1, 2]]) {
      const ring = add(fx, el('circle', { cx: x, cy: y, r: SIZE * 0.3, fill: 'none', stroke: i ? '#fff' : color, 'stroke-width': w + 1.5, class: 'fx-glow' }), 900);
      anim(ring, [{ r: SIZE * 0.3, opacity: 1 }, { r: SIZE * (1.25 + i * 0.3), opacity: 0 }], 700, i * 140);
    }
    // きらめき（生き物の色と白・金）
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + (i % 2) * 0.2;
      const d = SIZE * (0.9 + (i % 3) * 0.25);
      const sp = add(fx, el('polygon', { points: star(i % 2 ? 4.5 : 7), fill: [color, '#ffffff', '#ffe07a'][i % 3], class: 'fx-glow' }), 1000);
      anim(sp, [
        { transform: `translate(${x}px, ${y}px) scale(0.2) rotate(0deg)`, opacity: 0 },
        { transform: `translate(${x + Math.cos(a) * d * 0.6}px, ${y + Math.sin(a) * d * 0.6}px) scale(1.2) rotate(90deg)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${x + Math.cos(a) * d}px, ${y + Math.sin(a) * d - 6}px) scale(0.3) rotate(200deg)`, opacity: 0 },
      ], 800, 80);
    }
    // 名前が浮かぶ（同じ種類は1つだけ。初めての生き物は金色で大きく）
    if (!named.has(s.id)) {
      named.add(s.id);
      const first = !found.includes(s.id);
      const t = add(fx, el('text', { x: 0, y: 0, class: first ? 'fx-name fx-new' : 'fx-name' }), 1300);
      t.textContent = first ? `${byId[s.id].name}！ はじめて` : byId[s.id].name;
      anim(t, [
        { transform: `translate(${x}px, ${y - SIZE * 0.6}px) scale(0.6)`, opacity: 0 },
        { transform: `translate(${x}px, ${y - SIZE * 1.1}px) scale(1)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${x}px, ${y - SIZE * 1.3}px) scale(1)`, opacity: 1, offset: 0.75 },
        { transform: `translate(${x}px, ${y - SIZE * 1.6}px) scale(0.95)`, opacity: 0 },
      ], 1200, 120);
    }
  }
}

// 段の前後をくらべて、マスごとに何が変わったか（色の種類）
function changeKind(before, after) {
  if (before.creature && !after.creature) return 'release';
  if (before.ground !== after.ground) return after.ground;
  if (before.object !== after.object) return after.object ?? 'clear';
  if (before.height < after.height) return 'up';
  if (before.height > after.height) return 'down';
  return null;
}

// そのマスに効果を当てた生き物（その段で出た生き物のうち、効果が届くもの。いちばん近いもの）
const reachOf = (id) => Math.max(1, ...(byId[id].effects ?? [byId[id].effect]).filter(Boolean).map((e) => e.range ?? 1));
function sourceOf(spawned, k) {
  const [q, r] = parseKey(k);
  let best = null;
  for (const s of spawned) {
    const [q2, r2] = parseKey(s.key);
    const d = distance(q, r, q2, r2);
    if (d <= reachOf(s.id) && (!best || d < best.d)) best = { s, d };
  }
  return best?.s ?? null;
}

// ---- 行動：生き物から、変わるマスへ光の玉が飛ぶ。届くまでの時間（ms）を返す ----
export function actionFx(fx, before, after, step) {
  const skip = pushedKeys(step);
  const keys = [...new Set([...step.changed, ...Object.keys(after.cells).filter((k) => before.cells[k]?.creature && !after.cells[k].creature)])].filter((k) => !skip.has(k));
  let longest = gustFx(fx, before, step);
  for (const k of keys) {
    const kind = changeKind(before.cells[k], after.cells[k]);
    if (!kind) continue;
    const src = sourceOf(step.spawned, k);
    if (!src) continue;
    const [x0, y0] = center(before, src.key);
    const [x1, y1] = center(before, k);
    const color = KIND_COLOR[kind] ?? '#fff';
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const delay = Math.round(dist * 1.2);
    const ms = 380;
    longest = Math.max(longest, delay + ms);
    const lift = Math.min(28, dist * 0.35);
    const orb = add(fx, el('circle', { cx: 0, cy: 0, r: 6, fill: color, stroke: '#ffffff', 'stroke-width': 1.5, class: 'fx-orb' }), delay + ms + 50);
    anim(orb, [
      { transform: `translate(${x0}px, ${y0}px) scale(0.4)`, opacity: 0 },
      { transform: `translate(${(x0 + x1) / 2}px, ${(y0 + y1) / 2 - lift}px) scale(1.2)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${x1}px, ${y1}px) scale(0.8)`, opacity: 1 },
    ], ms, delay, 'ease-in-out');
    // 光の尾（少しずつ遅れて同じ道を通る小さな玉）
    for (let j = 1; j <= 3; j++) {
      const tail = add(fx, el('circle', { cx: 0, cy: 0, r: 4 - j, fill: j === 1 ? '#ffffff' : color, class: 'fx-orb' }), delay + ms + 60 * j + 60);
      anim(tail, [
        { transform: `translate(${x0}px, ${y0}px)`, opacity: 0 },
        { transform: `translate(${(x0 + x1) / 2}px, ${(y0 + y1) / 2 - lift}px)`, opacity: 0.9 - j * 0.2, offset: 0.5 },
        { transform: `translate(${x1}px, ${y1}px)`, opacity: 0 },
      ], ms, delay + 45 * j, 'ease-in-out');
    }
  }
  return longest;
}

// ---- 着いたマス：波紋と、変わった物に合わせた粒（葉・しずく・砂・泡・花びら・かけら・矢印・帰る生き物） ----
export function impactFx(fx, before, after, step) {
  const skip = pushedKeys(step);
  const keys = [...new Set([...step.changed, ...Object.keys(after.cells).filter((k) => before.cells[k]?.creature && !after.cells[k].creature)])].filter((k) => !skip.has(k));
  pushFx(fx, before, after, step);
  for (const k of keys) {
    const kind = changeKind(before.cells[k], after.cells[k]);
    if (!kind) continue;
    const [x, y] = center(after, k);
    const color = KIND_COLOR[kind] ?? '#fff';
    // 六角の波紋
    const hex = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 30);
      return `${(Math.cos(a) * SIZE * 0.85).toFixed(1)},${(Math.sin(a) * SIZE * 0.85).toFixed(1)}`;
    }).join(' ');
    const wave = add(fx, el('polygon', { points: hex, fill: 'none', stroke: color, 'stroke-width': 4, class: 'fx-glow' }), 700);
    anim(wave, [{ transform: `translate(${x}px, ${y}px) scale(0.5)`, opacity: 1 }, { transform: `translate(${x}px, ${y}px) scale(1.25)`, opacity: 0 }], 600);
    if (kind === 'release') { releaseFx(fx, before, k, x, y); continue; }
    if (kind === 'up' || kind === 'down') {
      const t = add(fx, el('text', { x: 0, y: 0, class: 'fx-arrow', fill: color }), 800);
      t.textContent = kind === 'up' ? '▲' : '▼';
      const dy = kind === 'up' ? -22 : 18;
      anim(t, [{ transform: `translate(${x}px, ${y + 6}px)`, opacity: 0 }, { transform: `translate(${x}px, ${y + 6 + dy * 0.4}px)`, opacity: 1, offset: 0.3 }, { transform: `translate(${x}px, ${y + 6 + dy}px)`, opacity: 0 }], 750);
      continue;
    }
    // 粒：上へ舞う（葉・花びら・泡）か、落ちる（しずく・砂・かけら）
    const rising = ['grass', 'tree', 'flower', 'marsh', 'clear', 'fire', 'lava'].includes(kind);
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 + 0.3;
      const ox = Math.cos(a) * SIZE * 0.35;
      const oy = Math.sin(a) * SIZE * 0.25;
      const shape = kind === 'water' || kind === 'marsh' ? el('circle', { r: kind === 'marsh' ? 2.6 : 2.2, fill: color, stroke: kind === 'marsh' ? '#e8fff6' : 'none', 'stroke-width': 0.8 })
        : el('ellipse', { rx: 3, ry: 1.6, fill: i % 2 ? color : '#ffffff' });
      const p = add(fx, shape, 900);
      const dx = ox * 1.4 + (i % 2 ? 4 : -4);
      const dy = rising ? -(14 + (i % 3) * 6) : 10 + (i % 3) * 4;
      anim(p, [
        { transform: `translate(${x + ox}px, ${y + oy}px) rotate(0deg)`, opacity: 0 },
        { transform: `translate(${x + ox + dx * 0.4}px, ${y + oy + dy * 0.4 - (rising ? 0 : 6)}px) rotate(60deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${x + ox + dx}px, ${y + oy + dy}px) rotate(160deg)`, opacity: 0 },
      ], 800, i * 30);
    }
  }
}

// ---- 押す（第2の島）：押した生き物から風が吹き、押された生き物は残像を引いて動く。島の外へ押されたら回って飛んでいく ----
const pushedKeys = (step) => new Set([...(step.moved ?? []).flatMap((m) => [m.from, m.to]), ...(step.pushedOut ?? []).map((m) => m.from)]);
// 押された生き物の隣にいる、押す効果を持つ生き物（風の出どころ）
const PUSHERS = new Set(CREATURES.filter((c) => (c.effects ?? [c.effect]).some((e) => e?.kind === 'push')).map((c) => c.id));
function pusherOf(step, k) {
  const [q, r] = parseKey(k);
  return step.spawned.find((s) => PUSHERS.has(s.id) && distance(q, r, ...parseKey(s.key)) === 1) ?? null;
}
const artImage = (id, size = ART) => {
  const art = id && creatureSvg(id, 32);
  return art ? el('image', { href: `data:image/svg+xml;utf8,${encodeURIComponent(art)}`, x: -size / 2, y: -size / 2, width: size, height: size }) : null;
};

// 風：押す生き物から、押される生き物へ弧の線が3本走る。届くまでの時間を返す
function gustFx(fx, before, step) {
  const list = [...(step.moved ?? []), ...(step.pushedOut ?? [])];
  let longest = 0;
  for (const m of list) {
    const src = pusherOf(step, m.from);
    if (!src) continue;
    const [x0, y0] = center(before, src.key);
    const [x1, y1] = center(before, m.from);
    const deg = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    for (let i = 0; i < 3; i++) {
      const arc = add(fx, el('path', { d: `M -6 ${(i - 1) * 7} q 8 -4 16 0`, fill: 'none', stroke: i === 1 ? '#ffffff' : KIND_COLOR.push, 'stroke-width': 2.4, 'stroke-linecap': 'round', class: 'fx-glow' }), 700);
      anim(arc, [
        { transform: `translate(${x0}px, ${y0}px) rotate(${deg}deg) scale(0.6)`, opacity: 0 },
        { transform: `translate(${(x0 + x1) / 2}px, ${(y0 + y1) / 2}px) rotate(${deg}deg) scale(1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${x1}px, ${y1}px) rotate(${deg}deg) scale(1.3)`, opacity: 0 },
      ], 380, i * 50, 'ease-in');
    }
    longest = Math.max(longest, 480);
  }
  return longest;
}

function pushFx(fx, before, after, step) {
  // 動いた生き物：元の所から新しい所へ、薄い残像が3つ続き、着いた所に土ぼこり
  for (const m of step.moved ?? []) {
    const [x0, y0] = center(before, m.from);
    const [x1, y1] = center(after, m.to);
    for (let i = 0; i < 3; i++) {
      const ghost = artImage(m.id);
      if (!ghost) break;
      add(fx, ghost, 600);
      const t = (i + 1) / 4;
      anim(ghost, [
        { transform: `translate(${x0 + (x1 - x0) * t}px, ${y0 + (y1 - y0) * t - 2}px)`, opacity: 0.55 - i * 0.12 },
        { transform: `translate(${x0 + (x1 - x0) * t}px, ${y0 + (y1 - y0) * t - 2}px)`, opacity: 0 },
      ], 450, i * 40, 'ease-in');
    }
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.15 + 0.175 * i);
      const p = add(fx, el('circle', { r: 2.5 + (i % 2), fill: '#e8dccb', opacity: 0.9 }), 700);
      anim(p, [
        { transform: `translate(${x1}px, ${y1 + 10}px)`, opacity: 0.9 },
        { transform: `translate(${x1 + Math.cos(a) * 18 * (i % 2 ? 1 : -1)}px, ${y1 + 10 - Math.sin(a) * 8}px) scale(1.6)`, opacity: 0 },
      ], 600, 0);
    }
  }
  // 島の外へ押された生き物：押された向きへ回りながら飛んでいき、小さな星が出る
  for (const m of step.pushedOut ?? []) {
    const [x0, y0] = center(before, m.from);
    const src = pusherOf(step, m.from);
    const [xs, ys] = src ? center(before, src.key) : [x0, y0 + 1];
    const len = Math.hypot(x0 - xs, y0 - ys) || 1;
    const [dx, dy] = [((x0 - xs) / len) * SIZE * 2.2, ((y0 - ys) / len) * SIZE * 2.2];
    const img = artImage(m.id);
    if (img) {
      add(fx, img, 1000);
      anim(img, [
        { transform: `translate(${x0}px, ${y0 - 2}px) rotate(0deg) scale(1)`, opacity: 1 },
        { transform: `translate(${x0 + dx * 0.6}px, ${y0 + dy * 0.6 - 26}px) rotate(300deg) scale(0.8)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${x0 + dx}px, ${y0 + dy - 6}px) rotate(540deg) scale(0.4)`, opacity: 0 },
      ], 900, 0, 'ease-out');
    }
    for (let i = 0; i < 4; i++) {
      const sp = add(fx, el('polygon', { points: star(4.5), fill: i % 2 ? '#ffffff' : '#ffe07a', class: 'fx-glow' }), 800);
      const a = (Math.PI * 2 * i) / 4;
      anim(sp, [
        { transform: `translate(${x0}px, ${y0 - 10}px) scale(0.3)`, opacity: 0 },
        { transform: `translate(${x0 + Math.cos(a) * 16}px, ${y0 - 10 + Math.sin(a) * 10}px) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${x0 + Math.cos(a) * 24}px, ${y0 - 16 + Math.sin(a) * 14}px) scale(0.3)`, opacity: 0 },
      ], 700, 60);
    }
  }
}

// 帰る生き物：絵がふわっと浮いて消え、つむじの線が回る
function releaseFx(fx, before, k, x, y) {
  const id = before.cells[k]?.creature;
  const art = id && creatureSvg(id, 32);
  if (art) {
    const img = add(fx, el('image', { href: `data:image/svg+xml;utf8,${encodeURIComponent(art)}`, x: -ART / 2, y: -ART / 2, width: ART, height: ART }), 1000);
    anim(img, [{ transform: `translate(${x}px, ${y - 2}px) scale(1)`, opacity: 1 }, { transform: `translate(${x + 6}px, ${y - 40}px) scale(0.6)`, opacity: 0 }], 900, 0, 'ease-in');
  }
  for (let i = 0; i < 3; i++) {
    const swirl = add(fx, el('path', { d: `M ${-10 + i * 3} 0 q 10 -10 20 0`, fill: 'none', stroke: KIND_COLOR.release, 'stroke-width': 2, 'stroke-linecap': 'round' }), 900);
    anim(swirl, [{ transform: `translate(${x}px, ${y + 8 - i * 8}px) rotate(0deg)`, opacity: 0 }, { transform: `translate(${x}px, ${y - 10 - i * 8}px) rotate(${i % 2 ? 40 : -40}deg)`, opacity: 0.9, offset: 0.4 }, { transform: `translate(${x}px, ${y - 30 - i * 8}px) rotate(${i % 2 ? 90 : -90}deg)`, opacity: 0 }], 800, i * 80);
  }
}

// 置いた所：小さな輪が広がる
export function placeFx(fx, board, k) {
  const [x, y] = center(board, k);
  const c = board.cells[k];
  const color = KIND_COLOR[c?.object && c.object !== 'tree' ? c.object : c?.ground] ?? '#fff';
  const ring = add(fx, el('circle', { cx: x, cy: y, r: SIZE * 0.2, fill: 'none', stroke: color, 'stroke-width': 3 }), 600);
  anim(ring, [{ r: SIZE * 0.2, opacity: 1 }, { r: SIZE * 0.9, opacity: 0 }], 500);
}

// 光の柱の色（重ねる SVG の中に1つだけ置く）
export function ensureDefs(fx) {
  if (fx.querySelector('#fx-beam')) return;
  const defs = el('defs');
  const g = el('linearGradient', { id: 'fx-beam', x1: 0, y1: 0, x2: 0, y2: 1 });
  g.append(el('stop', { offset: '0', 'stop-color': '#fff6c8', 'stop-opacity': 0 }));
  g.append(el('stop', { offset: '0.6', 'stop-color': '#fff6c8', 'stop-opacity': 0.75 }));
  g.append(el('stop', { offset: '1', 'stop-color': '#ffffff', 'stop-opacity': 0.9 }));
  defs.append(g);
  const r = el('radialGradient', { id: 'fx-flash' });
  r.append(el('stop', { offset: '0', 'stop-color': '#ffffff', 'stop-opacity': 0.95 }));
  r.append(el('stop', { offset: '0.5', 'stop-color': '#fff6c8', 'stop-opacity': 0.5 }));
  r.append(el('stop', { offset: '1', 'stop-color': '#fff6c8', 'stop-opacity': 0 }));
  defs.append(r);
  fx.append(defs);
}
