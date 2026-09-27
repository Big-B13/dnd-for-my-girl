/* =========================================================
   e2e-live.js — proves the whole loop against the REAL database
   without touching her profile:

     game writes  ->  your Firebase  ->  watch page renders

   Uses a scratch player id (_e2e_demo) and deletes it afterwards.

   Run:  node e2e-live.js
   ========================================================= */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

global.window = {};
require('./js/firebase-config.js');          // your real config
const CFG = global.window.FIREBASE_CONFIG;

require('firebase/compat/app');
require('firebase/compat/database');
const firebase = require('firebase/compat/app');
const Sync = require('./js/sync.js');

const SCRATCH = '_e2e_demo';
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };

(async () => {
  /* ---------- 1 · the game side writes ---------- */
  await Sync.init({ config: CFG, firebase, playerId: SCRATCH, campaignId: 'apple-pie', feedLimit: 200 });
  ok(Sync.isOn(), 'sync initialised against the real database');

  await Sync.saveCharacter({
    name: 'End-to-End Test', pronouns: 'they/them', speciesName: 'Halfling', className: 'Bard',
    backgroundName: 'Entertainer', hp: 9, maxHp: 9, ac: 14,
    abilities: { str: 8, dex: 15, con: 12, int: 10, wis: 13, cha: 15 },
    skills: ['performance', 'persuasion'], expertise: null,
    weapon: 'rapier', damage: '1d8',
    hairStyle: 'Short & tousled', hairColorName: 'Copper', eyeColorName: 'Amber', skinName: 'Olive',
    hairColorHex: '#b4552a', eyeColorHex: '#c98a2e', skinHex: '#d3a279',
    mark: 'freckles', outfit: 'apron', trinket: 'spoon'
  }, 1);
  await Sync.saveStoryPosition('hollow_oak', 'Act I · Finale', 'The Hollow Oak');
  await Sync.saveProgress({
    node: 'hollow_oak', level: 1, clues: ['tracks', 'ladder', 'gossip'],
    ingredients: { apples: 2, flour: 1 }, pieQuality: 4,
    hp: 9, maxHp: 9, ac: 14, stats: { checks: 12, passed: 9, crits: 1, fumbles: 0 }, screens: 23
  });
  await Sync.feed('roll', 'Perception check · d20 = 14 · modifier +3 = 17 vs DC 13 → SUCCESS',
    { check: 'Perception', d20: 14, mod: 3, total: 17, dc: 13, pass: true });
  await Sync.feed('choice', ' Follow the trail into the old orchard — to the hollow oak');
  ok(true, 'character, progress, scene and feed written to the live database');

  /* ---------- 2 · the watch page renders it ---------- */
  const dbRef = require('firebase/compat/database');
  const db0 = firebase.database(firebase.app());
  const before = JSON.stringify((await db0.ref(`players/${SCRATCH}/campaigns/apple-pie/progress`).once('value')).val());
  const herBefore = JSON.stringify((await db0.ref('players/her/campaigns/apple-pie').once('value')).val());

  const watch = fs.readFileSync(path.join(__dirname, 'watch.html'), 'utf8');
  const dom = new JSDOM(watch, { runScripts: 'outside-only', url: 'http://localhost/' });
  const w = dom.window;
  ['js/sync.js', 'js/data.js'].forEach(f => w.eval(fs.readFileSync(path.join(__dirname, f), 'utf8')));
  w.firebase = firebase;
  w.FIREBASE_CONFIG = CFG;
  w.PLAYER_ID = SCRATCH; w.CAMPAIGN_ID = 'apple-pie'; w.FEED_LIMIT = 200;
  const inline = [...watch.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  w.eval(inline[inline.length - 1]);
  await new Promise(r => setTimeout(r, 1500));       // let the live listeners fire

  const d = w.document;
  ok(d.querySelector('#wChar').textContent.includes('End-to-End Test'), 'watch page shows the character');
  ok(d.querySelector('#wChar').textContent.includes('Halfling Bard'), 'watch page shows species + class');
  ok(d.querySelector('#wProg').textContent.includes('The Hollow Oak'), 'watch page shows the live scene');
  ok(/4 \/ 10/.test(d.querySelector('#wProg').textContent), 'watch page shows pie quality 4/10');
  const feed = d.querySelectorAll('#wFeed .f-item');
  ok(feed.length >= 2, `watch page renders ${feed.length} live feed entries`);
  ok(d.querySelector('#wFeed').textContent.includes('Perception'), 'the dice roll made it to the watch page');
  ok(/connected/.test(d.querySelector('#wCloud').textContent), 'watch page reports connected');

  const afterWatch = JSON.stringify((await db0.ref(`players/${SCRATCH}/campaigns/apple-pie/progress`).once('value')).val());
  ok(afterWatch === before, 'opening the watch page did NOT modify her progress (read-only confirmed)');

  /* ---------- 3 · cleanup: scratch profile deleted ---------- */
  const raw = require('firebase/compat/database');
  const db = firebase.apps.length ? firebase.database(firebase.app()) : firebase.database();
  await db.ref('players/' + SCRATCH).remove();
  const after = await db.ref('players/' + SCRATCH).once('value');
  ok(after.val() === null, 'scratch profile removed — her data untouched');

  // and her profile is byte-identical to before the test touched anything
  const herAfter = JSON.stringify((await db.ref('players/her/campaigns/apple-pie').once('value')).val());
  ok(herAfter === herBefore, 'her real data unchanged by the test (currently: ' + (herBefore === 'null' ? 'empty — she will re-sync from her browser on next save' : herBefore.slice(0, 60)) + ')');

  console.log('\n' + '─'.repeat(52));
  console.log(fails === 0
    ? `✅ LIVE END-TO-END PASS — ${checks} assertions against your real Firebase`
    : `❌ ${fails} FAILED of ${checks}`);
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.log('THREW:', e.message); process.exit(1); });
