# 🥧 Grammy's Country Apple Pie

A one-session **Dungeons & Dragons** adventure that runs in any browser. No install,
no account, no dice to lose under the sofa.

Built for one player, and one very old woman with a rolling pin.

---

## Play it

```bash
cd apple-pie-dnd
python3 -m http.server 8000 --bind 0.0.0.0
```

Then open <http://localhost:8000>. (Any static file server works — there is no
build step and no dependencies at runtime.)

Progress autosaves to the browser, so closing the tab mid-adventure is fine.
Unlocked endings are remembered permanently, which is the reason to play again.

---

## What she builds

| Step | Choice | What it actually does |
|---|---|---|
| **Name & pronouns** | free text | appears in the story and on her sheet |
| **Trinket** | 6 options | each is a **one-use** mechanical resource |
| **Species** | Human, Elf, Halfling, Dwarf, Tiefling, Dragonborn | ability bonuses + traits that change real outcomes (Darkvision in the cellar, Dwarven poison immunity vs the wasps, Halfling Lucky rerolls a natural 1, Thaumaturgy talks its way past the bees) |
| **Class** | Fighter, Rogue, Wizard, Bard, Cleric, Ranger | hit die, AC, weapon, damage, level-1 features, and what she can do at **level 2** |
| **Origin** | 7 backgrounds | 2 free skill proficiencies, starting gear, and how the village reacts to her |
| **Look** | hair, eyes, skin, distinguishing mark, outfit, live portrait | the mark and outfit are **real +1 modifiers** on specific checks |
| **Ability scores** | assign 15/14/13/12/10/8 | the standard D&D array, then species bonuses apply |
| **Skills** | class list + origin | proficiencies (+2), Rogues also pick **Expertise** (+4) |

## How the dice work

Genuine 5e maths, shown in full every single time:

```
d20 + ability modifier + proficiency (×2 with Expertise)  vs  a Difficulty Class
```

Advantage, disadvantage, critical successes, critical failures, initiative-free
turn-based combat, hit points, armour class, damage dice, sneak attack, Hunter's
Mark, Action Surge, Second Wind, breath weapons — all implemented, all logged in
the **Dice Log** panel so she can see exactly why something worked.

## How the ending is decided

Nothing is random at the end — it is the sum of her whole adventure:

- **Pie quality (0–10)** = ingredient quality (6) + baking challenge (3) + Grammy's help (1)
- Every ingredient is graded ★/★★/★★★ by the checks she made hours earlier
- Plus: how many clues she found, whether she recovered the recipe, and
  **what she decided to do about a twelve-year-old with a sick brother**

That last one matters more than any dice roll in the game.

**Six endings**, one of them a secret ending that requires nearly everything to go
right. The title screen tracks which ones she has found.

---

## 🔥 Firebase Realtime Database

Optional. The game is fully playable without it — sync is a mirror on top of
`localStorage`, never a dependency underneath.

**Setup is five minutes:** see **[FIREBASE-SETUP.md](FIREBASE-SETUP.md)**.
Short version: paste seven values into **`js/firebase-config.js`**, publish
`database.rules.json`, reload. The pill above the character sheet turns from
**○ Cloud off** to **● Cloud synced**.

Then open **`watch.html`** on your phone: her character, her position in the
story, live pie quality, and **every dice roll and choice she makes**, pushed in
real time. Nothing to refresh.

```
players/her/
└── campaigns/
    ├── apple-pie/           this story
    │   ├── progress/        position, pie quality, ingredients, clues, stats
    │   ├── character/       who she built
    │   ├── endings/         which of the six she has found
    │   ├── runs/            one row per finished playthrough
    │   └── feed/            live dice rolls + choices, capped
    └── <next-campaign>/     future stories slot in beside this one
```

The `campaigns/` level is deliberate: adding a second story later means one new
`CAMPAIGN_ID` and nothing else moves.

## Structure

```
apple-pie-dnd/
├── index.html              the game
├── watch.html              the live watch page
├── style.css               the storybook theme
├── build.py                -> single-file portable builds
├── database.rules.json     Firebase security rules
├── FIREBASE-SETUP.md       click-by-click Firebase setup
└── js/
    ├── firebase-config.js  ← the only file you need to edit
    ├── sync.js             Realtime Database mirror + live feed
    ├── data.js             species, classes, origins, skills, enemies, endings
    ├── engine.js           dice, modifiers, combat, pie scoring, endings
    ├── story.js            the campaign — 106 nodes, ~7,900 words
    └── ui.js               rendering, character creation, save/load
```

`data.js`, `engine.js` and `story.js` are UMD modules, so they run unchanged in a
browser *and* in Node — which is what makes the test suite possible.

## Putting it on GitHub

A `.gitignore` is included (it excludes `node_modules/`, emulator logs, etc.).

```bash
git init
git add .
git commit -m "Grammy's Country Apple Pie"
git branch -M main
git remote add origin https://github.com/YOU/REPO.git
git push -u origin main
```

Or without git: create an empty repo on GitHub, then **Add file → Upload files**
and drop in everything from this folder (the uploader keeps `js/` intact).

> ⚠️ `js/firebase-config.js` contains your live web config, and
> `database.rules.json` leaves `players/{id}` open for reading/writing by design
> (no login — it is a shared profile for two people). If you make the repository
> **public**, anyone could in principle write valid-looking data to that database.
> For a private repo there is nothing to worry about. The proper upgrade for a
> public one is anonymous auth + `auth != null` rules.

## Tests

```bash
npm install          # jsdom + firebase, for the test suites
npm test             # all three suites — 1,498 assertions
npm run test:rules   # rules, graph integrity, 400 random playthroughs
npm run test:ui      # drives the real UI in a simulated browser, click by click
npm run test:sync    # sync layer vs an in-memory fake Realtime Database
npm run build        # regenerate the portable single-file builds
```

What they verify:

- every node reference in the story graph resolves
- every class × species combination can render every node without throwing
- the modifier maths is correct (proficiency, Expertise, Jack of All Trades, traits)
- Dwarven poison immunity, Halfling Lucky, level-up, one-use resources
- **all six endings are reachable**, and pie quality spans the full 0–10 range
- 400 random playthroughs all terminate — the story cannot dead-end
- a 7-HP level-1 wizard can always get out of the cellar (escalating escape routes)
- character creation, save/resume across a "closed tab", ending persistence
- the sync layer: correct schema, feed pruning, RTDB-illegal values stripped,
  denied writes swallowed, unconfigured = clean offline mode, two campaigns
  coexisting, and the whole game still running with no Firebase present at all
