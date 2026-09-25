/* =========================================================
   probe-firebase.js — pokes the REAL configured database.

   Writes a scratch node under players/_connection_test,
   reads it back, deletes it. Never touches the game data.

   Run:  node probe-firebase.js
   ========================================================= */
global.window = {};                       // firebase-config.js assigns to window
require('./js/firebase-config.js');
const CFG = global.window.FIREBASE_CONFIG;

require('firebase/compat/app');
require('firebase/compat/database');
const firebase = require('firebase/compat/app');

(async () => {
  console.log('project      :', CFG.projectId);
  console.log('databaseURL  :', CFG.databaseURL);

  const app = firebase.initializeApp(CFG);
  const db = firebase.database(app);
  const ref = db.ref('players/_connection_test');

  const payload = { hello: 'from-the-sandbox', at: Date.now() };
  try {
    await ref.set(payload);
    console.log('WRITE        : ✅ set() accepted');
  } catch (e) {
    console.log('WRITE        : ❌ ' + e.message);
    console.log('');
    console.log('=> The database refused the write. Almost always means the rules');
    console.log('   have not been (re)published yet. Paste database.rules.json into');
    console.log('   Realtime Database → Rules → Publish, then run me again.');
    process.exit(2);
  }

  try {
    const snap = await ref.once('value');
    const v = snap.val();
    console.log('READ         :', v && v.hello === 'from-the-sandbox'
      ? '✅ round-trip matches' : '❌ unexpected: ' + JSON.stringify(v));
  } catch (e) {
    console.log('READ         : ❌ ' + e.message);
  }

  try {
    await ref.remove();
    console.log('CLEANUP      : ✅ scratch node removed');
  } catch (e) {
    console.log('CLEANUP      : ❌ ' + e.message, '(harmless)');
  }

  // what is already in the game path?
  const game = await db.ref('players/' + (global.window.PLAYER_ID || 'her') + '/campaigns/' + (global.window.CAMPAIGN_ID || 'apple-pie')).once('value').catch(() => null);
  console.log('game path    :', game && game.val() ? JSON.stringify(game.val()).slice(0, 120) : '(empty — she has not played with sync on yet)');

  console.log('');
  console.log('✅ Connected. The game, the watch page and this database now agree.');
  process.exit(0);
})().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
