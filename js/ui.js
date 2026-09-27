/* =========================================================
   ui.js — rendering, character creation, combat screen,
   dice panel, character sheet, save/load.
   ========================================================= */
(function () {
  'use strict';
  const D = window.DNDData;
  const E = window.DNDEngine;
  const S = window.DNDStory;

  const $story = document.getElementById('story');
  const $sheet = document.getElementById('sheetInner');
  const $log = document.getElementById('log');
  const $logBody = document.getElementById('logBody');
  const $sheetEl = document.getElementById('sheet');

  let state = E.newState();
  let store = null;
  try { store = window.localStorage; } catch (e) { store = null; }

  const SAVE_KEY = 'applePieSave';
  const END_KEY = 'applePieEndings';

  /* Cloud mirror. If sync.js / Firebase are absent this stub keeps the
     game byte-for-byte identical to the offline version. */
  const NOOP = () => {};
  const SYNC = window.DNDSync || {
    init: () => Promise.resolve({ state: 'off' }), onStatus: () => NOOP,
    isOn: () => false, status: () => ({ state: 'off', label: 'Cloud off' }),
    saveProgress: NOOP, saveCharacter: NOOP, saveStoryPosition: NOOP,
    unlockEnding: NOOP, endRun: NOOP, feed: NOOP, startRun: NOOP,
    loadEndings: () => Promise.resolve([]), loadProgress: () => Promise.resolve(null)
  };

  /* =============== helpers =============== */
  const esc = t => String(t == null ? '' : t);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* New scenes scroll inside the story pane — the page itself never moves. */
  function storyToTop() {
    try {
      if (typeof $story.scrollTo === 'function') $story.scrollTo({ top: 0, behavior: 'smooth' });
      else $story.scrollTop = 0;
    } catch (e) { $story.scrollTop = 0; }
  }
  /* The portrait now lives in data.js so the watch page can use the same
     renderer. It reacts to pronouns, species, class and outfit. */
  const avatarSVG = (a, size) => D.avatarSVG(a, size);

  function d20svg(pips) {
    const marks = (pips || []).map(p => `<text x="${p.x}" y="${p.y}" font-size="7" text-anchor="middle" fill="rgba(122,76,32,.55)" font-family="sans-serif">${p.n}</text>`).join('');
    return `<svg class="d20" viewBox="0 0 100 100" role="img" aria-label="twenty sided die">
      <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" fill="#f4e6c8" stroke="#8a5322" stroke-width="3"/>
      <polygon points="50,20 76,36 76,64 50,80 24,64 24,36" fill="#fdf6e3" stroke="#c9873f" stroke-width="2"/>
      ${marks}
    </svg>`;
  }

  /* =============== persistence =============== */
  function unlockedEndings() {
    if (!store) return [];
    try { return JSON.parse(store.getItem(END_KEY) || '[]'); } catch (e) { return []; }
  }
  function unlockEnding(id) {
    const list = unlockedEndings();
    const fresh = !list.includes(id);
    if (fresh) { list.push(id); if (store) { try { store.setItem(END_KEY, JSON.stringify(list)); } catch (e) {} } }
    SYNC.unlockEnding(id, {
      pieQuality: E.pieQuality(state),
      clues: state.clues.length,
      character: state.pc ? state.pc.name : null
    });
    if (fresh) {
      SYNC.endRun({
        ending: id,
        pieQuality: E.pieQuality(state),
        clues: state.clues.length,
        species: state.pc && state.pc.speciesName,
        class: state.pc && state.pc.className,
        background: state.pc && state.pc.backgroundName,
        level: state.level,
        stats: state.stats
      });
      SYNC.feed('ending', 'Ending unlocked: ' + endingName(id), { ending: id });
    }
    return list;
  }
  function endingName(id) {
    const e = (window.DNDData && D.ENDINGS.find(x => x.id === id)) || null;
    return e ? e.name : id;
  }
  function snapshot() {
    return {
      level: state.level, pc: state.pc, flags: state.flags, clues: state.clues,
      items: state.items, ingredients: state.ingredients, used: state.used,
      node: state.node, seen: state.seen, stats: state.stats, rolls: state.rolls.slice(-40)
    };
  }
  function saveGame() {
    if (!state.pc) return;
    if (store) { try { store.setItem(SAVE_KEY, JSON.stringify(snapshot())); } catch (e) {} }
    if (SYNC.isOn()) {
      const snap = snapshot();
      SYNC.saveProgress({
        node: snap.node, level: snap.level, clues: snap.clues,
        ingredients: snap.ingredients, pieQuality: E.pieQuality(state),
        hp: snap.pc.hp, maxHp: snap.pc.maxHp, ac: snap.pc.ac,
        stats: snap.stats, screens: snap.seen.length
      });
      SYNC.saveCharacter(snap.pc, snap.level);
    }
  }
  function loadGame() {
    if (!store) return false;
    try {
      const raw = store.getItem(SAVE_KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      state = E.newState();
      Object.assign(state, d);
      state.phase = 'play';
      return true;
    } catch (e) { return false; }
  }
  function clearSave() { if (store) { try { store.removeItem(SAVE_KEY); } catch (e) {} } }

  /* =============== character sheet =============== */
  function renderSheet() {
    if (!state.pc) { $sheet.innerHTML = '<p class="empty">No character yet. Create one to begin.</p>'; return; }
    const pc = state.pc;
    const pb = E.profBonus(state);
    let h = '';
    h += `<div style="display:flex;gap:12px;align-items:center;margin-bottom:4px">${avatarSVG(pc, 78)}<div><p class="pc-name">${esc(pc.name)}</p>`;
    h += `<p class="pc-sub">Level ${state.level} ${esc(pc.speciesName)} ${esc(pc.className)} · ${esc(pc.backgroundName)}</p>`;
    h += `<p class="pc-sub" style="text-transform:none;letter-spacing:0;font-style:italic">${esc(pc.pronouns)}</p></div></div>`;

    h += `<h3>Vitals</h3>`;
    const pct = Math.max(0, Math.round(100 * pc.hp / pc.maxHp));
    h += `<div class="hpbar"><div class="hpfill" style="width:${pct}%"></div></div>`;
    h += `<div class="hp-num">HP ${pc.hp} / ${pc.maxHp} · AC ${pc.ac} · Prof +${pb}</div>`;

    h += `<h3>Ability Scores</h3><div class="abil-grid">`;
    D.ABILITIES.forEach(a => {
      const v = pc.abilities[a.key];
      h += `<div class="ab-box"><div class="n">${a.short}</div><div class="s">${v}</div><div class="m">${E.signed(E.mod(v))}</div></div>`;
    });
    h += `</div>`;

    h += `<h3>Skills</h3><div class="chips">`;
    D.SKILLS.forEach(sk => {
      const prof = pc.skills.includes(sk.key);
      const exp = pc.expertise === sk.key;
      const m = E.mod(pc.abilities[sk.ability]);
      let bonus = m;
      if (exp) bonus += pb * 2; else if (prof) bonus += pb;
      h += `<span class="chip${prof ? '' : ' item'}" style="${prof ? '' : 'opacity:.55'}">${prof ? (exp ? '◆ ' : '● ') : ''}${sk.name} <span class="pb">${E.signed(bonus)}</span></span>`;
    });
    h += `</div>`;

    h += `<h3>Features</h3><div class="chips">`;
    const cl = E.classDef(pc.class);
    cl.features.forEach(f => h += `<span class="chip">${f.name}</span>`);
    if (state.level >= 2 && cl.level2) h += `<span class="chip" style="background:rgba(217,164,65,.2);border-color:rgba(180,132,45,.6);color:#7a5614">Lv2 · ${cl.level2.name}</span>`;
    const sp = E.speciesDef(pc.species);
    sp.traits.forEach(t => h += `<span class="chip item">${t.name}</span>`);
    const bg = E.backgroundDef(pc.background);
    h += `<span class="chip item">${bg.feature.name}</span>`;
    h += `</div>`;

    h += `<h3>Kit</h3><div class="chips">`;
    h += `<span class="chip">${pc.weapon} (${pc.damage})</span>`;
    const trinket = D.TRINKETS.find(t => t.id === pc.trinket);
    if (trinket) h += `<span class="chip item">${trinket.name}${state.used['trinket'] ? ' ✓' : ''}</span>`;
    state.items.forEach(i => h += `<span class="chip item">${itemLabel(i)}</span>`);
    h += `</div>`;

    if (state.clues.length) {
      h += `<h3>Clues (${state.clues.length}/5)</h3><div class="chips">`;
      state.clues.forEach(c => h += `<span class="chip clue">${clueLabel(c)}</span>`);
      h += `</div>`;
    }

    const ingIds = Object.keys(state.ingredients);
    if (ingIds.length) {
      h += `<h3>For the pie</h3><div class="chips">`;
      D.INGREDIENTS.forEach(i => {
        const q = state.ingredients[i.id];
        h += `<span class="chip${q ? '' : ' clue'}">${i.icon} ${i.name} ${q ? '★'.repeat(q) : '—'}</span>`;
      });
      h += `</div>`;
    }

    if (state.flags.hasRecipe || state.flags.pieScore || Object.keys(state.ingredients).length) {
      h += `<h3>The Pie</h3><div class="hp-num" style="text-align:left;font-size:.85rem">Quality so far: <strong>${E.pieQuality(state)} / 10</strong></div>`;
    }

    h += `<h3>Tally</h3><div class="hp-num" style="text-align:left;font-size:.8rem;line-height:1.7">
      Checks made: ${state.stats.checks}<br>
      Passed: ${state.stats.passed} · Crits: ${state.stats.crits} · Fumbles: ${state.stats.fumbles}<br>
      Endings found: ${unlockedEndings().length} / ${D.ENDINGS.length}</div>`;

    $sheet.innerHTML = h;
  }

  function itemLabel(id) {
    const map = { torn_recipe: 'Torn recipe card', recipe_bottom: 'The last step', thieves_tools: "Thieves' tools", herbalism_kit: 'Herbalism kit', bakers_tools: 'Baking tools', disguise_kit: 'Disguise kit', temple_letter: 'Temple letter', rank_insignia: 'Rank insignia', rusty_ploughshare: 'Plough piece' };
    return map[id] || id;
  }
  function clueLabel(id) {
    const map = { tracks: 'Small boot prints', ladder: 'The moved ladder', bran: 'Bran saw someone', mabel: 'Mabel’s confession', gossip: 'The Marsh family', ribbon: 'Blue ribbon', cellar_rumour: 'The root cellar', pip: 'Pip Marsh', card: 'The torn card', lintel: 'The lintel words', fear: 'What Grammy fears' };
    return map[id] || id;
  }

  /* =============== dice log =============== */
  function pushLog(r, ok) {
    if (!r) return;
    const line = el('div', 'log-line');
    const cls = r.crit ? 'r' : (r.pass === true ? 'ok' : r.pass === false ? 'bad' : '');
    line.innerHTML = `<span class="${cls}">🎲 ${esc(r.logText)}</span>`;
    $logBody.prepend(line);
    $log.hidden = false;
  }

  /* =============== rendering blocks =============== */
  function renderBlocks(blocks, container) {
    (blocks || []).forEach(b => {
      if (!b) return;
      switch (b.type) {
        case 'p': container.appendChild(el('p', '', b.text)); break;
        case 'whisper': container.appendChild(el('p', 'whisper', b.text)); break;
        case 'h': container.appendChild(el('h2', 'loc', b.text)); break;
        case 'banner': container.appendChild(el('div', 'banner ' + (b.kind || ''), esc(b.text))); break;
        case 'said': {
          const q = el('blockquote', 'said');
          q.innerHTML = `<span class="who">${esc(b.who)}</span>${b.text}`;
          container.appendChild(q);
          break;
        }
        case 'stars': {
          const n = b.n;
          container.appendChild(el('div', 'stars', '★'.repeat(n) + '<span style="opacity:.3">' + '★'.repeat(Math.max(0, 5 - n)) + '</span>'));
          break;
        }
        case 'rollnote': container.appendChild(renderRollNote()); break;
        case 'combat': container.appendChild(renderCombat()); break;
        case 'gallery': container.appendChild(renderGallery()); break;
        case 'sheetcard': container.appendChild(renderSheetCard()); break;
      }
    });
  }

  function renderRollNote() {
    const r = state.lastRoll;
    const box = el('div', 'dice-box' + (r && r.pass === false ? ' fail' : ''));
    if (!r) { box.innerHTML = '<span class="hint">The dice were rolled.</span>'; return box; }
    const pips = [{ x: 50, y: 30, n: 20 }, { x: 30, y: 58, n: 8 }, { x: 70, y: 58, n: 14 }];
    box.innerHTML = `
      ${d20svg(pips)}
      <div>
        <div class="dice-num">d20 → ${r.d20}${r.second ? ` <span style="font-size:.9rem;opacity:.6">(${r.second.a} &amp; ${r.second.b})</span>` : ''}${r.lucky ? ' <span style="font-size:.9rem">🍀</span>' : ''}</div>
        <div class="dice-math">${r.parts.map(p => `${esc(p.label)} ${E.signed(p.amount)}`).join(' &nbsp;·&nbsp; ')} &nbsp;=&nbsp; <b>${E.signed(r.mod)}</b><br>
        ${r.d20} ${E.signed(r.mod)} = <b>${r.total}</b>${r.dc != null ? ` vs <b>DC ${r.dc}</b>` : ''}</div>
        <div class="dice-verdict">${r.crit ? '✦ CRITICAL SUCCESS ✦' : r.fumble ? '✖ CRITICAL FAILURE ✖' : r.pass ? '✓ Success' : r.pass === false ? '✗ Failure' : ''}</div>
      </div>`;
    box.querySelector('.d20').classList.add('roll');
    return box;
  }

  function renderGallery() {
    const un = unlockedEndings();
    const g = el('div', 'gallery');
    D.ENDINGS.forEach(e => {
      const got = un.includes(e.id);
      const c = el('div', 'gal' + (got ? '' : ' locked'));
      c.innerHTML = got
        ? `<span class="gt">${e.icon} ${e.name}</span><span class="gs">${e.rarity}</span><br>${e.desc}`
        : `<span class="gt">🔒 ???</span><span class="gs">${e.rarity}</span><br><em>Not found yet.</em>`;
      g.appendChild(c);
    });
    const wrap = el('div', '');
    wrap.appendChild(el('h2', 'loc', 'Endings discovered'));
    wrap.appendChild(g);
    wrap.appendChild(el('p', 'hint', `Different species, classes, origins, skills and choices lead to different endings. ${un.length} of ${D.ENDINGS.length} found.`));
    return wrap;
  }

  function renderSheetCard() {
    const pc = state.pc;
    const c = el('div', 'combat');
    c.innerHTML = `<h4>${esc(pc.name)} — Level ${state.level}</h4>
      <div class="cbt-row">
        <div class="cbt"><div class="nm">${esc(pc.speciesName)} ${esc(pc.className)}</div><div class="st">HP ${pc.hp}/${pc.maxHp} · AC ${pc.ac}</div></div>
        <div class="cbt"><div class="nm">Abilities</div><div class="st">${D.ABILITIES.map(a => `${a.short} ${pc.abilities[a.key]} (${E.signed(E.mod(pc.abilities[a.key]))})`).join(' · ')}</div></div>
      </div>`;
    return c;
  }

  /* =============== combat =============== */
  function renderCombat() {
    const c = state.combat;
    if (!c) return el('div', '');
    const box = el('div', 'combat');
    const pcHpPct = Math.max(0, Math.round(100 * state.pc.hp / state.pc.maxHp));
    const eHpPct = Math.max(0, Math.round(100 * c.enemy.hp / c.enemy.maxHp));
    box.innerHTML = `<h4>⚔️ Round ${c.round} — Combat</h4>
      <div class="cbt-row">
        <div class="cbt"><div class="nm">${esc(state.pc.name)}</div>
          <div class="hpbar"><div class="hpfill" style="width:${pcHpPct}%"></div></div>
          <div class="st">HP ${state.pc.hp}/${state.pc.maxHp} · AC ${state.pc.ac}</div></div>
        <div class="cbt"><div class="nm">${c.enemy.icon} ${esc(c.enemy.name)}</div>
          <div class="hpbar"><div class="hpfill" style="width:${eHpPct}%;background:linear-gradient(90deg,#7d1f18,#b3352b)"></div></div>
          <div class="st">HP ${c.enemy.hp}/${c.enemy.maxHp} · AC ${c.enemy.ac} · Hit +${c.enemy.atk} (${c.enemy.dmg} ${c.enemy.dmgType})</div></div>
      </div>
      <div style="margin-top:10px;font-size:.85rem;line-height:1.6">${c.log.slice(-5).map(l => `<div>${esc(l)}</div>`).join('')}</div>`;
    return box;
  }

  function combatActions() {
    const s = state, c = s.combat, node = S.getNode(s.node);
    const acts = [];
    if (!c || c.over) return acts;

    acts.push({
      label: `⚔️ Attack with your ${s.pc.weapon}`,
      tag: `d20 ${E.signed(E.mod(s.pc.abilities[s.pc.atkAbility]) + E.profBonus(s))} vs AC ${c.enemy.ac}`,
      run: () => { E.playerAttack(s, { label: 'You attack' }); }
    });

    if (E.hasTrait(s, 'breath') && !c.breathUsed) {
      acts.push({
        label: '🐉 Breath Weapon — a cone of fire',
        tag: '2d6 fire', tagKind: 'good',
        run: () => {
          c.breathUsed = true;
          const save = E.d20();
          const dmg = E.rollDice('2d6').total;
          E.combatLog(s, `🐉 You breathe fire: ${dmg} damage (enemy saves ${save >= 11 ? '— half' : '— full'}).`);
          E.damageToEnemy(s, save >= 11 ? Math.floor(dmg / 2) : dmg, 'Breath Weapon');
          E.checkCombatEnd(s);
        }
      });
    }
    if (E.hasFeature(s, 'huntersmark') && !c.markActive) {
      acts.push({
        label: "🏹 Hunter's Mark — mark it first",
        tag: '+1d6 per hit', tagKind: 'good',
        run: () => { c.markActive = true; E.combatLog(s, "🏹 Hunter's Mark: +1d6 to every attack against it."); }
      });
    }
    if (E.hasFeature(s, 'cunningaction') && !c.cunningUsed) {
      acts.push({
        label: '🗝️ Cunning Action — slip behind it',
        tag: 'advantage + sneak', tagKind: 'good',
        run: () => {
          c.cunningUsed = true; c.sneakUsed = false;
          E.combatLog(s, '🗝️ Cunning Action: you reposition — advantage on your next attack.');
          c.advantageNext = true;
        }
      });
    }
    if (E.hasFeature(s, 'actionsurge') && !c.surgeUsed) {
      acts.push({
        label: '⚔️ Action Surge — attack twice this turn',
        tag: 'two attacks', tagKind: 'good',
        run: () => {
          c.surgeUsed = true;
          E.combatLog(s, '⚔️ Action Surge!');
          E.playerAttack(s, { label: 'First strike' });
          if (!c.over) E.playerAttack(s, { label: 'Second strike' });
        }
      });
    }
    if (!E.spent(s, 'secondwind') && s.pc.hp < s.pc.maxHp) {
      acts.push({
        label: '💪 Second Wind — catch your breath',
        tag: '1d10+2 HP', tagKind: 'good',
        run: () => {
          E.spend(s, 'secondwind');
          const h = E.rollDice('1d10').total + 2;
          s.pc.hp = Math.min(s.pc.maxHp, s.pc.hp + h);
          E.combatLog(s, `💪 Second Wind: +${h} HP (${s.pc.hp}/${s.pc.maxHp}).`);
        }
      });
    }
    if (s.pc.trinket === 'spoon' && !E.spent(s, 'trinket')) {
      acts.push({
        label: '🥄 Your wooden spoon — steady your hands',
        tag: 'heal 1d4', tagKind: 'good',
        run: () => {
          E.spend(s, 'trinket');
          const h = E.rollDice('1d4').total;
          s.pc.hp = Math.min(s.pc.maxHp, s.pc.hp + h);
          E.combatLog(s, `🥄 The spoon, somehow, helps. +${h} HP.`);
        }
      });
    }

    acts.push({
      label: '🛡️ Dodge — brace and defend',
      tag: 'disadvantage vs you', tagKind: 'gray',
      run: () => { c.dodgeNext = true; E.combatLog(s, '🛡️ You brace. It attacks at disadvantage.'); }
    });

    acts.push({
      label: '🏃 Break away and run',
      tag: 'DC 12', tagKind: 'gray',
      run: () => {
        const r = E.roll(s, { skill: 'athletics', dc: 12, label: 'Escape (Athletics)' });
        s.lastRoll = r;
        pushLog(r);
        if (r.pass) { c.over = true; c.fled = true; c.won = false; E.combatLog(s, '🏃 You get clear.'); }
        else { E.combatLog(s, '🏃 It cuts you off.'); }
      }
    });

    if (node && typeof node.combatExtras === 'function') {
      node.combatExtras(s).forEach(a => acts.push(a));
    }
    return acts;
  }

  function renderCombatButtons(container) {
    const c = state.combat;
    const node = S.getNode(state.node);
    const wrap = el('div', 'choices');

    if (c.over) {
      const outcome = c.fled ? 'flee' : (c.won ? 'win' : 'lose');
      const target = node.resolution[outcome];
      const b = el('button', 'choice primary');
      b.innerHTML = `<span class="tag">Continue</span> ${outcome === 'win' ? 'Move on.' : outcome === 'flee' ? 'Get out of here.' : '…'}`;
      b.onclick = () => { state.combat = null; goto(target); };
      wrap.appendChild(b);
      container.appendChild(wrap);
      return;
    }

    combatActions().forEach(a => {
      const b = el('button', 'choice');
      b.innerHTML = `<span class="tag ${a.tagKind === 'good' ? 'good' : a.tagKind === 'gray' ? 'gray' : ''}">${esc(a.tag || '')}</span>${esc(a.label)}`;
      b.onclick = () => {
        a.run(state);
        if (state.combat && !state.combat.over) {
          E.enemyTurn(state);
          E.checkCombatEnd(state);
          if (state.combat && !state.combat.over) state.combat.round++;
        }
        renderNode(state.node);
      };
      wrap.appendChild(b);
    });
    container.appendChild(wrap);
  }

  /* =============== node rendering =============== */
  function goto(id) {
    if (id === '__restart') { clearSave(); restart(); return; }
    if (id === '__create') { startCreator(); return; }
    if (!S.getNode(id)) { console.warn('missing node', id); return; }
    state.node = id;
    if (!state.seen.includes(id)) state.seen.push(id);
    // record the ending in the permanent gallery
    if (id.startsWith('ending_')) unlockEnding(id.slice(7));
    renderNode(id);
    saveGame();
    const n = S.getNode(id);
    SYNC.saveStoryPosition(id, n && n.chapter, n && n.title);
    storyToTop();
  }

  function renderNode(id) {
    const node = S.getNode(id);
    if (!node) return;
    if (node.kind === 'combat' && !state.combat) E.startCombat(state, node.enemy);
    if (typeof node.onEnter === 'function' && state.seen.filter(x => x === id).length <= 1) node.onEnter(state);

    $story.innerHTML = '';
    $story.classList.remove('scene-fade'); void $story.offsetWidth; $story.classList.add('scene-fade');

    if (node.chapter) $story.appendChild(el('div', 'chapter', esc(node.chapter)));
    $story.appendChild(el('h1', '', esc(node.title)));
    $story.appendChild(el('div', 'rule'));

    const body = typeof node.body === 'function' ? node.body(state) : node.body;
    const bodyWrap = el('div', '');
    renderBlocks(body, bodyWrap);
    $story.appendChild(bodyWrap);

    if (node.kind === 'combat') {
      renderCombatButtons($story);
    } else {
      const choices = typeof node.choices === 'function' ? node.choices(state) : (node.choices || []);
      const wrap = el('div', 'choices');
      choices.forEach(ch => wrap.appendChild(makeChoice(ch)));
      $story.appendChild(wrap);
    }

    renderSheet();
    if (node.id !== undefined) { /* noop */ }
  }

  function makeChoice(ch) {
    const b = el('button', 'choice' + (ch.primary ? ' primary' : ''));
    const tag = ch.tag ? `<span class="tag ${ch.tagKind || ''}">${esc(ch.tag)}</span>` : '';
    b.innerHTML = `${tag}${ch.label}${ch.hint ? `<small>${esc(ch.hint)}</small>` : ''}`;
    b.onclick = () => {
      if (typeof ch.do === 'function') ch.do(state);
      if (ch.check) {
        const r = E.roll(state, ch.check);
        state.lastRoll = r;
        pushLog(r);
        SYNC.feed('roll', r.logText, {
          check: r.label, d20: r.d20, mod: r.mod, total: r.total,
          dc: r.dc, pass: r.pass, crit: r.crit, fumble: r.fumble
        });
        goto(r.pass ? ch.check.success : ch.check.failure);
      } else {
        state.lastRoll = null;
        SYNC.feed('choice', String(ch.label).replace(/<[^>]*>/g, ''));
        goto(ch.next);
      }
    };
    return b;
  }

  /* =============== character creator =============== */
  let build = null;
  let step = 0;
  const STEPS = ['name', 'species', 'class', 'origin', 'look', 'abilities', 'skills', 'review'];

  function startCreator() {
    build = {
      name: '', pronouns: 'she/her',
      height: 'Average', skinTouched: false,
      species: null, class: null, background: null,
      hairStyle: D.HAIR_STYLES[0], hairColor: D.HAIR_COLORS[0], eyeColor: D.EYE_COLORS[0],
      skin: D.SKIN_TONES[1], mark: D.MARKS[0].id, outfit: D.OUTFITS[0].id, trinket: D.TRINKETS[0].id,
      assignment: {}, pool: [...D.STANDARD_ARRAY],
      skills: [], expertise: null
    };
    step = 0;
    state.phase = 'create';
    renderCreator();
  }

  function pips() {
    let h = '<div class="pips">';
    for (let i = 0; i < STEPS.length; i++) h += `<span class="pip${i <= step ? ' on' : ''}"></span>`;
    h += '</div>';
    return h;
  }

  function liveAvatar(c, size) {
    const wrap = el('div', '');
    wrap.style.cssText = 'display:flex;justify-content:center;margin:10px 0 4px';
    wrap.innerHTML = avatarSVG(build, size || 92);
    c.appendChild(wrap);
  }

  function renderCreator() {
    $story.innerHTML = '';
    $story.classList.remove('scene-fade'); void $story.offsetWidth; $story.classList.add('scene-fade');
    const kind = STEPS[step];
    $story.appendChild(el('div', 'chapter', `Character creation · step ${step + 1} of ${STEPS.length}`));
    const head = el('div', 'step-head');
    const h1 = el('h1', '', CREATOR_TITLE[kind]);
    head.appendChild(h1);
    head.insertAdjacentHTML('beforeend', pips());
    $story.appendChild(head);
    $story.appendChild(el('div', 'rule'));
    CREATOR[kind]($story);
    renderSheet();
    storyToTop();
  }

  const CREATOR_TITLE = {
    name: 'Who Are You?',
    species: 'Species',
    class: 'Class',
    origin: 'Origin',
    look: 'How You Look',
    abilities: 'Ability Scores',
    skills: 'Skills',
    review: 'Your Character'
  };

  function navBar(container, opts) {
    const nav = el('div', 'nav');
    if (step > 0) {
      const back = el('button', 'btn ghost', '← Back');
      back.onclick = () => { step--; renderCreator(); };
      nav.appendChild(back);
    }
    const next = el('button', 'btn', opts.label || 'Continue →');
    next.disabled = !opts.ok();
    next.onclick = () => {
      if (!opts.ok()) return;              // never advance on an incomplete step
      if (opts.onNext) opts.onNext();
      if (step < STEPS.length - 1) { step++; renderCreator(); } else { beginGame(); }
    };
    nav.appendChild(next);
    if (opts.hint) nav.appendChild(el('span', 'hint', opts.hint));
    container.appendChild(nav);
  }

  function cardGrid(container, cls) {
    const g = el('div', 'grid ' + (cls || 'c2'));
    container.appendChild(g);
    return g;
  }

  const CREATOR = {
    name(c) {
      c.appendChild(el('p', '', 'Bramblewick is a village where everybody knows everybody, so a name matters. So does how you want to be talked about.'));
      liveAvatar(c, 92);
      const f1 = el('div', 'field');
      f1.innerHTML = '<label>Your name</label>';
      const i = document.createElement('input');
      i.type = 'text'; i.value = build.name; i.placeholder = 'e.g. Wren Ashdown'; i.maxLength = 28;
      i.oninput = () => { build.name = i.value; };
      f1.appendChild(i);
      c.appendChild(f1);

      const f2 = el('div', 'field');
      f2.innerHTML = '<label>Pronouns</label>';
      const g = el('div', 'swatches');
      ['she/her', 'he/him', 'they/them'].forEach(p => {
        const b = el('button', 'slot' + (build.pronouns === p ? ' sel' : ''), p);
        b.onclick = () => { build.pronouns = p; renderCreator(); };
        g.appendChild(b);
      });
      f2.appendChild(g);
      c.appendChild(f2);

      c.appendChild(el('h2', 'loc', 'And one small thing in your pocket'));
      c.appendChild(el('p', 'hint', 'Trinkets are one-use. Pick the one that sounds like you.'));
      const grid = cardGrid(c, 'c2');
      D.TRINKETS.forEach(t => {
        const card = el('button', 'card' + (build.trinket === t.id ? ' sel' : ''));
        card.innerHTML = `<div class="ttl">${esc(t.name)}</div><div class="mech">${esc(t.text)}</div>`;
        card.onclick = () => { build.trinket = t.id; renderCreator(); };
        grid.appendChild(card);
      });

      navBar(c, { ok: () => build.name.trim().length > 0, hint: 'A name is required.' });
    },

    species(c) {
      c.appendChild(el('p', '', 'Your species sets your ability score bonuses and gives you traits that open (and close) doors all campaign long.'));
      liveAvatar(c, 92);
      const grid = cardGrid(c, 'c2');
      D.SPECIES.forEach(sp => {
        const card = el('button', 'card' + (build.species === sp.id ? ' sel' : ''));
        const bonus = Object.entries(sp.bonus).map(([k, v]) => `+${v} ${E.shortOf(k)}`).join(', ');
        card.innerHTML = `<div class="ttl"><span class="ico">${sp.icon}</span>${esc(sp.name)}</div>
          <div class="meta">${esc(bonus)}</div>
          <div class="desc">${esc(sp.flavor)}</div>
          ${sp.traits.map(t => `<div class="mech"><strong>${esc(t.name)}.</strong> ${esc(t.text)}</div>`).join('')}
          ${sp.extraSkills ? `<div class="mech"><strong>Extra skill.</strong> +1 skill proficiency.</div>` : ''}`;
        card.onclick = () => {
          build.species = sp.id;
          if (!build.skinTouched) {
            const d = D.SKIN_TONES.find(t => t.name === (D.SPECIES_DEFAULT_SKIN[sp.id] || 'Fair'));
            if (d) build.skin = d;
          }
          renderCreator();
        };
        grid.appendChild(card);
      });
      navBar(c, { ok: () => !!build.species });
    },

    class(c) {
      c.appendChild(el('p', '', 'Your class sets your hit die, your armour, your weapon, and what you can do when the dice go against you.'));
      liveAvatar(c, 92);
      const grid = cardGrid(c, 'c2');
      D.CLASSES.forEach(cl => {
        const card = el('button', 'card' + (build.class === cl.id ? ' sel' : ''));
        card.innerHTML = `<div class="ttl"><span class="ico">${cl.icon}</span>${esc(cl.name)}</div>
          <div class="meta">d${cl.hitDie} hit die · AC ${esc(cl.ac)} · ${esc(cl.weapon)} ${esc(cl.damage)}</div>
          <div class="desc">${esc(cl.flavor)}</div>
          ${cl.features.map(f => `<div class="mech"><strong>${esc(f.name)}.</strong> ${esc(f.text)}</div>`).join('')}
          ${cl.cantrips ? `<div class="mech"><strong>Cantrips:</strong> ${esc(cl.cantrips.join(', '))}</div>` : ''}
          <div class="mech"><strong>At level 2:</strong> ${esc(cl.level2.name)} — ${esc(cl.level2.text)}</div>`;
        card.onclick = () => { build.class = cl.id; renderCreator(); };
        grid.appendChild(card);
      });
      navBar(c, { ok: () => !!build.class });
    },

    origin(c) {
      c.appendChild(el('p', '', 'Where you came from. Your origin gives you two free skill proficiencies, starting gear, and a feature that changes how the village treats you.'));
      const grid = cardGrid(c, 'c2');
      D.BACKGROUNDS.forEach(bg => {
        const card = el('button', 'card' + (build.background === bg.id ? ' sel' : ''));
        card.innerHTML = `<div class="ttl"><span class="ico">${bg.icon}</span>${esc(bg.name)}</div>
          <div class="meta">Free skills: ${bg.skills.map(s => E.skillName(s)).join(' · ')}</div>
          <div class="desc">${esc(bg.flavor)}</div>
          <div class="mech"><strong>${esc(bg.feature.name)}.</strong> ${esc(bg.feature.text)}</div>
          <div class="mech">Gear: ${esc(bg.gear.map(g => g.name).join(', '))}</div>`;
        card.onclick = () => { build.background = bg.id; renderCreator(); };
        grid.appendChild(card);
      });
      navBar(c, { ok: () => !!build.background });
    },

    look(c) {
      c.appendChild(el('p', '', 'None of this changes a number. All of it changes who you are.'));

      const preview = el('div', '');
      preview.style.cssText = 'display:flex;align-items:center;gap:18px;flex-wrap:wrap;background:rgba(255,255,255,.4);border:1px solid rgba(138,83,34,.3);border-radius:12px;padding:14px 16px';
      const dragonb = build.species === 'dragonborn';
      const paint = () => {
        preview.innerHTML = avatarSVG(build, 104) +
          `<div style="font-size:.92rem;line-height:1.6"><strong>${esc(build.name || 'Your character')}</strong><br>
           ${esc(build.hairColor.name)} ${dragonb ? 'crested' : esc(build.hairStyle).toLowerCase()} · ${esc(build.eyeColor.name)} eyes<br>
           ${esc(build.height)} · ${esc(build.skin.name)} skin · ${esc((D.MARKS.find(m => m.id === build.mark) || {}).name || '')}</div>`;
      };
      paint();
      c.appendChild(preview);

      if (dragonb) {
        c.appendChild(el('h2', 'loc', 'No hair — you are a dragon'));
        c.appendChild(el('p', 'hint', 'Dragonborn have no hair at all. The colour below tints your horns, crest and scale shading instead.'));
      } else {
        c.appendChild(el('h2', 'loc', 'Hair'));
        const hs = el('div', 'swatches');
        D.HAIR_STYLES.forEach(st => {
          const b = el('button', 'slot' + (build.hairStyle === st ? ' sel' : ''), esc(st));
          b.style.width = 'auto';
          b.onclick = () => { build.hairStyle = st; paint(); syncSwatches(); };
          hs.appendChild(b);
        });
        c.appendChild(hs);
      }

      c.appendChild(el('h2', 'loc', dragonb ? 'Horn & crest colour' : 'Hair colour'));
      const hc = el('div', 'swatches');
      D.HAIR_COLORS.forEach(col => {
        const b = el('button', 'sw' + (build.hairColor.name === col.name ? ' sel' : ''));
        b.style.background = col.hex; b.title = col.name; b.setAttribute('aria-label', col.name);
        b.onclick = () => { build.hairColor = col; paint(); syncSwatches(); };
        hc.appendChild(b);
      });
      c.appendChild(hc);

      c.appendChild(el('h2', 'loc', 'Eyes'));
      const ec = el('div', 'swatches');
      D.EYE_COLORS.forEach(col => {
        const b = el('button', 'sw' + (build.eyeColor.name === col.name ? ' sel' : ''));
        b.style.background = col.hex; b.title = col.name; b.setAttribute('aria-label', col.name);
        b.onclick = () => { build.eyeColor = col; paint(); syncSwatches(); };
        ec.appendChild(b);
      });
      c.appendChild(ec);

      c.appendChild(el('h2', 'loc', 'Skin'));
      const sk = el('div', 'swatches');
      D.SKIN_TONES.forEach(col => {
        const b = el('button', 'sw' + (build.skin.name === col.name ? ' sel' : ''));
        b.style.background = col.hex; b.title = col.name; b.setAttribute('aria-label', col.name);
        b.onclick = () => { build.skin = col; build.skinTouched = true; paint(); syncSwatches(); };
        sk.appendChild(b);
      });
      c.appendChild(sk);

      c.appendChild(el('h2', 'loc', 'Height'));
      const HINTS = {
        halfling: 'Halflings stand about three feet tall. “Taller” is taller for a halfling.',
        dwarf: 'Dwarves are broad and low — even a tall dwarf tops out around four and a half feet.',
        dragonborn: 'Dragonborn are big. Even a smaller one looks most people in the eye.',
        elf: 'Elves run slender and a little taller than humans.',
        tiefling: 'Tieflings come in about as human-sized as humans do.',
        human: 'Somewhere between five and six and a half feet.'
      };
      c.appendChild(el('p', 'hint', HINTS[build.species] || HINTS.human));
      const hts = el('div', 'swatches htslots');
      D.HEIGHTS.forEach(h => {
        const b = el('button', 'slot' + (build.height === h ? ' sel' : ''), h);
        b.style.width = 'auto';
        b.onclick = () => { build.height = h; paint(); syncSwatches(); };
        hts.appendChild(b);
      });
      c.appendChild(hts);

      c.appendChild(el('h2', 'loc', 'Something people notice'));
      c.appendChild(el('p', 'hint', 'These are real modifiers. They apply to specific checks all campaign.'));
      const gm = cardGrid(c, 'c2');
      D.MARKS.forEach(m => {
        const card = el('button', 'card' + (build.mark === m.id ? ' sel' : ''));
        card.innerHTML = `<div class="ttl">${esc(m.name)}</div><div class="mech">${esc(m.text)}</div>`;
        card.onclick = () => { build.mark = m.id; paint(); syncSwatches(); };
        gm.appendChild(card);
      });

      c.appendChild(el('h2', 'loc', 'What you are wearing'));
      const go = cardGrid(c, 'c2');
      D.OUTFITS.forEach(o => {
        const card = el('button', 'card' + (build.outfit === o.id ? ' sel' : ''));
        card.innerHTML = `<div class="ttl">${esc(o.name)}</div><div class="mech">${esc(o.text)}</div>`;
        card.onclick = () => { build.outfit = o.id; renderCreator(); };
        go.appendChild(card);
      });

      function syncSwatches() {
        c.querySelectorAll('.sw').forEach(n => n.classList.remove('sel'));
        c.querySelectorAll('.swatches .slot').forEach(n => n.classList.remove('sel'));
        c.querySelectorAll('.card').forEach(n => n.classList.remove('sel'));
        c.querySelectorAll('.sw').forEach(n => {
          const t = n.getAttribute('aria-label');
          if (t === build.hairColor.name || t === build.eyeColor.name || t === build.skin.name) n.classList.add('sel');
        });
        c.querySelectorAll('.swatches .slot').forEach(n => { if (n.textContent === build.hairStyle) n.classList.add('sel'); });
        c.querySelectorAll('.htslots .slot').forEach(n => { if (n.textContent === build.height) n.classList.add('sel'); });
        c.querySelectorAll('.card').forEach(n => {
          const t = n.querySelector('.ttl');
          if (t && (t.textContent === (D.MARKS.find(m => m.id === build.mark) || {}).name ||
                    t.textContent === (D.OUTFITS.find(o => o.id === build.outfit) || {}).name)) n.classList.add('sel');
        });
      }

      navBar(c, { ok: () => true });
    },

    abilities(c) {
      c.appendChild(el('p', '', 'Assign these six numbers to your six abilities: <strong>15, 14, 13, 12, 10, 8</strong>. Then your species bonus is added on top. Click a number to place it; click a placed number to take it back.'));
      c.appendChild(el('p', 'hint', `Still to place: ${build.pool.length ? build.pool.join(', ') : 'none — all placed'}`));
      const wrap = el('div', '');
      D.ABILITIES.forEach(a => {
        const row = el('div', 'ability-row');
        row.innerHTML = `<div class="ab">${a.short}<small>${esc(a.blurb)}</small></div>`;
        const btns = el('div', 'slot-btns');
        const placed = build.assignment[a.key];
        if (placed != null) {
          const b = el('button', 'slot sel', String(placed));
          b.title = 'Take this back';
          b.onclick = () => { build.pool.push(placed); build.pool.sort((x, y) => y - x); delete build.assignment[a.key]; renderCreator(); };
          btns.appendChild(b);
        } else {
          build.pool.forEach((v, i) => {
            const b = el('button', 'slot', String(v));
            b.onclick = () => {
              build.pool.splice(i, 1);
              build.assignment[a.key] = v;
              renderCreator();
            };
            btns.appendChild(b);
          });
        }
        row.appendChild(btns);
        const sp = D.SPECIES.find(s => s.id === build.species);
        const bonus = sp ? (sp.bonus[a.key] || 0) : 0;
        const total = placed != null ? placed + bonus : null;
        row.appendChild(el('div', 'mod', total != null ? `${total} <span style="font-size:.7rem;opacity:.7">(${E.signed(E.mod(total))})</span>` : '—'));
        wrap.appendChild(row);
      });
      c.appendChild(wrap);
      if (build.species) {
        const sp = D.SPECIES.find(s => s.id === build.species);
        c.appendChild(el('p', 'hint', `${sp.icon} ${sp.name} bonus: ${Object.entries(sp.bonus).map(([k, v]) => `+${v} ${E.shortOf(k)}`).join(', ')}`));
      }
      navBar(c, { ok: () => build.pool.length === 0, hint: 'Place all six numbers.' });
    },

    skills(c) {
      const cl = D.CLASSES.find(x => x.id === build.class);
      const bg = D.BACKGROUNDS.find(x => x.id === build.background);
      const sp = D.SPECIES.find(x => x.id === build.species);
      const extra = sp.extraSkills || 0;
      const classCount = cl.skillsCount;
      const maxTotal = classCount + extra;

      c.appendChild(el('p', '', `Your <strong>${bg.name}</strong> origin already gives you <strong>${bg.skills.map(s => E.skillName(s)).join('</strong> and <strong>')}</strong>.`));
      c.appendChild(el('p', '', `Now choose <strong>${classCount}</strong> skill${classCount > 1 ? 's' : ''} from your ${cl.name} list${extra ? `, plus <strong>${extra}</strong> extra from anywhere for being a ${sp.name}` : ''}.`));

      const chosen = build.skills;

      c.appendChild(el('h2', 'loc', `${cl.name} skills — pick ${classCount}`));
      const g1 = cardGrid(c, 'c3');
      cl.classSkills.forEach(k => {
        const sk = D.SKILL_BY_KEY[k];
        const on = chosen.includes(k);
        const card = el('button', 'card' + (on ? ' sel' : ''));
        card.innerHTML = `<div class="ttl" style="font-size:.95rem">${esc(sk.name)}</div><div class="meta">${E.shortOf(sk.ability)}</div>`;
        card.onclick = () => {
          if (on) build.skills = chosen.filter(x => x !== k);
          else if (chosen.length < maxTotal) build.skills.push(k);
          renderCreator();
        };
        g1.appendChild(card);
      });

      if (extra > 0) {
        c.appendChild(el('h2', 'loc', `Versatile — ${extra} extra skill from anywhere`));
        const g2 = cardGrid(c, 'c3');
        D.SKILLS.filter(s => !cl.classSkills.includes(s.key)).forEach(sk => {
          const on = chosen.includes(sk.key);
          const card = el('button', 'card' + (on ? ' sel' : ''));
          card.innerHTML = `<div class="ttl" style="font-size:.95rem">${esc(sk.name)}</div><div class="meta">${E.shortOf(sk.ability)}</div>`;
          card.onclick = () => {
            if (on) build.skills = chosen.filter(x => x !== sk.key);
            else if (chosen.length < maxTotal) build.skills.push(sk.key);
            renderCreator();
          };
          g2.appendChild(card);
        });
      }

      if (cl.id === 'rogue' && chosen.length >= 1) {
        c.appendChild(el('h2', 'loc', 'Expertise — double your proficiency on one skill'));
        const g3 = cardGrid(c, 'c3');
        chosen.forEach(k => {
          const on = build.expertise === k;
          const card = el('button', 'card' + (on ? ' sel' : ''));
          card.innerHTML = `<div class="ttl" style="font-size:.95rem">${esc(E.skillName(k))}</div><div class="mech">+4 instead of +2</div>`;
          card.onclick = () => { build.expertise = on ? null : k; renderCreator(); };
          g3.appendChild(card);
        });
      }

      navBar(c, { ok: () => chosen.length === maxTotal && (cl.id !== 'rogue' || !!build.expertise), hint: `Pick ${chosen.length} / ${maxTotal}${cl.id === 'rogue' ? ' and choose your Expertise' : ''}.` });
    },

    review(c) {
      const pc = E.finishCharacter(state, build);
      c.appendChild(el('p', '', 'Everything you have chosen is real and it all does something. Here is who is walking into Bramblewick.'));
      const cl = E.classDef(pc.class);
      const sp = E.speciesDef(pc.species);
      const bg = E.backgroundDef(pc.background);
      c.appendChild(el('div', 'banner gold', `Level 1 ${sp.name} ${cl.name} · ${bg.name}`));
      c.appendChild(el('p', '', `<strong>${esc(pc.name)}</strong> (${esc(pc.pronouns)}) — ${esc(pc.hairColor.name)} ${esc(pc.hairStyle).toLowerCase()}, ${esc(pc.eyeColor.name)} eyes, ${esc(String(pc.height || 'Average').toLowerCase())} for a ${esc(pc.speciesName)}, ${esc(pc.skin.name)} skin. ${esc(E.markDef(pc.mark).name)}. Wearing ${esc(E.outfitDef(pc.outfit).name.toLowerCase())}.`));
      c.appendChild(el('p', '', `<strong>HP ${pc.maxHp} · AC ${pc.ac} · Proficiency +${E.profBonus(state)}</strong>`));
      c.appendChild(el('p', '', D.ABILITIES.map(a => `${a.short} <strong>${pc.abilities[a.key]}</strong> (${E.signed(E.mod(pc.abilities[a.key]))})`).join(' &nbsp;·&nbsp; ')));
      c.appendChild(el('p', '', `<strong>Skills:</strong> ${pc.skills.map(s => E.skillName(s)).join(', ')}`));
      c.appendChild(el('p', '', `<strong>Carrying:</strong> ${esc(pc.equipment.join(', '))}, ${esc(D.TRINKETS.find(t => t.id === pc.trinket).name)}`));
      c.appendChild(el('p', 'whisper', sp.flavor));
      c.appendChild(el('p', 'whisper', cl.flavor));
      navBar(c, { label: '🎲 Walk into Bramblewick', ok: () => true });
    }
  };

  function beginGame() {
    E.finishCharacter(state, build);
    state.phase = 'play';
    state.node = null;
    state.seen = [];
    $log.hidden = false;
    SYNC.startRun();          // the game — and only the game — stamps a run
    goto('arrival');
  }

  /* =============== title =============== */
  function renderTitle() {
    state = E.newState();
    state.phase = 'title';
    $story.innerHTML = '';
    $story.classList.remove('scene-fade'); void $story.offsetWidth; $story.classList.add('scene-fade');

    $story.appendChild(el('div', 'chapter', 'A one-session Dungeons & Dragons adventure'));
    $story.appendChild(el('h1', '', 'Grammy’s <span class="accent">Country Apple Pie</span>'));
    $story.appendChild(el('p', 'subtitle', 'Thirty-nine blue ribbons. One empty windowsill. Eight hours until noon.'));
    $story.appendChild(el('div', 'rule'));
    $story.appendChild(el('p', '', 'Bramblewick is a village in a bowl of orchard, and once a year it holds a Harvest Fair, and once a year the same seventy-eight-year-old woman wins the pie competition with the same plain country apple pie with a lattice top.'));
    $story.appendChild(el('p', '', 'This year, the windowsill is empty. And there is a second problem she has not told anybody about yet: she has forgotten the last step of the recipe, and she never wrote it down, because her husband asked her not to.'));
    $story.appendChild(el('p', '', 'You have eight hours.'));

    const g = el('div', 'grid c3');
    [['🎲', 'Real dice', 'Every check is a genuine d20 + ability modifier + proficiency against a difficulty class. The math is shown to you every time.'],
     ['🧝', 'A real character', 'Species, class, origin, appearance and skills — all of it changes the numbers and opens different options in the story.'],
     ['🥧', 'Six endings', 'Your clues, your ingredients, your baking rolls and one very important moral choice decide how this ends.']].forEach(([i, t, d]) => {
      const card = el('div', 'card', `<div class="ttl"><span class="ico">${i}</span>${t}</div><div class="desc">${d}</div>`);
      card.style.cursor = 'default';
      g.appendChild(card);
    });
    $story.appendChild(g);

    $story.appendChild(renderGallery());

    const nav = el('div', 'nav');
    const has = store && store.getItem(SAVE_KEY);
    if (has) {
      const cont = el('button', 'btn', '↻ Continue your adventure');
      cont.onclick = () => { if (loadGame()) goto(state.node); };
      nav.appendChild(cont);
    }
    const b = el('button', 'btn' + (has ? ' ghost' : ''), '🎲 New character');
    b.onclick = () => startCreator();
    nav.appendChild(b);
    $story.appendChild(nav);

    storyToTop();
    renderSheet();
  }

  function restart() { renderTitle(); }

  /* =============== chrome =============== */
  document.getElementById('sheetToggle').onclick = () => $sheetEl.classList.toggle('open');
  document.getElementById('logToggle').onclick = e => {
    const b = document.getElementById('logBody');
    const hidden = b.style.display === 'none';
    b.style.display = hidden ? '' : 'none';
    e.target.textContent = hidden ? 'hide' : 'show';
  };

  /* =============== boot =============== */
  /* ---------- cloud status pill ---------- */
  function renderCloudStatus() {
    let pill = document.getElementById('cloudStatus');
    if (!pill) {
      pill = el('div', 'cloud-status');
      pill.id = 'cloudStatus';
      // Inside #main — a grid child of #app would steal a column slot.
      const main = document.getElementById('main');
      if (main) main.insertBefore(pill, main.firstChild);
      else return;
    }
    return pill;
  }
  function paintCloudStatus(st) {
    const pill = renderCloudStatus();
    if (!pill) return;
    const tone = st.state === 'online' ? 'ok' : st.state === 'error' ? 'bad' : 'idle';
    const dot = st.state === 'online' ? '●' : st.state === 'error' ? '▲' : '○';
    pill.className = 'cloud-status ' + tone;
    pill.title = st.detail || '';
    pill.innerHTML = `<span class="dot">${dot}</span> ${esc(st.label)}`;
  }

  function start() {
    state.endings = unlockedEndings();
    renderTitle();
    SYNC.onStatus(paintCloudStatus);
    // Boot the mirror after first paint so the game is never waiting on it.
    Promise.resolve()
      .then(() => SYNC.init())
      .then(st => {
        paintCloudStatus(st);
        if (!SYNC.isOn()) return;
        // Endings she found on another device join the local gallery.
        return SYNC.loadEndings().then(remote => {
          let added = 0;
          (remote || []).forEach(id => {
            if (!unlockedEndings().includes(id)) { unlockEnding(id); added++; }
          });
          if (added > 0) {
            state.endings = unlockedEndings();
            if (state.phase === 'title') renderTitle();
            renderSheet();
          }
        });
      })
      .catch(() => { /* offline is a perfectly good way to play */ });
  }

  window.DND = { start, state: () => state, SYNC };
})();
