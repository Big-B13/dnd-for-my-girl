# 🔥 Connecting to Firebase

Realtime Database, one shared profile, live watching. Five minutes of clicking.

---

## 1 · Get your web config

1. <https://console.firebase.google.com> → pick your project
2. **⚙️ Project settings** (gear icon, top left) → **General** tab
3. Scroll to **Your apps**. If there is no web app yet: click **`</>`**, give it a
   nickname (anything — `apple-pie`), **don't** tick Firebase Hosting, register.
4. You get an **SDK setup and configuration** block. Choose **Config**.
   It looks like:

```js
const firebaseConfig = {
  apiKey: "AIzaSyD-...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
```

## 2 · Get the database URL (this one is *not* in that snippet)

1. Left sidebar → **Build → Realtime Database**
2. If it says *Create Database*, click it → pick a location → **Start in test mode**
   (you will replace those rules in step 4)
3. Copy the URL at the top of the Data tab. It is one of:
   - `https://your-project-default-rtdb.firebaseio.com` (US)
   - `https://your-project-default-rtdb.europe-west1.firebasedatabase.app` (EU)

> Since you are in the Netherlands you will almost certainly get the
> `europe-west1.firebasedatabase.app` form. Use whichever the console shows.

## 3 · Paste it in

Open **`js/firebase-config.js`** and fill in the seven values. That is the only
file you ever need to edit.

```js
window.FIREBASE_CONFIG = {
  apiKey:            'AIzaSyD-...',
  authDomain:        'your-project.firebaseapp.com',
  projectId:         'your-project',
  storageBucket:     'your-project.firebasestorage.app',
  messagingSenderId: '1234567890',
  appId:             '1:1234567890:web:abc123',
  databaseURL:       'https://your-project-default-rtdb.europe-west1.firebasedatabase.app'
};

window.PLAYER_ID   = 'her';         // change to make a separate profile
window.CAMPAIGN_ID = 'apple-pie';   // future campaigns get their own id
```

The pill above the character sheet now reads **● Cloud synced** instead of
**○ Cloud off**. That is the whole confirmation you need.

## 4 · Security rules

**Realtime Database → Rules**, paste the contents of `database.rules.json`,
**Publish**.

Those rules validate types and sizes on every node the game writes, so a
malformed or oversized write is rejected at the door rather than corrupting her
save. Read/write is open on `players/{playerId}` — deliberate, because there is
no login: it is one shared profile between the two of you.

If you would rather lock it down properly later, the clean upgrade is anonymous
auth plus `auth != null` rules. The sync layer will not need to change beyond
signing in during `init()`.

## 5 · Watch her play

Open **`watch.html`** on your phone or a second screen. It shows, updating live:

- her character and what she built
- current chapter and scene
- pie quality and ingredient totals, as bars
- clues, checks, crits
- **every dice roll and choice she makes**, newest first, with the full math
- her past runs and which endings she has found

Leave it open. Nothing to refresh — Realtime Database pushes.

---

## What gets written

```
players/her/
├── profile/                    lastSeenAt
└── campaigns/
    └── apple-pie/
        ├── progress/           node, scene, level, pieQuality, ingredients, clues, stats
        ├── character/          name, species, class, abilities, skills, look, HP, AC
        ├── endings/heir/       unlockedAt, runId, pieQuality
        ├── runs/r1abc.../      one row per finished playthrough
        └── feed/-Nxyz.../      live dice rolls + choices, capped at FEED_LIMIT
```

**`campaigns/` is the point.** Adding a second story later means one new
`CAMPAIGN_ID` and nothing else moves — her character, her endings and her run
history all sit at the player level or beside the first campaign, not inside it.

## If something is wrong

| Pill says | Meaning |
|---|---|
| ○ Cloud off | `firebase-config.js` still has `PASTE_ME` in it, or the SDK did not load |
| ◐ Connecting… | config is fine, no network yet. It retries on its own |
| ▲ Cloud error | hover the pill for the real message. Almost always rules or a bad `databaseURL` |

**The game never depends on any of this.** Offline, misconfigured, or with the
CDN blocked, it plays exactly as before from `localStorage`. Sync is a mirror on
top, never a dependency underneath.

## Rebuild the portable files

```bash
python3 build.py
```

Regenerates `grammys-apple-pie.html` and `watch-standalone.html` with your
config baked in — those two files can be emailed or AirDropped and opened
anywhere.
