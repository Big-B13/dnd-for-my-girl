/* =========================================================
   firebase-config.js  —  project dnd-game-ee771
   =========================================================
   Connected 2026-09-25 from the Firebase console web config.
   These values are public by design (it is a client web app);
   the security rules in database.rules.json are the protection.
   ========================================================= */

window.FIREBASE_CONFIG = {
  apiKey:            'AIzaSyDm7Pzzxv6v98bXDarzjnnk6YD4kN-fKrA',
  authDomain:        'dnd-game-ee771.firebaseapp.com',
  projectId:         'dnd-game-ee771',
  storageBucket:     'dnd-game-ee771.firebasestorage.app',
  messagingSenderId: '1068477840609',
  appId:             '1:1068477840609:web:f0b4b348d4a88c44ffcba0',
  measurementId:     'G-M9P1TFN0DC',

  // Realtime Database (europe-west1), copied from the Database tab
  databaseURL:       'https://dnd-game-ee771-default-rtdb.europe-west1.firebasedatabase.app'
};

/* One shared profile: her game, your watch page, same place.
   Change this string to start a fresh, separate profile. */
window.PLAYER_ID = 'her';

/* Each campaign gets its own slot under this player, so future
   stories slot in beside this one without touching anything. */
window.CAMPAIGN_ID = 'apple-pie';

/* How many dice rolls / choices the live feed keeps. */
window.FEED_LIMIT = 200;
