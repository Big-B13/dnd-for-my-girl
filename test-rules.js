/* =========================================================
   test-rules.js — loads database.rules.json into the REAL
   Firebase RTDB emulator and proves the rules compile and
   accept exactly what the game writes (and reject what they
   should). Requires: npx firebase emulators:start --only database

   Run:  node test-rules.js
   ========================================================= */
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');

let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };

(async () => {
  const env = await initializeTestEnvironment({
    projectId: 'demo-apple-pie',
    database: {
      rules: fs.readFileSync(path.join(__dirname, 'database.rules.json'), 'utf8'),
      host: '127.0.0.1',
      port: 9000
    }
  });
  ok(true, 'the rules file COMPILED — the emulator accepted it');

  const ctx = env.unauthenticatedContext();   // the game runs signed-out
  const db = () => ctx.database();
  const B = 'players/her/campaigns/apple-pie';

  console.log('\n-- writes the game makes must SUCCEED --');
  await assertSucceeds(db().ref(B + '/progress').update({
    node: 'bake_dough', level: 2, pieQuality: 7, hp: 11, maxHp: 11, ac: 15,
    screens: 40, updatedAt: Date.now(), startedAt: Date.now(), runId: 'r1abc',
    clues: ['tracks', 'ladder'], ingredients: { apples: 2, flour: 1 },
    stats: { checks: 20, passed: 14, crits: 2, fumbles: 1 }
  }));
  ok(true, 'progress update accepted');

  await assertSucceeds(db().ref(B + '/progress/scene').set({
    node: 'bake_dough', chapter: 'Act III', title: 'One · The Pastry', at: Date.now()
  }));
  ok(true, 'progress/scene accepted alongside progress');

  await assertSucceeds(db().ref(B + '/character').set({
    name: 'Marigold', pronouns: 'she/her', species: 'Dwarf', class: 'Rogue',
    background: 'Criminal', level: 2, hp: 11, maxHp: 11, ac: 15,
    weapon: 'shortsword', damage: '1d6', expertise: 'stealth',
    skills: ['stealth', 'sleight', 'deception', 'perception'],
    abilities: { str: 10, dex: 15, con: 14, int: 8, wis: 12, cha: 13 },
    look: { hairStyle: 'Long braid', hair: 'Copper', eyes: 'Hazel', skin: 'Fair', mark: 'freckles' }
  }));
  ok(true, 'character accepted');

  await assertSucceeds(db().ref(B + '/endings/heir').set({
    unlockedAt: Date.now(), runId: 'r1abc', pieQuality: 8, clues: 6, character: 'Marigold'
  }));
  ok(true, 'ending accepted');

  await assertSucceeds(db().ref(B + '/runs/r1abc').set({
    startedAt: Date.now(), endedAt: Date.now(), ending: 'heir', pieQuality: 8,
    clues: 6, level: 2, species: 'Dwarf', class: 'Rogue', background: 'Criminal',
    stats: { checks: 20, passed: 14, crits: 2, fumbles: 1 }
  }));
  ok(true, 'run row accepted');

  await assertSucceeds(db().ref(B + '/feed').push({
    ts: Date.now(), kind: 'roll', text: 'Perception d20 = 14 · modifier +3 = 17 vs DC 13 → SUCCESS',
    detail: { check: 'Perception', d20: 14, mod: 3, total: 17, dc: 13, pass: true }
  }));
  ok(true, 'feed roll accepted');

  await assertSucceeds(db().ref('players/her/profile').set({ lastSeenAt: Date.now() }));
  ok(true, 'profile accepted');

  await assertSucceeds(db().ref(B + '/progress').get());
  ok(true, 'reads are allowed');

  console.log('\n-- malformed writes must be REJECTED --');
  await assertFails(db().ref(B + '/progress/pieQuality').set(99));
  ok(true, 'pieQuality above 10 rejected');
  await assertFails(db().ref(B + '/progress/level').set(0));
  ok(true, 'level 0 rejected');
  await assertFails(db().ref(B + '/progress/node').set('x'.repeat(65)));
  ok(true, '65-char node string rejected');
  await assertFails(db().ref(B + '/feed').push({ ts: Date.now(), kind: 'roll', text: 'y'.repeat(401) }));
  ok(true, '401-char feed text rejected');
  await assertFails(db().ref(B + '/endings/' + 'e'.repeat(33)).set({ unlockedAt: Date.now(), runId: 'r1' }));
  ok(true, '33-char ending id rejected');
  await assertFails(db().ref(B + '/character/name').set(123));
  ok(true, 'non-string character name rejected');
  await assertFails(db().ref('somewhere/else').set({ hello: 1 }));
  ok(true, 'writes outside players/ rejected');
  await assertFails(db().ref(B + '/runs/r1/ending').set(123));
  ok(true, 'non-string ending rejected');

  await env.cleanup();
  console.log('\n' + '─'.repeat(52));
  console.log(fails === 0 ? `✅ RULES PASS — ${checks} assertions against the live emulator` : `❌ ${fails} FAILED of ${checks}`);
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.log('THREW:', e.message); process.exit(1); });
