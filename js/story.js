/* =========================================================
   story.js — "Grammy's Country Apple Pie"
   Faithful to the one-shot by Jennifer Adcock (Wildmount edit
   by Johnny Johnson). Every choice moves a real number.
   ========================================================= */
(function (root, factory) {
  const D = (typeof module === 'object' && module.exports) ? require('./data.js') : root.DNDData;
  const E = (typeof module === 'object' && module.exports) ? require('./engine.js') : root.DNDEngine;
  if (typeof module === 'object' && module.exports) module.exports = factory(D, E);
  else root.DNDStory = factory(D, E);
})(typeof self !== 'undefined' ? self : this, function (D, E) {
  'use strict';

  /* ---------- tiny block DSL so nodes stay readable ---------- */
  const P = t => ({ type: 'p', text: t });
  const W = t => ({ type: 'whisper', text: t });
  const SAID = (who, text) => ({ type: 'said', who, text });
  const H = t => ({ type: 'h', text: t });
  const ROLLNOTE = () => ({ type: 'rollnote' });
  const COMBATVIEW = () => ({ type: 'combat' });
  const STARS = n => ({ type: 'stars', n });
  const GALLERY = () => ({ type: 'gallery' });

  /* All combat here is avoidable. Every fight offers a DC 13
     Charisma/Wisdom talk-down, per the module's own rules. */
  const talkDown = (s, line) => ({
    label: '🕊️ Talk it down (DC 13 Cha)',
    run: () => {
      const r = E.roll(s, { ability: 'cha', dc: 13, label: 'De-escalate' });
      s.lastRoll = r;
      const c = s.combat;
      if (r.pass) { c.over = true; c.fled = true; c.won = true; E.combatLog(s, '🕊️ ' + (line || 'The situation cools. Nobody dies today.')); }
      else E.combatLog(s, '🗯️ It is not listening. Yet.');
    }
  });

  const hurt = (s, dmg, type) => {
    const before = s.pc.hp;
    if (type === 'poison' && E.hasTrait(s, 'poisonres')) { E.combatLog(s, '☠️ The poison finds no purchase (Dwarven Resilience).'); return; }
    s.pc.hp = Math.max(0, s.pc.hp - dmg);
    void before;
  };

  /* =========================================================
     NODES
     ========================================================= */
  const NODES = {

    /* ================= PROLOGUE — THE TOWER ================= */
    arrival: {
      chapter: 'Prologue', title: 'The Wizard’s Study',
      onEnter: s => { E.setFlag(s, 'peaceful', s.flags.peaceful !== false); },
      body: () => [
        P('You were distrustful at first, when the imp appeared at your door to let you into the old wizard’s tower. But inside, you have seen enough benign wonders to settle your nerves: a teapot that pours by itself, a cat that is probably a bookshelf. The imp — who answers, reluctantly, to <strong>Crimp</strong> — carries your pack the whole way up without being asked and is clearly prepared for this to go unremarked, as it always has.'),
        P('At the top of a long and winding staircase is the study. Bookshelves line the walls. A desk is covered with bubbling potions, mysterious trinkets, and ink-stained scraps of parchment. Behind it, an elderly gnome with long wispy white hair and beard, twinkling eyes, and a large hooked nose very slowly stands up, introduces himself as <strong>Tyndareus the Green</strong>, and pours you a cup of tea.'),
        SAID('Tyndareus', 'When I was a boy, I tasted the most wonderful treat in all the Material Plane. I remember it like it was yesterday. <em>Grammy’s Country Apple Pies…</em> The bakery was near my village, and you could smell the spices all day and night, no matter where you were in town.'),
        SAID('Tyndareus', 'Alas, when I went away to wizard college, the place was overrun by the undead, and no one has dared go back in since. I would taste those heavenly pies just once more before I depart for the Celestial Plane. If I give you a map to the bakery — can you go in, and find me Grammy’s secret recipe?')
      ],
      choices: s => {
        const c = [];
        if (!s.flags.askedReward) c.push({ label: '“What’s in it for us?”', tag: 'Reward', next: 'reward' });
        if (!s.flags.askedLore) c.push({ label: '“Tell me more about this bakery.”', tag: 'Lore', next: 'lore' });
        if (!s.flags.crimpKind) c.push({ label: 'Thank the imp properly. Nobody thanks the help.', tag: 'Kindness', next: 'crimp_kind' });
        c.push({ label: '“We’ll bring you the recipe.”', tag: 'Accept', primary: true, next: 'travel' });
        c.push({ label: 'Decline. This is not your problem.', tag: 'Walk away', next: 'decline' });
        return c;
      }
    },

    crimp_kind: {
      chapter: 'Prologue', title: 'The Imp Nobody Thanks',
      onEnter: s => { E.setFlag(s, 'crimpKind'); E.befriend(s, 'crimp', 2); E.remember(s, 'You thanked Crimp the imp by name. Crimp will not forget this.'); },
      body: () => [
        P('You turn to the imp — small, leathery, four hundred years of carrying other people’s tea — and thank them properly, and ask their name.'),
        SAID('Crimp', '…Crimp.'),
        P('They say it like a word they have not been allowed to use in a very long time. Behind the desk, Tyndareus does not notice, which appears to be normal.'),
        W('Crimp straightens up one inch. It is the whole of a victory, and you are the only witness.')
      ],
      choices: () => [{ label: 'Back to the wizard’s offer', next: 'arrival' }]
    },

    reward: {
      chapter: 'Prologue', title: 'The Price of Pie',
      onEnter: s => { E.setFlag(s, 'askedReward'); },
      body: () => [
        SAID('Tyndareus', 'I will pay a large sum of gold at the end, and anything of value you might find in the bakery, you may keep.'),
        W('He leans forward, and his eyes twinkle just a little more.'),
        SAID('Tyndareus', 'And if you can find a <em>peaceful</em> way of getting the recipe — there will be a bonus award. All I really want is the recipe.')
      ],
      choices: () => [{ label: 'Back to the wizard’s offer', next: 'arrival' }]
    },

    lore: {
      chapter: 'Prologue', title: 'What He Remembers',
      onEnter: s => { E.setFlag(s, 'askedLore'); },
      body: () => [
        SAID('Tyndareus', 'The bakery stands at the edge of a ruined village, four days’ ride or two by boat. There is an orchard at the back. There were dryads in that orchard, once — Grammy chatted with them every day.'),
        SAID('Tyndareus', 'The undead that took the village are gone now, or so I am told. Something else lives in my bakery now. Something smaller. Louder, and greener.'),
        W('He does not know the recipe himself. He only knows what it smelled like.')
      ],
      choices: () => [{ label: 'Back to the wizard’s offer', next: 'arrival' }]
    },

    decline: {
      chapter: 'Prologue', title: 'Not Your Problem',
      body: () => [
        P('You set the tea down, untouched, and take the stairs. The imp watches you go with an expression you will be remembering for weeks.'),
        P('Some jobs are not worth the road. Some cravings are not yours to feed.'),
        W('Somewhere above, an old gnome puts the kettle back on the shelf, and looks out of the window for a very long time.')
      ],
      choices: () => [
        { label: 'Change your mind — take the job after all', next: 'travel' },
        { label: 'Keep walking', tag: 'Ending', next: 'ending_quit' }
      ]
    },

    /* ================= THE ROAD ================= */
    travel: {
      chapter: 'Chapter 1', title: 'The Road to the Bakery',
      body: () => [
        P('The map is good, the weather is fair, and Trostenwald sells anything from a ration of trail food to a full adventurer’s kit. The bakery is four days’ ride — or two by boat.'),
        W('The road is quieter than it should be. Scattered along it, here and there, are the rotted shapes of zombies that something already killed.')
      ],
      choices: () => [
        { label: 'Ride the trail (four days)', tag: 'Risk', next: 'trail' },
        { label: 'Take the boat (two days)', tag: 'Calm', next: 'boat' }
      ]
    },

    trail: {
      chapter: 'Chapter 1', title: 'Four Days of Pines',
      onEnter: s => { s.flags.roadRoll = E.d(6); },
      body: s => [
        P('You ride. The second night, the pines go quiet in a way that is not wind.'),
        s.flags.roadRoll >= 5
          ? P('Boots, off the path. Four goblins on patrol, crossing the trail ahead of you, arguing about something that smells like food.')
          : P('A deer watches you from a cutline. A scatter of squirrels adjudicates your saddlebags. Nothing else.')
      ],
      choices: s => s.flags.roadRoll >= 5 ? [
        { label: 'Slip past in the dark', tag: 'Stealth', check: { skill: 'stealth', dc: 12, success: 'trail_past', failure: 'trail_caught' } },
        { label: 'Let them pass, then ride on', next: 'trail_past' },
        { label: 'Ambush them', tag: 'Fight', next: 'trail_fight' }
      ] : [
        { label: 'Ride on', next: 'bakery_gate' }
      ]
    },

    trail_past: {
      chapter: 'Chapter 1', title: 'Unseen',
      body: () => [
        P('The goblins’ argument carries down the trail — something about a chief, something about <em>the pie ration</em> — and then the pines take the sound away.'),
        W('Goblins. In a bakery. You file that away.')
      ],
      choices: () => [{ label: 'On to the bakery', next: 'bakery_gate' }]
    },

    trail_caught: {
      chapter: 'Chapter 1', title: 'A Whistle in the Pines',
      body: () => [
        P('A twig, of all things. The patrol whirls, sees you, and for one long moment nobody on either side of the trail knows what to do.'),
        P('Then the smallest goblin shrugs, entirely without hostility, and the four of them melt into the dark. They were not going to fight you. They were going to <em>tell the chief</em>.')
      ],
      choices: () => [{ label: 'Ride on, faster', next: 'bakery_gate' }]
    },

    trail_fight: {
      chapter: 'Chapter 1', title: 'Ambush on the Trail',
      kind: 'combat', enemy: 'goblin',
      onEnter: s => { E.setFlag(s, 'peaceful', false); },
      body: () => [
        ROLLNOTE(),
        P('It is over quickly, and it is not glorious. The survivors run, and you understand — too late, perhaps — that they were only patrol, only hungry, only going home.')
      ],
      resolution: { win: 'trail_after', lose: 'trail_hurt', flee: 'trail_past' },
      combatExtras: s => [talkDown(s, 'You hold up empty hands and a ration of bread. The goblins take the bread and the moment, and go.')],
      choices: () => []
    },

    trail_after: {
      chapter: 'Chapter 1', title: 'What the Road Keeps',
      onEnter: s => { E.killed(s, 1, 'a goblin on the road. Word of you is riding ahead.'); },
      body: () => [
        P('You camp with your back to a log and a fire you do not enjoy. Somewhere behind you, the pines keep their own ledger.'),
        W('Word of you is riding ahead, faster than you can.')
      ],
      choices: () => [{ label: 'On to the bakery', next: 'bakery_gate' }]
    },

    trail_hurt: {
      chapter: 'Chapter 1', title: 'Beaten to the Ground',
      onEnter: s => { if (s.pc.hp <= 0) s.pc.hp = 1; },
      body: () => [
        P('You wake face-down in the needles with your ribs ringing. The goblins took nothing. They did not want your things. They wanted you to <em>stop</em>.')
      ],
      choices: () => [{ label: 'Limp on to the bakery', next: 'bakery_gate' }]
    },

    boat: {
      chapter: 'Chapter 1', title: 'Two Days of Water',
      body: () => [
        P('The boat is slow and the water is grey and kind. You sleep eleven hours the first night and watch a coney judge your boots the second morning.'),
        P('On the second evening the ferryman points you off at a rotten jetty, takes his silver, and does not ask why anyone would want to go <em>there</em>.')
      ],
      choices: () => [{ label: 'Walk the last mile', next: 'bakery_gate' }]
    },

    /* ================= OUTSIDE THE BAKERY ================= */
    bakery_gate: {
      chapter: 'Chapter 2', title: '1 — The Entrance',
      body: s => {
        const b = [
          P('As you approach the large stone building, the road turns into a gravel path surrounded by an overgrown lawn, leading toward a large set of wooden double doors. The fragrance of ripening apples is thick in the air from the old apple orchard in the back.'),
          P('There is one massive apple tree near the path to the front doors. As the wind whistles through the long grasses, you notice that the bark of the tree looks almost like an ancient, wizened face.'),
          W('The double doors are loosely barred from inside. The goblins mostly use the back.')
        ];
        if (s.flags.macFriend) b.push(P('Mac’s branches incline toward you, almost imperceptibly, the way an old man nods.'));
        if (E.hasClue(s, 'dock_hint')) b.push(W('The dryads’ advice stands: the loading dock is the quiet way in.'));
        return b;
      },
      choices: s => {
        const c = [];
        if (!s.flags.metMac) c.push({ label: 'Approach the great apple tree', tag: 'Mac', next: 'mac_talk' });
        c.push({ label: 'Circle back to the apple orchard', tag: 'Orchard', next: 'orchard' });
        if (!s.flags.doneWaste) c.push({ label: 'Inspect the waste pile round the side', tag: 'Waste', next: 'waste' });
        if (!s.flags.inside) c.push({ label: 'Break the bar on the front doors', tag: 'DC 14 Str', check: { ability: 'str', dc: 14, success: 'shop', failure: 'doors_fail' } });
        c.push({ label: 'Slip around to the loading dock', tag: 'Stealth', next: 'dock' });
        return c;
      }
    },

    doors_fail: {
      chapter: 'Chapter 2', title: 'Rot and Iron',
      onEnter: s => { E.noise(s, 2, 'You battered the front doors. Everything inside heard it.'); },
      body: () => [
        P('The wood is rotting but the bar inside holds, and the whole doorframe groans like a complaint. Somewhere inside, something small shouts a question in Goblin.'),
        W('Loud is a choice. There are quieter ways in.')
      ],
      choices: () => [
        { label: 'Try again, harder', tag: 'DC 14 Str', check: { ability: 'str', dc: 14, success: 'shop', failure: 'doors_fail2' } },
        { label: 'Fall back and think', next: 'bakery_gate' }
      ]
    },

    doors_fail2: {
      chapter: 'Chapter 2', title: 'Answered in Goblin',
      onEnter: s => { E.setFlag(s, 'alerted'); E.noise(s, 2, 'The doorframe cracked. Small feet are running to tell somebody bigger.'); },
      body: () => [
        P('The second shove cracks the frame — and from inside comes the unmistakable sound of small feet running to tell somebody bigger.'),
        W('If there was any surprise to be had, it is gone now.')
      ],
      choices: () => [{ label: 'Fall back and think', next: 'bakery_gate' }]
    },

    /* ---- Mac ---- */
    mac_talk: {
      chapter: 'Chapter 2', title: 'Macintosh',
      onEnter: s => { E.setFlag(s, 'metMac'); },
      body: () => [
        P('You are ten feet away when the tree <em>blinks</em>. Bark folds into a scowl. Two knots that were not eyes are now eyes, and they have been watching you for a quarter of an hour.'),
        SAID('Mac', 'Young. Loud. Pick your feet up out of my roots.'),
        W('He is grumpy, and old, and has very little patience for the antics of youngsters. He knows about the goblins inside, and does not much care: they killed the zombies, and they mostly ignore him.')
      ],
      choices: s => {
        const c = [];
        if (!E.hasClue(s, 'mac_hint')) c.push({ label: 'Ask about Grammy’s secret recipe', tag: 'DC 12', check: { skill: 'perception', dc: 12, success: 'mac_yes', failure: 'mac_no' } });
        if (!s.flags.macFriend) c.push({ label: 'Bow, and ask after his orchard, the way you would ask after an old man’s family', next: 'mac_friend' });
        c.push({ label: 'Threaten the tree — it is in your way', tag: 'Folly', next: 'mac_wrath' });
        c.push({ label: 'Leave him to his sun', next: 'bakery_gate' });
        return c;
      }
    },

    mac_yes: {
      chapter: 'Chapter 2', title: 'What the Tree Remembers',
      onEnter: s => { E.addClue(s, 'mac_hint'); },
      body: () => [
        SAID('Mac', 'Recipes. Secrets. Pfah. Old Grammy chatted every day with the dryads who live out back in the old orchard. Ask <em>them</em>. They gossip like starlings.'),
        W('It is the most words he has spent in a decade, and you can tell he would like them back.')
      ],
      choices: () => [{ label: 'Thank him, and go', next: 'bakery_gate' }]
    },

    mac_no: {
      chapter: 'Chapter 2', title: 'A Slow Blink',
      body: () => [
        SAID('Mac', 'I am a tree. I grow apples. Go bother something with pockets.'),
        W('The bark settles back into a face that was never a face. You have been dismissed by the oldest thing you have ever met.')
      ],
      choices: () => [{ label: 'Back to the path', next: 'bakery_gate' }]
    },

    mac_friend: {
      chapter: 'Chapter 2', title: 'The Oldest Tree',
      onEnter: s => {
        E.setFlag(s, 'macFriend');
        E.setIngredient(s, 'apples', 2);
        E.befriend(s, 'mac', 2);
        E.remember(s, 'You asked Mac about his orchard like family. He gave you six apples, aimed.');
      },
      body: () => [
        P('You bow, and you ask about the orchard — the blight year, the late frost, which rows are oldest. The scowl stays, but something behind it unknots.'),
        SAID('Mac', 'Hmph. Somebody finally <em>asks</em>.'),
        P('When you turn to go, six perfect apples drop at your feet in a neat row, aimed with a precision that is absolutely not wind.'),
        W('Mac’s apples. If this goes well, they will want to be in whatever gets baked.')
      ],
      choices: () => [{ label: 'Back to the path, apples bundled', next: 'bakery_gate' }]
    },

    mac_wrath: {
      chapter: 'Chapter 2', title: 'What the Orchard Answers',
      kind: 'combat', enemy: 'mac',
      onEnter: s => { E.setFlag(s, 'peaceful', false); E.setFlag(s, 'natureHarm'); },
      body: () => [
        ROLLNOTE(),
        P('The ground rolls. Nine shrubs in front of the building stand up like dogs. Mac does not rage — he <em>gardens</em>, and you are the weed.'),
        W('He aims to incapacitate. He will not kill you. This is not a fight you can win — it is a fight you can survive.')
      ],
      resolution: { win: 'mac_win', lose: 'ending_compost', flee: 'mac_fled' },
      combatExtras: s => [talkDown(s, 'You drop your weapon and put both hands on the dirt, and wait. The orchard decides you are compost that can learn.')],
      choices: () => []
    },

    mac_win: {
      chapter: 'Chapter 2', title: 'A Wound in the Orchard',
      onEnter: s => { E.anger(s, 'mac', 3); E.remember(s, 'You wounded Mac, the oldest tree in the orchard. The orchard will remember.'); },
      body: () => [
        P('You put steel into the old tree and the orchard goes silent in a way that is worse than any noise. Mac does not fall. He simply stops regarding you as a person, and begins regarding you as a season that will pass.'),
        W('The apples on the ground around you rot in an instant, all of them, at once.')
      ],
      choices: () => [{ label: 'Back away', next: 'bakery_gate' }]
    },

    mac_fled: {
      chapter: 'Chapter 2', title: 'Disengaged',
      body: () => [
        P('You get clear of the root-line with your skin whole and your dignity mulched. Behind you the orchard settles, and the shrubs sit back down.'),
        W('You will not be making a friend of that tree today.')
      ],
      choices: () => [{ label: 'Back to the path', next: 'bakery_gate' }]
    },

    /* ---- orchard & dryads ---- */
    orchard: {
      chapter: 'Chapter 2', title: '2 — The Apple Orchard',
      body: s => {
        const b = [
          P('The scent of apples is even thicker here. The older trees stand in neat orderly rows, but saplings sprouted since the goblins took over are everywhere. There is a whispering that does not seem to come from just the leaves.'),
          P('Early-ripened apples litter the ground. As you approach, one of them flies through the air, narrowly missing your head. The whispering is joined by the sound of giggling.'),
          P('Two of the older trees — a red and a green — are having an argument in creaks and groans, and have been recruiting their apples as ammunition.')
        ];
        if (s.flags.dryadFriend) b.push(W('The dryads are watching you the way cats watch a door.'));
        return b;
      },
      choices: s => {
        const c = [];
        if (!s.flags.dryadFriend) {
          c.push({ label: 'Leave a gift at the nearest trunk and step back', next: 'dryad_gift' });
          c.push({ label: 'Call out, friendly, and ask them to show themselves', tag: 'DC 13 Persuasion', check: { skill: 'persuasion', dc: 13, success: 'dryad_talk', failure: 'dryad_shy' } });
          c.push({ label: 'Apologize to the trees. Loudly. Sincerely. To trees.', tag: 'Sorry', next: 'orchard_sorry' });
          c.push({ label: 'Kick a sapling out of your way', tag: 'Rude', next: 'dryad_pelt' });
        } else if (!E.hasClue(s, 'recipe_split')) {
          c.push({ label: 'Ask the dryads what they know', tag: 'DC 17', check: { skill: 'persuasion', dc: 17, success: 'dryad_yes', failure: 'dryad_no' } });
        }
        c.push({ label: 'Back to the front', next: 'bakery_gate' });
        return c;
      }
    },

    orchard_sorry: {
      chapter: 'Chapter 2', title: 'Nobody Ever Says Sorry',
      onEnter: s => {
        E.setFlag(s, 'treeFriends');
        E.setIngredient(s, 'apples', 1);
        E.befriend(s, 'dryads', 1);
        E.remember(s, 'You apologized to Barktholomew and Rootilda. They each gave you an apple.');
      },
      body: () => [
        P('You apologize to the trees. Out loud. Sincerely. It turns out nobody — not the goblins, not the zombies, not the decades — has simply said <em>sorry</em> in this orchard before.'),
        P('The argument stops. The red apple tree, whom the green one addresses as <strong>Barktholomew</strong>, drops one perfect red apple at your feet. The green one — <strong>Rootilda</strong>, apparently — drops a green one beside it, as if the gift were a legal argument she is winning.'),
        W('Somewhere in the rows, the whispering agrees that you are, provisionally, all right.')
      ],
      choices: () => [{ label: 'Pocket the apples, gently', next: 'orchard' }]
    },

    dryad_gift: {
      chapter: 'Chapter 2', title: 'An Offering',
      onEnter: s => { E.setFlag(s, 'dryadFriend'); E.befriend(s, 'dryads', 1); E.remember(s, 'The dryads accepted your gift. They do not forget a gift-leaver.'); },
      body: () => [
        P('You leave something of yours at the nearest trunk — no weapon, nothing cruel — and step back. The whispering stops. Then, out of bark and leaf and afternoon light, three shapes unfold.'),
        P('The dryads are mischievous and reclusive, and they look at your gift the way you would look at a drawing a child made of you.'),
        SAID('A dryad', 'It is <em>acceptable</em>. Ask your questions, gift-leaver. But we do not like the goblins, and we liked the zombies less, and we like almost nothing.')
      ],
      choices: () => [{ label: 'Ask what they know of the recipe', tag: 'DC 17', check: { skill: 'persuasion', dc: 17, success: 'dryad_yes', failure: 'dryad_no' } }]
    },

    dryad_talk: {
      chapter: 'Chapter 2', title: 'They Come Out Laughing',
      body: () => [
        P('Three dryads unfold out of the afternoon light, giggling at your accent, your boots, your hat. They do not like giving much information away — but they also really, <em>really</em> do not like those disgusting goblins. And they liked the undead less.')
      ],
      choices: () => [{ label: 'Ask about the secret recipe', tag: 'DC 17', check: { skill: 'insight', dc: 17, success: 'dryad_yes', failure: 'dryad_no' } }]
    },

    dryad_shy: {
      chapter: 'Chapter 2', title: 'Only Leaves',
      body: () => [
        P('The giggling retreats from tree to tree like a thrown apple. Whatever they are, they will not come out for shouting — only for a gift, or for someone worth hearing.')
      ],
      choices: () => [{ label: 'Back among the rows', next: 'orchard' }]
    },

    dryad_yes: {
      chapter: 'Chapter 2', title: 'Half and Half',
      onEnter: s => {
        E.addClue(s, 'recipe_split');
        if (s.flags.dryadFriend) E.addClue(s, 'dock_hint');
      },
      body: s => {
        const b = [
          SAID('A dryad', 'The recipe? Grammy never wrote it in one place. Clever old woman. <em>Half</em> is hidden in her front office, and <em>half</em> is up in her apartment. Find both, or find nothing.')
        ];
        if (s.flags.dryadFriend) b.push(SAID('Another dryad', 'And gift-leaver — the goblins watch the front. You would surprise them better through the <em>loading dock</em>, round the side.'));
        return b;
      },
      choices: () => [{ label: 'Thank them, and go', next: 'bakery_gate' }]
    },

    dryad_no: {
      chapter: 'Chapter 2', title: 'Starlings, After All',
      body: () => [
        P('The dryads confer in a whisper you are not allowed to hear, and decide, collectively, that you are not worth the secret. An apple bounces off your shoulder, affectionately or otherwise.')
      ],
      choices: () => [{ label: 'Back among the rows', next: 'orchard' }]
    },

    dryad_pelt: {
      chapter: 'Chapter 2', title: 'Half-Rotten Justice',
      onEnter: s => { hurt(s, E.rollDice('1d4').total, 'bludgeoning'); if (s.pc.hp <= 0) s.pc.hp = 1; E.anger(s, 'dryads', 2); E.remember(s, 'You kicked a sapling. The orchard pelted you, and is keeping score.'); },
      body: () => [
        P('The orchard <em>erupts</em>. Half-rotten apples rain on you with humiliating accuracy until you leave the rows, or the dryads get bored. It is mostly the apples that get bored. You are still there.')
      ],
      choices: () => [{ label: 'Retreat, pipped and pelted', next: 'bakery_gate' }]
    },

    /* ---- waste pile ---- */
    waste: {
      chapter: 'Chapter 2', title: '3 — The Waste Pile',
      onEnter: s => { E.setFlag(s, 'doneWaste'); },
      body: () => [
        P('What was once an orderly row of compost and waste bins has long since heaped up into a massive trash pile, overgrown with fungus and other decomposers. It smells rancid, the odor carried on the breeze.'),
        W('Something in the pile is moving. Slowly. The wrong color of purple.')
      ],
      choices: () => [
        { label: 'Back away slowly — it is not worth it', next: 'bakery_gate' },
        { label: 'Slip past it along the wall', tag: 'DC 12 Dex', check: { ability: 'dex', dc: 12, success: 'waste_past', failure: 'waste_fight' } },
        { label: 'Destroy it before it grows', tag: 'Fight', next: 'waste_fight' }
      ]
    },

    waste_past: {
      chapter: 'Chapter 2', title: 'Held Breath',
      body: () => [
        P('You go past the pile on the balls of your feet while the violet fungus oozes a half-step toward the warmth you were holding. It is not fast. It is <em>patient</em>. You prefer fast.')
      ],
      choices: () => [{ label: 'On', next: 'bakery_gate' }]
    },

    waste_fight: {
      chapter: 'Chapter 2', title: 'The Violet Fungus',
      kind: 'combat', enemy: 'fungus',
      body: () => [
        ROLLNOTE(),
        P('It oozes out at half speed, four stalks lifting like lashes. It cannot hear you, cannot see you, cannot be frightened. It can only rot what it touches.')
      ],
      resolution: { win: 'waste_win', lose: 'waste_lose', flee: 'waste_fled' },
      combatExtras: s => [talkDown(s, 'You cannot reason with a mushroom — but you can back off slowly with your hands up, and it loses interest.')],
      choices: () => []
    },

    waste_win: {
      chapter: 'Chapter 2', title: 'Mulched',
      body: () => [
        P('The fungus collapses into honest compost. The smell improves by perhaps four percent. Somewhere, a new corpse somewhere else is about to have a very bad week.')
      ],
      choices: () => [{ label: 'On', next: 'bakery_gate' }]
    },

    waste_lose: {
      chapter: 'Chapter 2', title: 'Rotted Touch',
      onEnter: s => { if (s.pc.hp <= 0) s.pc.hp = 1; },
      body: () => [
        P('You drag yourself clear with one sleeve smoking faintly where it touched you. The fungus does not pursue. It has all the time there is.')
      ],
      choices: () => [{ label: 'On, carefully', next: 'bakery_gate' }]
    },

    waste_fled: {
      chapter: 'Chapter 2', title: 'Disengaged',
      body: () => [P('You back out of its reach. The pile settles. The breeze, rudely, carries the smell after you anyway.')],
      choices: () => [{ label: 'On', next: 'bakery_gate' }]
    },

    /* ---- loading dock ---- */
    dock: {
      chapter: 'Chapter 3', title: '7 — The Loading Dock',
      body: () => [
        P('A sliding wooden door opens into a room with bare stone floors and plain walls. An empty wagon stands abandoned, gathering dust. Within the bakery beyond, packing and shipping pallets stand ready to be loaded.'),
        P('As you watch, a patrol of two goblins walks by, oblivious.')
      ],
      choices: () => [
        { label: 'Slide in behind them, quiet', tag: 'DC 13 Stealth', check: { skill: 'stealth', dc: 13, success: 'dock_in', failure: 'dock_spotted' } },
        { label: 'Withdraw and try the front instead', next: 'bakery_gate' }
      ]
    },

    dock_in: {
      chapter: 'Chapter 3', title: 'Unseen',
      onEnter: s => { E.setFlag(s, 'surprise'); },
      body: () => [
        P('You time your slide to their footsteps and come out of the dock shadow into the bakery floor. The patrol rounds the ovens, sniffing at nothing.'),
        W('Whatever you do here, you do it first.')
      ],
      choices: () => [{ label: 'Look around the bakery floor', next: 'floor' }]
    },

    dock_spotted: {
      chapter: 'Chapter 3', title: '“Something Funny”',
      onEnter: s => { E.noise(s, 1, 'A goblin smelled something funny. Namely you.'); },
      body: () => [
        P('One of the goblins stops mid-patrol, sniffs the air with tremendous deliberation, and declares — at volume — that he smells <em>something funny</em>. They come in to investigate, scimitars out, ears enormous.')
      ],
      choices: () => [
        { label: 'Hold up your hands and talk', tag: 'DC 14 Cha', check: { ability: 'cha', dc: 14, success: 'dock_talk', failure: 'dock_fight' } },
        { label: 'Fight', tag: 'Fight', next: 'dock_fight' },
        { label: 'Run for it', next: 'bakery_gate' }
      ]
    },

    dock_talk: {
      chapter: 'Chapter 3', title: 'Bread Diplomacy',
      body: () => [
        P('You talk. It is not a noble speech — it is mostly hands, slow steps, and the word “pie”, which they understand perfectly. The goblins lower their scimitars, deeply suspicious, and decide to watch you instead of stabbing you.'),
        W('Addicted, the dryads said. They will tolerate you the way a dog tolerates the person holding the cheese.')
      ],
      choices: () => [{ label: 'Move carefully into the bakery floor', next: 'floor' }]
    },

    dock_fight: {
      chapter: 'Chapter 3', title: 'Dock Skirmish',
      kind: 'combat', enemy: 'goblin',
      onEnter: s => { E.setFlag(s, 'peaceful', false); E.noise(s, 2, 'Steel rang at the loading dock.'); },
      body: () => [ROLLNOTE(), P('They do not want to instigate this. They also do not want to lose it.')],
      resolution: { win: 'dock_win', lose: 'dock_hurt', flee: 'bakery_gate' },
      combatExtras: s => [talkDown(s)],
      choices: () => []
    },

    dock_win: {
      chapter: 'Chapter 3', title: 'The Dock Falls Quiet',
      onEnter: s => { E.killed(s, 1, 'a goblin at the loading dock'); },
      body: () => [
        P('It is over quickly and badly. The surviving patrol drags their friend out of sight, and the whole bakery seems to tilt its head toward the sound.'),
        W('You have made yourself a story they will tell each other. It is not a flattering story.')
      ],
      choices: () => [{ label: 'Move into the bakery floor', next: 'floor' }]
    },

    dock_hurt: {
      chapter: 'Chapter 3', title: 'Beaten at the Dock',
      onEnter: s => { if (s.pc.hp <= 0) s.pc.hp = 1; },
      body: () => [P('You come to outside the sliding door with your ears ringing. The goblins have barred it from inside. They are, you gather, telling everyone.')],
      choices: () => [{ label: 'Regroup', next: 'bakery_gate' }]
    },

    /* ================= INSIDE — THE BAKERY FLOOR (HUB) ================= */
    floor: {
      chapter: 'Chapter 3', title: '8 — The Bakery Floor',
      onEnter: s => { E.setFlag(s, 'inside'); },
      body: s => {
        const b = [
          P('The bakery floor is a wide open space with high ceilings and exposed wooden beams, sound echoing throughout. Two stone rooms stand to one side behind heavy barred doors. Between them hangs a small glass cabinet with an even smaller mallet on a chain.'),
          P('Six long work benches fill the center, covered with pie tins, rolling pins, and baking equipment. Some of the rolling pins are still rolling lazily back and forth, some enchantment keeping them in motion. Dulled knives chop at apples that have not been there in years.'),
          P('On the far side stand six massive ovens, their doors still opening periodically, as if remembering that they are supposed to. The whole place is a mess — not the work of a professional baker. It looks as if someone tried, and failed, to teach themselves to make pie.')
        ];
        if (s.flags.surprise && !s.flags.wary && !s.flags.hunting) b.push(W('The goblins do not know you are here. Yet.'));
        if (s.world.dead > 0) b.push(P('Nobody has moved the dead, and nobody has stopped looking at them. The bakery is quieter than a building full of goblins has any right to be, and every green face that sees you does one of two things: it freezes, or it runs.'));
        else if (E.mood(s, 'crew') >= 2) b.push(P('Pot-Helmet — an actual cooking pot worn as a helmet, and worn like a crown — waves at you from the rafters with a ladle. Rolling-Pin, self-appointed Assistant Crust Commander, salutes with a rolling pin. You have been, it is decided, <em>the pie person</em>.'));
        else if (E.mood(s, 'crew') > 0) b.push(P('A goblin on the benches pretends very hard not to recognize you, fails, and nudges a colleague, who also pretends, and also fails.'));
        if (s.flags.hunting) b.push(P('Patrols sweep this floor on a schedule you could set your heartbeat by. One went past the ovens while you stood here, sniffing the air for the smell of outside.'));
        else if (s.flags.wary) b.push(P('Something has the goblins jumpy. Conversations die when you move. A sentry has been posted by the glass cabinet, armed with a mallet and doubts.'));
        return b;
      },
      choices: s => {
        const c = [];
        if (s.flags.hunting && !s.flags.searchDone) c.push({ label: 'A patrol is sweeping this way — get behind the benches', tag: 'DC 13 Stealth', check: { skill: 'stealth', dc: 13, success: 'floor_hide', failure: 'floor_patrol' } });
        if (s.flags.crewFriend && !s.flags.bakeDone && !s.flags.baking) c.push({ label: 'Roll up your sleeves — it is time to bake with the crew', tag: 'The Bake', next: 'bake_prep' });
        if (!s.flags.doneShop) c.push({ label: '4 — Search the shop out front', tag: 'Shop', next: 'shop' });
        if (!s.flags.doneOffice) c.push({ label: '5 — The front office', tag: 'Office', next: 'office' });
        if (!s.flags.doneGuard) c.push({ label: '6 — The guard room', tag: 'Guard', next: 'guard' });
        if (!s.flags.doneStores) c.push({ label: 'The two stone store rooms', tag: 'Stores', next: 'stores' });
        if (!s.flags.doneEquipment) c.push({ label: 'Interfere with the enchanted equipment', tag: 'Risk', next: 'equipment' });
        if (!s.flags.doneOven) c.push({ label: 'Peer into the warm ovens', tag: 'Ovens', next: 'oven' });
        if (!s.flags.doneApartment) c.push({ label: '9 — Up the stair to Grammy’s apartment', tag: 'Apartment', next: 'apartment' });
        c.push({ label: 'Leave, and make for Trostenwald', tag: 'Finale', next: 'finale_gate' });
        return c;
      }
    },

    floor_hide: {
      chapter: 'Chapter 3', title: 'Between the Benches',
      onEnter: s => { E.setFlag(s, 'searchDone'); },
      body: () => [
        P('You fold yourself into the shadow under a work bench. Flour settles on your shoulders like snow. The patrol goes past — boots, sniffs, a muttered argument about whose turn it is to check the ovens — and does not find you.'),
        W('Your heartbeat does an excellent impression of a war drum for the better part of an hour.')
      ],
      choices: () => [{ label: 'Unfold, carefully', next: 'floor' }]
    },

    floor_patrol: {
      chapter: 'Chapter 3', title: 'Found',
      kind: 'combat', enemy: 'goblin',
      onEnter: s => { E.setFlag(s, 'searchDone'); E.setFlag(s, 'peaceful', false); E.noise(s, 2, 'The hunting patrol found you.'); },
      body: () => [ROLLNOTE(), P('A pot-helmeted goblin rounds the bench a half-second before you are somewhere else entirely, and the whole bakery hears what happens next.')],
      resolution: { win: 'floor_patrol_win', lose: 'equipment_lose', flee: 'floor' },
      combatExtras: s => [talkDown(s)],
      choices: () => []
    },

    floor_patrol_win: {
      chapter: 'Chapter 3', title: 'One Less Sentry',
      onEnter: s => { E.killed(s, 1, 'a goblin sentry'); },
      body: () => [P('The floor goes silent in the specific way that means <em>everyone</em> heard. You have bought a little time and a lot of memory.')],
      choices: () => [{ label: 'Keep moving', next: 'floor' }]
    },

    /* ---- 4 shop ---- */
    shop: {
      chapter: 'Chapter 3', title: '4 — The Shop',
      onEnter: s => { E.setFlag(s, 'doneShop'); },
      body: () => [
        P('The shop is a small front room where the famous pies were once sold. A counter stands surrounded by shelves on every wall, long since ransacked; paper boxes and bits of ribbon and twine litter the floor. Two small tables lie overturned.'),
        P('There are many signs of goblin infestation here — nests of ribbon, a pyramid of bottle caps, a shrine to something shiny. They could be tracked easily.'),
        W('The counter area has not been searched as carefully as the shelves.')
      ],
      choices: s => [
        { label: 'Search the counter area', tag: 'DC 12 Perception', check: { skill: 'perception', dc: 12, success: 'shop_box', failure: 'shop_nada' } },
        { label: 'Back to the bakery floor', next: 'floor' }
      ]
    },

    shop_box: {
      chapter: 'Chapter 3', title: 'The Cashbox',
      body: () => [
        P('Under the counter, wedged behind a drawer rail: a locked cashbox the goblins never found. The lock is small and old.')
      ],
      choices: () => [
        { label: 'Pick the lock', tag: 'DC 14 SoH', check: { skill: 'sleight', dc: 14, success: 'shop_loot', failure: 'shop_smash' } },
        { label: 'Smash it open', tag: 'DC 16 Str', check: { ability: 'str', dc: 16, success: 'shop_smashed', failure: 'shop_nada2' } }
      ]
    },

    shop_smash: {
      chapter: 'Chapter 3', title: 'Fine Fingers Fail',
      body: () => [P('The pick slips and the lock guts itself. Brute force it is, then.')],
      choices: () => [{ label: 'Smash it open', tag: 'DC 16 Str', check: { ability: 'str', dc: 16, success: 'shop_smashed', failure: 'shop_nada2' } }]
    },

    shop_smashed: {
      chapter: 'Chapter 3', title: 'Loud Money',
      onEnter: s => { E.noise(s, 2, 'You smashed the cashbox open. The crash carried.'); },
      body: () => [P('The box comes apart like a dropped pie. The crash rolls out through the shop, up the beams, and into the parts of this building where things have ears.')],
      choices: () => [{ label: 'Scoop up the coins', next: 'shop_loot' }]
    },

    shop_loot: {
      chapter: 'Chapter 3', title: '8 Gold, 11 Silver, 21 Copper',
      onEnter: s => { E.addItem(s, 'coins_small'); },
      body: () => [
        P('The lid gives. Inside: 8 gp, 11 sp, and 21 cp — a dead woman’s till, kept honest to the last copper. You take it, and you feel briefly like a grave-robber, and then you stop feeling like that, because graves do not pay.'),
        W('Kept. The wizard said you may keep anything of value you find.')
      ],
      choices: () => [{ label: 'Back to the bakery floor', next: 'floor' }]
    },

    shop_nada: {
      chapter: 'Chapter 3', title: 'Ribbon and Dust',
      body: () => [P('You find ribbon, twine, bottle caps, and one extremely judgmental goblin doodle of a very tall person being hit by a pie. Nothing of value.')],
      choices: () => [{ label: 'Back to the bakery floor', next: 'floor' }]
    },

    shop_nada2: {
      chapter: 'Chapter 3', title: 'Stubborn Little Box',
      body: () => [P('The box defeats you, which is a sentence you will not be telling anyone. Somewhere in it, coins rattle smugly.')],
      choices: () => [{ label: 'Back to the bakery floor', next: 'floor' }]
    },

    /* ---- 5 office ---- */
    office: {
      chapter: 'Chapter 3', title: '5 — The Office',
      onEnter: s => { E.setFlag(s, 'doneOffice'); },
      body: () => [
        P('This well-appointed room of sturdy mahogany and velvet curtains contains two paper-strewn desks with overturned chairs. Bookshelves and filing cabinets line the walls. The goblin odor is not as strong in here; the goblins cannot read, and see no use for stupid papers except as kindling.'),
        W('One of the desk drawers sits a half-inch proud, as if it wants something.')
      ],
      choices: s => {
        const c = [];
        if (!s.flags.officeSafe) c.push({ label: 'Search the bookshelves', tag: 'DC 13 Perception', check: { skill: 'perception', dc: 13, success: 'office_safe', failure: 'office_nosafe' } });
        if (!E.hasItem(s, 'half_office_done')) {
          c.push({ label: 'Check the proud drawer for traps first', tag: 'DC 13 Perception', check: { skill: 'perception', dc: 13, success: 'office_trapseen', failure: 'office_trap' } });
          c.push({ label: 'Just open the drawer', tag: 'Hasty', next: 'office_trap' });
        }
        c.push({ label: 'Back to the bakery floor', next: 'floor' });
        return c;
      }
    },

    office_safe: {
      chapter: 'Chapter 3', title: 'The Hidden Safe',
      onEnter: s => { E.setFlag(s, 'officeSafe'); },
      body: () => [
        P('Behind one shelf, a hairline seam: a safe, hidden from anyone who cannot read either. The goblins never stood a chance. The lock is better than the cashbox’s.')
      ],
      choices: () => [
        { label: 'Pick it', tag: 'DC 15 SoH', check: { skill: 'sleight', dc: 15, success: 'office_loot', failure: 'office_pry' } },
        { label: 'Pry it open', tag: 'DC 17 Str', check: { ability: 'str', dc: 17, success: 'office_loot', failure: 'office_noloot' } }
      ]
    },

    office_pry: {
      chapter: 'Chapter 3', title: 'The Lock Laughs',
      body: () => [P('The pick snaps. The safe remains, smug and mahogany-jawed. Brute force, then.')],
      choices: () => [{ label: 'Pry it open', tag: 'DC 17 Str', check: { ability: 'str', dc: 17, success: 'office_loot', failure: 'office_noloot' } }]
    },

    office_loot: {
      chapter: 'Chapter 3', title: '75 Gold, 50 Silver, 25 Copper',
      onEnter: s => { E.addItem(s, 'coins_big'); E.addItem(s, 'signet'); },
      body: () => [
        P('Inside: 75 gp, 50 sp, 25 cp — and one silver signet ring worth about 10 gp, pressed with a crest of an apple under a lattice. Business was booming, once.'),
        W('The velvet curtains would fetch another 10 gp at market, but they are heavy and cumbersome. You leave them to their dust.')
      ],
      choices: () => [{ label: 'Back to the office', next: 'office' }]
    },

    office_nosafe: {
      chapter: 'Chapter 3', title: 'Ledgers and Dust',
      body: () => [P('The shelves hold records of the bakery’s finances — business was booming — and nothing else your eye will admit to. If there is a safe here, it is shy.')],
      choices: () => [{ label: 'Back to the office', next: 'office' }]
    },

    office_noloot: {
      chapter: 'Chapter 3', title: 'The Safe Wins',
      body: () => [P('You bend a chair against it and achieve nothing except a bent chair. The safe keeps its counsel.')],
      choices: () => [{ label: 'Back to the office', next: 'office' }]
    },

    office_trapseen: {
      chapter: 'Chapter 3', title: 'A Needle in the Dark',
      body: () => [
        P('There — a hair-thin seam under the drawer pull, and the glint of a spring-loaded needle. A poison needle, by the look of the green stain on the wood where it has kissed the frame before.')
      ],
      choices: () => [
        { label: 'Disarm it', tag: 'DC 16 Dex', check: { ability: 'dex', dc: 16, success: 'office_half', failure: 'office_trap' } }
      ]
    },

    office_trap: {
      chapter: 'Chapter 3', title: 'The Needle',
      onEnter: s => {
        hurt(s, 1, 'piercing');
        const r = E.roll(s, { ability: 'con', dc: 15, label: 'Constitution save vs poison' });
        s.lastRoll = r; s.flags.needleSave = r.pass;
        if (!r.pass && !E.hasTrait(s, 'poisonres')) hurt(s, E.rollDice('1d10').total, 'poison');
        if (s.pc.hp <= 0) s.pc.hp = 1;
        E.addItem(s, 'half_office_done'); E.setIngredient(s, 'half_office', 2);
      },
      body: s => [
        P('The drawer opens exactly as far as a spring allows, and a needle stabs out of the dark: 1 piercing damage, and a cold bloom of poison up your wrist.'),
        s.flags.needleSave || E.hasTrait(s, 'poisonres')
          ? W('Your body throws the poison off. The world stays the right size.')
          : W('The room tilts for an hour, and your veins feel like somebody else’s.'),
        P('Inside the drawer, torn and folded small: <strong>half of the secret recipe</strong>, on old parchment, in a flour-dusted hand.')
      ],
      choices: s => [{ label: 'Pocket the half-recipe', next: (!s.flags.metGrammy && s.world.dead === 0 && s.flags.peaceful !== false) ? 'grammy' : 'floor' }]
    },

    office_half: {
      chapter: 'Chapter 3', title: 'Half the Secret',
      onEnter: s => { E.addItem(s, 'half_office_done'); E.setIngredient(s, 'half_office', 2); },
      body: () => [
        P('The spring sighs, disarmed. The drawer glides open, and there it is, torn and folded small: <strong>half of the secret recipe</strong>, on old parchment, in a flour-dusted hand.'),
        W('Somewhere in this building, if the dryads are right, there is a matching half.')
      ],
      choices: s => [{ label: 'Pocket the half-recipe', next: (!s.flags.metGrammy && s.world.dead === 0 && s.flags.peaceful !== false) ? 'grammy' : 'floor' }]
    },

    /* ---- Grammy ---- */
    grammy: {
      chapter: 'Chapter 3', title: 'The Woman in the Velvet Chair',
      onEnter: s => { E.setFlag(s, 'metGrammy'); },
      body: () => [
        P('You have the drawer half in your hand when the temperature drops by exactly one degree, and the velvet chair behind the desk is no longer empty.'),
        P('She is not a horror. She is a small, sturdy woman in a flour-dusted apron, faint as a photograph left in a window, with the calm of someone who has been dead a long time and used the time to tidy up. A nameplate on the desk, which you would swear was not there a moment ago, reads <strong>Smithwick</strong>.'),
        SAID('Grammy Smithwick', 'So. Somebody finally came for it. Sit down — no, not there, that’s the cat’s chair. He’s dead too, but he still has opinions.'),
        SAID('Grammy Smithwick', 'One question, and I’ll know if you’re lying, because I’m dead, and we get to do that now. <em>What are you going to do with my recipe?</em>')
      ],
      choices: () => [
        { label: 'Tell her the truth: a wizard wants one last taste — and the goblins upstairs want to learn to bake it', tag: 'Truth', next: 'grammy_blessing' },
        { label: 'Tell her what she wants to hear, and keep the real plan', tag: 'Lie', check: { skill: 'deception', dc: 15, success: 'grammy_fade', failure: 'grammy_caught' } }
      ]
    },

    grammy_blessing: {
      chapter: 'Chapter 3', title: 'The Secret That Isn’t in the Recipe',
      onEnter: s => {
        E.setFlag(s, 'grammyBlessing');
        E.befriend(s, 'grammy', 2);
        E.addClue(s, 'grammy_secret');
        E.remember(s, 'Grammy Smithwick blessed you — and told you the secret that isn’t in the recipe.');
      },
      body: () => [
        P('You tell her all of it: the old wizard and his one last taste; the goblins and their obsessive, hopeless, <em>endearing</em> attempts to bake her pie from memory and smell. She listens the way bakers listen — with the hands.'),
        SAID('Grammy Smithwick', 'Addicts. Huh. Forty years of somebody loving my pie enough to haunt my kitchen over it.'),
        P('She is quiet for a long moment. Then she leans forward and tells you the thing that is written on neither half of the parchment, in no drawer, in no hand:'),
        SAID('Grammy Smithwick', 'The secret ingredient was never in the recipe, dear. It’s who you share it with. You take those two halves — and you <em>share</em> them.'),
        W('The velvet chair is empty again. But the office feels, for the first time since the zombies, like somebody’s kitchen.')
      ],
      choices: () => [{ label: 'Pocket the half-recipe, gently', next: 'floor' }]
    },

    grammy_fade: {
      chapter: 'Chapter 3', title: 'She Lets You',
      onEnter: s => { E.setFlag(s, 'grammyFaded'); E.anger(s, 'grammy', 2); E.remember(s, 'You lied to Grammy Smithwick. She let you. Somehow that is worse.'); },
      body: () => [
        P('You tell her a pretty lie. She smiles at it the way you smile at a pie that came out wrong but was made with love — and fades back into the velvet chair without another word.'),
        W('The office is just an office again. You have the parchment now, and none of the rest of it.')
      ],
      choices: () => [{ label: 'Pocket the half-recipe', next: 'floor' }]
    },

    grammy_caught: {
      chapter: 'Chapter 3', title: 'Dead People Get to Do That',
      onEnter: s => { E.setFlag(s, 'grammyFaded'); E.anger(s, 'grammy', 2); E.remember(s, 'You tried to lie to Grammy Smithwick. She heard every word you meant instead.'); },
      body: () => [
        SAID('Grammy Smithwick', 'Oh, honey. I’m <em>dead</em>. We can hear those.'),
        P('She does not scold. She just looks at you with forty years of patience and none of the patience left for nonsense, and the chair is empty before you can apologize.'),
        W('You will be thinking about that look for a very long time.')
      ],
      choices: () => [{ label: 'Pocket the half-recipe', next: 'floor' }]
    },

    /* ---- the bake ---- */
    bake_prep: {
      chapter: 'Chapter 3', title: 'Trial One — The Organizing',
      onEnter: s => { E.setFlag(s, 'baking'); },
      body: () => [
        P('You tie an apron over your armor and turn baking into a military operation. Flour left. Apples right. Tins in a line. You bark friendly orders — and, to everyone’s astonishment, most of all your own, <em>the goblins fall into formation</em>. Nib on apples. Rolling-Pin on dough, obviously. Pot-Helmet on… whatever Pot-Helmet is doing. Skritch, lanky and paperwork-obsessed, begins keeping a tally on the back of an old pie-box.'),
        W('The Oven watches. You can feel it watching. Ovens do not have eyes. This one has <em>opinions</em>.')
      ],
      choices: () => [
        { label: 'Run this kitchen like a drill sergeant with a heart', tag: 'DC 12 Athletics', check: { ability: 'str', dc: 12, success: 'bake_magic', failure: 'bake_prep_retry' } }
      ]
    },

    bake_prep_retry: {
      chapter: 'Chapter 3', title: 'Flour Everywhere',
      body: () => [P('A sack goes over. Flour ghosts through the air like snow in a snow globe somebody shook. Nib sneezes for four solid minutes. But nobody quits — they have come too far, and so have you.')],
      choices: () => [
        { label: 'Again — slower, with the crew helping you', tag: 'DC 12 Athletics, advantage', check: { ability: 'str', dc: 12, advantage: true, success: 'bake_magic', failure: 'bake_prep_giveup' } }
      ]
    },

    bake_prep_giveup: {
      chapter: 'Chapter 3', title: 'Not Today',
      onEnter: s => { E.setFlag(s, 'baking', false); E.remember(s, 'The bake fell apart at the organizing. The crew will try again with you any day.'); },
      body: () => [P('The kitchen wins. The dough wins. Pot-Helmet, somehow, is in the ceiling. You call it, and the crew disperses with the dignity of people who have seen worse bakes.')],
      choices: () => [{ label: 'Back to the bakery floor', next: 'floor' }]
    },

    bake_magic: {
      chapter: 'Chapter 3', title: 'Trial Two — The Magic',
      body: () => [
        P('The Oven said <em>truth</em>, and old magic runs in this building’s bones. The crew watches as you decide what kind of magic a pie needs. Rolling-Pin suggests, by mime, <em>more</em>. Nib suggests, by hiding, that perhaps none.'),
        W('The runes on the store-room walls are still cold. The rolling pins still roll. This bakery has always been a little enchanted, and it is waiting to see what you add.')
      ],
      choices: s => {
        const c = [];
        if ((s.pc.cantrips || []).length) c.push({ label: 'Cast a cantrip like autumn leaves drifting through the bakery', next: 'bake_magic_cast' });
        c.push({ label: 'Work the old enchantment by feel — steady hands, steady heart', tag: 'DC 12 Arcana', check: { skill: 'arcana', dc: 12, success: 'bake_song', failure: 'bake_magic_fizzle' } });
        return c;
      }
    },

    bake_magic_cast: {
      chapter: 'Chapter 3', title: 'Dancing Lights',
      onEnter: s => { E.remember(s, 'You lit the bakery with cantrip-light like autumn leaves. The goblins have never seen anything so beautiful.'); },
      body: () => [
        P('You cast your smallest spell and give it your biggest heart: lights like autumn leaves, drifting gold and ember-orange through the rafters. The goblins go silent. Nib whispers a word that Skritch later tells you means <em>holy</em>.'),
        W('The Oven’s coals brighten one degree, which, from an oven, is applause.')
      ],
      choices: () => [{ label: 'On to the last trial', next: 'bake_song' }]
    },

    bake_magic_fizzle: {
      chapter: 'Chapter 3', title: 'A Fizzle and a Giggle',
      body: () => [P('The enchantment hiccups, sparks like a wet sneeze, and a single rolling pin rolls in a perfect, mocking circle. The goblins lose their entire composure. You laugh too, eventually, which counts for something.')],
      choices: () => [{ label: 'Shake it off — the song is what matters', next: 'bake_song' }]
    },

    bake_song: {
      chapter: 'Chapter 3', title: 'Trial Three — The Song',
      body: () => [
        P('The Oven said <em>song</em>. So you sing — an old song, the kind that travels with soldiers and sailors and anyone who has ever been far from a kitchen: a song about how the people you eat with matter more than the meal.'),
        P('One by one the goblins creep in: from the rafters, the store rooms, the stair. Nib joins first, because Nib joins everything. Then Rolling-Pin, keeping time with a rolling pin. Then — a moment you will tell for the rest of your life — <strong>Chief Grubnash himself</strong>, in the doorway, wooden spoon raised like a scepter, singing words he has never heard before as if he wrote them.')
      ],
      choices: s => [
        { label: 'Sing it like you mean it',
          tag: s.world.dead === 0 && E.mood(s, 'crew') >= 2 ? 'DC 13 Performance — the crew sings with you (advantage)' : 'DC 13 Performance',
          check: { skill: 'performance', dc: 13, advantage: s.world.dead === 0 && E.mood(s, 'crew') >= 2, success: 'bake_done', failure: 'bake_song_retry' } }
      ]
    },

    bake_song_retry: {
      chapter: 'Chapter 3', title: 'The Song Wobbles',
      body: () => [P('Your voice cracks on the third verse and the moment wobbles with it — but Pot-Helmet, bless the little maniac, bangs the pot on a bench until the beat comes back, and the crew carries you through the last line together.')],
      choices: () => [
        { label: 'One more time — together', tag: 'DC 13 Performance, advantage', check: { skill: 'performance', dc: 13, advantage: true, success: 'bake_done', failure: 'bake_song_giveup' } }
      ]
    },

    bake_song_giveup: {
      chapter: 'Chapter 3', title: 'Almost',
      onEnter: s => { E.setFlag(s, 'baking', false); E.remember(s, 'The song fell apart on the last verse. The pies came out all right. The magic did not.'); },
      body: () => [P('The song peters out. The pies bake anyway — honest, good, ordinary pies. The Oven says nothing at all, which is somehow the saddest sound in the world.')],
      choices: () => [{ label: 'Back to the bakery floor', next: 'floor' }]
    },

    bake_done: {
      chapter: 'Chapter 3', title: 'SHARE',
      onEnter: s => {
        E.setFlag(s, 'bakeDone'); E.setFlag(s, 'baking', false);
        E.befriend(s, 'crew', 1); E.befriend(s, 'oven', 2);
        E.remember(s, 'The bake succeeded. The pies rose. The Oven said: SHARE.');
      },
      body: () => [
        P('The pies rise. All of them. At once. Through the little glass windows in the oven doors the crusts go gold like a sunset that decided to be edible, and the smell — the <em>smell</em> — rolls out of the bakery and across the ruined village for the first time in forty years.'),
        P('The goblins stand in a row, covered in flour, weeping openly, holding pie. The Oven glows from every door at once and delivers its verdict in a single rumbling word:'),
        SAID('The Oven', 'SHARE.'),
        W('Somewhere out back, you would swear you hear an old tree laugh. The secret ingredient, it turns out, was never in the recipe.')
      ],
      choices: () => [{ label: 'Eat pie with the crew. Obviously.', next: 'floor' }]
    },

    /* ---- 6 guard ---- */
    guard: {
      chapter: 'Chapter 3', title: '6 — The Guard Room',
      onEnter: s => { E.setFlag(s, 'doneGuard'); },
      body: () => [
        P('Grammy kept two or three young men from the nearby town employed as guards, more to keep them out of trouble than anything else. This is where they kept their equipment and took breaks during long night patrols.'),
        P('Three quarterstaffs have fallen where they once stood against one wall. A small table with two chairs lies overturned. Opposite the quarterstaffs sits a locked chest.')
      ],
      choices: s => {
        const c = [];
        if (!s.flags.chestDone) c.push({ label: 'Open the chest', tag: 'DC 15 Dex', check: { ability: 'dex', dc: 15, success: 'guard_chest', failure: 'guard_smash' } });
        if (!s.flags.staffTaken) c.push({ label: 'Take a quarterstaff', next: 'guard_staff' });
        c.push({ label: 'Back to the bakery floor', next: 'floor' });
        return c;
      }
    },

    guard_smash: {
      chapter: 'Chapter 3', title: 'The Lock Stands',
      body: () => [P('The pick mangles the keyway. The chest, like its owner’s era, does not open for asking.')],
      choices: () => [{ label: 'Smash the lock off', tag: 'DC 17 Str', check: { ability: 'str', dc: 17, success: 'guard_smashed', failure: 'guard_nochest' } }]
    },

    guard_smashed: {
      chapter: 'Chapter 3', title: 'A Bang for the Rafters',
      onEnter: s => { E.noise(s, 2, 'You smashed the guard-room chest open.'); },
      body: () => [P('The lock comes off with a bang the rafters will discuss for a week.')],
      choices: () => [{ label: 'Look inside', next: 'guard_chest' }]
    },

    guard_chest: {
      chapter: 'Chapter 3', title: 'Shillelagh Oil',
      onEnter: s => { E.setFlag(s, 'chestDone'); E.addItem(s, 'oil'); },
      body: () => [
        P('The lock gives. Inside, packed in straw: three bottles of <strong>Shillelagh oil</strong> — rubbed on a club or quarterstaff, it works as if the spell had been cast. The guards’ little secret, kept for the night the zombies came.')
      ],
      choices: () => [{ label: 'Back to the guard room', next: 'guard' }]
    },

    guard_nochest: {
      chapter: 'Chapter 3', title: 'Dented and Defeated',
      body: () => [P('You dent the lid and skin your knuckles. The chest keeps its straw-packed secret.')],
      choices: () => [{ label: 'Back to the guard room', next: 'guard' }]
    },

    guard_staff: {
      chapter: 'Chapter 3', title: 'An Honest Stick',
      onEnter: s => { E.setFlag(s, 'staffTaken'); E.addItem(s, 'staff'); },
      body: () => [
        P('You take the best of the three quarterstaffs. The wood is not preserved; it feels a little tired in your hands, like a retired soldier.'),
        W('If an attack you make with it ever fails badly, it may break. Honest sticks do that.')
      ],
      choices: () => [{ label: 'Back to the guard room', next: 'guard' }]
    },

    /* ---- stores ---- */
    stores: {
      chapter: 'Chapter 3', title: 'The Stone Rooms',
      onEnter: s => { E.setFlag(s, 'doneStores'); },
      body: () => [
        P('Two stone rooms: ingredient storage and finished-product storage, mostly empty now, but the runes inscribed in the stone are still keeping both chilled, after all these years.'),
        W('Any magic user could copy the runes — a second-level spell, a variation of Cone of Cold that only cools food, never harms. Somebody planned for hot summers.')
      ],
      choices: s => {
        const c = [];
        if (!s.flags.spicesDone) c.push({ label: 'Search the corners', tag: 'DC 15 Perception', check: { skill: 'perception', dc: 15, success: 'stores_spices', failure: 'stores_nada' } });
        if (!s.flags.potionsDone) c.push({ label: 'Open the glass cabinet', next: 'stores_potions' });
        c.push({ label: 'Back to the bakery floor', next: 'floor' });
        return c;
      }
    },

    stores_spices: {
      chapter: 'Chapter 3', title: 'The Exotic Spices',
      onEnter: s => { E.setFlag(s, 'spicesDone'); E.setIngredient(s, 'spices', 2); E.addItem(s, 'spices_bag'); },
      body: () => [
        P('Hidden away in a corner behind a false stone: a bag each of <strong>cinnamon, nutmeg, ginger, and cloves</strong> — exotic, expensive, and still pungent. About 5 gp a bag at market, and worth far more to a pie.'),
        W('This is what the whole village smelled like. This is the smell Tyndareus crossed a map for.')
      ],
      choices: () => [{ label: 'Back to the store rooms', next: 'stores' }]
    },

    stores_nada: {
      chapter: 'Chapter 3', title: 'Empty Shelves, Cold Air',
      body: () => [P('Flour ghosts, a rat’s honest skeleton, cold air and older stone. Whatever was hidden here, your eye does not find it.')],
      choices: () => [{ label: 'Back to the store rooms', next: 'stores' }]
    },

    stores_potions: {
      chapter: 'Chapter 3', title: 'Two Healing Potions',
      onEnter: s => { E.setFlag(s, 'potionsDone'); E.addItem(s, 'potion'); },
      body: () => [
        P('The glass cabinet holds <strong>two regular healing potions</strong>, and the small mallet on its chain, for breaking the glass in an emergency. You take the potions gently, and leave the mallet its job.')
      ],
      choices: () => [{ label: 'Back to the store rooms', next: 'stores' }]
    },

    /* ---- equipment & ovens ---- */
    equipment: {
      chapter: 'Chapter 3', title: 'The Enchanted Benches',
      onEnter: s => { E.setFlag(s, 'doneEquipment'); },
      body: () => [
        P('Up close, the enchantment is old and kind and a little confused: rolling pins rolling at apples that are not there, knives dulled to spoons by decades of chopping. The magic equipment might fetch a few coppers as a curio for some interested wizard; otherwise it is poor condition, eaten through with rust and rot.'),
        W('A “Mending” cantrip might fix the physical damage. It cannot restore the magic. You reach out to touch a rolling pin—'),
        P('—and three goblins drop from the rafters to stop you: one wearing an actual cooking pot as a helmet (<strong>Pot-Helmet</strong>, chaos incarnate), one holding a rolling pin like a commissioned officer (<strong>Rolling-Pin</strong>, self-appointed Assistant Crust Commander), and one small, careful one who lands badly and apologizes to the floor (<strong>Nib</strong>).')
      ],
      choices: () => [
        { label: '“Easy. I’ll show you the recipe.”', tag: 'DC 14 Cha', check: { ability: 'cha', dc: 14, success: 'equipment_talk', failure: 'equipment_fight' } },
        { label: 'Fight', tag: 'Fight', next: 'equipment_fight' },
        { label: 'Back away slowly', next: 'floor' }
      ]
    },

    equipment_talk: {
      chapter: 'Chapter 3', title: 'Shown, Not Told',
      onEnter: s => { E.setFlag(s, 'crewFriend'); E.befriend(s, 'crew', 2); E.remember(s, 'You showed the crew the shapes of pie. They will remember you as the pie person.'); },
      body: () => [
        P('They cannot read, but they remember what they are told and what they are shown. You mime flour, and apples, and a lattice, and the word “pie”, and the three of them go very still, and then very excited, and then — decisively — not hostile.'),
        P('Nib asks, in goblin, whether you will be <em>staying for the bake</em>. Pot-Helmet has already begun rearranging the benches into something like a kitchen brigade.'),
        W('They are addicted. They will let you take the recipe. They will remember, forever, whether you shared the pie.')
      ],
      choices: () => [{ label: 'Back to the bakery floor', next: 'floor' }]
    },

    equipment_fight: {
      chapter: 'Chapter 3', title: 'Raiders from the Rafters',
      kind: 'combat', enemy: 'goblinTrio',
      onEnter: s => { E.setFlag(s, 'peaceful', false); E.noise(s, 3, 'There was a fight among the enchanted benches.'); },
      body: () => [ROLLNOTE(), P('They do not wish to instigate this. They also will not let you touch the machines that make the smell.')],
      resolution: { win: 'equipment_win', lose: 'equipment_lose', flee: 'floor' },
      combatExtras: s => [talkDown(s)],
      choices: () => []
    },

    equipment_win: {
      chapter: 'Chapter 3', title: 'The Crew Falls Quiet',
      onEnter: s => { E.killed(s, 3, 'Pot-Helmet, Rolling-Pin and Nib'); },
      body: () => [
        P('The rafters do not cheer. The rafters have gone entirely silent, which is worse. Somewhere upstairs, something heavy stands up.'),
        W('You will meet the chief eventually. He has been told exactly what you are.')
      ],
      choices: () => [{ label: 'Stand in the quiet a moment, then move on', next: 'floor' }]
    },

    equipment_lose: {
      chapter: 'Chapter 3', title: 'Beaten Among the Benches',
      onEnter: s => { if (s.pc.hp <= 0) s.pc.hp = 1; },
      body: () => [P('You wake under a work bench. The goblins have gone back to the rafters, and have left you a single half-baked mess in a pie tin, which is either mercy or a threat.')],
      choices: () => [{ label: 'Back to the bakery floor', next: 'floor' }]
    },

    oven: {
      chapter: 'Chapter 3', title: 'The Warm Ovens',
      onEnter: s => { E.setFlag(s, 'doneOven'); s.flags.ovenRoll = E.d(4); },
      body: s => {
        const who = ['', 'a magmin, dozing in the coals like a cat', 'a smoke mephit, puffing little grievances at the flue', 'a magma mephit, sunbathing on the oven floor', 'a fire snake, coiled around the bread stone like a belt'][s.flags.ovenRoll];
        const b = [
          P('The ovens are still warm but not hot — certainly not hot enough to bake a pie, as the half-baked messes in the tins on top attest. The warmth is not magic. It is <em>residence</em>: ' + who + '.')
        ];
        if (s.flags.bakeDone) b.push(P('The great oven at the center glows like a contented cat in a sunbeam. It has said its piece. It is, for the first time in forty years, <em>full</em>.'));
        else if (s.flags.ovenSpoke) b.push(P('The great oven at the center waits, the way very old things wait, having already said every word it needed to say.'));
        else b.push(
          P('And then the great oven at the center of the row — older than the building, older, you would bet, than the village — opens its door on its own. From somewhere deep in its fireless dark, a voice like a millstone turning over in its sleep says a single word:'),
          SAID('The Oven', 'APPLES.')
        );
        return b;
      },
      choices: s => {
        const c = [];
        if (!s.flags.ovenSpoke) c.push({ label: '“…Hello?”', tag: 'The Oven', next: 'oven_word' });
        c.push({ label: 'Leave it its hearth', next: 'floor' });
        if (!s.flags.ovenProvoked) c.push({ label: 'Prod it — this is not its house', tag: 'Provoke', next: 'oven_fight' });
        return c;
      }
    },

    oven_word: {
      chapter: 'Chapter 3', title: 'It Speaks in Single Words',
      onEnter: s => { E.setFlag(s, 'ovenSpoke'); E.befriend(s, 'oven', 1); E.remember(s, 'The great Oven spoke to you. One word at a time. It meant all of it.'); },
      body: () => [
        SAID('The Oven', 'APPLES.'),
        P('You wait. A minute passes, in the manner of ovens.'),
        SAID('The Oven', 'SONG.'),
        P('You wait longer. The coals rearrange themselves into something almost like a face, almost like a shrug.'),
        SAID('The Oven', 'TRUTH.'),
        W('It is asking for three things. It has been asking — in heat, and smoke, and forty years of half-baked messes — and nobody could hear it.')
      ],
      choices: () => [{ label: 'Promise, solemnly, to try', next: 'floor' }]
    },

    oven_fight: {
      chapter: 'Chapter 3', title: 'Provoked',
      kind: 'combat', enemy: 'oven',
      onEnter: s => { E.setFlag(s, 'peaceful', false); E.setFlag(s, 'ovenProvoked'); E.anger(s, 'oven', 2); E.remember(s, 'You provoked the dweller of the warm ovens.'); },
      body: () => [ROLLNOTE(), P('It wanted, so badly, to just be warm.')],
      resolution: { win: 'floor', lose: 'oven_lose', flee: 'floor' },
      combatExtras: s => [talkDown(s, 'You step back from the oven door with both hands up. The dweller settles, and forgives you nothing.')],
      choices: () => []
    },

    oven_lose: {
      chapter: 'Chapter 3', title: 'Singed',
      onEnter: s => { if (s.pc.hp <= 0) s.pc.hp = 1; },
      body: () => [P('You retreat with your eyebrows lighter than they were. The oven door swings shut with a small, satisfied clang.')],
      choices: () => [{ label: 'Back to the bakery floor', next: 'floor' }]
    },

    /* ---- 9 apartment ---- */
    apartment: {
      chapter: 'Chapter 3', title: '9 — Grammy’s Apartment',
      onEnter: s => { E.setFlag(s, 'doneApartment'); },
      body: s => {
        const b = [
          P('This once-homey apartment has been turned into a true goblin hovel. Two goblins and their leader stand in the middle of the room, staring at you. The leader is unmistakable: a flour-dusted apron over scavenged leather, a chef’s hat worn like a crown, a necklace of measuring spoons, and a wooden spoon held exactly the way kings hold scepters. <strong>Chief Grubnash.</strong> The goblins who took Grammy’s bakery have a <em>baker</em>.'),
          P('Ancient mahogany furniture still stands, too heavy to move: a bed missing its mattress in one corner, a wardrobe of crude weapons in the other. Against one wall, a desk covered in pelts and trophies — one drawer sitting a half-inch proud.'),
          W('The chief’s nose is twitching. You smell, to a goblin, like the outside — and like somebody who has been near the pie machines.')
        ];
        if (s.world.dead > 0) b.push(P('Grubnash’s eyes go to his guards, then to you, then to the wooden spoon in his hand. He has been told exactly what you are. The measuring spoons on his chest do not rattle, because he is holding very, very still.'));
        else if (s.flags.crewFriend) b.push(P('Pot-Helmet has clearly been up this stair at speed, because Grubnash looks at you the way a head chef looks at a visiting master: wary, hopeful, and slightly out of his depth.'));
        return b;
      },
      choices: s => {
        const c = [];
        if (!s.flags.aptDone) {
          c.push({ label: 'Talk. Slowly. About pie.',
            tag: s.world.dead > 0 ? 'DC ' + (14 + E.bloodPenalty(s)) + ' Cha — they know what you are' : 'DC 14 Cha',
            check: { ability: 'cha', dc: 14 + E.bloodPenalty(s), success: 'apartment_talk', failure: 'apartment_fight' } });
          c.push({ label: 'Fight the chief', tag: 'Fight', next: 'apartment_fight' });
          c.push({ label: 'Feint left, slip to the desk', tag: 'DC 13 Stealth', check: { skill: 'stealth', dc: 13, success: 'apartment_sneak', failure: 'apartment_fight' } });
        }
        c.push({ label: 'Back down the stair', next: 'floor' });
        return c;
      }
    },

    apartment_talk: {
      chapter: 'Chapter 3', title: 'The Pie Addicts',
      body: () => [
        P('You talk. The chief listens with his whole body. They have been trying to replicate Grammy’s pies — badly, obsessively — and they will listen to anyone who smells like the recipe. They cannot read it. But they will remember anything you tell them, or show them, forever.')
      ],
      choices: () => [
        { label: 'Promise them a copy of the recipe, in words they can keep', tag: 'A promise', next: 'apartment_deal' },
        { label: 'Show them, teach nothing, and go for the drawer', next: 'apartment_sneak_ok' },
        { label: 'Refuse them everything', next: 'apartment_fight' }
      ]
    },

    apartment_deal: {
      chapter: 'Chapter 3', title: 'Pie for Everyone',
      onEnter: s => { E.setFlag(s, 'goblinPact'); E.setFlag(s, 'aptDone'); E.setFlag(s, 'crewFriend'); E.befriend(s, 'crew', 2); E.remember(s, 'You promised Grubnash’s crew their own copy of the recipe. Goblins never forget a promise.'); },
      body: () => [
        P('You say the words — <em>a copy, in your own words, for the bakery’s new bakers</em> — and the room goes silent in a way churches do. The chief repeats it back to you, twice, to lock it in.'),
        W('Goblins have long memories. This one will outlive you both. They step aside from the desk, all three of them, like ushers.')
      ],
      choices: () => [{ label: 'Open the proud drawer', next: 'apartment_drawer' }]
    },

    apartment_sneak: {
      chapter: 'Chapter 3', title: 'Between Heartbeats',
      onEnter: s => { E.setFlag(s, 'aptDone'); },
      body: () => [
        P('You put your shadow in the wardrobe’s shadow and your feet in the chief’s blind side, and the desk receives you like it has been waiting.')
      ],
      choices: () => [{ label: 'Open the proud drawer', next: 'apartment_drawer' }]
    },

    apartment_sneak_ok: {
      chapter: 'Chapter 3', title: 'Shown, Kept',
      onEnter: s => { E.setFlag(s, 'aptDone'); },
      body: () => [
        P('You show them the half-recipe you carry, narrate it like a bedtime story, and teach nothing at all. They hang on every word, and will be repeating it incorrectly for years, happily. The desk is unguarded.')
      ],
      choices: () => [{ label: 'Open the proud drawer', next: 'apartment_drawer' }]
    },

    apartment_fight: {
      chapter: 'Chapter 3', title: 'The Chief',
      kind: 'combat', enemy: 'goblinChief',
      onEnter: s => { E.setFlag(s, 'peaceful', false); E.setFlag(s, 'aptDone'); E.noise(s, 3, 'There was a fight in Grammy’s apartment.'); },
      body: () => [ROLLNOTE(), P('The two under-goblins form a very committed audience. The chief fights the way an addict defends a pantry.')],
      resolution: { win: 'apartment_win', lose: 'apartment_lose', flee: 'floor' },
      combatExtras: s => [talkDown(s)],
      choices: () => []
    },

    apartment_win: {
      chapter: 'Chapter 3', title: 'The Hovel Falls Quiet',
      onEnter: s => { E.killed(s, 1, 'Chief Grubnash'); },
      body: () => [
        P('The chief goes down, wooden spoon and all, and the two under-goblins surrender the room with a speed that suggests they had been hoping someone would resolve this for them. They sit in the wardrobe and watch you with enormous ears.'),
        W('They will not meet your eyes. Somewhere in this building, a pot-helmeted goblin is being told, gently, that the pie person is not coming back up the stair.')
      ],
      choices: () => [{ label: 'Open the proud drawer', next: 'apartment_drawer' }]
    },

    apartment_lose: {
      chapter: 'Chapter 3', title: 'Escorted Out',
      onEnter: s => { if (s.pc.hp <= 0) s.pc.hp = 1; },
      body: () => [P('You wake at the bottom of the stair, unhurt, unpursued, and — the chief’s parting gift — missing one bootlace. A message, in goblin diplomacy.')],
      choices: () => [{ label: 'Back to the bakery floor', next: 'floor' }]
    },

    apartment_drawer: {
      chapter: 'Chapter 3', title: 'The Second Half',
      body: () => [
        P('The drawer is trapped — you can see the seam, the spring, the green stain — and it is also, plainly, the only place in this room a careful woman would have kept the rest of her heart.')
      ],
      choices: () => [
        { label: 'Disarm the trap', tag: 'DC 16 Dex', check: { ability: 'dex', dc: 16, success: 'apartment_half', failure: 'apartment_trap' } },
        { label: 'Open it and take the sting', tag: 'Hasty', next: 'apartment_trap' }
      ]
    },

    apartment_trap: {
      chapter: 'Chapter 3', title: 'The Needle, Again',
      onEnter: s => {
        hurt(s, 1, 'piercing');
        const r = E.roll(s, { ability: 'con', dc: 15, label: 'Constitution save vs poison' });
        s.lastRoll = r; s.flags.needleSave2 = r.pass;
        if (!r.pass && !E.hasTrait(s, 'poisonres')) hurt(s, E.rollDice('1d10').total, 'poison');
        if (s.pc.hp <= 0) s.pc.hp = 1;
        E.addItem(s, 'half_apt_done'); E.setIngredient(s, 'half_apartment', 2); E.setIngredient(s, 'spellbook', 2);
      },
      body: s => [
        P('The needle stabs out of the dark: 1 piercing, and cold poison up the wrist.'),
        s.flags.needleSave2 || E.hasTrait(s, 'poisonres') ? W('Your body throws it off.') : W('The room tilts for an hour.'),
        P('Inside: <strong>the second half of the secret recipe</strong> — and a small spellbook, more like a spell notebook, containing the few spells old Grammy knew: <em>Druidcraft, Entangle, Purify Food and Drink, Speak with Plants</em>.')
      ],
      choices: () => [{ label: 'Take both, and go', next: 'floor' }]
    },

    apartment_half: {
      chapter: 'Chapter 3', title: 'The Whole of It, in Two Halves',
      onEnter: s => { E.addItem(s, 'half_apt_done'); E.setIngredient(s, 'half_apartment', 2); E.setIngredient(s, 'spellbook', 2); },
      body: () => [
        P('The spring sighs, disarmed. Inside: <strong>the second half of the secret recipe</strong>, and a small spellbook — more like a spell notebook — with the few spells old Grammy knew: <em>Druidcraft, Entangle, Purify Food and Drink, Speak with Plants</em>.'),
        W('Two halves. One recipe. One very old wizard waiting.')
      ],
      choices: () => [{ label: 'Take both, and go', next: 'floor' }]
    },

    /* ================= FINALE ================= */
    finale_gate: {
      chapter: 'Finale', title: 'The Long Road Back',
      body: s => {
        const both = (s.ingredients.half_office || 0) > 0 && (s.ingredients.half_apartment || 0) > 0;
        return [
          both
            ? P('In your pack, folded together at last: two torn halves of one flour-dusted whole. The road back to Trostenwald is shorter than the road out. It always is.')
            : P('You do not have the whole recipe. You know exactly what you do not have, and where it is, and the road back to Trostenwald is long enough to rehearse saying so.')
        ];
      },
      choices: () => [
        { label: 'Ride for Trostenwald', tag: 'Finale', primary: true, next: 'finale' },
        { label: 'Go back inside for what you missed', next: 'floor' },
        { label: 'Quit. Some jobs are not worth it.', tag: 'Walk away', next: 'ending_quit' }
      ]
    },

    finale: {
      chapter: 'Finale', title: 'The Wizard Reads',
      onEnter: s => { s.flags.endingId = E.resolveEnding(s); },
      body: s => [
        P('The imp lets you in without a word, as if the tower has been listening for your footsteps since the orchard. Tyndareus very slowly stands, and holds out his hands for the parchment.'),
        (s.ingredients.half_office || 0) > 0 && (s.ingredients.half_apartment || 0) > 0
          ? P('He reads it once. He reads it again. His face lights up as he reads through the recipe. <em>“Of course, of course! It all makes sense,”</em> he says. He uses Mending to repair the torn parchment, and gives it to his imp servant to make one, immediately.')
          : P('He reads what you brought, and the light comes up in his face — and stops, halfway, like a sunrise interrupted. <em>“This is only half,”</em> he says, gently, the way you would tell a child the moon is not, in fact, a pie.')
      ],
      choices: s => {
        const c = [];
        const both = (s.ingredients.half_office || 0) > 0 && (s.ingredients.half_apartment || 0) > 0;
        if (both && s.flags.bakeDone && s.flags.grammyBlessing && s.flags.goblinPact && s.world.dead === 0) {
          c.push({ label: 'Tear up the recipe.', tag: 'The Promise', primary: true, next: 'finale_torn' });
        }
        const id = s.flags.endingId || E.resolveEnding(s);
        c.push({ label: '➤ And then…', primary: c.length === 0, next: 'ending_' + id });
        return c;
      }
    },

    finale_torn: {
      chapter: 'Finale', title: 'The Promise',
      onEnter: s => { s.flags.tornRecipe = true; s.flags.endingId = 'reopened'; },
      body: s => [
        P('Tyndareus’s hands are already outstretched for the parchment when you do the thing you rehearsed on every mile of the road back. You tear it. Cleanly — twice, four times — until Grammy’s secret recipe is confetti in an old wizard’s study.'),
        P('Crimp makes a sound like a kettle dropped from a shelf.'),
        SAID('Tyndareus', '…What have you <em>done</em>?'),
        s.flags.crimpKind
          ? P('Crimp looks at you. You look at Crimp. And Crimp — nobody’s favorite, always overlooked, four hundred years of carrying other people’s tea — very quietly sets down the tray, and stands beside you.')
          : P('Crimp freezes halfway to picking up the pieces, looks at your face, and — for the first time in four hundred years — decides to wait and see.'),
        SAID('You', 'If you ever really want to find this pie again, you go with me to the bakery in the morning. The recipe lives there. So does the woman who wrote it. So does everybody who kept it alive.'),
        SAID('You', 'Maybe not everyone that you knew is here anymore. But don’t forget about the people you do have around you.')
      ],
      choices: () => [{ label: '➤ And then…', primary: true, next: 'ending_reopened' }]
    },

    /* ================= ENDINGS ================= */
    ending_perfect: {
      chapter: 'Finale', title: 'The Best Pie in the World',
      body: s => [
        STARS(E.pieQuality(s)),
        P('He rummages in a drawer for a moment, then emerges with a rust-colored leather bag. <em>“I think you’ll find that quite entertaining,”</em> he says, with a twinkle in his eye. He also gives you <strong>1000 gold pieces, in a bag of holding</strong> — the bonus for a peaceful road, paid without being asked.'),
        P('The imp returns impossibly fast with a wonderful-smelling pie, and Tyndareus offers to share it with you. It is, indeed, the tastiest apple pie you have ever had the pleasure to eat. Somewhere in it, if you brought them, are Mac’s apples and the exotic spices, and the orchard’s goodwill, and it tastes like all of those things were ingredients all along.'),
        P('The rust-colored bag is a <strong>Bag of Tricks</strong>, which is, of course, fun. You will be telling this story for the rest of your life, and no one will ever believe the part about the tree.'),
        GALLERY()
      ],
      choices: () => [{ label: ' Play again — different choices, different ending', tag: 'Restart', next: '__restart' }]
    },

    ending_gold: {
      chapter: 'Finale', title: 'A Thousand Gold',
      body: s => [
        STARS(E.pieQuality(s)),
        P('He pays you in full — a heavy purse, no questions — and the imp bakes the pie from your two halves, and it is good, and he eats it standing up, looking out of the window, and does not offer you a slice.'),
        P('There was no bonus award. All he really wanted was the recipe, and he asked, politely, for a peaceful way; and the road you took was not a peaceful one. Goblins have long memories. So, it turns out, do gnomes.'),
        GALLERY()
      ],
      choices: () => [{ label: '🎲 Play again — different choices, different ending', tag: 'Restart', next: '__restart' }]
    },

    ending_goblins: {
      chapter: 'Finale', title: 'Pie for Everyone',
      body: s => [
        STARS(E.pieQuality(s)),
        P('You keep your word. Before you hand over the parchment, you say it aloud, slowly, twice, the way you would tell it to someone who cannot read and will never forget — and somewhere, four days away, three goblins sit in a ruined bakery repeating it back to each other like a prayer.'),
        P('Tyndareus listens, and twinkles, and pays you the bonus anyway. <em>“A recipe is only a promise people keep together,”</em> he says. <em>“You just added three very small, very green keepers.”</em>'),
        P('The pie is wonderful. Somewhere out there, the bakery has new bakers, and the orchard has new guardians, and the smell is coming back to the ruined village one spice at a time.'),
        GALLERY()
      ],
      choices: () => [{ label: '🎲 Play again — different choices, different ending', tag: 'Restart', next: '__restart' }]
    },

    ending_half: {
      chapter: 'Finale', title: 'Half a Recipe',
      body: s => [
        STARS(E.pieQuality(s)),
        P('He reads the half you brought, and smiles at it the way you smile at half a photograph. <em>“This is only half the recipe,”</em> he says. <em>“You’ll have to go back for the rest.”</em>'),
        P('He is disappointed, but not unkind, and he pays your expenses, and he pours you tea while you decide whether the road is done with you or you are done with the road.'),
        W('The other half is still out there. In a drawer. With a needle in it.'),
        GALLERY()
      ],
      choices: () => [{ label: '🎲 Play again — different choices, different ending', tag: 'Restart', next: '__restart' }]
    },

    ending_reopened: {
      chapter: 'Finale', title: 'Grammy’s Bakery, Reopened',
      onEnter: s => {
        s.flags.endingId = 'reopened';
        s.flags.tornRecipe = true;
        E.levelUp(s);
        E.remember(s, 'You reopened Grammy’s Bakery. They call you the one who brought the smell back.');
      },
      body: s => [
        STARS(E.pieQuality(s)),
        P('In the morning, to everybody’s astonishment — most of all his own — Tyndareus the Green comes. He is dressed for a journey he has not taken in sixty years. Crimp carries the satchel and walks one step ahead, like a guide, like a <em>somebody</em>.'),
        P('The goblins meet the old wizard at the door in a row, flour to their elbows, terrified, magnificent. Grubnash shakes his hand with both hands. The Oven says <strong>“WELCOME”</strong> — two whole syllables, a personal record — and the pies come out of it golden, on schedule, for the first time in forty years.'),
        P('The first slice does not go to the wizard. It goes to <strong>Crimp</strong> — because nobody has ever given Crimp anything, and you would like the record to show that it happened on your watch. The second goes to Tyndareus, who takes one bite, sits down very slowly on a bench, and is quiet for a while, in the good way.'),
        P('You do not take the recipe, because the recipe was never the point. Grammy Smithwick leans in the office doorway with her arms folded and the smug, shining satisfaction of a woman whose kitchen is <em>working</em>. Mac sends six apples up the road with a sapling that follows you home like a dog. And somewhere in the ruined village, the smell comes back — spices, all day and night, no matter where you stand.'),
        P('They give you 25 gold, which is everything the till has, and free pie at Grammy’s forever, and a new name that will follow you the rest of your life: <strong>the one who reopened Grammy’s Bakery</strong>.'),
        W('You are level 2. You have a family now: a crew, an imp, an ancient wizard, a ghost with standards, and one very contented Oven. The real secret ingredient was never in the recipe.')
      ],
      choices: () => [{ label: '🎲 Play again — different choices, different ending', tag: 'Restart', next: '__restart' }]
    },

    ending_quit: {
      chapter: 'Finale', title: 'The Pie-Less Fate',
      onEnter: s => { s.flags.endingId = 'quit'; },
      body: s => [
        STARS(1),
        P('You tell him it is too far, or too strange, or simply not yours to do. He is disappointed, but resigned to his pie-less fate, and he thanks you for coming, and the imp walks you out with the teacup you never finished.'),
        P('Some cravings are not yours to feed. Some jobs are not your jobs. You will still, some autumn evenings, catch a smell of cinnamon and apples on the wind, and stop, and stand still for a moment, and not know why.'),
        GALLERY()
      ],
      choices: () => [{ label: '🎲 Play again — different choices, different ending', tag: 'Restart', next: '__restart' }]
    },

    ending_compost: {
      chapter: 'Finale', title: 'Compost',
      onEnter: s => { s.flags.endingId = 'compost'; },
      body: s => [
        STARS(0),
        P('You threatened the orchard, and the orchard answered. Mac does not kill — he is not that kind of old — but he aims to incapacitate, and he is very, very good at it.'),
        P('You wake at the tree-line, mulched, mulled, and firmly planted, in the sense that your boots have been set into the soil with an authority you will not be appealing. The road home is long. The apples, at least, are free.'),
        GALLERY()
      ],
      choices: () => [{ label: '🎲 Play again — different choices, different ending', tag: 'Restart', next: '__restart' }]
    },

    /* ================= TITLE ================= */
    __title: {
      chapter: '', title: 'Grammy’s Country Apple Pie',
      body: () => [
        P('A one-session <strong>Dungeons &amp; Dragons</strong> adventure, faithful to the one-shot by Jennifer Adcock. An ancient gnome wizard wants one last taste of the best pie in the world. The bakery is ruined. The orchard is watching. The goblins are <em>addicted</em>.'),
        P('You will build a level 1 character — species, class, origin, look, skills — and every choice you make will change the numbers on your sheet and the ending you get.'),
        W('Real dice. Real modifiers. Real consequences. Every fight is avoidable — and everything you do is <em>remembered</em>. There are seven endings, and the truest one is very hard to find.')
      ],
      choices: () => [{ label: '🎲 Begin character creation', tag: 'Start', primary: true, next: '__create' }]
    }
  };

  function getNode(id) { return NODES[id] || null; }
  const nodeIds = () => Object.keys(NODES);

  return { NODES, getNode, nodeIds };
});
