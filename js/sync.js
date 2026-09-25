/* =========================================================
   sync.js — Firebase Realtime Database mirror.

   The game never depends on this file. localStorage stays the
   source of truth; Firebase is a mirror that also lets a second
   device watch the run live. If Firebase is missing, misconfigured
   or unreachable, every call here is a silent no-op.

   Schema (built to hold more campaigns later):

     players/{playerId}/
       profile/            { name, createdAt, lastSeenAt }
       campaigns/{campaignId}/
         progress/         current save, mirrors localStorage
         character/        who she built
         endings/{id}/     { unlockedAt, runId }
         runs/{runId}/     one row per completed playthrough
         feed/{pushId}/    live dice rolls + choices, capped
   ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DNDSync = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STATE = {
    configured: false,
    online: false,
    error: null,
    db: null,
    playerId: null,
    campaignId: null,
    feedLimit: 200,
    runId: null,
    runStartedAt: null,
    feedWrites: 0,
    listeners: []
  };

  /* ---------- status reporting (the little pill in the corner) ---------- */
  function emit() {
    const s = status();
    STATE.listeners.forEach(fn => { try { fn(s); } catch (e) { /* ignore */ } });
  }
  function onStatus(fn) {
    STATE.listeners.push(fn);
    fn(status());
    return () => { STATE.listeners = STATE.listeners.filter(f => f !== fn); };
  }
  function status() {
    if (!STATE.configured) return { state: 'off', label: 'Cloud off', detail: 'No Firebase config' };
    if (STATE.error) return { state: 'error', label: 'Cloud error', detail: STATE.error };
    return STATE.online
      ? { state: 'online', label: 'Cloud synced', detail: `players/${STATE.playerId}/campaigns/${STATE.campaignId}` }
      : { state: 'connecting', label: 'Connecting…', detail: '' };
  }
  const isOn = () => STATE.configured && !STATE.error;

  /* ---------- RTDB refuses undefined and some key characters ---------- */
  function clean(v, depth = 0) {
    if (depth > 8) return null;
    if (v === undefined || typeof v === 'function') return null;
    if (v === null) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v !== 'object') return v;
    if (Array.isArray(v)) {
      const out = v.map(x => clean(x, depth + 1)).filter(x => x !== null);
      return out.length ? out : null;
    }
    const out = {};
    let any = false;
    Object.keys(v).forEach(k => {
      const key = k.replace(/[.#$\[\]\/]/g, '_');
      const val = clean(v[k], depth + 1);
      if (val !== null) { out[key] = val; any = true; }
    });
    return any ? out : null;
  }

  const base = () => `players/${STATE.playerId}/campaigns/${STATE.campaignId}`;
  const ref = p => STATE.db.ref(p);
  const TS = () => (STATE.db.app && STATE.db.app.firebase && STATE.db.app.firebase.database
    ? STATE.db.app.firebase.database.ServerValue.TIMESTAMP
    : Date.now());

  /* Swallow write failures — the game must never break because of the cloud. */
  function write(path, value) {
    if (!isOn()) return Promise.resolve(false);
    const c = clean(value);
    if (c === null) return Promise.resolve(false);
    try {
      return ref(path).set(c).then(() => true).catch(e => { STATE.error = String(e.message || e); emit(); return false; });
    } catch (e) { STATE.error = String(e.message || e); emit(); return Promise.resolve(false); }
  }
  /* Merge-write: unlike set(), update() does not delete sibling children,
     so progress and progress/scene can be written independently. */
  function merge(path, value) {
    if (!isOn()) return Promise.resolve(false);
    const c = clean(value);
    if (c === null) return Promise.resolve(false);
    try {
      return ref(path).update(c).then(() => true).catch(e => { STATE.error = String(e.message || e); emit(); return false; });
    } catch (e) { STATE.error = String(e.message || e); emit(); return Promise.resolve(false); }
  }

  /* =========================================================
     init — safe to call with anything. Never throws.
     ========================================================= */
  function init(opts) {
    const o = opts || {};
    const cfg = o.config || (typeof window !== 'undefined' && window.FIREBASE_CONFIG) || null;
    const firebase = o.firebase || (typeof window !== 'undefined' && window.firebase) || null;

    STATE.playerId = o.playerId || (typeof window !== 'undefined' && window.PLAYER_ID) || 'her';
    STATE.campaignId = o.campaignId || (typeof window !== 'undefined' && window.CAMPAIGN_ID) || 'apple-pie';
    STATE.feedLimit = o.feedLimit || (typeof window !== 'undefined' && window.FEED_LIMIT) || 200;

    if (!cfg || !firebase || !cfg.apiKey || /PASTE_ME/.test(String(cfg.apiKey)) || /PASTE_ME/.test(String(cfg.databaseURL || ''))) {
      STATE.configured = false;
      emit();
      return Promise.resolve(status());
    }
    if (!firebase.database) {
      STATE.configured = false;
      STATE.error = 'firebase-database-compat.js did not load';
      emit();
      return Promise.resolve(status());
    }

    try {
      const app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
      STATE.db = o.database || firebase.database(app);
    } catch (e) {
      STATE.configured = false;
      STATE.error = String(e.message || e);
      emit();
      return Promise.resolve(status());
    }

    STATE.configured = true;
    STATE.error = null;
    STATE.feedWrites = 0;

    // .info/connected is the canonical connection flag
    try {
      ref('.info/connected').on('value', snap => {
        STATE.online = snap.val() === true;
        emit();
      });
    } catch (e) { /* offline is fine */ }

    STATE.runId = 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    STATE.runStartedAt = Date.now();

    return write(base() + '/progress', { runId: STATE.runId, startedAt: Date.now() })
      .then(() => write(`players/${STATE.playerId}/profile`, { lastSeenAt: Date.now() }))
      .then(() => status());
  }

  /* =========================================================
     game -> cloud
     ========================================================= */
  function saveProgress(snap) {
    if (!isOn()) return Promise.resolve(false);
    // merge so we never clobber progress/scene written by saveStoryPosition
    return merge(base() + '/progress', Object.assign({}, snap, { updatedAt: Date.now() }));
  }

  function saveCharacter(pc, level) {
    if (!isOn()) return Promise.resolve(false);
    return write(base() + '/character', {
      name: pc.name, pronouns: pc.pronouns,
      species: pc.speciesName, class: pc.className, background: pc.backgroundName,
      level: level, hp: pc.hp, maxHp: pc.maxHp, ac: pc.ac,
      abilities: pc.abilities, skills: pc.skills, expertise: pc.expertise,
      weapon: pc.weapon, damage: pc.damage,
      look: {
        hairStyle: pc.hairStyle, hair: pc.hairColorName, eyes: pc.eyeColorName,
        skin: pc.skinName, hairHex: pc.hairColorHex, eyeHex: pc.eyeColorHex, skinHex: pc.skinHex,
        mark: pc.mark, outfit: pc.outfit, trinket: pc.trinket
      },
      updatedAt: Date.now()
    });
  }

  function saveStoryPosition(nodeId, chapter, title) {
    if (!isOn()) return Promise.resolve(false);
    return write(base() + '/progress/scene', { node: nodeId, chapter: chapter || '', title: title || '', at: Date.now() });
  }

  function unlockEnding(id, info) {
    if (!isOn()) return Promise.resolve(false);
    return write(`${base()}/endings/${id}`, Object.assign({ unlockedAt: Date.now(), runId: STATE.runId }, info || {}));
  }

  function endRun(info) {
    if (!isOn()) return Promise.resolve(false);
    return write(`${base()}/runs/${STATE.runId}`, Object.assign({
      startedAt: STATE.runStartedAt,
      endedAt: Date.now()
    }, info || {}));
  }

  /* ---------- the live feed ---------- */
  function feed(kind, text, detail) {
    if (!isOn()) return Promise.resolve(false);
    const entry = clean({ ts: Date.now(), kind, text, detail: detail || null });
    if (!entry) return Promise.resolve(false);
    STATE.feedWrites++;
    let p;
    try { p = ref(base() + '/feed').push(entry).then(() => true); }
    catch (e) { STATE.error = String(e.message || e); emit(); return Promise.resolve(false); }
    // prune every 20 entries so the feed cannot grow forever
    if (STATE.feedWrites % 20 === 0) p = p.then(pruneFeed);
    return p.catch(e => { STATE.error = String(e.message || e); emit(); return false; });
  }

  function pruneFeed() {
    if (!isOn()) return Promise.resolve(false);
    const q = ref(base() + '/feed').orderByKey();
    return q.once('value').then(snap => {
      const keys = Object.keys(snap.val() || {});
      const excess = keys.length - STATE.feedLimit;
      if (excess <= 0) return true;
      const doomed = keys.slice(0, excess);
      const upd = {};
      doomed.forEach(k => { upd[k] = null; });
      return ref(base() + '/feed').update(upd).then(() => true);
    }).catch(() => false);
  }

  /* =========================================================
     cloud -> game  (restore a run started on another device)
     ========================================================= */
  function loadProgress() {
    if (!isOn()) return Promise.resolve(null);
    return ref(base() + '/progress').once('value')
      .then(snap => snap.val() || null)
      .catch(() => null);
  }
  function loadEndings() {
    if (!isOn()) return Promise.resolve([]);
    return ref(base() + '/endings').once('value')
      .then(snap => Object.keys(snap.val() || {}))
      .catch(() => []);
  }

  /* =========================================================
     watch page helpers
     ========================================================= */
  function watch(kind, cb) {
    if (!isOn()) return () => {};
    const path = kind === 'all' ? base() : `${base()}/${kind}`;
    const r = ref(path);
    const handler = snap => cb(snap.val(), snap.key);
    r.on('value', handler);
    return () => { try { r.off('value', handler); } catch (e) { /* ignore */ } };
  }

  function watchProfile(cb) {
    if (!isOn()) return () => {};
    const r = ref(`players/${STATE.playerId}/profile`);
    const handler = snap => cb(snap.val());
    r.on('value', handler);
    return () => { try { r.off('value', handler); } catch (e) { /* ignore */ } };
  }

  function watchCampaigns(cb) {
    if (!isOn()) return () => {};
    const r = ref(`players/${STATE.playerId}/campaigns`);
    const handler = snap => cb(Object.keys(snap.val() || {}));
    r.on('value', handler);
    return () => { try { r.off('value', handler); } catch (e) { /* ignore */ } };
  }

  function clearCloud() {
    if (!isOn()) return Promise.resolve(false);
    return ref(base()).remove().then(() => true).catch(() => false);
  }

  return {
    init, onStatus, status, isOn,
    saveProgress, saveCharacter, saveStoryPosition, unlockEnding, endRun,
    feed, pruneFeed, loadProgress, loadEndings,
    watch, watchProfile, watchCampaigns, clearCloud,
    clean,                      // exported for tests
    _state: STATE               // exported for tests
  };
});
