/* =========================================================
   story.js — "Grammy's Country Apple Pie"
   A one-session D&D campaign. Every choice moves a real number.
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
  const BANNER = (text, kind = '') => ({ type: 'banner', text, kind });
  const STARS = n => ({ type: 'stars', n });
  const GALLERY = () => ({ type: 'gallery' });
  const ROLLNOTE = () => ({ type: 'rollnote' });
  const COMBATVIEW = () => ({ type: 'combat' });
  const SHEETCARD = () => ({ type: 'sheetcard' });

  const clueCount = s => s.clues.length;
  const pc = s => s.pc;

  /* ---------- the secret ingredient, one per class ---------- */
  const MEMORY_TEXT = {
    fighter: 'You think of the winter you spent holding a gate in the Kess pass with nine people behind you, and the cook who came up the line at midnight with a bowl of something hot for every single one of them, and would not take no. You never learned her name. You have never forgotten the bowl.',
    rogue: 'You think of the night you broke into a merchant’s house in Vess and found a kitchen, and you were so hungry you ate standing up at the counter with your boots still on, and the woman of the house came down, looked at you, said nothing at all, and put a second plate on the table. You left through the window. You left the silver.',
    wizard: 'You think of your master’s tower, and how she taught you Prestidigitation on a burnt pot of stew, and how she said: magic is only the part of cooking you can see. The rest of it is someone deciding you were worth feeding. You wrote that in the margin of your spellbook in year one and you have never crossed it out.',
    bard: 'You think of a song. Not a good one — a bad one, four chords, that your grandmother sang wrong every single time while the bread was proving, and everyone in the house sang it wrong with her. You have performed in front of nine hundred people. You have never once gotten it right, on purpose.',
    cleric: 'You think of the year the fever came through, and how your order kept a pot on the fire for eleven weeks, and how at the end of it there was nothing left in the stores but barley and one apple that had gone soft, and how your superior split that apple into forty pieces and took none of it.',
    ranger: 'You think of a fire you did not build. You came down off the ridge in the dark and it was already lit, and there was a tin plate on a log with your name scratched into the handle by someone who knew you walked that way. You never found out who. You have walked that way every autumn since.'
  };

  /* ---------- class-specific way to give the secret ingredient ---------- */
  const MEMORY_ACTION = {
    fighter: 'You tell it plainly, the way you would give an order: who it is for, and why, and that they are not to argue.',
    rogue: 'You tell it quietly, close to the dish, so that nobody else in the room can take it off you.',
    wizard: 'You say the words in the old order, the way a spell wants them, and the kitchen gets very still.',
    bard: 'You sing it. Four chords. Wrong, on purpose, the way it was always sung.',
    cleric: 'You say it as a blessing, hands flat on the tin, the way you were taught to bless bread.',
    ranger: 'You say it out loud to the room the way you would call across a valley, because that is how it was said to you.'
  };

  /* =========================================================
     NODES
     ========================================================= */
  const NODES = {

    /* ================= PROLOGUE ================= */
    arrival: {
      chapter: 'Prologue', title: 'The Road to Bramblewick',
      body: () => [
        P('The cart road drops out of the hills in the last hour of daylight, and the first thing you notice is not the village. It is the smell.'),
        P('Bramblewick sits in a bowl of orchard — row after row of apple trees going russet and gold, smoke rising straight up out of a hundred chimneys because there is no wind at all, and underneath everything the warm brown smell of baking.'),
        W('Tomorrow is the Harvest Fair. Every lantern in the valley is already lit.'),
        P('You came here for a reason. Everyone in three counties knows the reason, even if they would be too polite to say it out loud: <em>Grammy Wren’s country apple pie.</em>')
      ],
      choices: () => [
        { label: 'Follow the lane down into the village.', tag: 'Continue', primary: true, next: 'cottage_door' }
      ]
    },

    cottage_door: {
      chapter: 'Prologue', title: 'The Cottage at the Edge of the Orchard',
      body: () => [
        P('At the end of the lane, where the cultivated rows give up and the old trees take over, there is a cottage with a crooked chimney and a kitchen window propped open with a wooden spoon.'),
        P('There is a pie cooling rack under that window. It is empty.'),
        P('The door is open too. You can hear somebody inside, talking to herself in the low furious mutter of a person who has been wronged by the universe.'),
        SAID('Grammy Wren', 'Fourteen steps. I counted. Fourteen steps from the oven to the sill, and I have walked them every year since before your mother was a thought, and I have never once — not ONCE — come back to an empty rack.')
      ],
      choices: () => [
        { label: 'Knock on the doorframe and announce yourself.', tag: 'Polite', next: 'meet_grammy' },
        {
          label: 'Say nothing. Examine the empty pie rack first.',
          tag: 'Perception DC 11', tagKind: '',
          hint: 'Something is wrong with the rack itself.',
          next: 'meet_grammy',
          check: {
            label: 'Perception', skill: 'perception', dc: 11, context: {},
            success: 'rack_seen', failure: 'meet_grammy'
          }
        }
      ]
    },

    rack_seen: {
      chapter: 'Prologue', title: 'What the Rack Tells You',
      body: () => [
        ROLLNOTE(),
        P('The rack is cold. Not cool — <em>cold</em>, the temperature of a thing that has been sitting empty all day, which means the pie was not taken from it this morning. It was taken from it in the night.'),
        P('And there, in the dust on the wood, one clean circle where a tin sat, and beside it — small, shallow, spaced close together — a set of boot prints too small for any adult in this valley.')
      ],
      choices: () => [
        {
          label: 'Pocket the knowledge. Knock on the door.',
          next: 'meet_grammy',
          do: s => { E.setFlag(s, 'knowsNight'); }
        }
      ]
    },

    meet_grammy: {
      chapter: 'Prologue', title: 'Grammy Wren',
      body: () => [
        P('She is seventy-eight years old and four foot eleven and she crosses the kitchen in three strides with the speed of a woman who has spent six decades not having time for nonsense. Her hands are knotted like old rope. Her apron is older than you are.'),
        SAID('Grammy Wren', 'Well. Don’t stand in my apples. Come in, come in, you’re letting the heat out and wood is expensive.'),
        P('She looks you up and down once, decides something about you in about a second and a half, and pushes a chair out with her foot.'),
        SAID('Grammy Wren', 'Sit. You’re the one they sent, or you’re the one who came, and either way you’re here, so — tea. And then you are going to help me, because I am out of time and out of pie and I refuse to be out of both at the same fair.')
      ],
      choices: () => [
        { label: 'Sit down and ask what happened.', tag: 'Continue', primary: true, next: 'grammy_plea' }
      ]
    },

    grammy_plea: {
      chapter: 'Prologue', title: 'Thirty-Nine Blue Ribbons',
      body: () => [
        P('For forty-one years, Grammy Wren has entered one pie into the Bramblewick Harvest Fair. For thirty-nine of those years she has won it.'),
        P('It is not a large pie. It is not decorated. It is a country apple pie with a lattice top and a crust the colour of a good idea, and there are people in this valley who will drive two days for one slice of it.'),
        SAID('Grammy Wren', 'I set it on the sill at nine. A pie that doesn’t see the sky comes out sad, that’s just a fact, you can write it down. At six I went to turn it and the sill was empty.'),
        P('She sits down then, which seems to cost her something, and she looks at her hands instead of at you.'),
        SAID('Grammy Wren', 'There is one more thing and I am only going to say it once.'),
        SAID('Grammy Wren', 'I have been forgetting things. Little things. Where I put the salt. Which year the frost came. And this spring I forgot the <em>last step</em> of the pie.'),
        SAID('Grammy Wren', 'I can taste it. I know it is in there. I have stood at that oven four hundred times with my hand on the door waiting for it to come back and it does not come back. Ezra used to say that step out loud, every single time, and then Ezra died, and I never wrote it down, because he asked me not to, and I said I wouldn’t, and I was <em>right</em> not to, and now I am the only one who knows it and I do not know it any more.'),
        W('The kitchen is very quiet. Somewhere outside, an apple drops.'),
        SAID('Grammy Wren', 'So. Two problems. Somebody has my pie. And I have lost my recipe. I intend to fix both of them before noon tomorrow, and you have hands, so you are helping.')
      ],
      choices: () => [
        {
          label: '“I’ll find your pie. And we’ll find the step.”',
          tag: 'Begin', primary: true, next: 'hub',
          do: s => { E.setFlag(s, 'promised'); }
        }
      ]
    },

    /* ================= THE HUB ================= */
    hub: {
      chapter: 'Act I', title: 'Bramblewick',
      body: s => {
        const b = [
          BANNER(`Clues found: ${clueCount(s)} of 5`, clueCount(s) >= 3 ? 'gold' : ''),
          P('Bramblewick is small enough to walk end to end in nine minutes and old enough that everybody in it knows everybody else’s business before they know it themselves.'),
          P('The Fair is at noon tomorrow. Until then, the village is yours.')
        ];
        if (clueCount(s) >= 3) {
          b.push(P('<em>Something is nagging at you. Small boot prints. A ladder that wasn’t there before. Whoever took that pie did not go far.</em>'));
          b.push(W('You could go looking in the old orchard now.'));
        } else {
          b.push(W('You need more to go on. Three solid clues, at least.'));
        }
        return b;
      },
      choices: s => {
        const c = [];
        if (!s.flags.doneOrchard) c.push({ label: '🍎 The Old Orchard — where the tracks lead', tag: 'Explore', next: 'orchard_edge' });
        else if (!s.flags.gotApples) c.push({ label: '🍎 Back to the orchard for apples', tag: 'Ingredient', next: 'orchard_apples' });
        if (!s.flags.doneMill) c.push({ label: '🌾 The Mill — Miller Bran has flour and opinions', tag: 'Explore', next: 'mill' });
        if (!s.flags.doneBakery) c.push({ label: '🍞 Mabel’s Bakery — cinnamon, and gossip', tag: 'Explore', next: 'bakery' });
        if (!s.flags.doneTavern) c.push({ label: '🍺 The Crooked Crumb — everybody talks in there', tag: 'Explore', next: 'tavern' });
        if (!s.flags.doneBees) c.push({ label: '🐝 The Wild Hives on the south slope', tag: 'Explore', next: 'beehive' });
        if (!s.flags.talkedGrammy) c.push({ label: '🏠 Stay in Grammy’s kitchen and talk to her', tag: 'Explore', next: 'grammy_kitchen' });
        if (clueCount(s) >= 3) {
          c.push({ label: '🌳 Follow the trail into the old orchard — to the hollow oak', tag: 'Act I finale', tagKind: 'good', primary: true, next: 'hollow_oak' });
        }
        // Safety net: the story can never dead-end in the hub.
        if (c.length === 0) {
          c.push({ label: '🌳 You have seen all there is to see. Go to the hollow oak.', tag: 'Act I finale', tagKind: 'good', primary: true, next: 'hollow_oak' });
        }
        return c;
      }
    },

    /* ================= ORCHARD ================= */
    orchard_edge: {
      chapter: 'Act I', title: 'The Old Orchard',
      body: () => [
        P('Past the neat rows the trees get strange. These are the originals — eighty, ninety years old, twisted into shapes like handwriting, moss to the knees. Nobody prunes back here. Grammy says the good apples all come from the front rows, and the back rows are for the birds and for remembering.'),
        P('The ground is soft from last night’s rain, which is either a great deal of luck or the only reason this mystery is solvable at all.')
      ],
      choices: () => [
        {
          label: 'Read the tracks in the mud.',
          tag: 'Survival DC 12', hint: 'Grammy’s orchard. Your ranger would know it.',
          check: { label: 'Survival (tracking)', skill: 'survival', dc: 12, context: { wilds: true }, success: 'tracks_good', failure: 'tracks_bad' },
          next: 'tracks_bad'
        },
        {
          label: 'Just look around carefully instead.',
          tag: 'Perception DC 13',
          check: { label: 'Perception', skill: 'perception', dc: 13, context: {}, success: 'tracks_good', failure: 'tracks_bad' },
          next: 'tracks_bad'
        }
      ]
    },

    tracks_good: {
      chapter: 'Act I', title: 'Fourteen Steps',
      body: s => [
        ROLLNOTE(),
        P('Small boots. Short stride. Somebody about twelve years old, going fast, carrying something awkward in both arms — the prints are deep at the heel and scuffed at the toe, the way they are when your hands are full and you are leaning back to balance.'),
        P('They go from Grammy’s window, straight through the old orchard, and they stop at the great hollow oak at the far end.'),
        P('They do not come back out.')
      ],
      choices: () => [
        {
          label: 'Take a rubbing of the print and mark the tree.',
          tag: 'Clue', next: 'orchard_ladder',
          do: s => { E.addClue(s, 'tracks'); }
        }
      ]
    },

    tracks_bad: {
      chapter: 'Act I', title: 'Mud Is Just Mud',
      body: s => [
        ROLLNOTE(),
        P('There are prints. There are a great many prints. There are deer prints, boot prints, one print that might be a boot or might be a very confident goose.'),
        P('You do get one thing: a set of small ones heading away from the cottage toward the back of the orchard, and something dragged alongside them, low to the ground, about the size of a pie tin.')
      ],
      choices: () => [
        {
          label: 'It is enough. Follow the general direction.',
          tag: 'Clue', next: 'orchard_ladder',
          do: s => { E.addClue(s, 'tracks'); E.setFlag(s, 'weakTracks'); }
        }
      ]
    },

    orchard_ladder: {
      chapter: 'Act I', title: 'The Ladder',
      body: () => [
        P('Against the side of the old barn there is a ladder. There is also, in the mud where the ladder has stood for perhaps forty years, a clean rectangle where the ladder is <em>not</em>.'),
        P('It has been moved. Recently. And it has been moved toward the hollow oak.')
      ],
      choices: s => {
        const c = [];
        c.push({
          label: 'Note it. Someone is climbing something out here.',
          tag: 'Clue', next: 'orchard_return',
          do: s => { E.addClue(s, 'ladder'); }
        });
        if (!s.flags.gotApples) {
          c.push({
            label: 'While you are here — pick apples. A pie needs apples.',
            tag: 'Athletics DC 11', hint: 'The good ones are never within reach.',
            next: 'orchard_apples'
          });
        }
        return c;
      }
    },

    orchard_apples: {
      chapter: 'Act I', title: 'Picking',
      body: () => [
        P('Grammy’s rule, stated roughly forty times a season: if you can reach it from the ground, it is not ready.'),
        P('The Wren russets grow high and on the outside branches, over the drop, where the sun gets them. They are the ugly ones — knobbly, brown-freckled, the colour of old leather. They taste like October.')
      ],
      choices: s => {
        const c = [
          {
            label: 'Climb for the high outside fruit.',
            tag: 'Athletics DC 11',
            check: { label: 'Athletics (climbing)', skill: 'athletics', dc: 11, context: {}, success: 'apples_best', failure: 'apples_ok' },
            next: 'apples_ok'
          },
          {
            label: 'Take only what the tree has already dropped. Safe, and fast.',
            tag: 'Safe',
            next: 'apples_ok'
          }
        ];
        if (E.hasFeature(s, 'forager')) {
          c.push({
            label: '🏹 Forage properly — you know which trees carry and which don’t.',
            tag: 'Ranger', tagKind: 'good', hint: 'Natural Explorer: you always find an extra helping.',
            next: 'apples_best'
          });
        }
        return c;
      }
    },

    apples_best: {
      chapter: 'Act I', title: 'The Good Ones',
      body: s => [
        ROLLNOTE(),
        P('Twenty minutes up a ninety-year-old tree gets you a full apron of Wren russets — high-branch fruit, sun-hit, heavy with sugar, the kind that breaks your teeth on the first bite and then ruins every other apple for you.'),
        P('You come down with scratched forearms and a very smug expression.')
      ],
      choices: () => [
        {
          label: 'Carry them home.', tag: 'Ingredient: Apples ★★★', tagKind: 'good', next: 'orchard_return',
          do: s => { E.setIngredient(s, 'apples', 2); E.setFlag(s, 'gotApples'); }
        }
      ]
    },

    apples_ok: {
      chapter: 'Act I', title: 'Windfalls',
      body: s => [
        ROLLNOTE(),
        P('You get apples. Plenty of them. Some are bruised, some have been at by a wasp, one has clearly been claimed by a beetle with ambitions.'),
        P('They will make a pie. It will not be the pie it could have been.')
      ],
      choices: () => [
        {
          label: 'Carry them home anyway.', tag: 'Ingredient: Apples ★★', next: 'orchard_return',
          do: s => { E.setIngredient(s, 'apples', 1); E.setFlag(s, 'gotApples'); }
        }
      ]
    },

    orchard_return: {
      chapter: 'Act I', title: 'Back to the Lane',
      body: () => [P('The light is going. Back down the lane, the village is lighting up one window at a time.')],
      choices: () => [{ label: 'Head back into Bramblewick.', tag: 'Continue', next: 'hub' }],
      onEnter: s => { E.setFlag(s, 'doneOrchard'); }
    },

    /* ================= MILL ================= */
    mill: {
      chapter: 'Act I', title: 'Bramblewick Mill',
      body: () => [
        P('The mill sits on the stream at the bottom of the village with its wheel going slow and its whole building humming like a struck note. Inside it is loud, white, and warm.'),
        P('Miller Bran is the size of a doorframe and covered head to foot in flour, which makes him look like a ghost that has been working out.'),
        SAID('Miller Bran', 'If you’re here about the pie, I already told the constable I was asleep. I was asleep. Ask my wife. Actually don’t ask my wife.')
      ],
      choices: s => {
        const c = [
          {
            label: '“I’m not the constable. I’m here about flour.”',
            tag: 'Persuasion DC 12',
            check: { label: 'Persuasion', skill: 'persuasion', dc: 12, context: { villager: true }, success: 'mill_flour_good', failure: 'mill_flour_ok' },
            next: 'mill_flour_ok'
          },
          {
            label: 'Say nothing about the pie. Offer to help with the sacks first.',
            tag: 'Athletics DC 12', hint: 'Nothing loosens a miller like a shared backache.',
            check: { label: 'Athletics', skill: 'athletics', dc: 12, context: {}, success: 'mill_help', failure: 'mill_flour_ok' },
            next: 'mill_flour_ok'
          }
        ];
        if (E.hasTrait(s, 'minorillusion') === false && E.hasFeature(s, 'prestidigitation')) {
          c.push({
            label: '🔮 Prestidigitation: clean the flour off his good coat before he notices.',
            tag: 'Wizard / Bard', tagKind: 'good', hint: 'A small kindness, cast silently.',
            next: 'mill_help'
          });
        }
        return c;
      }
    },

    mill_help: {
      chapter: 'Act I', title: 'Six Sacks',
      body: s => [
        ROLLNOTE(),
        P('You haul six sacks. Bran hauls six sacks. By the fourth you are both too tired to be polite, which in a village is the same thing as being friends.'),
        P('He sits down on an upturned barrel and looks at you sideways.')
      ],
      choices: () => [{ label: 'Let him talk.', tag: 'Continue', next: 'mill_secret' }]
    },

    mill_flour_good: {
      chapter: 'Act I', title: 'Flour',
      body: s => [
        ROLLNOTE(),
        SAID('Miller Bran', 'Right. Right. Flour. Course.'),
        P('He goes to the good bin — not the bin he sells from, the <em>good</em> bin, the one with the stone-ground pastry flour that he keeps for his own house and pretends he does not have.')
      ],
      choices: () => [
        {
          label: 'Take the good flour.', tag: 'Ingredient: Flour ★★★', tagKind: 'good', next: 'mill_secret',
          do: s => { E.setIngredient(s, 'flour', 2); }
        }
      ]
    },

    mill_flour_ok: {
      chapter: 'Act I', title: 'Flour',
      body: s => [
        ROLLNOTE(),
        P('He gives you flour. It is perfectly good flour. It is the flour he sells. You will not be told twice that there was another bin.')
      ],
      choices: () => [
        {
          label: 'Take it and be grateful.', tag: 'Ingredient: Flour ★★', next: 'mill_secret',
          do: s => { E.setIngredient(s, 'flour', 1); }
        }
      ]
    },

    mill_secret: {
      chapter: 'Act I', title: 'What Bran Saw',
      body: () => [
        SAID('Miller Bran', 'Since you’ve been useful. Night before last, I was up — wheel jammed, happens — and I saw somebody go past on the orchard path. Small. Carrying something like a washboard, or a shield, or — well. A pie, maybe. Going <em>toward</em> the old trees.'),
        SAID('Miller Bran', 'And here’s the part. They came back an hour later without it. An hour. Whatever they were doing, they did it and then they went home.'),
        P('He looks uncomfortable, the way people do when they are about to say something about somebody’s child.')
      ],
      choices: () => [
        {
          label: '“Whose child was it, Bran?”',
          tag: 'Clue', next: 'mill_return',
          do: s => { E.addClue(s, 'bran'); }
        }
      ]
    },

    mill_return: {
      chapter: 'Act I', title: 'Out of the Mill',
      body: () => [SAID('Miller Bran', 'I didn’t say that. I said nothing. Go on with you.')],
      choices: () => [{ label: 'Back to the village.', tag: 'Continue', next: 'hub' }],
      onEnter: s => { E.setFlag(s, 'doneMill'); }
    },

    /* ================= BAKERY ================= */
    bakery: {
      chapter: 'Act I', title: 'Mabel’s Bakery',
      body: () => [
        P('Mabel runs the only other place in Bramblewick that bakes for the Fair, which means Mabel has come second to Grammy Wren for thirty-nine years and has developed a personality about it.'),
        P('Her shop smells of cardamom and resentment. Both are excellent.'),
        SAID('Mabel', 'Oh, she’s sent for help, has she. Forty-one years of <em>I don’t need anybody</em> and now there’s a stranger in her kitchen.')
      ],
      choices: s => {
        const c = [
          {
            label: '“She didn’t send me. I came. And I need cinnamon.”',
            tag: 'Persuasion DC 13',
            check: { label: 'Persuasion', skill: 'persuasion', dc: 13, context: { merchant: true }, success: 'bakery_good', failure: 'bakery_ok' },
            next: 'bakery_ok'
          },
          {
            label: '“Thirty-nine years running second. That must be its own kind of skill.”',
            tag: 'Risky', hint: 'Flattery, or a slap. Possibly both.',
            check: { label: 'Persuasion (delicate)', skill: 'persuasion', dc: 15, context: { merchant: true, important: true }, success: 'bakery_friend', failure: 'bakery_ok' },
            next: 'bakery_ok'
          }
        ];
        if (E.isProficient(s, 'sleight')) {
          c.push({
            label: '🗝️ Take the cinnamon off the shelf while she talks.',
            tag: 'Sleight of Hand DC 14', tagKind: 'gray', hint: 'It would work. It would also be a thing you did.',
            check: { label: 'Sleight of Hand', skill: 'sleight', dc: 14, context: {}, success: 'bakery_steal', failure: 'bakery_caught' },
            next: 'bakery_caught'
          });
        }
        return c;
      }
    },

    bakery_friend: {
      chapter: 'Act I', title: 'Mabel',
      body: s => [
        ROLLNOTE(),
        P('Mabel goes very still. Then she takes off her apron, folds it, and says — not bitterly, just plainly:'),
        SAID('Mabel', 'Do you know what the difference is? Between hers and mine? Mine is better balanced. I have the notes. Cardamom, a little orange peel, and my crust is objectively more consistent.'),
        SAID('Mabel', 'And hers tastes like somebody’s house. And everybody in this valley has eaten in that house. That’s the whole trick and I have <em>never</em> been able to buy it.')
      ],
      choices: () => [
        {
          label: '“Then help me make it. Please.”',
          tag: 'Clue', next: 'bakery_gift',
          do: s => { E.addClue(s, 'mabel'); E.setFlag(s, 'mabelAlly'); }
        }
      ]
    },

    bakery_gift: {
      chapter: 'Act I', title: 'Cinnamon',
      body: () => [
        P('Mabel is quiet for a moment. Then she goes into the back and comes out with a tin of true Ceylon cinnamon — the pale, brittle, expensive kind that nobody in a village this size should have and Mabel absolutely has.'),
        SAID('Mabel', 'Don’t tell her I gave you that. Tell her you found it.')
      ],
      choices: () => [
        {
          label: 'Take the cinnamon.', tag: 'Ingredient: Cinnamon ★★★', tagKind: 'good', next: 'bakery_return',
          do: s => { E.setIngredient(s, 'cinnamon', 2); }
        }
      ]
    },

    bakery_good: {
      chapter: 'Act I', title: 'Cinnamon',
      body: s => [
        ROLLNOTE(),
        P('She sells you the cinnamon at cost, which from Mabel is practically a hug, and she gives you one piece of information for free because she cannot help herself.')
      ],
      choices: () => [
        {
          label: 'Take it and listen.', tag: 'Ingredient: Cinnamon ★★★', tagKind: 'good', next: 'bakery_clue',
          do: s => { E.setIngredient(s, 'cinnamon', 2); }
        }
      ]
    },

    bakery_ok: {
      chapter: 'Act I', title: 'Cinnamon',
      body: s => [
        ROLLNOTE(),
        P('You get the cassia. It is fine. It is the cinnamon that goes in things. It is not the cinnamon that goes in <em>this</em> thing.')
      ],
      choices: () => [
        {
          label: 'Pay and go.', tag: 'Ingredient: Cinnamon ★★', next: 'bakery_clue',
          do: s => { E.setIngredient(s, 'cinnamon', 1); }
        }
      ]
    },

    bakery_steal: {
      chapter: 'Act I', title: 'Cinnamon',
      body: s => [
        ROLLNOTE(),
        P('The tin goes into your coat with the smoothness of long practice. Mabel does not blink.'),
        W('Somewhere behind your ribs, a small cold thing makes a note of this.')
      ],
      choices: () => [
        {
          label: 'Thank her and leave.', tag: 'Ingredient: Cinnamon ★★★', next: 'bakery_clue',
          do: s => { E.setIngredient(s, 'cinnamon', 2); E.setFlag(s, 'stoleFromMabel'); }
        }
      ]
    },

    bakery_caught: {
      chapter: 'Act I', title: 'Hands',
      body: s => [
        ROLLNOTE(),
        SAID('Mabel', 'Ah.'),
        P('She does not shout. She just looks at your hand, and then at your face, and the look is worse than shouting.'),
        SAID('Mabel', 'You want it, you buy it. That’s the whole arrangement, that’s the whole <em>civilisation</em>, dear.'),
        P('You buy the cassia at full price and she does not speak to you again.')
      ],
      choices: () => [
        {
          label: 'Take the cheap cinnamon and go.', tag: 'Ingredient: Cinnamon ★', next: 'bakery_clue',
          do: s => { E.setIngredient(s, 'cinnamon', 1); E.setFlag(s, 'mabelAngry'); }
        }
      ]
    },

    bakery_clue: {
      chapter: 'Act I', title: 'The Other Thing Mabel Knows',
      body: () => [
        SAID('Mabel', 'One thing. Free. Because I am not a monster and because she has beaten me for thirty-nine years and I would rather she beat me at the Fair than not at all.'),
        SAID('Mabel', 'Her windowsill. Forty-one years. Do you know why she cools it outside? Because Ezra built that sill. He built the whole kitchen extension, and he cut the sill stone himself, and she puts the pie there because that is where <em>he</em> put it. It isn’t a technique. It’s a habit with a ghost in it.'),
        SAID('Mabel', 'And there’s an old root cellar under that orchard that Ezra dug out and never told anybody about, because Ezra was like that.')
      ],
      choices: () => [
        {
          label: '“A root cellar.”', tag: 'Clue', next: 'bakery_return',
          do: s => { E.addClue(s, 'cellar_rumour'); }
        }
      ]
    },

    bakery_return: {
      chapter: 'Act I', title: 'Into the Street',
      body: () => [P('The cardamom follows you all the way down the lane.')],
      choices: () => [{ label: 'Back to the village.', tag: 'Continue', next: 'hub' }],
      onEnter: s => { E.setFlag(s, 'doneBakery'); }
    },

    /* ================= TAVERN ================= */
    tavern: {
      chapter: 'Act I', title: 'The Crooked Crumb',
      body: () => [
        P('Eleven people, one fire, and a dog that has been asleep in the same patch of sunlight since the previous administration. When you come in, the conversation does not stop — it just drops about a note and a half and waits for you to sit down.'),
        W('This is where Bramblewick keeps its records.')
      ],
      choices: s => {
        const c = [
          {
            label: 'Buy a round and let them talk at you.',
            tag: 'Persuasion DC 11',
            check: { label: 'Persuasion', skill: 'persuasion', dc: 11, context: { villager: true }, success: 'tavern_good', failure: 'tavern_ok' },
            next: 'tavern_ok'
          },
          {
            label: 'Ask about the pie directly, loudly, to the room.',
            tag: 'Intimidation DC 14', tagKind: 'gray',
            check: { label: 'Intimidation', skill: 'intimidation', dc: 14, context: { official: true }, success: 'tavern_intimidate', failure: 'tavern_ok' },
            next: 'tavern_ok'
          }
        ];
        if (E.isProficient(s, 'performance')) {
          c.push({
            label: '🪕 Get the lute out. Earn the room the old way.',
            tag: 'Performance DC 12',
            check: { label: 'Performance', skill: 'performance', dc: 12, context: { important: true }, success: 'tavern_song', failure: 'tavern_ok' },
            next: 'tavern_ok'
          });
        }
        return c;
      }
    },

    tavern_song: {
      chapter: 'Act I', title: 'Two Verses and a Chorus',
      body: s => [
        ROLLNOTE(),
        P('You play the one about the miller’s daughter and then, because they are warmed up, you make one up about a pie, and by the second verse the whole room is singing the chorus wrong, which is the highest honour available in this building.'),
        P('The dog wakes up. This has not happened since spring.')
      ],
      choices: () => [{ label: 'Let them tell you everything.', tag: 'Continue', next: 'tavern_reveal' }]
    },

    tavern_good: {
      chapter: 'Act I', title: 'The Room Opens Up',
      body: s => [ROLLNOTE(), P('Ale goes a long way in a village with one tavern. Within ten minutes you are not a stranger any more, you are a person who bought something.')],
      choices: () => [{ label: 'Listen.', tag: 'Continue', next: 'tavern_reveal' }]
    },

    tavern_intimidate: {
      chapter: 'Act I', title: 'The Room Goes Quiet',
      body: s => [
        ROLLNOTE(),
        P('It works, in the sense that they talk. It does not work in the sense that anybody likes it, and one old man at the fire says <em>“right, then”</em> in a tone that will follow you around this village.'),
        W('You get the information. You will pay for it at the Fair.')
      ],
      choices: () => [{
        label: 'Listen.', tag: 'Continue', next: 'tavern_reveal',
        do: s => { E.setFlag(s, 'scaredVillage'); }
      }]
    },

    tavern_ok: {
      chapter: 'Act I', title: 'Crumbs',
      body: s => [ROLLNOTE(), P('You get scraps. A name, a rumour, half a thing about a ladder. It is not nothing.')],
      choices: () => [{ label: 'Take what you can get.', tag: 'Continue', next: 'tavern_reveal' }]
    },

    tavern_reveal: {
      chapter: 'Act I', title: 'The Marsh Family',
      body: s => [
        P('It comes out in pieces, the way village information always does.'),
        SAID('Old Hal', 'Marsh place, up the hollow. Been empty since the father went off for the levies. Girl’s in there with the two little ones. Pip, she’s called. Twelve, maybe thirteen, hard to say, she’s small for it.'),
        SAID('Old Hal', 'Constable went up there twice. Comes back and says there’s nothing to see and then he goes and sits in the church for an hour, which is his way.'),
        SAID('A woman by the fire', 'Her brother’s poorly. The little one. Thom. Been poorly since the spring and there’s no coin for the apothecary and there isn’t going to be, and that is the entire story of this village, dear, it has always been the entire story.')
      ],
      choices: () => [
        {
          label: 'Ask who else might want Grammy’s pie gone.',
          tag: 'Clue', next: 'tavern_return',
          do: s => { E.addClue(s, 'gossip'); E.setFlag(s, 'knowsPip'); }
        }
      ]
    },

    tavern_return: {
      chapter: 'Act I', title: 'Last Orders',
      body: () => [SAID('Old Hal', 'You’re not the constable’s sort, are you. Good. Don’t be.')],
      choices: () => [{ label: 'Back into the village.', tag: 'Continue', next: 'hub' }],
      onEnter: s => { E.setFlag(s, 'doneTavern'); }
    },

    /* ================= BEES ================= */
    beehive: {
      chapter: 'Act I', title: 'The Wild Hives',
      body: () => [
        P('On the south slope, under a low rock shelf out of the wind, there are five wild hives in the hollows of a dead elm. Nobody owns them. Grammy has taken honey from them for forty years and says the arrangement is that she leaves more than she takes.'),
        P('The bees are up. It is a warm afternoon and they know it.'),
        W('Grammy’s pie has two tablespoons of wildflower honey in it. Not much. It matters enormously.')
      ],
      choices: s => {
        const c = [
          {
            label: 'Move slow, move low, smoke them gently, take a comb.',
            tag: 'Animal Handling DC 13',
            check: { label: 'Animal Handling', skill: 'animal', dc: 13, context: { beasts: true }, success: 'bees_good', failure: 'bees_stung' },
            next: 'bees_stung'
          },
          {
            label: 'Study the hives first. Learn which one is calm.',
            tag: 'Nature DC 12',
            check: { label: 'Nature', skill: 'nature', dc: 12, context: { beasts: true }, success: 'bees_nature', failure: 'bees_stung' },
            next: 'bees_stung'
          }
        ];
        if (E.hasTrait(s, 'minorillusion')) {
          c.push({
            label: '😈 Thaumaturgy: conjure the sound of a rival swarm fifty feet off.',
            tag: 'Tiefling', tagKind: 'good', hint: 'Bees are not bright. Bees are, however, competitive.',
            next: 'bees_good'
          });
        }
        return c;
      }
    },

    bees_nature: {
      chapter: 'Act I', title: 'The Fourth Hive',
      body: s => [
        ROLLNOTE(),
        P('The fourth hive is a split colony — young queen, small population, gentle stock, and it has put up more than it needs.'),
        P('You take one comb from the fourth hive and nothing else, and not one bee comes off the board.')
      ],
      choices: () => [{
        label: 'Jar the honey.', tag: 'Ingredient: Honey ★★★', tagKind: 'good', next: 'bees_clue',
        do: s => { E.setIngredient(s, 'honey', 2); }
      }]
    },

    bees_good: {
      chapter: 'Act I', title: 'One Comb',
      body: s => [
        ROLLNOTE(),
        P('Slow. Low. Smoke like a rumour rather than a fact. You get a full comb of dark wildflower honey and the elm stays quiet around you.')
      ],
      choices: () => [{
        label: 'Jar the honey.', tag: 'Ingredient: Honey ★★★', tagKind: 'good', next: 'bees_clue',
        do: s => { E.setIngredient(s, 'honey', 2); }
      }]
    },

    bees_stung: {
      chapter: 'Act I', title: 'An Arrangement Broken',
      body: s => [
        ROLLNOTE(),
        P('You get honey. You also get stung four times on the back of the hand and once, memorably, on the ear, and the elm is still angry about it as you leave.'),
        W('Grammy leaves more than she takes. Today you did not.')
      ],
      choices: () => [{
        label: 'Jar what you have.', tag: 'Ingredient: Honey ★★', next: 'bees_clue',
        do: s => { E.setIngredient(s, 'honey', 1); E.setFlag(s, 'angeredBees'); }
      }]
    },

    bees_clue: {
      chapter: 'Act I', title: 'Something Odd',
      body: s => {
        const b = [
          P('On your way down you pass the fifth hive and stop.'),
          P('There is a handprint in the soot on the rock beside it. A small one. And there is a scrap of blue ribbon caught on a splinter, the kind of ribbon that holds a girl’s hair back.'),
          P('Somebody else comes up here. Somebody small. And they come here <em>carefully</em> — the soot is laid down properly, the way you do it when you have been taught.')
        ];
        if (s.flags.angeredBees) b.push(W('Somebody who was taught better than you were, today.'));
        return b;
      },
      choices: () => [
        {
          label: 'Take the ribbon.', tag: 'Clue', next: 'bees_return',
          do: s => { E.addClue(s, 'ribbon'); }
        }
      ]
    },

    bees_return: {
      chapter: 'Act I', title: 'Down the Slope',
      body: () => [P('Your ear is going to be a story for a week.')],
      choices: () => [{ label: 'Back to the village.', tag: 'Continue', next: 'hub' }],
      onEnter: s => { E.setFlag(s, 'doneBees'); }
    },

    /* ================= GRAMMY'S KITCHEN ================= */
    grammy_kitchen: {
      chapter: 'Act I', title: 'The Kitchen',
      onEnter: s => { E.setFlag(s, 'talkedGrammy'); },
      body: () => [
        P('Grammy’s kitchen is the warmest room in the valley and it is not entirely because of the fire. Everything in it has been used ten thousand times: the tin, the board, the rolling pin worn to an hourglass in the middle, the spoon in the window.'),
        P('On the wall there is a shelf of blue ribbons and one photograph of a broad, laughing man holding a pie like a trophy.')
      ],
      choices: s => {
        const c = [];
        if (!s.flags.askedEzra) {
          c.push({ label: 'Ask about Ezra.', tag: 'Talk', next: 'grammy_ezra' });
        }
        if (!s.flags.askedRecipe) {
          c.push({ label: 'Ask her to walk you through the recipe, step by step.', tag: 'Talk', next: 'grammy_recipe' });
        }
        if (E.isProficient(s, 'insight') && !s.flags.insightGrammy) {
          c.push({
            label: '✨ Insight — she is not telling you something.',
            tag: 'Insight DC 13',
            check: { label: 'Insight', skill: 'insight', dc: 13, context: {}, success: 'grammy_insight', failure: 'grammy_ezra' },
            next: 'grammy_ezra'
          });
        }
        c.push({ label: 'Head back out into the village.', tag: 'Continue', next: 'hub' });
        return c;
      }
    },

    grammy_ezra: {
      chapter: 'Act I', title: 'Ezra',
      body: s => [
        ROLLNOTE(),
        P('She looks up at the photograph for a long moment.'),
        SAID('Grammy Wren', 'Ezra Wren. Built this kitchen with his own hands, dug out the whole orchard terrace, and could not boil an egg. Not one egg. I have photographs.'),
        SAID('Grammy Wren', 'He never cooked a thing in his life. But every single time I put a pie in that oven, he would stand at the door with me and say the last step out loud. And then he’d say — <em>“that one’s for so-and-so”</em> — and he’d name whoever it was going to.'),
        SAID('Grammy Wren', 'I used to laugh at him. Forty years I laughed at him.'),
        W('She wipes her hands on the apron. There is nothing on them.')
      ],
      choices: () => [
        {
          label: 'Let the silence sit. Don’t fill it.',
          tag: 'Continue', next: 'grammy_kitchen',
          do: s => { E.setFlag(s, 'askedEzra'); E.setFlag(s, 'knowsEzra'); }
        }
      ]
    },

    grammy_recipe: {
      chapter: 'Act I', title: 'The Recipe',
      body: s => [
        P('She recites it without hesitation, which tells you how deep it goes.'),
        SAID('Grammy Wren', 'Russets, high branch, ugly ones. Flour — Bran’s good bin, don’t let him lie to you. Butter cold, cubed, and you work it with your fingertips because your hands are warmer than you think. Salt. Two tablespoons wildflower honey, and I mean wild, not that shop rubbish. Cinnamon — real cinnamon, Mabel has it, she’ll deny it. Nutmeg if the apples were shy that year. Lattice, eight strips, brushed with cream not egg, because egg makes it shine and shine is showing off.'),
        SAID('Grammy Wren', 'Oven hot. Then down. Window cracked — a pie that doesn’t see the sky comes out sad.'),
        SAID('Grammy Wren', 'And then. And then the —'),
        P('She stops. Her mouth is open. Nothing comes.'),
        SAID('Grammy Wren', '— the last step.'),
        W('She sits down heavily in the good chair.'),
        SAID('Grammy Wren', 'I can make every pie in this valley except my own.')
      ],
      choices: () => [
        {
          label: '“Then we find it. Where would Ezra have kept it?”',
          tag: 'Continue', next: 'grammy_kitchen',
          do: s => { E.setFlag(s, 'askedRecipe'); E.setFlag(s, 'knowsEzra'); }
        }
      ]
    },

    grammy_insight: {
      chapter: 'Act I', title: 'What She Isn’t Saying',
      body: s => [
        ROLLNOTE(),
        P('You watch her while she talks about the Fair, and you notice that she does not look at the window, and that when she says the word <em>recipe</em> her hand goes to her apron pocket, where there is nothing.'),
        P('There is a second fear under the first one, and it is not about losing the Fair.'),
        P('She is afraid that when she is gone, nobody will be able to make it. That the pie stops with her. That forty-one years of it just — stops.')
      ],
      choices: () => [
        {
          label: 'Say nothing about it. File it away.',
          tag: 'Clue', tagKind: 'good', next: 'grammy_kitchen',
          do: s => { E.addClue(s, 'fear'); E.setFlag(s, 'understandsGrammy'); E.setFlag(s, 'insightGrammy'); }
        },
        {
          label: '“Grammy. You want someone to learn it. That’s what this is.”',
          tag: 'Bold', hint: 'It might help enormously. It might break her heart open.',
          check: { label: 'Persuasion (honest)', skill: 'persuasion', dc: 12, context: { grandmother: true }, success: 'grammy_trust', failure: 'grammy_deflect' },
          next: 'grammy_deflect'
        }
      ]
    },

    grammy_trust: {
      chapter: 'Act I', title: 'The Real Ask',
      body: s => [
        ROLLNOTE(),
        P('She does not answer for a while.'),
        SAID('Grammy Wren', 'Ezra asked me not to write it down. He said a recipe on paper is a receipt, and a recipe in hands is a — is a —'),
        SAID('Grammy Wren', 'Oh, for heaven’s sake, it’s a <em>family</em>, that’s what he said, it’s a family, and I said you absolute fool, and he said yes, and he was right, and now he is dead and I am forgetful and the Fair is at noon.'),
        P('She straightens up, and something in her face sets the way iron sets.'),
        SAID('Grammy Wren', 'Find me that step. And then you are going to stand at that oven with me and I am going to put it in <em>your</em> hands, because I am not taking it into the ground.')
      ],
      choices: () => [
        {
          label: '“Deal.”',
          tag: 'Major', tagKind: 'good', next: 'grammy_kitchen',
          do: s => { E.setFlag(s, 'grammyHelp'); E.setFlag(s, 'insightGrammy'); E.setFlag(s, 'understandsGrammy'); }
        }
      ]
    },

    grammy_deflect: {
      chapter: 'Act I', title: 'Not Yet',
      body: s => [
        ROLLNOTE(),
        SAID('Grammy Wren', 'I want a pie, dear. Let’s not have a conversation.'),
        P('She says it kindly. That is somehow worse. But you saw it, and she knows you saw it, and that will count for something later.')
      ],
      choices: () => [
        {
          label: 'Drop it. For now.',
          tag: 'Continue', next: 'grammy_kitchen',
          do: s => { E.setFlag(s, 'insightGrammy'); E.setFlag(s, 'sawTheFear'); }
        }
      ]
    },

    /* ================= ACT I FINALE — THE HOLLOW OAK ================= */
    hollow_oak: {
      chapter: 'Act I · Finale', title: 'The Hollow Oak',
      body: s => [
        BANNER('Act I — Finale', ''),
        P('The old orchard at dusk. The great hollow oak is the biggest thing in it — nine feet across at the base, split by lightning forty years ago and healed around the wound into a doorway big enough to stand in.'),
        P('There is a ladder at its foot. There are small boot prints in the mud. And from inside the tree, faintly, there is the smell of cold apple and woodsmoke.'),
        P('And there is something else in front of the hollow, low and grey and entirely awake, that has been watching you come up the orchard for the last two minutes.')
      ],
      choices: s => {
        const c = [];
        c.push({
          label: '🦡 Approach the badger slowly, hands open.',
          tag: 'Animal Handling DC 14',
          check: { label: 'Animal Handling', skill: 'animal', dc: 14, context: { beasts: true }, success: 'badger_calm', failure: 'badger_fight' },
          next: 'badger_fight'
        });
        if (E.isProficient(s, 'stealth')) {
          c.push({
            label: '🗝️ Go around. Get in through the lightning split without her noticing.',
            tag: 'Stealth DC 13',
            check: { label: 'Stealth', skill: 'stealth', dc: 13, context: { hood: true }, success: 'badger_sneak', failure: 'badger_fight' },
            next: 'badger_fight'
          });
        }
        if (E.hasTrait(s, 'minorillusion')) {
          c.push({
            label: '😈 Thaumaturgy: a badger’s own call, from the far end of the orchard.',
            tag: 'Tiefling', tagKind: 'good',
            next: 'badger_calm', do: s => { E.setFlag(s, 'badgerTricked'); }
          });
        }
        if (E.hasItem(s, 'thieves_tools')) {
          c.push({
            label: '🌑 Leave a piece of trail bread at a distance and back off.',
            tag: 'Criminal', tagKind: 'good', hint: 'You have been on the wrong end of a guard animal before.',
            next: 'badger_calm'
          });
        }
        c.push({ label: '⚔️ It is between you and the door. Fine.', tag: 'Combat', tagKind: 'gray', next: 'badger_fight' });
        return c;
      }
    },

    badger_calm: {
      chapter: 'Act I · Finale', title: 'Bramble',
      body: s => [
        ROLLNOTE(),
        P('She is enormous and she is old and one of her eyes is cloudy. She smells your hands, decides, and lies down across the hollow like a door that has decided to stay a door.'),
        P('You notice, because you are looking, that she is thin. And that she is not guarding anything dangerous.'),
        W('She is guarding a child who feeds her.')
      ],
      choices: () => [
        { label: 'Duck past her into the hollow.', tag: 'Continue', next: 'meet_pip', do: s => { E.setFlag(s, 'badgerFriend'); } }
      ]
    },

    badger_sneak: {
      chapter: 'Act I · Finale', title: 'Through the Split',
      body: s => [
        ROLLNOTE(),
        P('You go wide through the bracken, get a hand on the lightning split, and slide into the hollow with the badger five feet away and entirely uninterested.'),
        P('Inside, it is bigger than it looks. Dry. Somebody has swept it.')
      ],
      choices: () => [{ label: 'Look inside.', tag: 'Continue', next: 'meet_pip' }]
    },

    badger_fight: {
      chapter: 'Act I · Finale', title: 'Bramble the Badger',
      kind: 'combat', enemy: 'badger',
      body: s => [
        ROLLNOTE(),
        P('She comes at you low and fast and she is not playing. You have about a second to decide what kind of person you are about to be.')
      ],
      combatExtras: s => {
        const c = [];
        if (!s.flags.badgerOffered) {
          c.push({
            label: '🍞 Drop your trail rations and back off slowly.',
            tag: 'Animal Handling DC 12', tagKind: 'good',
            run: st => {
              const r = E.roll(st, { skill: 'animal', dc: 12, label: 'Animal Handling (calming)', context: { beasts: true } });
              st.lastRoll = r;
              st.flags.badgerOffered = true;
              if (r.pass) { st.combat.over = true; st.combat.won = true; st.flags.badgerFriend = true; E.combatLog(st, '🍞 She eats. She lies down. The fight is over.'); }
              else { E.combatLog(st, '🦡 She knocks the bread away and comes again.'); }
            }
          });
        }
        return c;
      },
      resolution: { win: 'meet_pip', lose: 'badger_lose', flee: 'badger_fled' }
    },

    badger_lose: {
      chapter: 'Act I · Finale', title: 'Out of the Orchard',
      body: () => [
        P('You go down in the bracken with a badger on your boot and your dignity somewhere in the next county, and the sensible part of you hauls the rest of you backwards out of the orchard at speed.'),
        W('You are alive. You are bleeding. The hollow oak is still standing there, patient as a badger.')
      ],
      choices: () => [
        {
          label: 'Bind the bites with your herb kit and try again — carefully this time.',
          tag: 'Heal', next: 'meet_pip',
          do: s => {
            if (E.hasItem(s, 'herbalism_kit')) { s.pc.hp = Math.min(s.pc.maxHp, s.pc.hp + E.rollDice('1d4+2').total); }
            else { s.pc.hp = Math.max(1, Math.floor(s.pc.maxHp / 2)); }
            E.setFlag(s, 'badgerFriend');
          }
        }
      ]
    },

    badger_fled: {
      chapter: 'Act I · Finale', title: 'Regroup',
      body: () => [P('You get clear. She does not follow — she has no interest in you, only in the doorway. You sit in the bracken with your heart going and think about what you are actually trying to do here.')],
      choices: () => [
        { label: 'Go back and do it properly.', tag: 'Continue', next: 'hollow_oak' }
      ]
    },

    meet_pip: {
      chapter: 'Act I · Finale', title: 'Pip Marsh',
      body: s => [
        P('The inside of the oak is swept and dry and somebody has been living in it. There is a blanket. There is a crate for a table. There are three bowls, and one of them is very small.'),
        P('And there is a girl of about twelve, standing with her back against the far wall, holding a pie tin in front of her like a shield.'),
        P('The pie is half gone. Not eaten — <em>taken apart</em>, carefully, slice by slice, and packed into a cloth.'),
        SAID('Pip', 'It was on the window.'),
        SAID('Pip', 'It was just — on the window. And nobody was coming for it. I waited until it was proper dark and nobody came.'),
        P('Her chin goes up. She is twelve and she is not going to cry in front of you.'),
        SAID('Pip', 'My brother likes sweet things. He can’t keep anything else down. That’s the whole thing. That’s all of it. You can take me to the constable, I’ve already decided about the constable.')
      ],
      choices: s => {
        const c = [];
        c.push({
          label: '“I’m not the constable. Sit down. Tell me about Thom.”',
          tag: 'Persuasion DC 11',
          check: { label: 'Persuasion', skill: 'persuasion', dc: 11, context: { villager: true }, success: 'pip_talk', failure: 'pip_guarded' },
          next: 'pip_guarded'
        });
        if (E.isProficient(s, 'insight')) {
          c.push({
            label: '✨ Insight — what is she actually most afraid of right now?',
            tag: 'Insight DC 12',
            check: { label: 'Insight', skill: 'insight', dc: 12, context: {}, success: 'pip_insight', failure: 'pip_guarded' },
            next: 'pip_guarded'
          });
        }
        c.push({
          label: '“Give me the pie, Pip.”',
          tag: 'Intimidation DC 10', tagKind: 'gray', hint: 'It would work. She is twelve.',
          check: { label: 'Intimidation', skill: 'intimidation', dc: 10, context: {}, success: 'pip_cowed', failure: 'pip_guarded' },
          next: 'pip_guarded'
        });
        if (E.isProficient(s, 'sleight')) {
          c.push({
            label: '🗝️ Take the tin while she is talking.',
            tag: 'Sleight of Hand DC 15', tagKind: 'gray',
            check: { label: 'Sleight of Hand', skill: 'sleight', dc: 15, context: {}, success: 'pip_robbed', failure: 'pip_guarded' },
            next: 'pip_guarded'
          });
        }
        return c;
      }
    },

    pip_insight: {
      chapter: 'Act I · Finale', title: 'Not the Constable',
      body: s => [
        ROLLNOTE(),
        P('She is not afraid of you. She has already decided about you and you are the least of it.'),
        P('She is afraid that if she goes, the two little ones go to the parish, and the parish sends them to different houses, and Thom — who is four, and poorly, and cannot keep anything down but sweet things — goes somewhere where nobody knows that.'),
        W('That is the whole fear. That is all of it.')
      ],
      choices: () => [
        {
          label: '“Nobody is taking your brother anywhere.”',
          tag: 'Continue', next: 'pip_talk',
          do: s => { E.setFlag(s, 'knowsTheFear'); }
        }
      ]
    },

    pip_talk: {
      chapter: 'Act I · Finale', title: 'Thom',
      body: s => [
        ROLLNOTE(),
        P('It takes a while. She is twelve and she has been the adult in that house for a year and a half and she does not put it down easily.'),
        SAID('Pip', 'He’s four. He had the fever in the spring and he came back thin and he hasn’t been right since. He can’t keep bread down. He can’t keep broth down. He can keep <em>sweet</em> down, and if he doesn’t eat he just goes quiet and sleeps and that’s the part that —'),
        P('She stops. She puts the tin down on the crate.'),
        SAID('Pip', 'I know whose pie it is. Everybody knows. I’ve stood at that fence and smelled it my whole life and I have never once been given a slice and I knew exactly what I was doing.')
      ],
      choices: () => [
        {
          label: '“Then let’s fix it. Both problems. Come with me.”',
          tag: 'Clue', next: 'pip_reveal',
          do: s => { E.addClue(s, 'pip'); E.setFlag(s, 'pipTrusts'); }
        }
      ]
    },

    pip_guarded: {
      chapter: 'Act I · Finale', title: 'Walls Up',
      body: s => [
        ROLLNOTE(),
        P('She goes flat and quiet and stops being a child, which is the saddest trick you have ever watched anybody do.'),
        SAID('Pip', 'Take it, then. It’s mostly gone anyway. I cut it up so I could carry it without it breaking and now it’s all broken.')
      ],
      choices: () => [
        {
          label: 'Ask about her brother, gently.',
          tag: 'Clue', next: 'pip_reveal',
          do: s => { E.addClue(s, 'pip'); }
        }
      ]
    },

    pip_cowed: {
      chapter: 'Act I · Finale', title: 'Easy',
      body: s => [
        ROLLNOTE(),
        P('It is easy. That is the worst part. She hands over the tin without a word and does not look at you and you have won completely and it feels like losing something.'),
        W('She is twelve. You are whatever you are. Note the difference.')
      ],
      choices: () => [
        {
          label: 'Take the tin.',
          tag: 'Continue', next: 'pip_reveal',
          do: s => { E.addClue(s, 'pip'); E.setFlag(s, 'cowedPip'); }
        }
      ]
    },

    pip_robbed: {
      chapter: 'Act I · Finale', title: 'Hands',
      body: s => [
        ROLLNOTE(),
        P('The tin is in your coat before she finishes the word <em>constable</em>. Clean. She does not even feel it go.'),
        P('Then she looks down at her empty hands and her face does something you are going to think about for a long time.'),
        SAID('Pip', 'Oh. You’re one of those.')
      ],
      choices: () => [
        {
          label: 'Take the tin.',
          tag: 'Continue', next: 'pip_reveal',
          do: s => { E.addClue(s, 'pip'); E.setFlag(s, 'robbedPip'); }
        }
      ]
    },

    pip_reveal: {
      chapter: 'Act I · Finale', title: 'The Torn Card',
      body: s => [
        P('There is something else in the hollow, and it is not food.'),
        P('Tucked into a crack in the bark, dry and folded twice, is a card in a careful old hand. It is a recipe. It is written in ink that has gone brown with age and it is <em>torn</em> — ripped straight down the bottom third, deliberately, a long time ago, by somebody who was angry about it.'),
        P('The header says: <em>WREN — COUNTRY APPLE — for G.</em>'),
        P('And the last line of it, the part that is missing, is exactly the part Grammy cannot remember.')
      ],
      choices: () => [
        {
          label: 'Take the card.',
          tag: 'Clue', next: 'pip_choice',
          do: s => { E.addClue(s, 'card'); E.setFlag(s, 'hasCard'); E.addItem(s, 'torn_recipe'); }
        }
      ]
    },

    pip_choice: {
      chapter: 'Act I · Finale', title: 'What You Do Next',
      body: s => [
        P('Pip is watching you. She has already worked out that you know, and that the constable is a nine-minute walk, and that she cannot outrun you.'),
        P('Everything after this happens because of what you do in the next ten seconds.')
      ],
      choices: s => {
        const c = [];
        c.push({
          label: '“Pack your brother up. You’re all coming to Grammy’s. Tonight.”',
          tag: 'Kind', tagKind: 'good', primary: true,
          next: 'act2_transition',
          do: s => { E.setFlag(s, 'pipFriend'); E.setFlag(s, 'tookThemIn'); }
        });
        if (E.isProficient(s, 'persuasion') || E.isProficient(s, 'deception')) {
          c.push({
            label: '“I’ll say the pie fell. I’ll say a fox took it. But you come with me and you help me bake a new one.”',
            tag: 'Persuasion DC 13',
            check: { label: 'Persuasion', skill: 'persuasion', dc: 13, context: { villager: true }, success: 'pip_deal', failure: 'pip_no_deal' },
            next: 'pip_no_deal'
          });
        }
        c.push({
          label: 'Walk to the constable.',
          tag: 'Harsh', tagKind: 'gray', hint: 'It is the law. It is also a choice.',
          next: 'act2_transition',
          do: s => { E.setFlag(s, 'reportedPip'); }
        });
        c.push({
          label: 'Say nothing. Leave. Let her work it out.',
          tag: 'Cold', tagKind: 'gray',
          next: 'act2_transition',
          do: s => { E.setFlag(s, 'leftPip'); }
        });
        return c;
      }
    },

    pip_deal: {
      chapter: 'Act I · Finale', title: 'The Deal',
      body: s => [
        ROLLNOTE(),
        SAID('Pip', '…You’d lie to the constable.'),
        SAID('Pip', 'You don’t even know me.'),
        P('She says it like it is an accusation and her eyes are suddenly very bright and she is furious about it.'),
        SAID('Pip', 'Fine. FINE. I can carry things. I know where the good apples are, I’ve been in that orchard more than she has, and I can climb better than you, obviously, look at you.')
      ],
      choices: () => [
        {
          label: '“Then let’s go.”',
          tag: 'Ally gained', tagKind: 'good', next: 'act2_transition',
          do: s => { E.setFlag(s, 'pipFriend'); E.setFlag(s, 'pipAlly'); }
        }
      ]
    },

    pip_no_deal: {
      chapter: 'Act I · Finale', title: 'No',
      body: s => [
        ROLLNOTE(),
        SAID('Pip', 'No.'),
        SAID('Pip', 'You come in here and you — no. I don’t want your deal. I know what I did and I don’t need you to make it smaller, I need somebody to not take my brother.'),
        P('She picks up the small bowl off the crate and holds it with both hands.'),
        SAID('Pip', 'Go on, then.')
      ],
      choices: () => [
        {
          label: 'Leave her be. Take the card and go.',
          tag: 'Continue', next: 'act2_transition',
          do: s => { E.setFlag(s, 'leftPip'); }
        }
      ]
    },

    /* ================= ACT II — THE CELLAR ================= */
    act2_transition: {
      chapter: 'Act II', title: 'Eleven Steps',
      body: s => {
        const b = [
          BANNER('Act II — The Cellar Under the Orchard', 'gold'),
          P('Grammy is at the sink when you come back in, and she does not turn around, and she says:'),
          SAID('Grammy Wren', 'Well. Did you find my pie.')
        ];
        if (s.flags.pipFriend) {
          b.push(P('Pip is behind you with two small children and a badger at her heels and a cloth full of ruined pie, and Grammy Wren turns around and looks at all of it for a long moment.'));
          b.push(SAID('Grammy Wren', '…Oh, for heaven’s sake. Sit them down. All of them. There’s bread and there’s jam and the jam is the good jam and nobody is to say a word about it.'));
          b.push(W('She does not mention the pie. Not once. She puts a kettle on.'));
        } else if (s.flags.reportedPip) {
          b.push(P('You tell her. She listens all the way through without interrupting, which is not like her.'));
          b.push(SAID('Grammy Wren', '…Right.'));
          b.push(P('She says nothing else about it for the rest of the night, and the kitchen is a colder room than it was.'));
        } else {
          b.push(P('You tell her about the hollow oak, and about the girl, and about the tin with half a pie in it.'));
          b.push(SAID('Grammy Wren', '…A sick child.'));
          b.push(P('She is quiet a while. Then:'));
          b.push(SAID('Grammy Wren', 'Well. That’s that, then, isn’t it. That’s the whole thing. That has always been the whole thing.'));
        }
        b.push(P('You put the torn card on the table in front of her.'));
        b.push(P('She does not touch it. She looks at it the way you would look at a letter from somebody dead.'));
        b.push(SAID('Grammy Wren', 'Ezra wrote that. In our first year. And then we had the — the row, about the Fair, about whether it was mine or ours, and he tore the bottom off it and he said <em>“you’ll not have the last of it, then”</em> and he went out and he dug, because that’s what he did, he dug.'));
        b.push(SAID('Grammy Wren', 'There’s a cellar under the orchard terrace. He built it and he never told me a single thing he put in it and I have not been down there in nineteen years.'));
        b.push(W('She finally picks up the card, and her hand is not steady.'));
        b.push(SAID('Grammy Wren', 'Bring me back the bottom of this, if it’s down there. And bring it back before noon tomorrow, because I have thirty-nine ribbons on that shelf and I am not stopping at thirty-nine.'));
        return b;
      },
      choices: () => [
        { label: 'Go down into the orchard terrace, to the cellar.', tag: 'Act II', primary: true, next: 'cellar_door' }
      ]
    },

    cellar_door: {
      chapter: 'Act II', title: 'Under the Terrace',
      body: s => {
        const b = [
          P('Behind the fourth row, under a tangle of blackberry, there is a flat stone with an iron ring in it that you would walk over a hundred times and never see.'),
          P('It takes both of you to lift it. Underneath is a stair going down into black, and the air that comes up is cold and smells of wet stone and, faintly, of apple wood smoke that has been sitting there for nineteen years.')
        ];
        if (E.hasTrait(s, 'darkvision')) b.push(W('Your eyes adjust before the torch is even lit. Darkvision. Small mercies.'));
        else b.push(P('You light the storm lantern. It throws about eight feet of light and then gives up.'));
        return b;
      },
      choices: s => {
        const c = [];
        c.push({
          label: 'Go down.', tag: 'Descend', primary: true, next: 'cellar_guardian'
        });
        if (E.isProficient(s, 'history') || E.hasTrait(s, 'stonecunning')) {
          c.push({
            label: '🪨 Read the stonework first. Ezra built this — he built it like he talked.',
            tag: 'History DC 12',
            check: { label: 'History (stonework)', skill: 'history', dc: 12, context: { stonework: true }, success: 'cellar_read', failure: 'cellar_guardian' },
            next: 'cellar_guardian'
          });
        }
        return c;
      }
    },

    cellar_read: {
      chapter: 'Act II', title: 'How Ezra Built',
      body: s => [
        ROLLNOTE(),
        P('The lintel is cut with a mason’s mark and beneath it, scratched into the stone in the same careful hand as the recipe card, is a line:'),
        W('“FOR THE ONE WHO COMES DOWN HERE LOOKING FOR SOMEBODY ELSE’S.”'),
        P('And beneath that, smaller: <em>“it’s not a secret, love. it’s a name.”</em>')
      ],
      choices: () => [
        {
          label: 'Take the lantern and go down.',
          tag: 'Clue', tagKind: 'good', next: 'cellar_guardian',
          do: s => { E.addClue(s, 'lintel'); E.setFlag(s, 'readLintel'); }
        }
      ]
    },

    cellar_guardian: {
      chapter: 'Act II', title: 'Something Down Here Is Awake',
      kind: 'combat', enemy: 'guardian',
      body: s => [
        P('The stair comes out into a vaulted room the size of a chapel. Stone shelves. A great brick oven at the far end, cold. Barrels gone to hoops.'),
        P('And in the middle of the floor, on a low stone plinth, there is a figure made of millstone and iron banding, about the height of a man kneeling, with two holes where eyes would go.'),
        P('It has been sitting there for nineteen years.'),
        P('It stands up.'),
        W('Ezra built a lot of things and evidently told nobody about any of them.')
      ],
      combatExtras: s => {
        const c = [];
        const tries = s.flags.guardianTries || 0;

        // The words on the lintel always work if you read them.
        if (!s.flags.triedLintel) {
          c.push({
            label: '📜 “I came down here looking for somebody else’s.”',
            tag: s.flags.readLintel ? 'You know the words' : 'History DC 15',
            tagKind: s.flags.readLintel ? 'good' : '',
            run: st => {
              if (st.flags.readLintel) {
                st.combat.over = true; st.combat.won = true; st.flags.guardianStoodDown = true;
                E.combatLog(st, '🗿 The guardian stops. It sits back down on its plinth, facing the oven, like a dog that has been called off. It does not move again.');
              } else {
                const r = E.roll(st, { skill: 'history', dc: 15, label: 'History (remembering)', context: { stonework: true } });
                st.lastRoll = r; st.flags.triedLintel = true;
                if (r.pass) { st.combat.over = true; st.combat.won = true; st.flags.guardianStoodDown = true; E.combatLog(st, '🗿 It stops. It sits down. It faces the oven and stays there.'); }
                else { E.combatLog(st, '🗿 Wrong words. It swings.'); }
              }
            }
          });
        }

        // Stealth is always an option — it just gets harder to be surprised.
        if (!s.flags.triedSneak) {
          c.push({
            label: '🗝️ Drop flat and go around the wall to the shelves.',
            tag: E.isProficient(s, 'stealth') ? 'Stealth DC 15' : 'Stealth DC 17 (untrained)',
            run: st => {
              const dc = E.isProficient(st, 'stealth') ? 15 : 17;
              const r = E.roll(st, { skill: 'stealth', dc, label: 'Stealth', context: { hood: true } });
              st.lastRoll = r; st.flags.triedSneak = true;
              if (r.pass) { st.combat.over = true; st.combat.won = true; st.flags.guardianAvoided = true; E.combatLog(st, '🤫 You are past it. It turns, slowly, on nothing at all.'); }
              else { E.combatLog(st, '💢 Gravel. It heard gravel.'); }
            }
          });
        }

        // It is nineteen years old and made of millstone. It tires. This is the
        // guaranteed way through, so no build can ever be stuck in this cellar.
        if (tries >= 1) {
          c.push({
            label: `🗿 Let it tire itself out. It has been awake ${tries === 1 ? 'once' : tries + ' times'} in nineteen years — it cannot keep this up.`,
            tag: tries >= 3 ? 'Guaranteed' : 'Patience', tagKind: 'good',
            run: st => {
              const t = st.flags.guardianTries || 0;
              if (t >= 3) {
                st.combat.over = true; st.combat.won = true; st.flags.guardianStoodDown = true;
                E.combatLog(st, '🗿 It swings at the air twice, and then it simply… sits down. Stone grinds on stone and it does not get up again.');
              } else {
                const r = E.roll(st, { ability: 'con', dc: 12 - (t * 2), label: 'Outlast it (Constitution)' });
                st.lastRoll = r;
                if (r.pass) { st.combat.over = true; st.combat.won = true; st.flags.guardianStoodDown = true; E.combatLog(st, '🗿 You keep out of reach. After a while its arms go slow, and it sinks back onto the plinth.'); }
                else { E.combatLog(st, '🗿 You cannot keep the distance. It catches you.'); }
              }
            }
          });
        }
        return c;
      },
      resolution: { win: 'cellar_shrine', lose: 'cellar_lose', flee: 'cellar_fled' }
    },

    cellar_lose: {
      chapter: 'Act II', title: 'Up the Stair',
      body: s => {
        const tries = s.flags.guardianTries || 0;
        return [
          P('You go up that stair faster than you have ever gone up a stair, and the flat stone comes down behind you with a sound like a book closing.'),
          P('You lie in the blackberry for a while. It is not undignified. It is horizontal.'),
          tries >= 2
            ? W('Something occurs to you, lying there: that thing has been awake for nineteen years. It has been asleep for nineteen years. It is made of millstone and it is very, very tired. So are you. But it was tired first.')
            : W('Nineteen years asleep, and you are the first thing to wake it. It will not have the energy for this forever.')
        ];
      },
      choices: () => [
        {
          label: 'Get up. Go back down. You did not come this far.',
          tag: 'Continue', next: 'cellar_guardian',
          do: s => {
            s.flags.guardianTries = (s.flags.guardianTries || 0) + 1;
            s.pc.hp = Math.max(1, Math.floor(s.pc.maxHp * 0.6));
          }
        }
      ]
    },

    cellar_fled: {
      chapter: 'Act II', title: 'Regroup',
      body: () => [P('You get back up the stair with your skin on. The cold air of the orchard has never been so welcome.')],
      choices: () => [
        {
          label: 'Try again.', tag: 'Continue', next: 'cellar_guardian',
          do: s => { s.flags.guardianTries = (s.flags.guardianTries || 0) + 1; }
        }
      ]
    },

    cellar_shrine: {
      chapter: 'Act II', title: 'What Ezra Left',
      body: s => [
        ROLLNOTE(),
        P('The far wall is not shelves. It is a bench, and on the bench there is a tin box, and in the tin box, wrapped in oilcloth that has done its job for nineteen years, there is a sheaf of paper.'),
        P('Letters. Dozens of them. All to the same person. All beginning the same way.'),
        W('“G. —”'),
        P('And there, at the bottom, on its own sheet, in the same brown ink as the card, is the torn third of a recipe.')
      ],
      choices: () => [
        {
          label: 'Read the last step.',
          tag: 'Continue', primary: true, next: 'the_last_step',
          do: s => { E.addItem(s, 'recipe_bottom'); E.setFlag(s, 'hasRecipe'); }
        }
      ]
    },

    the_last_step: {
      chapter: 'Act II', title: 'The Last Step',
      body: s => [
        BANNER('The secret ingredient', 'gold'),
        P('It is one line. It is not an ingredient at all.'),
        W('“and then you put your hands flat on the tin and you say out loud, to the pie, who it is for. that is the whole thing. that has always been the whole thing. a pie nobody is named in is just bread with fruit in it. — E.”'),
        P('You read it three times.'),
        s.flags.readLintel
          ? P('Under the lintel he scratched: <em>it’s not a secret, love. it’s a name.</em>')
          : P('It is so stupid and so obvious that you almost laugh, and then you do not laugh at all.'),
        P('Forty-one years. Thirty-nine ribbons. And the last step of the best pie in three counties was a man standing at an oven door saying his wife’s pie’s name out loud to it, every single time, for forty years.')
      ],
      choices: () => [
        {
          label: 'Take it up to her.',
          tag: 'Continue', primary: true, next: 'levelup'
        }
      ]
    },

    levelup: {
      chapter: 'Act II', title: 'Level 2',
      body: s => {
        const up = E.levelUp(s);
        E.setFlag(s, 'levelledUp');
        return [
          BANNER('⬆ Level 2', 'gold'),
          P('You come up out of the ground into a cold orchard at three in the morning with a dead man’s handwriting in your coat, and somewhere in the middle of it something in you settles into a new shape.'),
          P('This is what it feels like to have done a thing that mattered. It is not fireworks. It is more like a joint clicking back in.'),
          up ? P(`<strong>${s.pc.name} is now level 2.</strong> Maximum hit points +${up.hp}.`) : P('You are stronger than you were an hour ago.'),
          up && up.feature ? P(`<strong>New ability — ${up.feature.name}.</strong> ${up.feature.text}`) : P(''),
          SHEETCARD()
        ].filter(Boolean);
      },
      choices: () => [
        { label: 'Go into the kitchen. Wake Grammy. It is time to bake.', tag: 'Act III', primary: true, next: 'bake_intro' }
      ]
    },

    /* ================= ACT III — BAKING ================= */
    bake_intro: {
      chapter: 'Act III', title: 'Four in the Morning',
      body: s => {
        const b = [
          BANNER('Act III — The Bake', 'gold'),
          P('She reads the paper standing up under the lamp. She does not sit down. She reads it twice.'),
          P('Then she puts it face down on the table, very carefully, the way you would put down something that might break, and she says in a completely level voice:'),
          SAID('Grammy Wren', 'The absolute fool.'),
          SAID('Grammy Wren', 'Forty years. Forty years he stood at that door and I thought he was being <em>silly</em>.'),
          P('She wipes her face once with the back of her wrist and then she is moving, and the kitchen becomes a different place entirely.'),
          SAID('Grammy Wren', 'Right. Apron. Hands. We have eight hours and I am going to teach you my pie and you are going to get it right, because I am not doing this twice.'),
          H('On the bench'),
        ];
        const q = n => '★'.repeat(n || 0) + '☆'.repeat(2 - (n || 0));
        D.INGREDIENTS.filter(i => i.id !== 'memory').forEach(i => {
          const have = s.ingredients[i.id];
          b.push(P(`${i.icon} <strong>${i.name}</strong> — ${have ? q(have) + (have === 2 ? ' — perfect' : ' — serviceable') : '<em>MISSING</em>'}`));
        });
        b.push(P('💛 <strong>The last step</strong> — ★★ — you have it, and it is one sentence long.'));
        b.push(W('Every choice you have made so far is sitting on that bench. Now you have to bake with it.'));
        return b;
      },
      choices: s => {
        const c = [];
        const missing = D.INGREDIENTS.filter(i => i.id !== 'memory' && !s.ingredients[i.id]);
        missing.forEach(i => {
          c.push({
            label: `${i.icon} You still need ${i.name.toLowerCase()} — go now, fast.`,
            tag: 'Missing', tagKind: 'gray',
            next: 'quick_' + i.id
          });
        });
        c.push({ label: '🥧 Begin.', tag: 'Skill challenge', tagKind: 'good', primary: true, next: 'bake_dough' });
        return c;
      }
    },

    quick_apples: {
      chapter: 'Act III', title: 'Apples, Fast',
      body: () => [P('The orchard at four in the morning. You take what the tree has already given up.')],
      choices: () => [{ label: 'Back to the kitchen.', tag: 'Ingredient: Apples ★★', next: 'bake_intro', do: s => { E.setIngredient(s, 'apples', 1); } }]
    },
    quick_flour: {
      chapter: 'Act III', title: 'Flour, Fast',
      body: () => [P('Bran is up — millers are always up. He takes one look at your face and hands you a sack without being asked.')],
      choices: () => [{ label: 'Back to the kitchen.', tag: 'Ingredient: Flour ★★', next: 'bake_intro', do: s => { E.setIngredient(s, 'flour', 1); } }]
    },
    quick_honey: {
      chapter: 'Act III', title: 'Honey, Fast',
      body: () => [P('Mabel keeps honey. Mabel keeps everything. She is awake, because Mabel is always awake, and she does not charge you.')],
      choices: () => [{ label: 'Back to the kitchen.', tag: 'Ingredient: Honey ★★', next: 'bake_intro', do: s => { E.setIngredient(s, 'honey', 1); } }]
    },
    quick_cinnamon: {
      chapter: 'Act III', title: 'Cinnamon, Fast',
      body: () => [P('There is cassia in Grammy’s jar. It is not the good stuff and you both know it and neither of you says so.')],
      choices: () => [{ label: 'Back to the kitchen.', tag: 'Ingredient: Cinnamon ★★', next: 'bake_intro', do: s => { E.setIngredient(s, 'cinnamon', 1); } }]
    },

    /* ---- the skill challenge ---- */
    bake_dough: {
      chapter: 'Act III', title: 'One · The Pastry',
      body: s => [
        BANNER('Baking challenge · 1 of 4', ''),
        SAID('Grammy Wren', 'Butter cold. Cubed. And you work it with your <em>fingertips</em>, not your palms, because your palms are a furnace and you will melt it, and melted butter is a biscuit, and I have made biscuits and I know.'),
        SAID('Grammy Wren', 'You are looking for the texture of wet gravel. Not sand — sand is over-worked. Wet gravel. Go.')
      ],
      choices: s => {
        const c = [
          {
            label: 'Work the pastry.',
            tag: 'Survival DC 13', hint: 'Hands, feel, patience.',
            check: { label: 'Survival (working by feel)', skill: 'survival', dc: 13, context: { kitchen: true }, success: 'dough_good', failure: 'dough_bad' },
            next: 'dough_bad'
          },
          {
            label: 'Watch her hands first and copy exactly.',
            tag: 'Perception DC 13',
            check: { label: 'Perception (copying technique)', skill: 'perception', dc: 13, context: { kitchen: true }, success: 'dough_good', failure: 'dough_bad' },
            next: 'dough_bad'
          }
        ];
        if (E.hasFeature(s, 'prestidigitation')) {
          c.push({
            label: '🔮 Prestidigitation — chill the butter as you work it.',
            tag: 'Wizard / Bard', tagKind: 'good', hint: 'The one legitimate use of magic in a kitchen.',
            next: 'dough_good', do: st => { E.setFlag(st, 'usedMagic1'); }
          });
        }
        if (E.hasItem(s, 'bakers_tools')) {
          c.push({
            label: '🍞 Your own rolling pin. Four years of apprenticeship says you know this.',
            tag: 'Guild Artisan', tagKind: 'good',
            next: 'dough_good', do: st => { E.setFlag(st, 'usedTools'); }
          });
        }
        return c;
      }
    },

    dough_good: {
      chapter: 'Act III', title: 'Wet Gravel',
      body: s => [
        ROLLNOTE(),
        P('It comes together in the bowl and then, suddenly, in your hands — cold, pale, faintly marbled with butter that has not melted. You press a thumb into it and it springs back slowly, like a good mattress.'),
        SAID('Grammy Wren', '…Huh.'),
        P('She says it like it is a complaint. It is not a complaint.')
      ],
      choices: () => [{ label: 'Rest it in the cool and move on.', tag: '+1 baking', tagKind: 'good', next: 'bake_filling', do: s => { s.flags.bakingScore = (s.flags.bakingScore || 0) + 1; } }]
    },

    dough_bad: {
      chapter: 'Act III', title: 'Sand',
      body: s => [
        ROLLNOTE(),
        P('It goes past wet gravel, past sand, and into something resembling a damp biscuit dough, and you can feel the butter weeping out of it onto your wrists.'),
        SAID('Grammy Wren', 'Stop. STOP. Leave it. Cold water, one tablespoon, and you are not to touch it again for twenty minutes.'),
        P('It is salvageable. It is not what it could have been.')
      ],
      choices: () => [{ label: 'Rest it and move on.', tag: 'No bonus', next: 'bake_filling' }]
    },

    bake_filling: {
      chapter: 'Act III', title: 'Two · The Filling',
      body: s => [
        BANNER('Baking challenge · 2 of 4', ''),
        P('The apples go down in even slices, tossed with the sugar, the cinnamon, the two tablespoons of wild honey, and — if the apples were shy this year — a grate of nutmeg.'),
        SAID('Grammy Wren', 'Taste it. Now. Don’t look at me like that, taste it — you cannot season a thing you have not tasted, that is not cooking, that is arithmetic.'),
        W('The bowl is in front of you. It is close, but close is not it.')
      ],
      choices: s => {
        const c = [
          {
            label: 'Taste and adjust by instinct.',
            tag: 'Medicine DC 13', hint: 'Palate, balance, knowing what is missing.',
            check: { label: 'Medicine (palate & balance)', skill: 'medicine', dc: 13, context: { kitchen: true }, success: 'fill_good', failure: 'fill_bad' },
            next: 'fill_bad'
          },
          {
            label: 'Reason it out — which apples, how much sugar, how sharp.',
            tag: 'Nature DC 13',
            check: { label: 'Nature (the fruit itself)', skill: 'nature', dc: 13, context: { kitchen: true }, success: 'fill_good', failure: 'fill_bad' },
            next: 'fill_bad'
          }
        ];
        if (s.ingredients.apples === 2) {
          c.push({
            label: '🍎 The high-branch fruit is carrying it. Barely touch the bowl.',
            tag: 'Great apples', tagKind: 'good', hint: 'Your earlier climb pays off here.',
            next: 'fill_good'
          });
        }
        if (E.hasFeature(s, 'prestidigitation') && !s.flags.usedMagic1) {
          c.push({
            label: '🔮 Prestidigitation — flavour the filling directly.',
            tag: 'Wizard / Bard', tagKind: 'good',
            next: 'fill_good'
          });
        }
        return c;
      }
    },

    fill_good: {
      chapter: 'Act III', title: 'Right',
      body: s => [
        ROLLNOTE(),
        P('One more pinch of salt — you would not have guessed salt, and it is salt — and the whole thing lifts. It stops being apple and sugar and becomes the smell of that windowsill.'),
        P('Grammy tastes it. She does not say anything. She puts the spoon down very precisely where spoons go, which is her version of standing up and cheering.')
      ],
      choices: () => [{ label: 'Fill the tin.', tag: '+1 baking', tagKind: 'good', next: 'bake_lattice', do: s => { s.flags.bakingScore = (s.flags.bakingScore || 0) + 1; } }]
    },

    fill_bad: {
      chapter: 'Act III', title: 'Almost',
      body: s => [
        ROLLNOTE(),
        P('It is good. It is a good apple filling. It is not <em>that</em> filling, and you can taste the gap, and so can she, and neither of you says it out loud because there is no time.')
      ],
      choices: () => [{ label: 'Fill the tin.', tag: 'No bonus', next: 'bake_lattice' }]
    },

    bake_lattice: {
      chapter: 'Act III', title: 'Three · The Lattice',
      body: s => [
        BANNER('Baking challenge · 3 of 4', ''),
        SAID('Grammy Wren', 'Eight strips. Four and four. Cream, not egg, on the top, because egg makes it shine and shine is <em>showing off</em>.'),
        SAID('Grammy Wren', 'And do not weave it tight. Tight doesn’t vent. A pie that cannot breathe comes out wet.'),
        P('Eight strips of cold pastry on a floured board and a knife and absolutely no margin for error.')
      ],
      choices: s => {
        const c = [
          {
            label: 'Cut and weave it.',
            tag: 'Sleight of Hand DC 13', hint: 'Steady hands and a light touch.',
            check: { label: 'Sleight of Hand (fine work)', skill: 'sleight', dc: 13, context: { kitchen: true }, success: 'lat_good', failure: 'lat_bad' },
            next: 'lat_bad'
          },
          {
            label: 'Take it slow and measure each strip.',
            tag: 'Acrobatics DC 13', hint: 'Control. Deliberate, unhurried movement.',
            check: { label: 'Acrobatics (control)', skill: 'acrobatics', dc: 13, context: { kitchen: true }, success: 'lat_good', failure: 'lat_bad' },
            next: 'lat_bad'
          }
        ];
        if (E.hasFeature(s, 'magehand')) {
          c.push({
            label: '🔮 Mage Hand — hold four strips steady while you weave the other four.',
            tag: 'Wizard', tagKind: 'good', hint: 'Two extra hands is not cheating. It is wizarding.',
            next: 'lat_good'
          });
        }
        if (s.flags.pipAlly || s.flags.pipFriend) {
          c.push({
            label: '👧 Pip on one side, you on the other. She has small hands and she is quick.',
            tag: 'Ally', tagKind: 'good',
            next: 'lat_good', do: st => { E.setFlag(st, 'pipHelped'); }
          });
        }
        return c;
      }
    },

    lat_good: {
      chapter: 'Act III', title: 'Eight Strips',
      body: s => [
        ROLLNOTE(),
        P('Four and four, over-under, loose enough to see the fruit through, and the whole thing sits on the tin like it was born there.'),
        SAID('Grammy Wren', '…That is a better lattice than I did at your age and I would like you both to know that I said it under duress.')
      ],
      choices: () => [{ label: 'Cream on top. Into the oven.', tag: '+1 baking', tagKind: 'good', next: 'bake_oven', do: s => { s.flags.bakingScore = (s.flags.bakingScore || 0) + 1; } }]
    },

    lat_bad: {
      chapter: 'Act III', title: 'Seven Strips',
      body: s => [
        ROLLNOTE(),
        P('One strip tears. Then another. You end up with seven and a patch, woven tight because you are hurrying, and it looks like a pie made by somebody who has read about pies.'),
        SAID('Grammy Wren', 'It’ll eat fine.'),
        W('“It’ll eat fine” is the worst thing she can possibly say.')
      ],
      choices: () => [{ label: 'Cream on top. Into the oven.', tag: 'No bonus', next: 'bake_oven' }]
    },

    bake_oven: {
      chapter: 'Act III', title: 'Four · The Last Step',
      body: s => [
        BANNER('Baking challenge · 4 of 4', 'gold'),
        P('The oven is hot. The window is cracked a hand’s width, the way it has been for forty-one years, and the cold night air is coming in across the tin.'),
        P('And now the last step, which is one sentence long and which you are holding in your hands.'),
        W('You put your hands flat on the tin. The tin is warm through the cloth. Everybody in the kitchen is looking at you.'),
        H(MEMORY_TEXT[s.pc.class] || MEMORY_TEXT.fighter),
        SAID('Grammy Wren', '…Well? Go on then. Say it.')
      ],
      choices: s => {
        const c = [];
        if (s.flags.pipFriend || s.flags.pipAlly) {
          c.push({
            label: '💛 “This one’s for Thom Marsh. He’s four. He can’t keep anything down but sweet things, and he’s going to eat a whole slice at the Fair with everybody watching.”',
            tag: 'The name', tagKind: 'good', primary: true, hint: 'Ezra said: a pie nobody is named in is just bread with fruit in it.',
            check: { label: 'Charisma (the last step)', ability: 'cha', dc: 12, context: {}, success: 'oven_good', failure: 'oven_ok' },
            next: 'oven_ok'
          });
        }
        c.push({
          label: '💛 “This one’s for Grammy Wren, who has never once been given a slice of her own pie at her own Fair.”',
          tag: 'The name', tagKind: 'good',
          check: { label: 'Charisma (the last step)', ability: 'cha', dc: 13, context: {}, success: 'oven_good', failure: 'oven_ok' },
          next: 'oven_ok'
        });
        c.push({
          label: '💛 “This one’s for Ezra.”',
          tag: 'The name', hint: 'Nineteen years. It is his oven. It is his line.',
          check: { label: 'Charisma (the last step)', ability: 'cha', dc: 11, context: {}, success: 'oven_good', failure: 'oven_ok' },
          next: 'oven_ok'
        });
        c.push({
          label: '💛 “This one’s for me.”',
          tag: 'Bold', tagKind: 'gray', hint: 'Honest. Also possibly the wrong answer.',
          check: { label: 'Charisma (the last step)', ability: 'cha', dc: 16, context: {}, success: 'oven_good', failure: 'oven_ok' },
          next: 'oven_ok'
        });
        return c;
      }
    },

    oven_good: {
      chapter: 'Act III', title: 'Said Out Loud',
      body: s => [
        ROLLNOTE(),
        P(MEMORY_ACTION[s.pc.class] || MEMORY_ACTION.fighter),
        P('And the kitchen does something. Nothing magical happens. There is no light. But everybody in the room stops doing what they were doing, and Grammy Wren puts her hand on the oven door the way she has four hundred times, and the pie goes in.'),
        P('She says, very quietly, to nobody:'),
        SAID('Grammy Wren', 'That’s what he said. That’s exactly what he said.'),
        W('The window is cracked a hand’s width. Outside, it is starting to get light.')
      ],
      choices: () => [{
        label: 'Close the oven door.', tag: '+1 baking', tagKind: 'good', next: 'bake_result',
        do: s => { s.flags.bakingScore = (s.flags.bakingScore || 0) + 1; E.setIngredient(s, 'memory', 2); }
      }]
    },

    oven_ok: {
      chapter: 'Act III', title: 'Said',
      body: s => [
        ROLLNOTE(),
        P('You say it. It comes out flat and hurried and you can hear yourself performing it, which is the opposite of the thing.'),
        P('But you say it. And the pie goes in.'),
        SAID('Grammy Wren', '…Right. Oven door. Don’t slam it.')
      ],
      choices: () => [{
        label: 'Close the oven door.', tag: 'Ingredient: The last step ★★', next: 'bake_result',
        do: s => { E.setIngredient(s, 'memory', 1); }
      }]
    },

    bake_result: {
      chapter: 'Act III', title: 'Forty Minutes',
      body: s => {
        const q = E.pieQuality(s);
        const b = [
          P('You wait in the kitchen while it gets light outside. Nobody says much. Grammy sits in the good chair with Ezra’s letters in her lap and does not read them, exactly — she holds them.'),
          s.flags.pipFriend ? P('Pip falls asleep on the floor with her brother on her chest and the badger at her feet like a rug that breathes.') : P(''),
          P('At some point the smell changes. It goes from <em>baking</em> to <em>done</em>, and there is no way to describe the difference except that one of them makes you hungry and the other one makes you homesick.'),
          H('On the table, cooling on the rack'),
          P(`Quality: <strong>${q} / 10</strong> — ingredients ${Math.min(6, Object.values(s.ingredients).reduce((a, x) => a + x, 0))}/6 · baking ${Math.min(3, s.flags.bakingScore || 0)}/3${s.flags.grammyHelp ? ' · Grammy at your shoulder +1' : ''}`),
          W('It is not a number anybody in this village would ever use. It is what you have.'),
          BANNER('The sun is up. The Fair is at noon.', '')
        ].filter(Boolean);
        return b;
      },
      choices: () => [
        { label: 'Carry it to the Fair.', tag: 'Act IV', primary: true, next: 'fair_morning' }
      ]
    },

    /* ================= ACT IV — THE FAIR ================= */
    fair_morning: {
      chapter: 'Act IV', title: 'The Harvest Fair',
      body: s => [
        BANNER('Act IV — The Fair', 'gold'),
        P('Bramblewick Fair is three long tables, a fiddle, a pig in a pen, and the entire population of the valley standing in a horseshoe around a blue ribbon.'),
        P('There are eleven pies. Mabel’s is there, and it is, objectively, extremely good, and Mabel is standing next to it with her arms folded like a person at a funeral for somebody she did not like.'),
        P('Mayor Odell is the judge. Mayor Odell has judged this Fair for twenty-two years and has never once explained his criteria.')
      ],
      choices: () => [
        { label: 'Walk the pie to the table.', tag: 'Continue', primary: true, next: 'fair_procession' }
      ]
    },

    fair_procession: {
      chapter: 'Act IV', title: 'Down the Middle',
      body: s => {
        const b = [
          P('You carry it down the middle of the horseshoe on Grammy’s wooden board, and the crowd does the thing crowds do, which is go quiet one person at a time until the whole field is silent except for the fiddle, which has the sense to stop.')
        ];
        if (s.flags.scaredVillage) b.push(P('Somebody at the back says your name in a tone that reminds you of the tavern. It does not spread. But it is there.'));
        if (s.flags.pipFriend) b.push(P('Pip is walking beside you with Thom on her hip. Thom is four and thin and wide awake, and he has been told exactly what is happening and he has not taken his eyes off the tin.'));
        if (s.flags.reportedPip) b.push(P('The constable is standing by the pig pen, and there is a Marsh girl in the middle of the horseshoe that nobody in this village is going to forget.'));
        b.push(SAID('Grammy Wren', 'Don’t you dare drop my pie.'));
        b.push(W('You do not drop the pie.'));
        return b;
      },
      choices: () => [
        { label: 'Set it on the table.', tag: 'Judging', primary: true, next: 'the_judging' }
      ]
    },

    the_judging: {
      chapter: 'Act IV', title: 'Judging',
      body: s => [
        P('Mayor Odell cuts the first slice. He lifts it. The lattice holds — or mostly holds. The filling is the colour of late October.'),
        P('He eats it standing up, the way everybody does, and then he stops chewing for a second, which is the only review that has ever mattered at this Fair.'),
        W('The whole valley is looking at you.')
      ],
      choices: s => {
        const c = [];
        c.push({
          label: 'Say nothing. Let the pie do it.',
          tag: 'Confident', tagKind: 'good', primary: true,
          check: { label: 'The pie speaks for itself', ability: 'cha', dc: 12, context: { important: true }, success: 'judge_good', failure: 'judge_ok' },
          next: 'judge_ok'
        });
        if (E.isProficient(s, 'performance')) {
          c.push({
            label: '🪕 Tell them whose pie it is, and who it was named for, out loud, to the whole field.',
            tag: 'Performance DC 13',
            check: { label: 'Performance', skill: 'performance', dc: 13, context: { important: true }, success: 'judge_song', failure: 'judge_ok' },
            next: 'judge_ok'
          });
        }
        c.push({
          label: 'Tell the truth about the whole night. All of it, to everybody.',
          tag: 'Persuasion DC 14', hint: 'Including the parts that are not flattering to you.',
          check: { label: 'Persuasion (the truth)', skill: 'persuasion', dc: 14, context: { important: true, villager: true }, success: 'judge_truth', failure: 'judge_ok' },
          next: 'judge_ok'
        });
        if (E.hasFeature(s, 'jack') && !s.flags.usedJack) {
          c.push({
            label: '🎭 Jack of All Trades — read the room and give the crowd exactly what it wants.',
            tag: 'Bard', tagKind: 'good',
            next: 'judge_good', do: st => { E.setFlag(st, 'usedJack'); }
          });
        }
        return c;
      }
    },

    judge_good: {
      chapter: 'Act IV', title: 'The Pause',
      body: s => [
        ROLLNOTE(),
        P('It is the pause. Everybody in the valley knows the pause — the half second where Mayor Odell stops chewing and looks at the tin like it has personally offended him.'),
        P('Then he takes a second slice, without looking at anybody, and that is the whole verdict and always has been.')
      ],
      choices: () => [{ label: 'Wait for the ribbon.', tag: 'Continue', next: 'verdict', do: s => { E.setFlag(s, 'presentedWell'); } }]
    },

    judge_song: {
      chapter: 'Act IV', title: 'Told Out Loud',
      body: s => [
        ROLLNOTE(),
        P('You tell them. Not a song — the story. Ezra at the oven door. Forty years of a man saying a pie’s name out loud to it. Nineteen years of a woman who could not remember the last step.'),
        P('By the end of it, there are four people crying in a field in Bramblewick and one of them is the mayor.')
      ],
      choices: () => [{ label: 'Wait for the ribbon.', tag: 'Continue', next: 'verdict', do: s => { E.setFlag(s, 'presentedWell'); E.setFlag(s, 'toldTheStory'); } }]
    },

    judge_truth: {
      chapter: 'Act IV', title: 'All of It',
      body: s => [
        ROLLNOTE(),
        P('You tell them about the hollow oak. About the ladder. About a twelve-year-old with a sick brother and a badger and a torn recipe card.'),
        s.flags.pipFriend
          ? P('And then you say her name, and the whole field turns to look at Pip Marsh, and somebody at the back starts clapping, and it spreads the way that spreads.')
          : P('And the field goes very quiet, and the constable looks at the ground.'),
        P('Mayor Odell puts his fork down.')
      ],
      choices: () => [{ label: 'Wait for the ribbon.', tag: 'Continue', next: 'verdict', do: s => { E.setFlag(s, 'presentedWell'); E.setFlag(s, 'toldTheStory'); } }]
    },

    judge_ok: {
      chapter: 'Act IV', title: 'A Good Pie',
      body: s => [
        ROLLNOTE(),
        P('It lands. It is a good pie. Nobody cries, nobody stops chewing, and the mayor says <em>“mm”</em> in the voice of a man who has eaten eleven pies since nine o’clock.')
      ],
      choices: () => [{ label: 'Wait for the ribbon.', tag: 'Continue', next: 'verdict' }]
    },

    verdict: {
      chapter: 'Act IV', title: 'The Ribbon',
      onEnter: s => { E.setFlag(s, 'ending', E.resolveEnding(s)); },
      body: s => [
        P('Mayor Odell picks up the blue ribbon.'),
        P(`Your pie scored <strong>${E.pieQuality(s)} / 10</strong> — ${s.clues.length} clues, ${Math.min(3, s.flags.bakingScore || 0)} of 3 baking steps, ${s.flags.hasRecipe ? 'the recipe recovered' : 'the recipe still lost'}.`)
      ],
      choices: s => [{ label: '…', tag: 'Epilogue', primary: true, next: 'ending_' + (s.flags.ending || 'burnt') }]
    },

    /* ================= ENDINGS ================= */
    ending_true: {
      chapter: 'Epilogue', title: 'The Whole Truth',
      body: s => [
        BANNER('🥇 Secret Ending — The Whole Truth', 'gold'),
        STARS(5),
        P('First place is a formality. What happens after is the part the valley talks about for the next forty years.'),
        P('You tell them everything. The hollow oak. The ladder. The badger. A twelve-year-old who walked fourteen steps to a windowsill because her brother could keep sweet things down and nothing else.'),
        P('And then Grammy Wren, seventy-eight years old, four foot eleven, thirty-nine blue ribbons, gets up on a hay bale in front of the entire valley and says:'),
        SAID('Grammy Wren', 'Forty-one years I have won this with a pie and I have never once told anybody how it is made, because my husband told me not to write it down and he was right, and here is the whole of it, and I want every one of you to hear it, because I am not taking it into the ground.'),
        P('She reads the last step out loud, to a field full of people, in Ezra’s handwriting.'),
        W('“…and then you put your hands flat on the tin and you say out loud, to the pie, who it is for.”'),
        P('Pip Marsh and her two brothers live at the cottage from that October. There is a fourth bowl on the shelf. Thom eats a whole slice at the Fair and another one after, sitting up, and he keeps it down.'),
        P('And at the Fair the year after, and the year after that, the pie on Grammy’s table has a second name under the first one.'),
        W('Yours.'),
        GALLERY()
      ],
      choices: s => [{ label: '🎲 Play again — different choices, different ending', tag: 'Restart', next: '__restart' }]
    },

    ending_heir: {
      chapter: 'Epilogue', title: 'Grammy’s Heir',
      body: s => [
        BANNER('🥧 Best Ending — Grammy’s Heir', 'gold'),
        STARS(4),
        P('The ribbon is yours. It is not really about the ribbon.'),
        P('It is about three days later, when you come back through Bramblewick on the road and Grammy Wren is standing in the lane with her arms folded and an apron over one arm.'),
        SAID('Grammy Wren', 'You’re going the wrong way.'),
        SAID('Grammy Wren', 'The apples are coming in and I have got a kiln to mend and I am seventy-eight years old and I have a pie to teach somebody and you have got hands, so — apron. Hands. Come on.'),
        P('You stay through the harvest. And the next one. And the one after that.'),
        P('There is a second bowl on the shelf. There is a name scratched into the handle of a rolling pin, in a careful hand, that was not there before.'),
        W('Ezra was right. A recipe on paper is a receipt. A recipe in hands is a family.')
      ].concat([GALLERY()]),
      choices: () => [{ label: '🎲 Play again — different choices, different ending', tag: 'Restart', next: '__restart' }]
    },

    ending_champion: {
      chapter: 'Epilogue', title: 'Champion of the Fair',
      body: s => [
        BANNER('🏆 Great Ending — Champion of the Fair', 'gold'),
        STARS(4),
        P('Mayor Odell takes a second slice without looking at anybody, which in Bramblewick is the highest honour available to a baked good.'),
        s.flags.toldTheStory
          ? P('And when he hands over the ribbon he says, quietly, so only the three of you can hear it: <em>“Tell me about that last line again.”</em>')
          : P('And Mabel, thirty-nine years second, comes over and looks at the lattice for a long time and says: <em>“Eight strips. Loose. I have been weaving mine tight for thirty-nine years, haven’t I.”</em>'),
        P('Grammy Wren does not say anything at all. She puts the ribbon on the shelf herself, between the years, and then she stands there looking at the whole row of them for longer than anybody expects.'),
        SAID('Grammy Wren', 'Forty.'),
        W('It is a good number. It is not the last one.')
      ].concat([GALLERY()]),
      choices: () => [{ label: '🎲 Play again — different choices, different ending', tag: 'Restart', next: '__restart' }]
    },

    ending_humble: {
      chapter: 'Epilogue', title: 'A Humble Slice',
      body: s => [
        BANNER('🍂 Good Ending — A Humble Slice', ''),
        STARS(3),
        P('It does not win. Mabel’s does, and Mabel’s is, objectively, extremely good, and Mabel is gracious about it in the specific way of a person who has waited thirty-nine years.'),
        P('But at the end of the afternoon, when the tables are being folded and the pig has gone home, Grammy Wren cuts the rest of the pie into six and hands one to you on her good plate.'),
        SAID('Grammy Wren', 'It’s not my pie.'),
        P('You wait.'),
        SAID('Grammy Wren', 'It’s a <em>pie</em>. And I have eaten two slices of it, which I would like you to understand is not a thing I do at a Fair, in public, at my age, with my reputation.'),
        P('She sits down on an upturned crate next to you and eats the rest of hers.'),
        W('That is its own ribbon. Nobody writes your name on it.')
      ].concat([GALLERY()]),
      choices: () => [{ label: '🎲 Play again — different choices, different ending', tag: 'Restart', next: '__restart' }]
    },

    ending_recipe: {
      chapter: 'Epilogue', title: 'The Recipe Kept',
      body: s => [
        BANNER('📜 Bittersweet Ending — The Recipe Kept', ''),
        STARS(2),
        P('The pie is not good. You know it and she knows it and the whole field knows it, and it comes seventh of eleven behind a blackberry crumble made by a child.'),
        P('It does not matter, in the end, because of what happens after.'),
        P('Grammy Wren takes the torn card and the bottom third and puts them together on the kitchen table with the two halves an inch apart, because that is how she wants it, and she leaves it there.'),
        SAID('Grammy Wren', 'He asked me not to write it down. I said I wouldn’t. I was right not to, and I have spent nineteen years being right, and it turns out being right is not the same as being <em>able</em>.'),
        SAID('Grammy Wren', 'So. You’re going to come back next September and we are going to make this properly, and you are going to learn it in your hands and not on a page, and when I am gone it is going to be yours, and you are going to say the last step out loud to it like a sensible person.'),
        W('The pie failed. The promise did not.'),
        W('Thirty-nine ribbons on the shelf. And one recipe, in hands, going forward.')
      ].concat([GALLERY()]),
      choices: () => [{ label: '🎲 Play again — different choices, different ending', tag: 'Restart', next: '__restart' }]
    },

    ending_burnt: {
      chapter: 'Epilogue', title: 'Smoke in the Kitchen',
      body: s => [
        BANNER('💨 Tough Ending — Smoke in the Kitchen', 'warn'),
        STARS(1),
        P('The pie is not good, and everybody is too polite in the specific devastating way that villages are polite.'),
        P('It comes last. Behind the blackberry crumble. Behind, it must be said, a pie entered by a man who has never baked anything in his life and entered it as a joke.'),
        P('Grammy Wren does not say a word about it all day.'),
        P('At eight o’clock you find her in the kitchen with the oven door open and Ezra’s letters on the table, and she is not crying, she is <em>furious</em>, which is much more like her.'),
        SAID('Grammy Wren', 'Forty-one years. FORTY-ONE. And I let a stranger make my pie in my kitchen and it came LAST.'),
        SAID('Grammy Wren', 'Right. Get your coat. You are not leaving this valley. You are going to sit at that bench every morning until you can make this with your eyes shut, and I am going to be horrible to you about it, and next September we are going to win.'),
        W('Some campaigns end badly and start well. This is one of them.')
      ].concat([GALLERY()]),
      choices: () => [{ label: '🎲 Play again — different choices, different ending', tag: 'Restart', next: '__restart' }]
    },

    /* ================= TITLE ================= */
    __title: {
      chapter: '', title: 'Grammy’s Country Apple Pie',
      body: () => [
        P('A one-session <strong>Dungeons &amp; Dragons</strong> adventure for one player and one very old woman with a rolling pin.'),
        P('You will build a level 1 character — species, class, origin, look, skills — and every choice you make will change the numbers on your sheet and the ending you get.'),
        W('Real dice. Real modifiers. Real consequences. There are six endings, and one of them is very hard to find.')
      ],
      choices: () => [{ label: '🎲 Begin character creation', tag: 'Start', primary: true, next: '__create' }]
    }
  };

  function getNode(id) { return NODES[id] || null; }
  const nodeIds = () => Object.keys(NODES);

  return { NODES, getNode, nodeIds, MEMORY_TEXT, MEMORY_ACTION };
});
