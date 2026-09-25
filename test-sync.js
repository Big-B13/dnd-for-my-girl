/* =========================================================
   test-sync.js — exercises the Firebase sync layer against an
   in-memory fake of the Realtime Database API.
   Run:  node test-sync.js
   ========================================================= */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
const section = t => console.log('\n' + t);

const root = __dirname;
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

/* ---------------- in-memory Realtime Database fake ---------------- */
function makeFakeFirebase(opts) {
  opts = opts || {};
  const tree = {};
  const calls = [];
  let pushCounter = 0;
  let failWrites = !!opts.failWrites;

  const segs = p => String(p).split('/').filter(Boolean);
  const getAt = p => segs(p).reduce((n, k) => (n == null ? undefined : n[k]), tree);
  const setAt = (p, v) => {
    const s = segs(p);
    let n = tree;
    for (let i = 0; i < s.length - 1; i++) { if (n[s[i]] == null || typeof n[s[i]] !== 'object') n[s[i]] = {}; n = n[s[i]]; }
    if (v === null) delete n[s[s.length - 1]]; else n[s[s.length - 1]] = v;
  };
  const snap = v => ({ val: () => (v === undefined ? null : v), key: 'fake' });

  function ref(p) {
    const self = {
      path: p,
      set(v) {
        calls.push({ op: 'set', path: p });
        if (failWrites) return Promise.reject(new Error('permission_denied'));
        setAt(p, v); return Promise.resolve();
      },
      update(o) {
        calls.push({ op: 'update', path: p });
        if (failWrites) return Promise.reject(new Error('permission_denied'));
        const cur = getAt(p) || {};
        Object.keys(o).forEach(k => { if (o[k] === null) delete cur[k]; else cur[k] = o[k]; });
        setAt(p, cur); return Promise.resolve();
      },
      push(v) {
        pushCounter++;
        const key = 'k' + String(pushCounter).padStart(8, '0');   // sorts like a push id
        calls.push({ op: 'push', path: p + '/' + key });
        if (failWrites) return Promise.reject(new Error('unavailable'));
        setAt(p + '/' + key, v);
        return Promise.resolve({ key });
      },
      remove() { calls.push({ op: 'remove', path: p }); setAt(p, null); return Promise.resolve(); },
      on(ev, cb) {
        if (p === '.info/connected') { cb(snap(true)); return cb; }
        cb(snap(getAt(p)));
        return cb;
      },
      off() {},
      once() { return Promise.resolve(snap(getAt(p))); },
      orderByKey() { return self; },
      limitToFirst() { return self; }
    };
    return self;
  }

  const app = { name: '[DEFAULT]' };
  const firebase = {
    apps: [app],
    app: () => app,
    initializeApp: () => app,
    database: () => ({
      ref,
      app: { firebase },
      goOnline() {}, goOffline() {}
    })
  };
  firebase.database.ServerValue = { TIMESTAMP: { '.sv': 'timestamp' } };
  app.firebase = firebase;

  return { firebase, tree, calls, get: getAt, fail: v => { failWrites = v; } };
}

const GOOD_CONFIG = {
  apiKey: 'AIzaTest', authDomain: 'test.firebaseapp.com', projectId: 'test',
  storageBucket: 'test.appspot.com', messagingSenderId: '1', appId: '1:1:web:1',
  databaseURL: 'https://test-default-rtdb.firebaseio.com'
};

section('0 · database.rules.json is valid rules language');
(function () {
  const raw = fs.readFileSync(path.join(__dirname, 'database.rules.json'), 'utf8');
  let rules;
  try { rules = JSON.parse(raw); ok(true, 'rules parse as JSON'); }
  catch (e) { ok(false, 'rules parse as JSON: ' + e.message); return; }
  ok(!/\bundefined\b/.test(raw), 'no `undefined` token (it does not exist in the rules language)');
  ok(!/\bconsole\b|\bwindow\b|\bdocument\b/.test(raw), 'no JS globals in rules');
  const vals = [];
  (function walk(n) { if (typeof n === 'string') vals.push(n); else if (n && typeof n === 'object') Object.values(n).forEach(walk); })(rules);
  vals.filter(v => v.includes('val().length')).forEach(v =>
    ok(v.includes('isString()'), `val().length only alongside isString(): "${v.slice(0, 40)}…"`));
  ok(!/numChildren/.test(raw), 'no invented numChildren() in rules');
})();

/* =========================================================
   1 · sync layer against the fake
   ========================================================= */
section('1 · sync layer against a fake Realtime Database');

const Sync = require('./js/sync.js');
const fake = makeFakeFirebase();

(async function () {
  await Sync.init({
    config: GOOD_CONFIG, firebase: fake.firebase,
    playerId: 'her', campaignId: 'apple-pie', feedLimit: 5
  });
  ok(Sync.isOn() === true, 'sync reports itself on with a real config');
  ok(Sync.status().state === 'online', 'status is online');
  ok(Sync.status().detail === 'players/her/campaigns/apple-pie', 'status names the exact path');

  await Sync.saveCharacter({
    name: 'Marigold', pronouns: 'she/her', speciesName: 'Dwarf', className: 'Rogue',
    backgroundName: 'Criminal', hp: 11, maxHp: 11, ac: 15,
    abilities: { str: 12, dex: 17 }, skills: ['stealth', 'sleight'], expertise: 'stealth',
    weapon: 'shortsword', damage: '1d6',
    hairStyle: 'Long braid', hairColorName: 'Copper', eyeColorName: 'Hazel', skinName: 'Fair',
    mark: 'freckles', outfit: 'cloak', trinket: 'spoon'
  }, 2);

  const ch = fake.get('players/her/campaigns/apple-pie/character');
  ok(ch && ch.name === 'Marigold', 'character written to the right path');
  ok(ch.level === 2, 'character level stored');
  ok(ch.abilities.dex === 17, 'ability scores stored');
  ok(ch.skills.length === 2, 'skills stored');
  ok(ch.look.hair === 'Copper' && ch.look.mark === 'freckles', 'appearance stored');

  await Sync.saveProgress({ node: 'bake_dough', pieQuality: 7, clues: ['tracks', 'ladder'], hp: 11, maxHp: 11 });
  const pr = fake.get('players/her/campaigns/apple-pie/progress');
  ok(pr.node === 'bake_dough', 'progress node stored');
  ok(pr.pieQuality === 7, 'pie quality stored');
  ok(typeof pr.updatedAt === 'number', 'progress carries a timestamp');

  await Sync.saveStoryPosition('bake_dough', 'Act III', 'One · The Pastry');
  const sc = fake.get('players/her/campaigns/apple-pie/progress/scene');
  ok(sc && sc.title === 'One · The Pastry', 'scene position stored');

  // a later progress write must merge, not wipe the scene written above
  await Sync.saveProgress({ node: 'bake_filling', pieQuality: 8 });
  const pr2 = fake.get('players/her/campaigns/apple-pie/progress');
  ok(pr2.node === 'bake_filling', 'later progress write lands');
  ok(pr2.scene && pr2.scene.title === 'One · The Pastry', 'a later progress write does not clobber progress/scene');

  await Sync.unlockEnding('heir', { pieQuality: 8 });
  const en = fake.get('players/her/campaigns/apple-pie/endings/heir');
  ok(en && en.pieQuality === 8, 'ending stored with detail');
  ok(typeof en.runId === 'string' && en.runId.length > 3, 'ending tied to a run id');

  await Sync.endRun({ ending: 'heir', pieQuality: 8, stats: { checks: 20, passed: 14 } });
  const runs = fake.get('players/her/campaigns/apple-pie/runs');
  const runKeys = Object.keys(runs || {});
  ok(runKeys.length === 1, `one run recorded (${runKeys.length})`);
  ok(runs[runKeys[0]].ending === 'heir', 'run stores the ending');
  ok(runs[runKeys[0]].stats.checks === 20, 'run stores the dice stats');

  /* ---- the live feed, and its cap ---- */
  section('2 · the live feed is capped');
  for (let i = 0; i < 25; i++) await Sync.feed('roll', 'roll ' + i, { d20: i });
  await Sync.pruneFeed();
  const feed = fake.get('players/her/campaigns/apple-pie/feed') || {};
  const keys = Object.keys(feed);
  ok(keys.length <= 5, `feed pruned to the limit of 5 (got ${keys.length})`);
  ok(feed[keys[keys.length - 1]].text === 'roll 24', 'the newest entry survived pruning');
  ok(!keys.some(k => feed[k].text === 'roll 0'), 'the oldest entry was dropped');

  /* ---- undefined / NaN must never reach RTDB ---- */
  section('3 · nothing unwritable reaches the database');
  await Sync.saveProgress({ okValue: 1, badValue: undefined, fn: function () {}, nan: NaN, deep: { a: undefined, b: 2 } });
  const p2 = fake.get('players/her/campaigns/apple-pie/progress');
  ok(!('badValue' in p2), 'undefined stripped');
  ok(!('fn' in p2), 'functions stripped');
  ok(!('nan' in p2), 'NaN stripped');
  ok(p2.deep.b === 2 && !('a' in p2.deep), 'nested objects cleaned');

  const cleaned = Sync.clean({ 'a.b$c': 1 });
  ok(Object.keys(cleaned)[0] === 'a_b_c', 'illegal RTDB key characters sanitised');

  /* ---- write failures must be swallowed ---- */
  section('4 · a denied write cannot break the game');
  fake.fail(true);
  const r1 = await Sync.saveProgress({ a: 1 });
  const r2 = await Sync.feed('roll', 'x');
  const r3 = await Sync.unlockEnding('true');
  ok(r1 === false && r2 === false && r3 === false, 'failed writes resolve false instead of throwing');
  ok(Sync.status().state === 'error', 'the status pill can show the failure');
  ok(/permission_denied/.test(Sync.status().detail), `the error is surfaced ("${Sync.status().detail}")`);
  fake.fail(false);

  /* ---- unconfigured means fully offline, not broken ---- */
  section('5 · unconfigured = clean offline mode');
  const S2 = require('./js/sync.js');
  const st = await S2.init({ config: { apiKey: 'PASTE_ME', databaseURL: 'PASTE_ME' }, firebase: null });
  ok(st.state === 'off', 'placeholder config is detected as unconfigured');
  ok(S2.isOn() === false, 'isOn() false');
  ok((await S2.saveProgress({ a: 1 })) === false, 'writes no-op');
  ok((await S2.loadEndings()).length === 0, 'reads return empty');
  const st3 = await S2.init({ config: null, firebase: null });
  ok(st3.state === 'off', 'a missing config object is also handled');

  /* ---- multi-campaign schema ---- */
  section('6 · the schema holds more than one campaign');
  const f2 = makeFakeFirebase();
  const S3 = require('./js/sync.js');
  await S3.init({ config: GOOD_CONFIG, firebase: f2.firebase, playerId: 'her', campaignId: 'apple-pie' });
  await S3.saveProgress({ node: 'arrival' });
  await S3.init({ config: GOOD_CONFIG, firebase: f2.firebase, playerId: 'her', campaignId: 'the-dragon-of-delft' });
  await S3.saveProgress({ node: 'intro' });
  const camps = Object.keys(f2.get('players/her/campaigns'));
  ok(camps.length === 2, `two campaigns coexist under one player (${camps.join(', ')})`);
  ok(f2.get('players/her/campaigns/apple-pie/progress').node === 'arrival', 'the first campaign is untouched');
  ok(f2.get('players/her/campaigns/the-dragon-of-delft/progress').node === 'intro', 'the second has its own slot');

  /* =========================================================
     7 · the real UI, wired to the fake, in a real DOM
     ========================================================= */
  section('7 · the game itself syncs while you play');
  const dom = new JSDOM(read('index.html'), { runScripts: 'outside-only', url: 'http://localhost/' });
  const w = dom.window;
  w.scrollTo = () => {};
  const f3 = makeFakeFirebase();
  // load the scripts, THEN set the config globals the way a real deploy would
  ['js/sync.js', 'js/data.js', 'js/engine.js', 'js/story.js', 'js/ui.js']
    .forEach(f => w.eval(read(f)));
  w.firebase = f3.firebase;
  w.FIREBASE_CONFIG = GOOD_CONFIG;
  w.PLAYER_ID = 'her'; w.CAMPAIGN_ID = 'apple-pie'; w.FEED_LIMIT = 200;
  w.eval('window.DND.start()');
  await new Promise(r => setTimeout(r, 5));

  const d = w.document;
  const qa = s => Array.from(d.querySelectorAll(s));
  const click = n => n.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  const nav = () => click(qa('.nav .btn')[qa('.nav .btn').length - 1]);
  const choices = () => qa('#story .choices .choice');

  ok(!!d.querySelector('#cloudStatus'), 'the cloud status pill is on the page');
  await new Promise(r => setTimeout(r, 5));
  ok(/synced|Cloud/i.test(d.querySelector('#cloudStatus').textContent),
     `the pill reports a state ("${d.querySelector('#cloudStatus').textContent.trim()}")`);

  // build a character and play a few screens
  click(qa('.nav .btn').find(b => /New character/.test(b.textContent)));
  const inp = d.querySelector('input'); inp.value = 'Synced Hero';
  inp.dispatchEvent(new w.Event('input', { bubbles: true }));
  nav();
  click(qa('#story .card')[3]); nav();
  click(qa('#story .card')[0]); nav();
  click(qa('#story .card')[0]); nav();
  nav();
  for (let i = 0; i < 6; i++) click(qa('.ability-row')[i].querySelector('.slot-btns .slot'));
  nav();
  click(qa('#story .card')[0]); click(qa('#story .card')[1]); nav(); nav();

  for (let i = 0; i < 12; i++) {
    const cs = choices();
    if (!cs.length) break;
    click(cs[0]);
  }
  await new Promise(r => setTimeout(r, 10));

  const cloud = f3.get('players/her/campaigns/apple-pie');
  ok(!!cloud, 'a campaign node was created in the database');
  ok(cloud.character && cloud.character.name === 'Synced Hero', 'her character reached the cloud');
  ok(cloud.progress && cloud.progress.scene, 'her position in the story reached the cloud');
  const feedKeys = Object.keys((cloud.feed) || {});
  ok(feedKeys.length >= 5, `the live feed captured ${feedKeys.length} events`);
  const kinds = new Set(feedKeys.map(k => cloud.feed[k].kind));
  ok(kinds.has('choice'), 'the feed recorded her choices');
  ok(kinds.has('roll') || kinds.has('scene'), 'the feed recorded rolls or scene changes');
  ok(typeof cloud.progress.pieQuality === 'number', 'pie quality is mirrored live');

  /* ---- and the game still works with NO firebase at all ---- */
  section('8 · the game is identical with no Firebase present');
  const dom2 = new JSDOM(read('index.html'), { runScripts: 'outside-only', url: 'http://localhost/' });
  const w2 = dom2.window; w2.scrollTo = () => {};
  const errs = [];
  w2.console.error = (...a) => errs.push(a.join(' '));
  w2.console.warn = (...a) => errs.push(a.join(' '));
  ['js/data.js', 'js/engine.js', 'js/story.js', 'js/ui.js'].forEach(f => w2.eval(read(f)));
  w2.eval('window.DND.start()');
  const d2 = w2.document;
  ok(d2.querySelector('#story h1').textContent.includes('Country Apple Pie'), 'title screen renders with no sync.js at all');
  const qa2 = s => Array.from(d2.querySelectorAll(s));
  const click2 = n => n.dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));
  click2(qa2('.nav .btn').find(b => /New character/.test(b.textContent)));
  const i2 = d2.querySelector('input'); i2.value = 'Offline Hero';
  i2.dispatchEvent(new w2.Event('input', { bubbles: true }));
  const nav2 = () => click2(qa2('.nav .btn')[qa2('.nav .btn').length - 1]);
  nav2(); click2(qa2('#story .card')[0]); nav2(); click2(qa2('#story .card')[0]); nav2();
  click2(qa2('#story .card')[0]); nav2(); nav2();
  for (let i = 0; i < 6; i++) click2(qa2('.ability-row')[i].querySelector('.slot-btns .slot'));
  nav2(); click2(qa2('#story .card')[0]); click2(qa2('#story .card')[1]); nav2(); nav2();
  for (let i = 0; i < 10; i++) { const cs = qa2('#story .choices .choice'); if (!cs.length) break; click2(cs[0]); }
  ok(errs.length === 0, `no console errors offline (${errs.length})`);
  ok(d2.querySelector('#story').textContent.length > 200, 'the story plays normally offline');

  /* =========================================================
     9 · the watch page renders what she wrote
     ========================================================= */
  section('9 · the watch page renders her live run');
  const wdom = new JSDOM(read('watch.html'), { runScripts: 'outside-only', url: 'http://localhost/' });
  const ww = wdom.window;
  ['js/sync.js', 'js/data.js'].forEach(f => ww.eval(read(f)));
  ww.firebase = f3.firebase;
  ww.FIREBASE_CONFIG = GOOD_CONFIG;
  ww.PLAYER_ID = 'her'; ww.CAMPAIGN_ID = 'apple-pie'; ww.FEED_LIMIT = 200;
  // pull the one inline (src-less) script out of watch.html
  const watchSrc = read('watch.html');
  const blocks = [...watchSrc.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  ok(blocks.length === 1, `watch.html has exactly one inline script (${blocks.length})`);
  ww.eval(blocks[0]);
  await new Promise(r => setTimeout(r, 20));

  const wd = ww.document;
  ok(/Watching/.test(wd.querySelector('#wTitle').textContent), `watch page header ("${wd.querySelector('#wTitle').textContent}")`);
  ok(wd.querySelector('#wChar').textContent.includes('Synced Hero'), 'watch page shows her character name');
  ok(/\d+ \/ 10/.test(wd.querySelector('#wProg').textContent), 'watch page shows live pie quality');
  const fItems = wd.querySelectorAll('#wFeed .f-item');
  ok(fItems.length >= 5, `watch page renders ${fItems.length} live feed entries`);
  ok(/connected/.test(wd.querySelector('#wCloud').textContent), 'watch page reports the connection');

  console.log('\n' + '─'.repeat(52));
  console.log(fails === 0 ? `✅ SYNC PASS — ${checks} assertions` : `❌ ${fails} FAILED of ${checks}`);
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.log('\nTHREW: ' + e.stack); process.exit(1); });
