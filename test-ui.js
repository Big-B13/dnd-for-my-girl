/* =========================================================
   test-ui.js — drives the real UI in a simulated browser (jsdom)
   and clicks all the way from the title screen to an ending.
   Run:  node test-ui.js
   ========================================================= */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
const section = t => console.log('\n' + t);

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = ['js/data.js', 'js/engine.js', 'js/story.js', 'js/ui.js']
  .map(f => fs.readFileSync(path.join(root, f), 'utf8'));

function boot() {
  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    url: 'http://localhost/',
    pretendToBeVisual: true
  });
  const w = dom.window;
  // jsdom lacks these; the game only uses them cosmetically
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  files.forEach((src, i) => {
    try { w.eval(src); }
    catch (e) { throw new Error(`${files[i]} failed to evaluate: ${e.message}`); }
  });
  w.eval('window.DND.start()');
  return { dom, w, d: w.document };
}

const q = (d, s) => d.querySelector(s);
const qa = (d, s) => Array.from(d.querySelectorAll(s));
const click = n => { if (!n) throw new Error('nothing to click'); n.dispatchEvent(new n.ownerDocument.defaultView.MouseEvent('click', { bubbles: true })); };
const choices = d => qa(d, '#story .choices .choice');
const storyText = d => q(d, '#story').textContent.replace(/\s+/g, ' ').trim();

/* ---------------- 1. boot ---------------- */
section('1 · the page boots');
let B;
try {
  B = boot();
  ok(true, 'index.html + all four scripts evaluate without error');
} catch (e) {
  console.log('  ✗ ' + e.message);
  process.exit(1);
}
const { w, d } = B;
ok(storyText(d).includes('Country Apple Pie'), 'title screen renders the campaign name');
ok(storyText(d).includes('Endings discovered'), 'ending gallery renders on the title screen');
ok(qa(d, '.gal').length === 6, 'all six endings listed as locked');
ok(q(d, '#sheetInner').textContent.includes('No character yet'), 'sheet placeholder shown before creation');

/* ---------------- 2. character creation ---------------- */
section('2 · character creation, click by click');
const navBtn = () => qa(d, '.nav .btn');
click(navBtn().find(b => /New character/.test(b.textContent)));
ok(storyText(d).includes('Who Are You?'), 'step 1 is the name step');
ok(qa(d, '#story .card').length === 6, 'six trinkets offered');

// Continue must be disabled with no name
let next = qa(d, '.nav .btn').pop();
ok(next.disabled === true, 'cannot continue without a name');

const nameInput = q(d, '#story input[type=text]');
nameInput.value = 'Marigold Thistle';
nameInput.dispatchEvent(new w.Event('input', { bubbles: true }));
click(qa(d, '#story .card')[3]);                       // pick a trinket
next = qa(d, '.nav .btn').pop();
ok(next.disabled === false, 'can continue once a name is entered');
click(next);

ok(storyText(d).includes('Species'), 'step 2 is species');
ok(qa(d, '#story .card').length === 6, 'six species offered');
click(qa(d, '#story .card')[3]);                       // dwarf
click(qa(d, '.nav .btn').pop());

ok(storyText(d).includes('Class'), 'step 3 is class');
ok(qa(d, '#story .card').length === 6, 'six classes offered');
click(qa(d, '#story .card')[1]);                       // rogue
click(qa(d, '.nav .btn').pop());

ok(storyText(d).includes('Origin'), 'step 4 is origin');
ok(qa(d, '#story .card').length === 7, 'seven origins offered');
click(qa(d, '#story .card')[1]);                       // criminal
click(qa(d, '.nav .btn').pop());

ok(storyText(d).includes('How You Look'), 'step 5 is appearance');
ok(qa(d, '#story svg[aria-label="character portrait"]').length === 1, 'live portrait renders');
const swatches = qa(d, '.sw');
ok(swatches.length === 8 + 8 + 8, `24 colour swatches (hair/eyes/skin) — got ${swatches.length}`);
click(swatches[5]);  click(swatches[12]); click(swatches[20]);   // change colours
click(qa(d, '#story .card')[4]);                        // a distinguishing mark
click(qa(d, '.nav .btn').pop());

ok(storyText(d).includes('Ability Scores'), 'step 6 is ability scores');
next = qa(d, '.nav .btn').pop();
ok(next.disabled === true, 'cannot continue until all six scores are placed');
// place one number per row
for (let i = 0; i < 6; i++) click(qa(d, '.ability-row')[i].querySelector('.slot-btns .slot'));
ok(qa(d, '.ability-row').every(r => r.querySelector('.slot.sel')), 'all six rows hold a placed score');
// and taking one back returns it to the pool
click(qa(d, '.ability-row')[0].querySelector('.slot.sel'));
ok(storyText(d).includes('Still to place: 15'), 'clicking a placed score returns it to the pool');
click(qa(d, '.ability-row')[0].querySelector('.slot-btns .slot'));
next = qa(d, '.nav .btn').pop();
ok(next.disabled === false, 'can continue once all six are placed');
click(next);

ok(storyText(d).includes('Skills'), 'step 7 is skills');
ok(storyText(d).includes('Deception'), 'criminal origin grants Deception for free');
ok(storyText(d).includes('Expertise'), 'rogue is offered Expertise');
next = qa(d, '.nav .btn').pop();
ok(next.disabled === true, 'cannot continue before picking skills + expertise');
const tap = i => qa(d, '#story .card')[i].dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
tap(0); tap(1);                                  // pick two rogue skills
next = qa(d, '.nav .btn').pop();
ok(next.disabled === true, 'still blocked until Expertise is chosen');
tap(0);                                          // toggle one off...
ok(qa(d, '#story .card.sel').length === 1, 'clicking a chosen skill deselects it');
tap(2);                                          // ...and pick a different one
ok(qa(d, '#story .card.sel').length === 2, 'two skills selected again');
const expertiseCards = qa(d, '#story .card').filter(c => /\+4 instead of \+2/.test(c.textContent));
ok(expertiseCards.length === 2, `Expertise offered for each chosen skill (${expertiseCards.length})`);
click(expertiseCards[0]);
next = qa(d, '.nav .btn').pop();
ok(next.disabled === false, 'can continue once skills and Expertise are set');
click(next);

ok(storyText(d).includes('Your Character'), 'step 8 is the review');
ok(storyText(d).includes('Marigold Thistle'), 'review shows her name');
ok(storyText(d).includes('Dwarf Rogue'), 'review shows species + class');
const sheetNow = q(d, '#sheetInner').textContent;
ok(sheetNow.includes('Marigold Thistle'), 'character sheet populated during creation');
ok(/Stealth/.test(sheetNow), 'sheet lists skills');

click(qa(d, '.nav .btn').pop());

/* ---------------- 3. the game plays ---------------- */
section('3 · playing the campaign');
ok(storyText(d).includes('Road to Bramblewick'), 'the prologue starts');
ok(q(d, '#log').hidden === false, 'dice log is visible in play');

let guard = 0, endingReached = null, rollsSeen = 0, combats = 0;
while (guard++ < 600) {
  const cs = choices(d);
  if (!cs.length) throw new Error('dead end: no choices on screen at ' + storyText(d).slice(0, 80));
  const before = qa(d, '.dice-box').length;

  // prefer interesting options, otherwise take the first
  let pick = cs.find(b => /Act I finale|Act II|Act III|Act IV|Epilogue|Begin|Skill challenge/i.test(b.textContent))
          || cs.find(b => /Clue|Ingredient|Continue/i.test(b.textContent))
          || cs[Math.floor(Math.random() * cs.length)];
  const wasCombat = !!q(d, '.combat h4');
  click(pick);
  if (q(d, '.combat h4') && !wasCombat) combats++;
  const boxes = qa(d, '.dice-box').length;
  if (boxes > before) rollsSeen++;

  const head = q(d, '#story h1');
  const chapter = q(d, '#story .chapter');
  if (chapter && /Epilogue/.test(chapter.textContent)) { endingReached = head.textContent; break; }
}

ok(endingReached !== null, `reached an ending ("${endingReached}") in ${guard} screens`);
ok(rollsSeen > 3, `real dice were rolled on screen (${rollsSeen} dice panels shown)`);
ok(qa(d, '.log-line').length > 3, `dice log recorded ${qa(d, '.log-line').length} rolls with full math`);
ok(/d20 =/.test(q(d, '.log-line').textContent), 'log lines show the actual d20 and modifier math');

/* ---------------- 4. the sheet reflects the story ---------------- */
section('4 · the character sheet tracked the adventure');
const sheet = q(d, '#sheetInner').textContent;
ok(/Level 2/.test(sheet), 'she levelled up to 2');
ok(/Clues/.test(sheet), 'clues are listed on the sheet');
ok(/For the pie/.test(sheet), 'gathered ingredients are listed');
ok(/Quality so far/.test(sheet), 'pie quality is shown');
ok(/Endings found: 1/.test(sheet), 'the ending was recorded in the gallery');

/* ---------------- 5. ending unlocks permanently + restart works ---------------- */
section('5 · endings persist and the game restarts');
const gal = qa(d, '.gal').filter(g => !/🔒/.test(g.textContent));
ok(gal.length === 1, `exactly one ending unlocked (${gal.length})`);
ok(JSON.parse(w.localStorage.getItem('applePieEndings')).length === 1, 'ending written to localStorage');
ok(!!w.localStorage.getItem('applePieSave'), 'game autosaved');

click(choices(d).find(b => /Play again/.test(b.textContent)) || navBtn().find(b => /Play again/.test(b.textContent)));
ok(storyText(d).includes('Country Apple Pie'), 'back at the title screen');
const gal2 = qa(d, '.gal').filter(g => !/🔒/.test(g.textContent));
ok(gal2.length === 1, 'the unlocked ending is still shown after restart');
ok(!navBtn().some(b => /Continue/.test(b.textContent)), 'starting over cleared the old save');
ok(w.localStorage.getItem('applePieSave') === null, 'no save left after a deliberate restart');
ok(JSON.parse(w.localStorage.getItem('applePieEndings')).length === 1, 'but the endings gallery survives a restart');

// a brand new run must not be contaminated by the old one
click(navBtn().find(b => /New character/.test(b.textContent)));
ok(q(d, '#sheetInner').textContent.includes('No character yet'), 'fresh run resets the character sheet');

/* ---------------- 5b. closing the tab mid-adventure and coming back ---------------- */
section('5b · closing the tab mid-adventure and coming back');
(function () {
  // we are already on the name step of the fresh run; play a few screens
  const inp = q(d, '#story input[type=text]');
  inp.value = 'Resume Test'; inp.dispatchEvent(new w.Event('input', { bubbles: true }));
  const adv = () => click(qa(d, '.nav .btn').pop());
  adv();                                     // name -> species
  click(qa(d, '#story .card')[2]); adv();    // pick a species -> class
  click(qa(d, '#story .card')[0]); adv();    // pick a class   -> origin
  click(qa(d, '#story .card')[0]); adv();    // pick an origin -> look
  adv();                                     // look -> abilities
  for (let i = 0; i < 6; i++) click(qa(d, '.ability-row')[i].querySelector('.slot-btns .slot'));
  click(qa(d, '.nav .btn').pop());                                // skills step
  qa(d, '#story .card')[0].dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  qa(d, '#story .card')[1].dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  click(qa(d, '.nav .btn').pop());
  click(qa(d, '.nav .btn').pop());                                // review -> begin
  click(choices(d)[0]); click(choices(d)[0]);                     // a couple of story screens

  const saved = w.localStorage.getItem('applePieSave');
  ok(!!saved, 'progress was autosaved mid-adventure');
  const savedNode = JSON.parse(saved).node;
  const savedName = JSON.parse(saved).pc.name;

  // "close the tab": brand-new DOM, same origin, same storage
  const B2 = boot();
  B2.w.localStorage.setItem('applePieSave', saved);
  B2.w.eval('window.DND.start()');
  const d2 = B2.d;
  const nav2 = qa(d2, '.nav .btn');
  ok(nav2.some(b => /Continue your adventure/.test(b.textContent)), 'a Continue button is offered on return');
  click(nav2.find(b => /Continue your adventure/.test(b.textContent)));
  const st2 = JSON.parse(B2.w.localStorage.getItem('applePieSave'));
  ok(st2.node === savedNode, `resumed on the same screen (${savedNode})`);
  ok(B2.d.querySelector('#sheetInner').textContent.includes(savedName), `her character came back (${savedName})`);
  ok(/Level 1/.test(B2.d.querySelector('#sheetInner').textContent), 'level restored');
})();

/* ---------------- 6. combat is survivable for a fragile build ---------------- */
section('6 · a level-1 wizard can always get out of the cellar');
(function () {
  const E = w.eval('window.DNDEngine');
  const Dd = w.eval('window.DNDData');
  const S = w.eval('window.DNDStory');
  const st = E.newState();
  E.finishCharacter(st, {
    species: 'human', class: 'wizard', background: 'hermit', name: 'Fragile', pronouns: 'she/her',
    hairStyle: 'x', hairColor: Dd.HAIR_COLORS[0], eyeColor: Dd.EYE_COLORS[0], skin: Dd.SKIN_TONES[0],
    mark: 'none', outfit: 'cloak', trinket: 'spoon',
    assignment: { str: 8, dex: 14, con: 12, int: 15, wis: 10, cha: 13 },
    skills: ['arcana', 'history', 'medicine', 'nature'], expertise: null
  });
  ok(st.pc.maxHp <= 8, `a level-1 wizard has ${st.pc.maxHp} HP — genuinely fragile`);

  const node = S.getNode('cellar_guardian');
  let attempts = 0, escaped = false;
  while (attempts++ < 12 && !escaped) {
    E.startCombat(st, node.enemy);
    let rounds = 0;
    while (!st.combat.over && rounds++ < 80) {
      const extras = node.combatExtras(st);
      if (extras.length) extras[Math.floor(Math.random() * extras.length)].run(st);
      else E.playerAttack(st, {});
      if (st.combat.over) break;
      E.enemyTurn(st); E.checkCombatEnd(st);
      if (st.pc.hp <= 0) break;
    }
    if (st.combat.won) escaped = true;
    st.combat = null;
    st.pc.hp = Math.max(1, Math.floor(st.pc.maxHp * 0.6));
    st.flags.guardianTries = (st.flags.guardianTries || 0) + 1;
  }
  ok(escaped, `the fragile wizard gets through the cellar in ${attempts} attempt(s)`);
  ok(attempts <= 6, `and it never takes more than a handful of tries (${attempts})`);
})();

console.log('\n' + '─'.repeat(52));
console.log(fails === 0 ? `✅ UI PASS — ${checks} assertions` : `❌ ${fails} FAILED of ${checks}`);
process.exit(fails === 0 ? 0 : 1);
