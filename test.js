/* =========================================================
   test.js — headless checks for the campaign.
   Run:  node test.js
   ========================================================= */
const fs = require('fs');
const path = require('path');
const D = require('./js/data.js');
const E = require('./js/engine.js');
const S = require('./js/story.js');

let fails = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { fails++; console.log('  ✗ ' + msg); } }
function section(t) { console.log('\n' + t); }

/* ---------- 1. data integrity ---------- */
section('1 · data integrity');
const skillKeys = new Set(D.SKILLS.map(s => s.key));
D.CLASSES.forEach(c => {
  ok(c.acBase > 0, `class ${c.id} has acBase`);
  c.classSkills.forEach(k => ok(skillKeys.has(k), `class ${c.id} skill "${k}" exists`));
  ok(c.level2 && c.level2.id, `class ${c.id} has a level 2 feature`);
  ok(c.features.length > 0, `class ${c.id} has features`);
  ok(c.classSkills.length >= c.skillsCount, `class ${c.id} offers enough skills`);
});
D.BACKGROUNDS.forEach(b => b.skills.forEach(k => ok(skillKeys.has(k), `background ${b.id} skill "${k}" exists`)));
Object.values(D.ENEMIES).forEach(e => ok(e.hp > 0 && e.ac > 0, `enemy ${e.name} is complete`));
ok(D.ENDINGS.length === 6, 'six endings defined');
ok(new Set(D.ENDINGS.map(e => e.id)).size === 6, 'ending ids unique');

/* ---------- 2. every node reference resolves ---------- */
section('2 · node graph integrity');
const SPECIAL = new Set(['__restart', '__create']);
const ids = new Set(S.nodeIds());
function targetExists(id, from, what) {
  if (id == null) { ok(false, `${from}: ${what} is null`); return; }
  ok(ids.has(id) || SPECIAL.has(id), `${from}: ${what} -> "${id}" exists`);
}
const state = E.newState();
E.finishCharacter(state, {
  species: 'human', class: 'ranger', background: 'folkhero', name: 'Test', pronouns: 'she/her',
  hairStyle: 'x', hairColor: D.HAIR_COLORS[0], eyeColor: D.EYE_COLORS[0], skin: D.SKIN_TONES[0],
  mark: 'freckles', outfit: 'cloak', trinket: 'spoon',
  assignment: { str: 13, dex: 15, con: 12, int: 10, wis: 14, cha: 8 },
  skills: ['survival', 'nature'], expertise: null
});

S.nodeIds().forEach(id => {
  const n = S.getNode(id);
  if (id.startsWith('__')) return;
  try {
    const body = typeof n.body === 'function' ? n.body(state) : n.body;
    ok(Array.isArray(body), `${id}: body returns blocks`);
    (body || []).forEach(b => ok(typeof b === 'object' && b.type, `${id}: every block is well-formed`));
  } catch (e) { ok(false, `${id}: body() threw — ${e.message}`); }

  if (n.kind === 'combat') {
    ok(n.resolution && n.resolution.win && n.resolution.lose && n.resolution.flee, `${id}: combat has all three resolutions`);
    targetExists(n.resolution.win, id, 'win');
    targetExists(n.resolution.lose, id, 'lose');
    targetExists(n.resolution.flee, id, 'flee');
    ok(D.ENEMIES[n.enemy], `${id}: enemy "${n.enemy}" exists`);
    try {
      E.startCombat(state, n.enemy);
      if (typeof n.combatExtras === 'function') n.combatExtras(state).forEach(a => ok(typeof a.run === 'function', `${id}: combat extra has run()`));
      state.combat = null;
    } catch (e) { ok(false, `${id}: combat setup threw — ${e.message}`); }
  }

  let choices;
  try { choices = typeof n.choices === 'function' ? n.choices(state) : (n.choices || []); }
  catch (e) { ok(false, `${id}: choices() threw — ${e.message}`); return; }
  if (n.kind !== 'combat') ok(Array.isArray(choices) && choices.length > 0, `${id}: has at least one choice`);
  (choices || []).forEach((ch, i) => {
    if (ch.check) {
      targetExists(ch.check.success, id, `choice ${i} success`);
      targetExists(ch.check.failure, id, `choice ${i} failure`);
      if (ch.check.skill) ok(skillKeys.has(ch.check.skill), `${id}: choice ${i} skill "${ch.check.skill}" exists`);
      ok(ch.check.dc != null, `${id}: choice ${i} has a DC`);
    } else {
      targetExists(ch.next, id, `choice ${i} next`);
    }
  });
});

/* ---------- 3. choices() for every class at every node ---------- */
section('3 · every class can render every node');
D.CLASSES.forEach(cl => {
  D.SPECIES.forEach(sp => {
    const st = E.newState();
    E.finishCharacter(st, {
      species: sp.id, class: cl.id, background: 'folkhero', name: 'T', pronouns: 'she/her',
      hairStyle: 'x', hairColor: D.HAIR_COLORS[0], eyeColor: D.EYE_COLORS[0], skin: D.SKIN_TONES[0],
      mark: 'freckles', outfit: 'cloak', trinket: 'spoon',
      assignment: { str: 13, dex: 15, con: 12, int: 10, wis: 14, cha: 8 },
      skills: cl.classSkills.slice(0, cl.skillsCount), expertise: cl.classSkills[0]
    });
    S.nodeIds().forEach(id => {
      if (id.startsWith('__')) return;
      const n = S.getNode(id);
      try {
        if (typeof n.body === 'function') n.body(st);
        if (typeof n.choices === 'function') n.choices(st);
        if (typeof n.combatExtras === 'function') { E.startCombat(st, n.enemy); n.combatExtras(st); st.combat = null; }
        if (typeof n.onEnter === 'function') n.onEnter(st);
      } catch (e) { ok(false, `${cl.id}/${sp.id} @ ${id}: ${e.message}`); }
    });
  });
});
ok(true, 'no class/species combination crashed');

/* ---------- 4. dice math ---------- */
section('4 · dice math');
(function () {
  const st = E.newState();
  E.finishCharacter(st, {
    species: 'human', class: 'cleric', background: 'acolyte', name: 'T', pronouns: 'she/her',
    hairStyle: 'x', hairColor: D.HAIR_COLORS[0], eyeColor: D.EYE_COLORS[0], skin: D.SKIN_TONES[0],
    mark: 'none', outfit: 'cloak', trinket: 'spoon',
    assignment: { str: 14, dex: 10, con: 13, int: 8, wis: 15, cha: 12 },
    skills: ['insight', 'medicine', 'history', 'religion'], expertise: null
  });
  // wis 15 (+2) + human +1 = 16 (+3); insight proficient (+2); acolyte +1  => +6
  const m = E.modifierFor(st, { skill: 'insight' });
  ok(m.total === 6, `insight modifier is +6 (got ${m.total})`);
  // religion proficient, wis +3 + 2 = +5
  const r2 = E.modifierFor(st, { skill: 'religion' });
  ok(r2.total === 5, `religion modifier is +5 (got ${r2.total})`);
  // arcana not proficient, int 8+1=9 => -1
  const r3 = E.modifierFor(st, { skill: 'arcana' });
  ok(r3.total === -1, `untrained arcana is -1 (got ${r3.total})`);
  ok(E.profBonus(st) === 2, 'proficiency bonus at level 1 is +2');
  ok(st.pc.maxHp === 8 + 2, `cleric maxHp is 10 (got ${st.pc.maxHp})`);
  ok(st.pc.ac === 16, `cleric AC is 16 (got ${st.pc.ac})`);

  // bard jack of all trades: +1 on untrained
  const bard = E.newState();
  E.finishCharacter(bard, {
    species: 'elf', class: 'bard', background: 'entertainer', name: 'B', pronouns: 'she/her',
    hairStyle: 'x', hairColor: D.HAIR_COLORS[0], eyeColor: D.EYE_COLORS[0], skin: D.SKIN_TONES[0],
    mark: 'none', outfit: 'cloak', trinket: 'spoon',
    assignment: { str: 8, dex: 15, con: 12, int: 10, wis: 13, cha: 14 },
    skills: ['performance', 'persuasion', 'deception', 'history'], expertise: null
  });
  const jack = E.modifierFor(bard, { skill: 'acrobatics' });
  ok(jack.parts.some(p => p.label === 'Jack of All Trades'), 'bard gets Jack of All Trades on untrained skills');
  // elf dex 15+2 = 17 => +3, jack +1 => +4
  ok(jack.total === 4, `bard untrained acrobatics is +4 (got ${jack.total})`);
  const jackStr = E.modifierFor(bard, { skill: 'athletics' });
  ok(jackStr.total === 0, `bard untrained athletics (str 8) is +0 (got ${jackStr.total})`);
  ok(bard.pc.maxHp === 8 + 1, `bard maxHp is 9 (got ${bard.pc.maxHp})`);
})();

/* ---------- 5. rogues get double expertise, dwarves resist poison ---------- */
section('5 · traits fire');
(function () {
  const st = E.newState();
  E.finishCharacter(st, {
    species: 'dwarf', class: 'rogue', background: 'criminal', name: 'R', pronouns: 'she/her',
    hairStyle: 'x', hairColor: D.HAIR_COLORS[0], eyeColor: D.EYE_COLORS[0], skin: D.SKIN_TONES[0],
    mark: 'gap', outfit: 'cloak', trinket: 'spoon',
    assignment: { str: 10, dex: 15, con: 13, int: 8, wis: 12, cha: 14 },
    skills: ['stealth', 'sleight', 'deception', 'perception'], expertise: 'stealth'
  });
  // dwarf gives no dex bonus: dex 15 => +2, expertise +4, gap mark +1 => +7
  const m = E.modifierFor(st, { skill: 'stealth' });
  ok(m.total === 7, `dwarf rogue expert stealth is +7 (got ${m.total})`);
  const plain = E.modifierFor(st, { skill: 'perception' });
  ok(plain.total === 3, `dwarf rogue proficient perception (wis 12) is +3 (got ${plain.total})`);
  ok(E.hasTrait(st, 'poisonres'), 'dwarf has poison resistance');

  E.startCombat(st, 'oven');
  st.pc.hp = 20; st.pc.maxHp = 20;
  const before = st.pc.hp;
  E.damageToPC(st, 5, 'poison');
  ok(st.pc.hp === before, `dwarf takes 0 poison damage (hp stayed ${st.pc.hp})`);

  E.startCombat(st, 'goblin');
  E.damageToPC(st, 5, 'piercing');
  ok(st.pc.hp === before - 5, 'non-poison damage lands normally');
  st.combat = null;
})();

/* ---------- 6. pie scoring & ending resolution ---------- */
section('6 · pie quality → endings');
(function () {
  function mk() {
    const st = E.newState();
    E.finishCharacter(st, {
      species: 'human', class: 'bard', background: 'artisan', name: 'P', pronouns: 'she/her',
      hairStyle: 'x', hairColor: D.HAIR_COLORS[0], eyeColor: D.EYE_COLORS[0], skin: D.SKIN_TONES[0],
      mark: 'none', outfit: 'apron', trinket: 'spoon',
      assignment: { str: 8, dex: 14, con: 12, int: 10, wis: 13, cha: 15 },
      skills: ['performance', 'persuasion', 'insight', 'history'], expertise: null
    });
    return st;
  }
  const perfect = mk();
  D.INGREDIENTS.forEach(i => E.setIngredient(perfect, i.id, 2));
  perfect.flags.peaceful = true; perfect.flags.dryadFriend = true; perfect.flags.macFriend = true;
  ok(E.pieQuality(perfect) === 10, `everything brought back in peace is 10/10 (got ${E.pieQuality(perfect)})`);
  ok(E.resolveEnding(perfect) === 'perfect', `whole recipe + peace + 10/10 => perfect (got ${E.resolveEnding(perfect)})`);

  const gold = mk();
  E.setIngredient(gold, 'half_office', 2); E.setIngredient(gold, 'half_apartment', 2);
  gold.flags.peaceful = false;
  ok(E.resolveEnding(gold) === 'gold', `whole recipe by the sword => gold (got ${E.resolveEnding(gold)})`);

  const pact = mk();
  E.setIngredient(pact, 'half_office', 2); E.setIngredient(pact, 'half_apartment', 2);
  pact.flags.goblinPact = true;
  ok(E.resolveEnding(pact) === 'goblins', `a promise to the goblins => goblins ending (got ${E.resolveEnding(pact)})`);

  const half = mk();
  E.setIngredient(half, 'half_office', 2);
  ok(E.resolveEnding(half) === 'half', `one half => half ending (got ${E.resolveEnding(half)})`);

  const nothing = mk();
  nothing.flags.peaceful = false;
  ok(E.pieQuality(nothing) === 0, `nothing brought back is 0/10 (got ${E.pieQuality(nothing)})`);
})();

/* ---------- 7. full playthroughs ---------- */
section('7 · full random playthroughs');
(function () {
  const endingsSeen = new Set();
  let games = 0, maxNodes = 0;

  for (let g = 0; g < 400; g++) {
    const cl = D.CLASSES[g % D.CLASSES.length];
    const sp = D.SPECIES[Math.floor(g / D.CLASSES.length) % D.SPECIES.length];
    const bg = D.BACKGROUNDS[g % D.BACKGROUNDS.length];
    const st = E.newState();
    E.finishCharacter(st, {
      species: sp.id, class: cl.id, background: bg.id, name: 'Play', pronouns: 'she/her',
      hairStyle: D.HAIR_STYLES[0], hairColor: D.HAIR_COLORS[0], eyeColor: D.EYE_COLORS[0], skin: D.SKIN_TONES[0],
      mark: D.MARKS[g % D.MARKS.length].id, outfit: D.OUTFITS[g % D.OUTFITS.length].id,
      trinket: D.TRINKETS[g % D.TRINKETS.length].id,
      assignment: { str: 13, dex: 15, con: 12, int: 10, wis: 14, cha: 8 },
      skills: cl.classSkills.slice(0, cl.skillsCount).concat(bg.skills).slice(0, 4),
      expertise: cl.id === 'rogue' ? cl.classSkills[0] : null
    });

    let node = 'arrival';
    let guard = 0;
    while (guard++ < 400) {
      const n = S.getNode(node);
      if (!n) throw new Error(`missing node ${node} in playthrough ${g}`);
      if (typeof n.onEnter === 'function') n.onEnter(st);
      if (n.kind === 'combat') {
        E.startCombat(st, n.enemy);
        let rounds = 0;
        while (!st.combat.over && rounds++ < 60) {
          // A real player sees the special options too, so use them sometimes.
          const extras = typeof n.combatExtras === 'function' ? n.combatExtras(st) : [];
          if (extras.length && Math.random() < 0.5) {
            extras[Math.floor(Math.random() * extras.length)].run(st);
          } else {
            E.playerAttack(st, {});
          }
          if (st.combat.over) break;
          E.enemyTurn(st);
          E.checkCombatEnd(st);
          if (st.pc.hp <= 0) break;              // down -> 'lose' resolution, as in the game
        }
        if (st.pc.hp <= 0) { st.combat.over = true; st.combat.won = false; }
        const outcome = st.combat.fled ? 'flee' : st.combat.won ? 'win' : 'lose';
        st.combat = null;
        // the lose/flee nodes restore HP
        st.pc.hp = Math.max(1, Math.floor(st.pc.maxHp * 0.6));
        node = n.resolution[outcome];
        continue;
      }
      if (node.startsWith('ending_')) { endingsSeen.add(node.slice(7)); break; }

      const choices = typeof n.choices === 'function' ? n.choices(st) : n.choices;
      if (!choices || !choices.length) throw new Error(`dead end at ${node} in playthrough ${g}`);
      const ch = choices[Math.floor(Math.random() * choices.length)];
      if (typeof ch.do === 'function') ch.do(st);
      if (ch.check) {
        const r = E.roll(st, ch.check);
        st.lastRoll = r;
        node = r.pass ? ch.check.success : ch.check.failure;
      } else {
        node = ch.next;
      }
      if (node === '__restart' || node === '__create') break;
    }
    games++;
    maxNodes = Math.max(maxNodes, guard);
    ok(guard < 400, `playthrough ${g} (${cl.id}/${sp.id}/${bg.id}) terminated`);
  }

  console.log(`  ${games} playthroughs completed, longest ${maxNodes} nodes`);
  console.log(`  endings reached by random play: ${[...endingsSeen].sort().join(', ') || 'none'}`);
  ok(endingsSeen.size >= 3, `random play reaches at least 3 distinct endings (got ${endingsSeen.size})`);
  [...endingsSeen].forEach(id => ok(D.ENDINGS.some(e => e.id === id), `ending "${id}" is a defined ending`));
})();

/* ---------- 8. level up ---------- */
section('8 · levelling');
(function () {
  const st = E.newState();
  E.finishCharacter(st, {
    species: 'dragonborn', class: 'fighter', background: 'soldier', name: 'L', pronouns: 'she/her',
    hairStyle: 'x', hairColor: D.HAIR_COLORS[0], eyeColor: D.EYE_COLORS[0], skin: D.SKIN_TONES[0],
    mark: 'scar', outfit: 'patched', trinket: 'spoon',
    assignment: { str: 15, dex: 12, con: 14, int: 8, wis: 10, cha: 13 },
    skills: ['athletics', 'intimidation', 'perception', 'survival'], expertise: null
  });
  const hp0 = st.pc.maxHp;
  const up = E.levelUp(st);
  ok(st.level === 2, 'level is now 2');
  ok(up.feature.id === 'actionsurge', `fighter level 2 is Action Surge (got ${up.feature.id})`);
  ok(st.pc.maxHp === hp0 + up.hp, 'maxHp grew by the roll');
  ok(E.hasFeature(st, 'actionsurge'), 'Action Surge is now available');
  ok(E.levelUp(st) === null, 'cannot level past 2 in this adventure');
})();

/* ---------- 9. trinkets / one-use resources ---------- */
section('9 · one-use resources');
(function () {
  const st = E.newState();
  E.finishCharacter(st, {
    species: 'halfling', class: 'cleric', background: 'hermit', name: 'H', pronouns: 'she/her',
    hairStyle: 'x', hairColor: D.HAIR_COLORS[0], eyeColor: D.EYE_COLORS[0], skin: D.SKIN_TONES[0],
    mark: 'none', outfit: 'apron', trinket: 'spoon',
    assignment: { str: 8, dex: 14, con: 13, int: 10, wis: 15, cha: 12 },
    skills: ['medicine', 'nature', 'insight', 'history'], expertise: null
  });
  ok(!E.spent(st, 'trinket'), 'trinket unused at start');
  E.spend(st, 'trinket');
  ok(E.spent(st, 'trinket'), 'trinket is spent after use');
  ok(E.hasTrait(st, 'lucky'), 'halfling has Lucky');

  // Lucky: force a run of 1s and confirm it rerolls
  let sawReroll = false;
  const realRandom = Math.random;
  Math.random = () => 0;  // every d20 => 1
  const r = E.roll(st, { ability: 'str', label: 'forced' });
  Math.random = realRandom;
  ok(r.lucky === true, 'Lucky triggered a reroll on a natural 1');
  const apronRoll = E.roll(st, { ability: 'cha', label: 'raw ability roll with an outfit equipped' });
  ok(apronRoll.total === apronRoll.d20 + E.mod(st.pc.abilities.cha), 'raw ability rolls ignore skill-only outfit bonuses');
  ok(true, 'lucky roll recorded');
  void sawReroll;
})();

/* ---------- 10. story text quality ---------- */
section('10 · content coverage');
(function () {
  ok(S.nodeIds().length >= 60, `campaign has ${S.nodeIds().length} nodes (want 60+)`);
  const words = S.nodeIds().reduce((n, id) => {
    const b = S.getNode(id).body;
    if (typeof b !== 'function') return n;
    const st = E.newState();
    E.finishCharacter(st, {
      species: 'human', class: 'bard', background: 'artisan', name: 'W', pronouns: 'she/her',
      hairStyle: 'x', hairColor: D.HAIR_COLORS[0], eyeColor: D.EYE_COLORS[0], skin: D.SKIN_TONES[0],
      mark: 'none', outfit: 'apron', trinket: 'spoon',
      assignment: { str: 8, dex: 14, con: 12, int: 10, wis: 13, cha: 15 },
      skills: ['performance', 'persuasion', 'insight', 'history'], expertise: null
    });
    try { return n + (b(st) || []).map(x => String(x.text || '')).join(' ').split(/\s+/).length; }
    catch (e) { return n; }
  }, 0);
  console.log(`  ~${words.toLocaleString()} words of story across ${S.nodeIds().length} nodes`);
  ok(words > 3000, `story is substantial (${words} words)`);
})();

/* ---------- 11. every ending is actually reachable ---------- */
section('11 · all six endings are reachable');
(function () {
  const mk = () => {
    const st = E.newState();
    E.finishCharacter(st, {
      species: 'human', class: 'bard', background: 'artisan', name: 'R', pronouns: 'she/her',
      hairStyle: 'x', hairColor: D.HAIR_COLORS[0], eyeColor: D.EYE_COLORS[0], skin: D.SKIN_TONES[0],
      mark: 'none', outfit: 'apron', trinket: 'spoon',
      assignment: { str: 8, dex: 14, con: 12, int: 10, wis: 13, cha: 15 },
      skills: ['performance', 'persuasion'], expertise: null
    });
    return st;
  };
  const seen = new Set(), qualities = new Set();
  const halves = [[0,0],[2,0],[2,2]];
  for (const [ho, ha] of halves) for (const sp of [0,2]) for (const peace of [false,true])
  for (const dry of [false,true]) for (const mac of [false,true]) for (const pact of [false,true]) {
    const st = mk();
    E.setIngredient(st, 'half_office', ho); E.setIngredient(st, 'half_apartment', ha);
    E.setIngredient(st, 'spices', sp); E.setIngredient(st, 'apples', sp); E.setIngredient(st, 'spellbook', sp);
    st.flags.peaceful = peace; st.flags.dryadFriend = dry; st.flags.macFriend = mac; st.flags.goblinPact = pact;
    qualities.add(E.pieQuality(st));
    seen.add(E.resolveEnding(st));
  }
  console.log(`  pie quality range reachable: 0–${Math.max(...qualities)}`);
  ['perfect', 'gold', 'goblins', 'half'].forEach(id => ok(seen.has(id), `ending "${id}" is produced by the resolver`));
  ok(S.NODES.decline.choices().some(c => c.next === 'ending_quit') && S.NODES.finale_gate.choices(E.newState()).some(c => c.next === 'ending_quit'), 'quit ending is offered on the road');
  ok(S.NODES.mac_wrath.resolution.lose === 'ending_compost', 'compost ending is what Mac deals out');
  D.ENDINGS.forEach(e => ok(S.nodeIds().includes('ending_' + e.id), `ending node ending_${e.id} exists`));
  ok(qualities.has(10) && qualities.has(0), 'pie quality spans the full 0–10 range');
})();

/* ---------- 12 · database.rules.json must be valid rules language ---------- */
section('12 · security rules lint');
(function () {
  const raw = fs.readFileSync(path.join(__dirname, 'database.rules.json'), 'utf8');
  let rules;
  try { rules = JSON.parse(raw); ok(true, 'database.rules.json is valid JSON'); }
  catch (e) { ok(false, 'database.rules.json parses: ' + e.message); return; }

  const strings = [];
  (function walk(n) {
    if (typeof n === 'string') { strings.push(n); return; }
    if (n && typeof n === 'object') Object.values(n).forEach(walk);
  })(rules);
  const validates = strings.filter(t => t.includes('.validate') || t.startsWith('newData.'));

  ok(!/\bundefined\b/.test(raw), 'no `undefined` anywhere (it is not a rules keyword)');
  ok(!/\bconsole\b|\bdocument\b|\bwindow\b/.test(raw), 'no browser/JS globals in rules');

  // .val().length is only legal on strings: every use must sit next to isString()
  validates.forEach(v => {
    if (/val\(\)\.length/.test(v)) {
      ok(/isString\(\)/.test(v), `val().length only on strings: "${v.slice(0, 46)}…"`);
    }
  });
  // numChildren() does not exist in the RTDB rules language
  ok(!/numChildren/.test(raw), 'no invented numChildren() calls');

  // every .validate mentions only documented rules-language members
  const ALLOW = /newData|data|auth|now|root|\.val\(\)|\.isString\(\)|\.isNumber\(\)|\.isBoolean\(\)|\.hasChildren\(\)|\.numChildren\(\)|\.exists\(\)|\.length|\$[a-zA-Z]+\.length|&&|\|\||===|!==|<=|>=|<|>|!|\(|\)|true|false|null/g;
  validates.forEach(v => {
    const stripped = v.replace(ALLOW, '').replace(/[\s0-9.]+/g, '');
    ok(stripped.length === 0, `only rules-language tokens in: "${v.slice(0, 40)}…"`);
  });
})();

/* ---------- 13. the reactive portrait ---------- */
section('13 · avatar reacts to pronouns, species, class and outfit');
(() => {
  const A = D.avatarSVG;
  ok(typeof A === 'function', 'data.js exports avatarSVG');
  const base = { hairStyle: 'Short & tousled', mark: 'none', outfit: 'cloak' };

  /* pronouns */
  const she = A({ ...base, pronouns: 'she/her', species: 'human', class: 'rogue' });
  const he  = A({ ...base, pronouns: 'he/him',  species: 'human', class: 'rogue' });
  const they = A({ ...base, pronouns: 'they/them', species: 'human', class: 'rogue' });
  ok(he.includes('data-part="beard"'), 'he/him grows a beard');
  ok(!she.includes('data-part="beard"'), 'she/her has no beard');
  ok(!they.includes('data-part="beard"'), 'they/them has no beard');
  ok(she.includes('data-part="beard"') === false && she.includes('#d9736a'), 'she/her keeps the blush');
  ok(he.includes('data-part="stubble"'), 'he/him gets stubble');
  ok(she !== he && he !== they && she !== they, 'all three pronoun portraits differ');
  ok(he.includes('M20 130') && she.includes('M28 130'), 'masculine build is broader than feminine');

  /* species */
  const elf = A({ ...base, pronouns: 'she/her', species: 'elf' });
  const human = A({ ...base, pronouns: 'she/her', species: 'human' });
  ok(elf.includes('data-part="ears"') && !human.includes('data-part="ears"'), 'elf gets pointed ears, human round ones');
  const tie = A({ ...base, species: 'tiefling' });
  ok(tie.includes('data-part="horns"') && tie.includes('data-part="tail"'), 'tiefling gets horns and a tail');
  ok(tie.includes('data-part="tail-spade"') && tie.includes('data-part="fangs"'), 'tiefling tail ends in a spade and the smile shows fangs');
  const drag = A({ ...base, species: 'dragonborn' });
  ok(drag.includes('data-part="snout"') && drag.includes('data-part="crest"'), 'dragonborn gets snout and fin crest');
  ok(drag.includes('data-part="horns"') && drag.includes('data-part="jaw-spikes"') && drag.includes('data-part="scales"'), 'dragonborn gets swept horns, jaw spikes and scale texture');
  ok(!drag.includes('data-part="hair-top"'), 'dragonborn has no hair');
  ok(!A({ ...base, species: 'human', hairStyle: 'Bald & polished' }).includes('data-part="hair-top"'), 'bald means no hair');
  const dwarfF = A({ ...base, pronouns: 'she/her', species: 'dwarf' });
  ok(dwarfF.includes('data-part="beard"'), 'dwarves all grow beards, even she/her');
  ok(dwarfF.includes('data-part="beard-rings"') && dwarfF.includes('data-part="earring"'), 'dwarf beard gets rings and the ear gets a gold hoop');
  ok(dwarfF.includes('M16 130'), 'dwarves are stocky');
  ok(A({ ...base, pronouns: 'she/her', species: 'elf' }).includes('data-part="earring"'), 'elves get a dangling earring');
  const half = A({ ...base, species: 'halfling' });
  ok(half.includes('scale(0.8)'), 'halfling figure is smaller in the frame');
  ok(A({ ...base, species: 'halfling', height: 'Taller' }).includes('scale(0.87)'), 'a taller halfling is bigger than an average one');
  ok(A({ ...base, species: 'human', height: 'Taller' }).includes('scale(1.07)') && A({ ...base, species: 'human', height: 'Smaller' }).includes('scale(0.93)'), 'height choice nudges stature');
  ok(A({ ...base, species: 'halfling', height: 'Taller' }).includes('scale(0.87)') && !A({ ...base, species: 'halfling', height: 'Taller' }).includes('scale(1'), 'a tall halfling still reads smaller than a human');

  /* class gear */
  const byClass = id => A({ ...base, pronouns: 'they/them', species: 'human', class: id });
  ok(byClass('wizard').includes('data-part="hat"'), 'wizard wears the pointy hat');
  const fig = byClass('fighter');
  ok(fig.includes('data-part="pauldron"') && fig.includes('data-part="sword"'), 'fighter gets pauldron and sword');
  const rog = byClass('rogue');
  ok(rog.includes('data-part="hood"') && rog.includes('data-part="dagger"'), 'rogue gets hood and dagger');
  const bard = byClass('bard');
  ok(bard.includes('data-part="cap"') && bard.includes('data-part="lute"') && bard.includes('data-part="notes"'), 'bard gets feathered cap, lute and notes');
  const cle = byClass('cleric');
  ok(cle.includes('data-part="amulet"') && cle.includes('data-part="halo"'), 'cleric gets amulet and halo');
  const ran = byClass('ranger');
  ok(ran.includes('data-part="bow"') && ran.includes('data-part="hood"'), 'ranger gets bow and half-hood');
  ok(!byClass('wizard').includes('data-part="bow"'), 'classes do not leak gear into each other');

  /* outfit colours */
  ok(A({ ...base, outfit: 'apron' }).includes('#d8c49a'), 'apron recolours the torso');
  ok(A({ ...base, outfit: 'fine' }).includes('#7b2d3f') && A({ ...base, outfit: 'fine' }).includes('data-part="collar"'), 'fine clothes get burgundy + gold collar');
  ok(A({ ...base, outfit: 'patched' }).includes('data-part="patches"'), 'patched leathers show patches');

  /* the three shapes we pass around must agree */
  const pcShape = A({ pronouns: 'he/him', species: 'elf', class: 'wizard',
    hairStyle: 'Long braid', mark: 'glasses', outfit: 'fine',
    skinHex: '#a06a44', hairColorHex: '#101010', eyeColorHex: '#205030' });
  const buildShape = A({ pronouns: 'he/him', species: 'elf', class: 'wizard',
    hairStyle: 'Long braid', mark: 'glasses', outfit: 'fine',
    skin: { hex: '#a06a44' }, hairColor: { hex: '#101010' }, eyeColor: { hex: '#205030' } });
  const watchShape = A({ pronouns: 'he/him', species: 'Elf', class: 'Wizard',
    look: { hairStyle: 'Long braid', mark: 'glasses', outfit: 'fine',
            skinHex: '#a06a44', hairHex: '#101010', eyeHex: '#205030' } });
  ok(pcShape === buildShape, 'pc shape and creation-build shape render identically');
  ok(pcShape === watchShape, 'pc shape and watch-page shape render identically');
  ok(pcShape.includes('#101010') && pcShape.includes('#a06a44'), 'chosen colours actually land in the portrait');

  /* size + braided beard */
  ok(A(base, 64).includes('width="64"'), 'size parameter is honoured');
  ok(A({ ...base, pronouns: 'he/him', hairStyle: 'Long braid' }).includes('data-part="beard"'), 'braided masculine hair grows a long beard');
})();

/* ---------- summary ---------- */
console.log('\n' + '─'.repeat(46));
console.log(fails === 0 ? `✅ ALL PASS — ${checks} assertions` : `❌ ${fails} FAILED of ${checks} assertions`);
process.exit(fails === 0 ? 0 : 1);
