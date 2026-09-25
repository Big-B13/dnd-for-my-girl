/* =========================================================
   engine.js — the dice, the math, the character sheet.
   Real D&D 5e rules: d20 + ability mod + proficiency vs a DC.
   ========================================================= */
(function (root, factory) {
  const D = (typeof module === 'object' && module.exports) ? require('./data.js') : root.DNDData;
  if (typeof module === 'object' && module.exports) module.exports = factory(D);
  else root.DNDEngine = factory(D);
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';

  /* ---------------- dice ---------------- */
  function d(n, sides = 6) { return Math.floor(Math.random() * sides) + 1; }
  function d20() { return d(1, 20); }
  function parseDice(str) {
    // "1d8+2" -> [1,8,2]
    const m = String(str).match(/^(\d*)d(\d+)([+-]\d+)?$/i);
    if (!m) return [1, 6, 0];
    return [parseInt(m[1] || '1', 10), parseInt(m[2], 10), parseInt(m[3] || '0', 10)];
  }
  function rollDice(str) {
    const [n, sides, flat] = parseDice(str);
    let total = flat, parts = [];
    for (let i = 0; i < n; i++) { const v = d(1, sides); parts.push(v); total += v; }
    return { total, parts, expr: str };
  }

  /* ---------------- state ---------------- */
  function newState() {
    return {
      phase: 'title',
      pc: null,
      level: 1,
      flags: {},          // story booleans
      clues: [],          // clue ids
      items: [],          // item ids
      ingredients: {},    // id -> quality 0..2
      used: {},           // one-use resources spent
      rolls: [],          // dice log
      node: null,
      seen: [],           // visited node ids
      endings: [],        // unlocked ending ids (persisted)
      combat: null,
      stats: { checks: 0, passed: 0, crits: 0, fumbles: 0 }
    };
  }

  const ABILITY_KEYS = D.ABILITIES.map(a => a.key);
  const shortOf = key => (D.ABILITIES.find(a => a.key === key) || {}).short || key.toUpperCase();
  const skillDef = key => D.SKILL_BY_KEY[key] || null;
  const skillName = key => (skillDef(key) || { name: key }).name;
  const speciesDef = id => D.SPECIES.find(s => s.id === id);
  const classDef = id => D.CLASSES.find(c => c.id === id);
  const backgroundDef = id => D.BACKGROUNDS.find(b => b.id === id);
  const markDef = id => D.MARKS.find(m => m.id === id);
  const outfitDef = id => D.OUTFITS.find(m => m.id === id);

  /* ---------------- modifiers ---------------- */
  const mod = score => Math.floor((score - 10) / 2);
  const signed = n => (n >= 0 ? '+' + n : '' + n);

  function profBonus(state) {
    return 2 + Math.floor((state.level - 1) / 4);
  }

  function hasTrait(state, id) {
    const sp = speciesDef(state.pc.species);
    return !!sp && sp.traits.some(t => t.id === id);
  }
  function hasFeature(state, id) {
    const cl = classDef(state.pc.class);
    if (!cl) return false;
    if (cl.features.some(f => f.id === id)) return true;
    return !!cl.level2 && cl.level2.id === id && state.level >= 2;
  }
  function isProficient(state, skillKey) {
    return state.pc.skills.includes(skillKey);
  }
  function isExpert(state, skillKey) {
    return state.pc.expertise === skillKey;
  }
  function spent(state, id) { return !!state.used[id]; }
  function spend(state, id) { state.used[id] = true; }

  /**
   * Flat modifier for an ability or skill check.
   * opts: { skill, bonus:[{id,label,amount}], context:{} }
   */
  function modifierFor(state, opts = {}) {
    const skill = opts.skill ? skillDef(opts.skill) : null;
    const ability = skill ? skill.ability : (opts.ability || 'str');
    let total = mod(state.pc.abilities[ability]);
    const parts = [{ label: shortOf(ability), amount: mod(state.pc.abilities[ability]) }];

    if (skill) {
      const pb = profBonus(state);
      if (isExpert(state, skill.key)) {
        total += pb * 2; parts.push({ label: 'Proficiency (Expertise)', amount: pb * 2 });
      } else if (isProficient(state, skill.key)) {
        total += pb; parts.push({ label: 'Proficiency', amount: pb });
      } else if (hasFeature(state, 'jack')) {
        const j = Math.floor(pb / 2);
        if (j > 0) { total += j; parts.push({ label: 'Jack of All Trades', amount: j }); }
      }
    }

    // class / species / background riders
    if (skill && skill.key === 'history' && hasTrait(state, 'stonecunning') && opts.context && opts.context.stonework) {
      total += 2; parts.push({ label: 'Stone Cunning', amount: 2 });
    }
    if (skill && skill.key === 'survival' && hasFeature(state, 'natural') && opts.context && opts.context.wilds) {
      total += 2; parts.push({ label: 'Natural Explorer', amount: 2 });
    }
    if (skill && (skill.ability === 'cha') && state.pc.background === 'artisan' && opts.context && opts.context.merchant) {
      total += 1; parts.push({ label: 'Guild Artisan', amount: 1 });
    }
    if (skill && skill.key === 'insight' && state.pc.background === 'acolyte') {
      total += 1; parts.push({ label: 'Shelter of the Faithful', amount: 1 });
    }
    if (skill && ['intimidation', 'persuasion'].includes(skill.key) && state.pc.background === 'soldier' && opts.context && opts.context.official) {
      total += 1; parts.push({ label: 'Military Rank', amount: 1 });
    }
    if (skill && skill.key === 'persuasion' && state.pc.background === 'folkhero' && opts.context && opts.context.villager) {
      total += 1; parts.push({ label: 'Rustic Hospitality', amount: 1 });
    }
    if (skill && ['nature', 'animal'].includes(skill.key) && hasTrait(state, 'minorillusion') && opts.context && opts.context.beasts) {
      total += 1; parts.push({ label: 'Thaumaturgy', amount: 1 });
    }

    // mark / outfit / trinket riders
    const mark = markDef(state.pc.mark);
    const outfit = outfitDef(state.pc.outfit);
    const ctx = opts.context || {};
    if (mark && skill) {
      const rules = {
        freckles: s => s.key === 'persuasion' && (ctx.cook || ctx.grandmother),
        scar: () => !!ctx.fire,
        gap: s => ['deception', 'stealth'].includes(s.key),
        tattoo: s => ['nature', 'animal'].includes(s.key),
        glasses: s => ['perception', 'history'].includes(s.key),
        none: s => s.key === 'stealth'
      };
      if (rules[mark.id] && rules[mark.id](skill)) { total += 1; parts.push({ label: mark.name, amount: 1 }); }
    }
    if (outfit && skill) {
      const rules = {
        cloak: s => s.key === 'stealth' && ctx.hood,
        apron: () => !!ctx.kitchen,
        fine: s => ['persuasion', 'deception'].includes(s.key) && ctx.important,
        patched: s => ['acrobatics', 'athletics', 'survival'].includes(s.key)
      };
      if (rules[outfit.id] && rules[outfit.id](skill)) { total += 1; parts.push({ label: outfit.name, amount: 1 }); }
    }

    (opts.bonus || []).forEach(b => { total += b.amount; parts.push({ label: b.label, amount: b.amount }); });

    return { total, parts, ability, skill: skill ? skill.key : null };
  }

  /** Advantage resolution. Returns 'adv' | 'dis' | null */
  function advantageFor(state, opts = {}) {
    if (opts.advantage && opts.disadvantage) return null;   // they cancel
    if (opts.advantage) return 'adv';
    if (opts.disadvantage) return 'dis';
    return null;
  }

  /* ---------------- the roll ---------------- */
  /**
   * roll(state, { skill, ability, dc, advantage, disadvantage, bonus, context, label })
   * Returns { d20, die, mod, parts, total, dc, pass, crit, fumble, label, logText }
   */
  function roll(state, opts = {}) {
    const m = modifierFor(state, opts);
    let adv = advantageFor(state, opts);
    let die, second = null;

    if (adv === 'adv') {
      const a = d20(), b = d20();
      die = Math.max(a, b); second = { a, b, kept: 'high' };
    } else if (adv === 'dis') {
      const a = d20(), b = d20();
      die = Math.min(a, b); second = { a, b, kept: 'low' };
    } else {
      die = d20();
    }

    // Halfling Lucky: reroll a natural 1 once
    let lucky = false;
    if (die === 1 && hasTrait(state, 'lucky')) {
      die = d20(); lucky = true;
    }

    const total = die + m.total;
    const dc = opts.dc == null ? null : opts.dc;
    const crit = die === 20;
    const fumble = die === 1;
    let pass;
    if (dc == null) pass = null;
    else if (crit) pass = true;
    else if (fumble) pass = false;
    else pass = total >= dc;

    const result = {
      d20: die, second, adv, lucky, mod: m.total, parts: m.parts, total, dc,
      pass, crit, fumble,
      label: opts.label || (opts.skill ? skillName(opts.skill) + ' check' : 'Roll'),
      skill: m.skill, ability: m.ability
    };
    result.logText = describeRoll(result);

    state.rolls.push(result);
    if (state.rolls.length > 200) state.rolls.shift();
    state.stats.checks++;
    if (dc != null) { if (pass) state.stats.passed++; }
    if (crit) state.stats.crits++;
    if (fumble) state.stats.fumbles++;
    return result;
  }

  function describeRoll(r) {
    const bits = [];
    bits.push(r.label);
    bits.push(`d20 = ${r.d20}${r.second ? ` (rolled ${r.second.a} & ${r.second.b}, kept ${r.second.kept})` : ''}${r.lucky ? ' — Lucky reroll!' : ''}`);
    bits.push(`modifier ${signed(r.mod)} [${r.parts.map(p => `${p.label} ${signed(p.amount)}`).join(', ')}]`);
    bits.push(`total ${r.total}`);
    if (r.dc != null) bits.push(`vs DC ${r.dc} → ${r.crit ? 'CRITICAL SUCCESS' : r.fumble ? 'CRITICAL FAILURE' : r.pass ? 'SUCCESS' : 'FAILURE'}`);
    return bits.join(' · ');
  }

  /* ---------------- combat ---------------- */
  function startCombat(state, enemyKey) {
    const e = D.ENEMIES[enemyKey];
    const pc = state.pc;
    state.combat = {
      key: enemyKey,
      enemy: { name: e.name, icon: e.icon, ac: e.ac, hp: e.hp, maxHp: e.hp, atk: e.atk, dmg: e.dmg, dmgType: e.dmgType, note: e.note },
      round: 1,
      log: [],
      over: false,
      won: false,
      fled: false,
      dodgeNext: false,
      sneakUsed: false,
      breathUsed: false,
      surgeUsed: false,
      markActive: false
    };
    combatLog(state, `⚔️ Combat begins: ${e.name} (AC ${e.ac}, ${e.hp} HP).`);
    return state.combat;
  }

  function combatLog(state, text) {
    if (!state.combat) return;
    state.combat.log.push(text);
    if (state.combat.log.length > 60) state.combat.log.shift();
  }

  function damageToPC(state, amount, type) {
    let amt = amount;
    let note = '';
    if (type === 'poison' && hasTrait(state, 'poisonres')) { amt = 0; note = ' (Dwarven Resilience — no poison damage)'; }
    else if (type === 'fire' && hasTrait(state, 'fireres')) { amt = Math.floor(amt / 2); note = ' (Fire Resistance — half damage)'; }
    state.pc.hp = Math.max(0, state.pc.hp - amt);
    combatLog(state, `💥 You take ${amt} ${type} damage${note}. HP ${state.pc.hp}/${state.pc.maxHp}.`);
    return amt;
  }

  function damageToEnemy(state, amount, label) {
    state.combat.enemy.hp = Math.max(0, state.combat.enemy.hp - amount);
    combatLog(state, `🗡️ ${label} — ${amount} damage. ${state.combat.enemy.name}: ${state.combat.enemy.hp}/${state.combat.enemy.maxHp} HP.`);
    return amount;
  }

  function enemyTurn(state) {
    const c = state.combat;
    const die = d20();
    const total = die + c.enemy.atk;
    const disadv = c.dodgeNext;
    c.dodgeNext = false;
    let hit = total >= state.pc.ac;
    if (disadv && die !== 20) {
      const die2 = d20();
      const total2 = die2 + c.enemy.atk;
      hit = Math.min(total, total2) >= state.pc.ac;
      combatLog(state, `🛡️ ${c.enemy.name} attacks (dodging: ${die} & ${die2}).`);
    } else {
      combatLog(state, `${c.enemy.name} attacks: d20 ${die} + ${c.enemy.atk} = ${total} vs your AC ${state.pc.ac}.`);
    }
    if (die === 1) { combatLog(state, `✨ It misses badly.`); return; }
    if (hit) damageToPC(state, rollDice(c.enemy.dmg).total, c.enemy.dmgType);
    else combatLog(state, `✨ It misses.`);
  }

  function checkCombatEnd(state) {
    const c = state.combat;
    if (!c || c.over) return;
    if (c.enemy.hp <= 0) { c.over = true; c.won = true; combatLog(state, `🏆 ${c.enemy.name} is defeated!`); }
    else if (state.pc.hp <= 0) { c.over = true; c.won = false; combatLog(state, `🌑 You fall...`); }
  }

  /** Player attacks. opts: { bonus:[], label, extraDamage, advantage } */
  function playerAttack(state, opts = {}) {
    const c = state.combat;
    const pc = state.pc;
    const atkAbility = pc.atkAbility;
    const bonus = [{ label: shortOf(atkAbility), amount: mod(pc.abilities[atkAbility]) },
                   { label: 'Proficiency', amount: profBonus(state) }];
    (opts.bonus || []).forEach(b => bonus.push(b));
    let atkTotal = bonus.reduce((s, b) => s + b.amount, 0);
    let adv = opts.advantage ? 'adv' : null;
    if (c.advantageNext) { adv = 'adv'; c.advantageNext = false; }

    let die;
    if (adv === 'adv') { const a = d20(), b = d20(); die = Math.max(a, b); }
    else die = d20();

    const total = die + atkTotal;
    const hit = die === 20 || (die !== 1 && total >= c.enemy.ac);
    combatLog(state, `${opts.label || 'You attack'}: d20 ${die} ${signed(atkTotal)} = ${total} vs AC ${c.enemy.ac}${adv ? ' (advantage)' : ''}.`);

    if (hit) {
      let dmg = rollDice(pc.damage.split(' ')[0]).total + mod(pc.abilities[pc.dmgAbility]);
      let detail = `${pc.weapon} (${pc.damage} ${signed(mod(pc.abilities[pc.dmgAbility]))})`;
      if (pc.sneak && !c.sneakUsed) {
        const s = rollDice(pc.sneak).total;
        dmg += s; c.sneakUsed = true;
        detail += ` + Sneak Attack ${s}`;
      }
      if (c.markActive) {
        const hm = rollDice('1d6').total; dmg += hm; detail += ` + Hunter's Mark ${hm}`;
      }
      if (opts.extraDamage) { dmg += opts.extraDamage; detail += ` + ${opts.extraLabel || 'bonus'} ${opts.extraDamage}`; }
      if (die === 20) { const crit = rollDice(pc.damage.split(' ')[0]).total; dmg += crit; detail += ` + CRIT ${crit}`; }
      dmg = Math.max(1, dmg);
      damageToEnemy(state, dmg, detail);
    } else {
      combatLog(state, `💨 Miss.`);
    }
    checkCombatEnd(state);
    return hit;
  }

  /* ---------------- character ---------------- */
  function finishCharacter(state, build) {
    const sp = speciesDef(build.species);
    const cl = classDef(build.class);
    const bg = backgroundDef(build.background);

    const abilities = {};
    ABILITY_KEYS.forEach(k => { abilities[k] = (build.assignment[k] || 8) + (sp.bonus[k] || 0); });

    const conMod = mod(abilities.con);
    const maxHp = cl.hitDie + conMod;

    const dexMod = mod(abilities.dex);
    let ac = cl.acBase + dexMod;
    if (cl.id === 'cleric') ac = cl.acBase;   // chain mail ignores Dexterity

    const pc = {
      name: build.name.trim() || 'Wren',
      pronouns: build.pronouns || 'she/her',
      species: sp.id, speciesName: sp.name,
      class: cl.id, className: cl.name,
      background: bg.id, backgroundName: bg.name,
      hairStyle: build.hairStyle, hairColor: build.hairColor,
      eyeColor: build.eyeColor, skin: build.skin,
      mark: build.mark, outfit: build.outfit, trinket: build.trinket,
      abilities,
      hairColorName: (build.hairColor && build.hairColor.name) || '',
      hairColorHex: (build.hairColor && build.hairColor.hex) || '#6b3f21',
      eyeColorName: (build.eyeColor && build.eyeColor.name) || '',
      eyeColorHex: (build.eyeColor && build.eyeColor.hex) || '#8a6a34',
      skinName: (build.skin && build.skin.name) || '',
      skinHex: (build.skin && build.skin.hex) || '#eec7a6',
      // class picks + the two free skills your origin grants
      skills: [...new Set([...(build.skills || []), ...bg.skills])],
      expertise: build.expertise || null,
      hp: maxHp, maxHp, ac,
      atkAbility: cl.atkAbility, dmgAbility: cl.dmgAbility,
      weapon: cl.weapon, damage: cl.damage, sneak: cl.sneak || null,
      cantrips: cl.cantrips || [],
      equipment: [...cl.equipment, ...bg.gear.map(g => g.name)],
      spellSlots: cl.id === 'wizard' ? 2 : (cl.id === 'bard' ? 2 : 0)
    };
    state.pc = pc;
    state.level = 1;
    state.flags.pieScore = 0;
    return pc;
  }

  function levelUp(state) {
    if (state.level >= 2) return null;
    const cl = classDef(state.pc.class);
    const gained = d(1, cl.hitDie) + mod(state.pc.abilities.con);
    state.level = 2;
    state.pc.maxHp += Math.max(1, gained);
    state.pc.hp = state.pc.maxHp;
    return { hp: Math.max(1, gained), feature: cl.level2 };
  }

  /* ---------------- flags & tracking ---------------- */
  const setFlag = (state, k, v = true) => { state.flags[k] = v; };
  const flag = (state, k) => state.flags[k];
  const hasClue = (state, id) => state.clues.includes(id);
  function addClue(state, id) { if (!state.clues.includes(id)) { state.clues.push(id); return true; } return false; }
  function addItem(state, id) { if (!state.items.includes(id)) { state.items.push(id); return true; } return false; }
  const hasItem = (state, id) => state.items.includes(id);

  function setIngredient(state, id, quality) {
    state.ingredients[id] = Math.max(state.ingredients[id] || 0, quality);
  }
  function ingredientCount(state) { return Object.keys(state.ingredients).length; }

  /* ---------------- the pie ---------------- */
  /**
   * Pie quality 0-10: ingredient quality (0-6) + baking rolls (0-3) + help (0-1)
   */
  function pieQuality(state) {
    let q = 0;
    const quals = D.INGREDIENTS.map(i => state.ingredients[i.id] || 0);
    q += quals.reduce((a, b) => a + b, 0);            // 5 ingredients × max 2 = 10 → capped below
    q = Math.min(6, q);
    q += Math.min(3, state.flags.bakingScore || 0);
    if (state.flags.grammyHelp) q += 1;
    return Math.max(0, Math.min(10, q));
  }

  function resolveEnding(state) {
    const q = pieQuality(state);
    const allClues = state.clues.length >= 5;
    const recipe = state.flags.hasRecipe;
    const pip = state.flags.pipFriend;

    if (allClues && pip && recipe && q >= 8) return 'true';
    if (recipe && q >= 6) return 'heir';
    if (q >= 7) return 'champion';
    if (q >= 4) return 'humble';
    if (recipe) return 'recipe';
    return 'burnt';
  }

  /* ---------------- persistence (endings gallery) ---------------- */
  function loadUnlocked(store) {
    try {
      const raw = store.getItem('applePieEndings');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveUnlocked(store, list) {
    try { store.setItem('applePieEndings', JSON.stringify(list)); } catch (e) { /* private mode */ }
  }

  return {
    d, d20, rollDice, parseDice,
    newState, finishCharacter, levelUp,
    roll, describeRoll, modifierFor, advantageFor,
    mod, signed, profBonus, shortOf, skillName, skillDef,
    speciesDef, classDef, backgroundDef, markDef, outfitDef,
    hasTrait, hasFeature, isProficient, isExpert, spent, spend,
    startCombat, playerAttack, enemyTurn, combatLog, damageToPC, damageToEnemy, checkCombatEnd,
    setFlag, flag, addClue, hasClue, addItem, hasItem,
    setIngredient, ingredientCount, pieQuality, resolveEnding,
    loadUnlocked, saveUnlocked, ABILITY_KEYS
  };
});
