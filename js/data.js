/* =========================================================
   data.js — all the rules & character-creation content.
   Every entry here has a real mechanical effect in the story.
   ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DNDData = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  /* ---------- core rule constants ---------- */
  const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
  const ABILITIES = [
    { key: 'str', name: 'Strength', short: 'STR', blurb: 'hauling, smashing, holding the line' },
    { key: 'dex', name: 'Dexterity', short: 'DEX', blurb: 'sneaking, climbing, quick hands' },
    { key: 'con', name: 'Constitution', short: 'CON', blurb: 'stamina, hit points, stubbornness' },
    { key: 'int', name: 'Intelligence', short: 'INT', blurb: 'ciphers, lore, reading old handwriting' },
    { key: 'wis', name: 'Wisdom', short: 'WIS', blurb: 'noticing, tracking, reading people' },
    { key: 'cha', name: 'Charisma', short: 'CHA', blurb: 'talking, performing, being believed' }
  ];

  /* ---------- skills ---------- */
  const SKILLS = [
    { key: 'athletics', name: 'Athletics', ability: 'str' },
    { key: 'acrobatics', name: 'Acrobatics', ability: 'dex' },
    { key: 'sleight', name: 'Sleight of Hand', ability: 'dex' },
    { key: 'stealth', name: 'Stealth', ability: 'dex' },
    { key: 'arcana', name: 'Arcana', ability: 'int' },
    { key: 'history', name: 'History', ability: 'int' },
    { key: 'nature', name: 'Nature', ability: 'int' },
    { key: 'animal', name: 'Animal Handling', ability: 'wis' },
    { key: 'religion', name: 'Religion', ability: 'wis' },
    { key: 'insight', name: 'Insight', ability: 'wis' },
    { key: 'medicine', name: 'Medicine', ability: 'wis' },
    { key: 'perception', name: 'Perception', ability: 'wis' },
    { key: 'survival', name: 'Survival', ability: 'wis' },
    { key: 'deception', name: 'Deception', ability: 'cha' },
    { key: 'intimidation', name: 'Intimidation', ability: 'cha' },
    { key: 'performance', name: 'Performance', ability: 'cha' },
    { key: 'persuasion', name: 'Persuasion', ability: 'cha' }
  ];
  const SKILL_BY_KEY = Object.fromEntries(SKILLS.map(s => [s.key, s]));

  /* ---------- species ---------- */
  const SPECIES = [
    {
      id: 'human', name: 'Human', icon: '🧑‍🌾',
      bonus: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
      traits: [
        { id: 'versatile', name: 'Versatile', text: 'You pick up one extra skill proficiency at level 1.' }
      ],
      extraSkills: 1,
      flavor: 'Bramblewick is mostly humans, which is to say mostly people who have opinions about pastry. Being one of them gets you through doors.'
    },
    {
      id: 'elf', name: 'Elf', icon: '🧝‍♀️',
      bonus: { dex: 2, int: 1 },
      traits: [
        { id: 'darkvision', name: 'Darkvision', text: 'You see in dim light and darkness. No torch needed in the cellar.' },
        { id: 'fey', name: 'Fey Ancestry', text: 'Charm effects cannot affect you. Certain sweet talk simply slides off.' }
      ],
      flavor: 'Elves think a hundred years is a reasonable amount of time to perfect a crust. They are not wrong.'
    },
    {
      id: 'halfling', name: 'Halfling', icon: '🦶',
      bonus: { dex: 2, cha: 1 },
      traits: [
        { id: 'lucky', name: 'Lucky', text: 'When you roll a 1 on the d20, you may reroll it once.' },
        { id: 'secondbreakfast', name: 'Second Breakfast', text: 'Food heals you for 1 extra hit point.' }
      ],
      flavor: 'You have been told your whole life that you look like you belong in a kitchen. You are going to prove it.'
    },
    {
      id: 'dwarf', name: 'Dwarf', icon: '⛏️',
      bonus: { con: 2, str: 1 },
      traits: [
        { id: 'darkvision', name: 'Darkvision', text: 'You see in dim light and darkness. No torch needed in the cellar.' },
        { id: 'stonecunning', name: 'Stone Cunning', text: 'Advantage on History checks about old stonework, cellars and ruins.' },
        { id: 'poisonres', name: 'Dwarven Resilience', text: 'You take no damage from wasp stings and other poisons.' }
      ],
      flavor: 'Under the orchard there is a great deal of very old stonework, and you will enjoy every inch of it.'
    },
    {
      id: 'tiefling', name: 'Tiefling', icon: '😈',
      bonus: { cha: 2, int: 1 },
      traits: [
        { id: 'fireres', name: 'Fire Resistance', text: 'You take half damage from fire — ovens included.' },
        { id: 'minorillusion', name: 'Thaumaturgy', text: 'You can conjure small illusions. Useful for distracting bees and badgers.' }
      ],
      flavor: 'Half the village crosses the street when you walk past. The other half wants to know what you know.'
    },
    {
      id: 'dragonborn', name: 'Dragonborn', icon: '🐉',
      bonus: { str: 2, cha: 1 },
      traits: [
        { id: 'breath', name: 'Breath Weapon', text: 'In combat you may breathe fire for 2d6 damage (once per fight).' },
        { id: 'fireres', name: 'Fire Resistance', text: 'You take half damage from fire — ovens included.' }
      ],
      flavor: 'You can hold a baking tray straight out of a 400-degree oven. Nobody else at the fair can say that.'
    }
  ];

  /* ---------- classes ---------- */
  const CLASSES = [
    {
      id: 'fighter', name: 'Fighter', icon: '⚔️', hitDie: 10,
      acBase: 13, ac: 'leather + shield (13 + DEX)', weapon: 'longsword', atkAbility: 'str',
      damage: '1d8', dmgAbility: 'str',
      classSkills: ['athletics', 'intimidation', 'perception', 'survival', 'animal', 'history'],
      skillsCount: 2,
      equipment: ['Longsword', 'Wooden shield', 'Leather armour'],
      features: [
        { id: 'secondwind', name: 'Second Wind', text: 'Once per adventure: regain 1d10 + 2 hit points as a bonus action.' }
      ],
      level2: { id: 'actionsurge', name: 'Action Surge', text: 'Once per fight: take a second action on your turn.' },
      flavor: 'You have carried heavy things for people who could not. A 40-pound sack of flour is not a problem. A wasp swarm is a problem, but a manageable one.'
    },
    {
      id: 'rogue', name: 'Rogue', icon: '🗝️', hitDie: 8,
      acBase: 12, ac: 'leather (12 + DEX)', weapon: 'shortsword', atkAbility: 'dex',
      damage: '1d6 (+1d6 sneak attack)', dmgAbility: 'dex', sneak: '1d6',
      classSkills: ['stealth', 'sleight', 'perception', 'deception', 'acrobatics', 'insight'],
      skillsCount: 2,
      equipment: ['Shortsword', "Thieves' tools", 'Leather armour', 'Hooded cloak'],
      features: [
        { id: 'expertise', name: 'Expertise', text: 'Choose one skill you are proficient in: your proficiency bonus on it is doubled (+4).' }
      ],
      level2: { id: 'cunningaction', name: 'Cunning Action', text: 'Once per fight: hide, dash or disengage as a bonus action (advantage on your next attack).' },
      flavor: 'You have taken things that were not yours. Tonight you may take something back, and the difference matters more than you expected.'
    },
    {
      id: 'wizard', name: 'Wizard', icon: '🔮', hitDie: 6,
      acBase: 11, ac: 'unarmoured (11 + DEX)', weapon: 'quarterstaff', atkAbility: 'int',
      damage: '1d6', dmgAbility: 'int',
      classSkills: ['arcana', 'history', 'insight', 'perception', 'nature', 'medicine'],
      skillsCount: 2,
      equipment: ['Quarterstaff', 'Spellbook', 'Component pouch', 'Two 1st-level spell slots'],
      cantrips: ['Fire Bolt (1d10 fire)', 'Prestidigitation', 'Mage Hand'],
      features: [
        { id: 'prestidigitation', name: 'Prestidigitation', text: 'Clean, flavour, warm or chill small things. Massively useful in a kitchen.' },
        { id: 'magehand', name: 'Mage Hand', text: 'A spectral hand reaches 30 feet. Retrieve things without touching them.' }
      ],
      level2: { id: 'arcanerecovery', name: 'Arcane Recovery', text: 'Regain one spell slot when you rest.' },
      flavor: 'You know eleven ways to light a fire and one way to make a crust rise. The second one is rarer.'
    },
    {
      id: 'bard', name: 'Bard', icon: '🪕', hitDie: 8,
      acBase: 13, ac: 'studded leather (13 + DEX)', weapon: 'rapier', atkAbility: 'dex',
      damage: '1d8', dmgAbility: 'dex',
      classSkills: ['performance', 'persuasion', 'deception', 'history', 'sleight', 'insight'],
      skillsCount: 2,
      equipment: ['Rapier', 'A well-loved lute', 'Leather armour', 'Costume trunk'],
      cantrips: ['Vicious Mockery (1d4 + disadvantage)', 'Prestidigitation'],
      features: [
        { id: 'jack', name: 'Jack of All Trades', text: 'Add +1 to every skill check you are NOT proficient in.' },
        { id: 'prestidigitation', name: 'Prestidigitation', text: 'Clean, flavour, warm or chill small things. Massively useful in a kitchen.' }
      ],
      level2: { id: 'inspiration', name: 'Bardic Inspiration', text: 'Once per adventure: add 1d6 to any roll, yours or an ally\'s.' },
      flavor: 'Every village has a song about a pie. You would like yours to have a second verse.'
    },
    {
      id: 'cleric', name: 'Cleric (Life)', icon: '✨', hitDie: 8,
      acBase: 16, ac: 'chain mail (16)', weapon: 'mace', atkAbility: 'str',
      damage: '1d6', dmgAbility: 'str',
      classSkills: ['medicine', 'insight', 'persuasion', 'religion', 'history', 'perception'],
      skillsCount: 2,
      equipment: ['Mace', 'Chain mail', 'Holy symbol (a wooden spoon, worn as a pendant)', 'Healer\'s kit'],
      features: [
        { id: 'healingword', name: 'Healing Word', text: 'Once per adventure: you or an ally regains 1d4 + Wisdom hit points.' },
        { id: 'bless', name: 'Bless', text: 'Once per adventure: add 1d4 to one roll.' }
      ],
      level2: { id: 'channel', name: 'Channel Divinity', text: 'Once per adventure: heal yourself or an ally for 2d8 + 2.' },
      flavor: 'You serve a small, warm god whose holy symbol is a pie dish. Nobody has ever told you that is not allowed.'
    },
    {
      id: 'ranger', name: 'Ranger', icon: '🏹', hitDie: 10,
      acBase: 12, ac: 'leather (12 + DEX)', weapon: 'longbow', atkAbility: 'dex',
      damage: '1d8', dmgAbility: 'dex',
      classSkills: ['survival', 'nature', 'perception', 'stealth', 'animal', 'athletics'],
      skillsCount: 2,
      equipment: ['Longbow + 20 arrows', 'Two shortswords', 'Leather armour', 'Trail rations'],
      features: [
        { id: 'natural', name: 'Natural Explorer', text: 'Advantage on Survival checks in forests and orchards.' },
        { id: 'huntersmark', name: "Hunter's Mark", text: 'Once per fight: mark a foe and add 1d6 to every attack against it.' },
        { id: 'forager', name: 'Forager', text: 'You always find an extra helping when gathering ingredients.' }
      ],
      level2: { id: 'primawareness', name: 'Primeval Awareness', text: 'Sense what kind of creatures are near you, even through walls.' },
      flavor: 'You can read a set of footprints the way other people read a letter. The orchard has a lot to say.'
    }
  ];

  /* ---------- backgrounds (origins) ---------- */
  const BACKGROUNDS = [
    {
      id: 'folkhero', name: 'Folk Hero', icon: '🌾',
      skills: ['animal', 'survival'],
      gear: [{ id: 'rusty_ploughshare', name: 'A piece of your family plough', kind: 'gear' }],
      feature: { id: 'rustic_hospitality', name: 'Rustic Hospitality', text: 'Common folk shelter you. Villagers start friendly instead of wary.' },
      flavor: 'You grew up behind a plough and learned that the whole village eats when the harvest holds.'
    },
    {
      id: 'criminal', name: 'Criminal', icon: '🌑',
      skills: ['deception', 'stealth'],
      gear: [{ id: 'thieves_tools', name: "Thieves' tools", kind: 'gear' }],
      feature: { id: 'criminal_contact', name: 'Criminal Contact', text: 'You can recognise a thief, and they can recognise you.' },
      flavor: 'You know exactly how someone gets through a locked window at night. It is a specialised education.'
    },
    {
      id: 'acolyte', name: 'Acolyte', icon: '🕯️',
      skills: ['insight', 'history'],
      gear: [{ id: 'temple_letter', name: 'Letter from your temple', kind: 'gear' }],
      feature: { id: 'shelter_faithful', name: 'Shelter of the Faithful', text: 'The church door is always open to you. +1 to Insight.' },
      flavor: 'You kept the candles lit and the records straight, which turns out to be the same job as keeping a recipe.'
    },
    {
      id: 'entertainer', name: 'Entertainer', icon: '🎭',
      skills: ['performance', 'persuasion'],
      gear: [{ id: 'disguise_kit', name: 'Disguise kit', kind: 'gear' }],
      feature: { id: 'by_popular_demand', name: 'By Popular Demand', text: 'You always find an audience. Crowds lean your way.' },
      flavor: 'You have played every tavern between here and the coast, always for supper, always for coins.'
    },
    {
      id: 'artisan', name: 'Guild Artisan', icon: '🍞',
      skills: ['insight', 'persuasion'],
      gear: [{ id: 'bakers_tools', name: 'Your own rolling pin & baking tools', kind: 'gear' }],
      feature: { id: 'guild_membership', name: 'Guild Membership', text: 'Trade folk trust you. +1 to checks with merchants. Rolling pin: +1 to baking rolls.' },
      flavor: 'You apprenticed four years to learn that dough is mostly patience wearing a flour disguise.'
    },
    {
      id: 'soldier', name: 'Soldier', icon: '🛡️',
      skills: ['athletics', 'intimidation'],
      gear: [{ id: 'rank_insignia', name: 'Your old rank insignia', kind: 'gear' }],
      feature: { id: 'military_rank', name: 'Military Rank', text: 'People used to orders listen. +1 to Intimidation and Persuasion with officials.' },
      flavor: 'You guarded a border for three years and never once missed a ration. You know what it is to be hungry.'
    },
    {
      id: 'hermit', name: 'Hermit', icon: '🌲',
      skills: ['medicine', 'nature'],
      gear: [{ id: 'herbalism_kit', name: 'Herbalism kit', kind: 'gear' }],
      feature: { id: 'discovery', name: 'Discovery', text: 'You know a secret about Bramblewick that nobody else remembers.' },
      flavor: 'You lived nine years at the top of the valley and came down for one reason: you smelled cinnamon.'
    }
  ];

  /* ---------- appearance ---------- */
  const HAIR_STYLES = ['Long braid', 'Short & tousled', 'Tightly curled', 'Shaved at the sides', 'Waist-length & wild', 'In a neat bun', 'Bald & polished'];
  const HAIR_COLORS = [
    { name: 'Chestnut', hex: '#6b3f21' }, { name: 'Wheat', hex: '#d9b26a' },
    { name: 'Raven', hex: '#241b18' }, { name: 'Copper', hex: '#b4552a' },
    { name: 'Silver', hex: '#c9c6bd' }, { name: 'Moss green', hex: '#5f7a3a' },
    { name: 'Storm grey', hex: '#6f6f78' }, { name: 'Plum', hex: '#6d3355' }
  ];
  const EYE_COLORS = [
    { name: 'Hazel', hex: '#8a6a34' }, { name: 'Storm blue', hex: '#4a7a9c' },
    { name: 'Green', hex: '#4f7a48' }, { name: 'Amber', hex: '#c98a2e' },
    { name: 'Violet', hex: '#7a5a9c' }, { name: 'Charcoal', hex: '#33302e' },
    { name: 'Gold-flecked', hex: '#b58c2c' }, { name: 'Silver', hex: '#b9bcc0' }
  ];
  const SKIN_TONES = [
    { name: 'Porcelain', hex: '#f6dcc4' }, { name: 'Fair', hex: '#eec7a6' },
    { name: 'Olive', hex: '#d3a279' }, { name: 'Bronze', hex: '#b57f52' },
    { name: 'Umber', hex: '#8b5a34' }, { name: 'Deep', hex: '#5c3a22' },
    { name: 'Ashen', hex: '#cdbfae' }, { name: 'Frost-touched', hex: '#e8e3dc' },
    { name: 'Sea blue', hex: '#7fa8b8' }, { name: 'Ember red', hex: '#c05548' },
    { name: 'Violet', hex: '#9a7bb0' }, { name: 'Moss', hex: '#7ba05b' },
    { name: 'Scale ivory', hex: '#dfe6ea' }, { name: 'Scale brass', hex: '#d9a94e' }
  ];
  const HEIGHTS = ['Smaller', 'Average', 'Taller'];
  const SPECIES_DEFAULT_SKIN = {
    human: 'Fair', elf: 'Porcelain', halfling: 'Olive', dwarf: 'Bronze',
    tiefling: 'Sea blue', dragonborn: 'Scale ivory'
  };
  const MARKS = [
    { id: 'freckles', name: 'Freckles like cinnamon', text: '+1 to Persuasion with cooks and grandmothers.' },
    { id: 'scar', name: 'A burn scar on one hand', text: 'You have been near fire before: +1 to rolls against fire and ovens.' },
    { id: 'gap', name: 'One chipped front tooth', text: 'You look harmless: +1 to Deception and Stealth.' },
    { id: 'tattoo', name: 'An apple-blossom tattoo', text: '+1 to Nature and Animal Handling.' },
    { id: 'glasses', name: 'Spectacles with one cracked lens', text: '+1 to Perception and History.' },
    { id: 'none', name: 'Nothing remarkable', text: 'You are forgettable on purpose: +1 to Stealth.' }
  ];
  const OUTFITS = [
    { id: 'cloak', name: 'Travel-worn cloak', text: 'Advantage on Stealth when you can pull the hood up.' },
    { id: 'apron', name: 'Flour-dusted apron', text: '+1 to every roll made in a kitchen.' },
    { id: 'fine', name: 'Fine clothes (slightly out of date)', text: '+1 to Persuasion and Deception with important people.' },
    { id: 'patched', name: 'Patched leathers', text: '+1 to Acrobatics, Athletics and Survival.' }
  ];
  const TRINKETS = [
    { id: 'spoon', name: 'A wooden spoon worn smooth', text: 'Reroll one failed baking check. (One use.)' },
    { id: 'button', name: 'A brass button from a coat you loved', text: 'One free reroll on any Charisma check. (One use.)' },
    { id: 'blossom', name: 'A pressed apple blossom', text: 'Advantage on one Nature or Animal Handling check. (One use.)' },
    { id: 'thread', name: 'A spool of red thread', text: 'Mend or rig one thing: turn a disaster into a workable result. (One use.)' },
    { id: 'foot', name: "A rabbit's foot (ethically sourced)", text: 'Reroll one natural 1 you ever roll. (One use.)' },
    { id: 'coin', name: 'A coin from a country that no longer exists', text: 'Once, buy something you cannot afford.' }
  ];

  /* ---------- enemies ---------- */
  const ENEMIES = {
    wasps: {
      name: 'Wasp Swarm', icon: '🐝', ac: 12, hp: 20, atk: 4, dmg: '1d6', dmgType: 'poison',
      speed: 30, note: 'Resist its poison and it cannot hurt you at all.'
    },
    badger: {
      name: 'Bramble the Badger', icon: '🦡', ac: 13, hp: 16, atk: 3, dmg: '1d6', dmgType: 'piercing',
      speed: 25, note: 'She is protecting something. Consider not fighting her.'
    },
    guardian: {
      name: 'The Cellar Guardian', icon: '🗿', ac: 15, hp: 24, atk: 5, dmg: '1d8', dmgType: 'bludgeoning',
      speed: 20, note: 'Old stone, older temper. It does not want to be awake — and it gets wearier every time it is woken.'
    }
  };

  /* ---------- ingredients ---------- */
  const INGREDIENTS = [
    { id: 'apples', name: 'Apples', icon: '🍎', place: 'orchard' },
    { id: 'flour', name: 'Flour', icon: '🌾', place: 'mill' },
    { id: 'honey', name: 'Honey', icon: '🍯', place: 'beehive' },
    { id: 'cinnamon', name: 'Cinnamon', icon: '🪵', place: 'bakery' },
    { id: 'memory', name: 'The secret ingredient', icon: '💛', place: 'grammys' }
  ];

  /* ---------- endings ---------- */
  const ENDINGS = [
    { id: 'true', name: 'The Whole Truth', icon: '🥇', rarity: 'Secret ending', desc: 'Every clue found, the thief forgiven, the recipe recovered, and the pie perfect.' },
    { id: 'heir', name: "Grammy's Heir", icon: '🥧', rarity: 'Best ending', desc: 'Grammy teaches you the recipe, and you are the one who keeps it alive.' },
    { id: 'champion', name: 'Champion of the Fair', icon: '🏆', rarity: 'Great ending', desc: 'First place blue ribbon. The whole valley tastes it.' },
    { id: 'humble', name: 'A Humble Slice', icon: '🍂', rarity: 'Good ending', desc: 'Not perfect — but Grammy eats two slices, and that is its own ribbon.' },
    { id: 'burnt', name: 'Smoke in the Kitchen', icon: '💨', rarity: 'Tough ending', desc: 'The pie failed. The night did not.' },
    { id: 'recipe', name: 'The Recipe Kept', icon: '📜', rarity: 'Bittersweet ending', desc: 'You learned why the recipe was never written down, and you kept the promise anyway.' }
  ];


  /* =============== reactive portrait ===============
     One renderer used by the game, the creation preview and the watch
     page. Accepts any of the three shapes we pass around:
       · pc        (finishCharacter result: hairColorHex, species id, ...)
       · build     (creation state: hairColor {name,hex} objects)
       · character (watch-page node: speciesName-as-name, look: {...})   */
  function avatarSVG(a, size) {
    a = a || {};
    const look = a.look || a;
    const skin = look.skinHex || (look.skin && look.skin.hex) || '#eec7a6';
    const hair = look.hairHex || look.hairColorHex || (look.hairColor && look.hairColor.hex) || '#6b3f21';
    const eyes = look.eyeHex || look.eyeColorHex || (look.eyeColor && look.eyeColor.hex) || '#8a6a34';
    const style = String(look.hairStyle || '').toLowerCase();
    const mark = look.mark || 'none';
    const outfit = String(look.outfit || 'cloak');
    const height = String(look.height || a.height || 'Average');

    const pron = String(a.pronouns || 'she/her').toLowerCase().split('/')[0];
    const fem = pron === 'she';
    const masc = pron === 'he';
    const sp = String(a.species || 'human').toLowerCase();
    const cl = String(a.class || '').toLowerCase();

    const dwarf = sp === 'dwarf', elf = sp === 'elf', halfling = sp === 'halfling';
    const tiefling = sp === 'tiefling', dragon = sp === 'dragonborn';
    const bald = /bald/.test(style);
    const long = /long|braid|waist|bun/.test(style);
    const braided = /braid|long|waist/.test(style);
    const short = /short|tousled|shaved/.test(style);
    const curly = /curl/.test(style);
    const bun = /bun/.test(style);

    /* --- stature: the species sets the baseline, the height choice nudges --- */
    const BASE = { halfling: 0.8, dwarf: 0.87, human: 1, elf: 0.99, tiefling: 1, dragonborn: 1.06 };
    const DELTA = { Smaller: -0.07, Average: 0, Taller: 0.07 };
    let sc = (BASE[sp] || 1) + (DELTA[height] || 0);
    sc = Math.max(0.68, Math.min(1.14, sc));
    const scs = String(Math.round(sc * 100) / 100);
    const scale = ' transform="translate(' + (60 * (1 - sc)).toFixed(1) + ' ' + (130 * (1 - sc)).toFixed(1) + ') scale(' + scs + ')"';

    /* --- body --- */
    const BODY_FILL = { cloak: '#7d4b22', apron: '#d8c49a', fine: '#7b2d3f', patched: '#6a6a42' };
    const bodyFill = BODY_FILL[outfit] || BODY_FILL.cloak;
    const torso = dwarf
      ? '<path data-part="torso" d="M16 130 q4 -32 44 -32 q40 0 44 32 z" fill="' + bodyFill + '"/>'
      : masc
      ? '<path data-part="torso" d="M20 130 q4 -30 40 -30 q36 0 40 30 z" fill="' + bodyFill + '"/>'
      : fem
      ? '<path data-part="torso" d="M28 130 q6 -26 32 -26 q26 0 32 26 z" fill="' + bodyFill + '"/>'
      : '<path data-part="torso" d="M24 130 q5 -28 36 -28 q31 0 36 28 z" fill="' + bodyFill + '"/>';

    let bodyDeco = '';
    if (outfit === 'apron') bodyDeco = '<g data-part="apron"><path d="M44 110 q16 8 32 0 l5 20 h-42 z" fill="#f3ead4"/><g fill="#fff" opacity=".85"><circle cx="50" cy="118" r="1.3"/><circle cx="62" cy="122" r="1.2"/><circle cx="72" cy="116" r="1.4"/><circle cx="56" cy="126" r="1.1"/></g></g>';
    if (outfit === 'fine') bodyDeco = '<path data-part="collar" d="M46 108 q14 10 28 0" stroke="#e0b64a" stroke-width="3.2" fill="none"/>';
    if (outfit === 'patched') bodyDeco = '<g data-part="patches" fill="#8a7442"><rect x="32" y="114" width="11" height="8" rx="2" transform="rotate(-7 37 118)"/><rect x="68" y="118" width="10" height="7" rx="2" transform="rotate(9 73 121)"/></g>';

    /* --- beard --- */
    let beard = '', stubble = '', beardRings = '';
    if (dwarf) {
      beard = braided
        ? '<g data-part="beard"><path d="M34 72 q26 38 52 0 q0 28 -26 30 q-26 -2 -26 -30 z" fill="' + hair + '"/><path d="M60 98 q5 16 1 26 q-6 -10 -1 -26 z" fill="' + hair + '"/><circle cx="61" cy="122" r="3" fill="' + hair + '"/></g>'
        : '<g data-part="beard"><path d="M34 72 q26 40 52 0 q0 26 -26 28 q-26 -2 -26 -28 z" fill="' + hair + '"/></g>';
      beardRings = '<g data-part="beard-rings" fill="#9aa0a8"><rect x="45" y="90" width="7" height="5" rx="2.4"/><rect x="68" y="90" width="7" height="5" rx="2.4"/></g>';
    } else if (masc) {
      beard = braided
        ? '<g data-part="beard"><path d="M42 76 q18 22 36 0 q-2 18 -18 22 q-16 -4 -18 -22 z" fill="' + hair + '"/><path d="M57 96 q4 16 2 25 q-6 -9 -2 -25 z" fill="' + hair + '"/></g>'
        : '<g data-part="beard"><path d="M42 76 q18 18 36 0 q-2 14 -18 16 q-16 -2 -18 -16 z" fill="' + hair + '"/></g>';
      stubble = '<g data-part="stubble" fill="' + hair + '" opacity=".22"><circle cx="44" cy="84" r="1"/><circle cx="50" cy="88" r="1"/><circle cx="60" cy="89" r="1"/><circle cx="70" cy="88" r="1"/><circle cx="76" cy="84" r="1"/></g>';
    }

    /* --- ears per species: elves get long elegant ones --- */
    const ears = (elf || tiefling)
      ? (elf
        ? '<g data-part="ears" fill="' + skin + '"><path d="M31 50 q-17 2 -15 21 q12 1 17 -10 z"/><path d="M89 50 q17 2 15 21 q-12 1 -17 -10 z"/></g>'
        : '<g data-part="ears" fill="' + skin + '"><path d="M30 52 q-13 3 -10 18 q10 1 14 -9 z"/><path d="M90 52 q13 3 10 18 q-10 1 -14 -9 z"/></g>')
      : dragon
      ? '<g data-part="frill" fill="' + skin + '" opacity=".85"><path d="M28 48 q-9 7 -5 20 q7 -3 9 -11 z"/><path d="M92 48 q9 7 5 20 q-7 -3 -9 -11 z"/></g>'
      : '<ellipse cx="28" cy="66" rx="5" ry="8" fill="' + skin + '"/><ellipse cx="92" cy="66" rx="5" ry="8" fill="' + skin + '"/>';

    const earring = dwarf
      ? '<circle data-part="earring" cx="27" cy="75" r="3.4" fill="none" stroke="#e0b64a" stroke-width="2"/>'
      : elf
      ? '<g data-part="earring"><path d="M92 74 v5" stroke="#e0b64a" stroke-width="1.4"/><circle cx="92" cy="81" r="2" fill="#4f7a48"/></g>'
      : '';

    /* --- dragonborn: snout, swept horns, jaw spikes, scale texture --- */
    const snout = dragon
      ? '<g data-part="snout"><ellipse cx="60" cy="80" rx="17" ry="12" fill="' + skin + '"/><ellipse cx="60" cy="80" rx="17" ry="12" fill="rgba(0,0,0,.06)"/><circle cx="53.5" cy="77" r="1.7" fill="rgba(0,0,0,.4)"/><circle cx="66.5" cy="77" r="1.7" fill="rgba(0,0,0,.4)"/><path d="M52 87 q8 4 16 0" stroke="rgba(0,0,0,.3)" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>'
      : '';
    const crest = dragon
      ? '<g data-part="crest" fill="' + hair + '"><path d="M52 24 l4 -13 5 11 z"/><path d="M64 24 l5 -12 4 12 z"/></g>' +
        '<g data-part="horns" fill="' + hair + '"><path d="M42 30 q-16 -14 -12 -30 q12 8 18 22 z"/><path d="M78 30 q16 -14 12 -30 q-12 8 -18 22 z"/></g>' +
        '<g data-part="jaw-spikes" fill="' + skin + '"><path d="M30 72 l-7 3 6 4 z"/><path d="M32 82 l-6 4 6 3 z"/><path d="M90 72 l7 3 -6 4 z"/><path d="M88 82 l6 4 -6 3 z"/></g>' +
        '<g data-part="scales" stroke="rgba(0,0,0,.14)" fill="none" stroke-width="1.2"><path d="M40 96 q4 3 8 0"/><path d="M52 100 q4 3 8 0"/><path d="M64 100 q4 3 8 0"/><path d="M74 96 q4 3 8 0"/><path d="M44 42 q4 -3 8 0"/><path d="M68 42 q4 -3 8 0"/></g>'
      : '';

    /* --- tiefling: big curling horns, spade tail, fangs --- */
    const horns = tiefling
      ? '<g data-part="horns" fill="#4a352a"><path d="M40 32 C22 26 16 10 24 2 C30 10 38 18 46 26 z"/><path d="M80 32 C98 26 104 10 96 2 C90 10 82 18 74 26 z"/></g>'
      : '';
    const tail = tiefling
      ? '<g data-part="tail"><path d="M94 128 q17 -7 13 -24 q0 8 -5 11" stroke="#8a5a3a" stroke-width="3.2" fill="none" stroke-linecap="round"/><path data-part="tail-spade" d="M104 100 l7 -7 3 9 -9 3 z" fill="#8a5a3a"/></g>'
      : '';
    const fangs = tiefling
      ? '<g data-part="fangs" fill="#fff"><path d="M49 79 l2.4 4.4 2 -4.4 z"/><path d="M66.6 79 l2.4 4.4 2 -4.4 z"/></g>'
      : '';

    /* --- hair (never for dragonborn or the bald) --- */
    let hairBack = '', hairTop = '', curls = '', bunTop = '', braidStrand = '';
    if (!dragon && !bald) {
      hairBack = long ? '<path d="M22 62 q-6 40 4 58 h68 q10 -18 4 -58 z" fill="' + hair + '"/>' : '';
      hairTop = '<path data-part="hair-top" d="' + (short
        ? 'M26 56 q2 -32 34 -32 q32 0 34 32 q-10 -14 -34 -14 q-24 0 -34 14 z'
        : 'M24 60 q0 -38 36 -38 q36 0 36 38 q-8 -20 -36 -20 q-28 0 -36 20 z') + '" fill="' + hair + '"/>';
      curls = curly ? '<g fill="' + hair + '"><circle cx="30" cy="34" r="9"/><circle cx="44" cy="26" r="10"/><circle cx="60" cy="26" r="10"/><circle cx="74" cy="34" r="9"/><circle cx="26" cy="48" r="8"/><circle cx="78" cy="48" r="8"/></g>' : '';
      bunTop = bun ? '<circle cx="60" cy="18" r="11" fill="' + hair + '"/>' : '';
      braidStrand = /braid/.test(style) ? '<path d="M78 62 q14 16 8 40 q-2 8 -8 6 q6 -22 -6 -38 z" fill="' + hair + '"/>' : '';
    }

    /* --- class gear --- */
    const behind = {
      fighter: '<g data-part="sword"><path d="M92 124 l14 -40" stroke="#9aa0a8" stroke-width="4.4" stroke-linecap="round"/><path d="M101 90 l9 -4" stroke="#7a4a1e" stroke-width="3.4"/><circle cx="108" cy="82" r="3.2" fill="#c9873f"/></g>',
      bard: '<g data-part="lute"><path d="M98 126 l7 -42" stroke="#9c6b30" stroke-width="5" stroke-linecap="round"/><circle cx="106" cy="82" r="4.4" fill="#7a4a1e"/><g fill="#3d2a10"><circle cx="104" cy="78" r="1.1"/><circle cx="108" cy="78" r="1.1"/></g></g>',
      ranger: '<g data-part="bow"><path d="M100 86 q11 26 0 42" stroke="#7a4a1e" stroke-width="3.6" fill="none"/><path d="M100 86 v42" stroke="#e8dcb8" stroke-width="1.2"/><path d="M96 93 l-6 -11" stroke="#7a4a1e" stroke-width="2.8" stroke-linecap="round"/></g>'
    };
    const onBody = {
      fighter: '<g data-part="pauldron"><ellipse cx="23" cy="115" rx="13" ry="9.5" fill="#8d939b"/><ellipse cx="23" cy="112" rx="13" ry="9.5" fill="#b9bfc7"/><ellipse cx="23" cy="111" rx="8" ry="5.5" fill="#cfd5db"/></g>',
      rogue: '<g data-part="dagger"><path d="M83 111 l11 15" stroke="#9aa0a8" stroke-width="3.6" stroke-linecap="round"/><path d="M81 109 l5 6" stroke="#3d3020" stroke-width="4.4" stroke-linecap="round"/></g>',
      cleric: '<g data-part="amulet"><path d="M48 106 q12 11 24 0" stroke="#e0b64a" stroke-width="2.2" fill="none"/><circle cx="60" cy="115" r="5.4" fill="#e0b64a"/><path d="M60 112 v6.5 M56.8 115 h6.5" stroke="#8a5322" stroke-width="1.7"/></g>'
    };
    const hoodBack = cl === 'rogue'
      ? '<path data-part="hood" d="M32 100 q28 -18 56 0 q-10 15 -28 15 q-18 0 -28 -15 z" fill="#40483f"/>'
      : cl === 'ranger'
      ? '<path data-part="hood" d="M36 102 q24 -15 48 0 q-8 12 -24 12 q-16 0 -24 -12 z" fill="#5a6e3a"/>'
      : '';
    const hat = cl === 'wizard'
      ? '<g data-part="hat"><path d="M60 2 q-6 27 -22 37 h44 q-16 -10 -22 -37 z" fill="#3f4a8a"/><ellipse cx="60" cy="40" rx="28" ry="6.5" fill="#3f4a8a"/><path d="M41 34 q19 8 38 0 l-2 5 q-17 7 -34 0 z" fill="#e0b64a"/><path d="M52 15 l1.8 4.6 4.6 1.8 -4.6 1.8 -1.8 4.6 -1.8 -4.6 -4.6 -1.8 4.6 -1.8 z" fill="#e0b64a"/></g>'
      : '';
    const cap = cl === 'bard'
      ? '<g data-part="cap"><ellipse cx="57" cy="33" rx="27" ry="9.5" fill="#8a3550" transform="rotate(-7 57 33)"/><ellipse cx="57" cy="30" rx="27" ry="9.5" fill="#a54060" transform="rotate(-7 57 30)"/><path d="M79 25 q13 -11 8 -23 q-10 7 -12 17 z" fill="#b3352b"/></g>'
      : '';
    const notes = cl === 'bard'
      ? '<g data-part="notes" fill="#7d4b22" opacity=".75"><text x="8" y="48" font-size="15" font-family="serif">&#9834;</text><text x="100" y="60" font-size="11" font-family="serif">&#9835;</text></g>'
      : '';
    const halo = cl === 'cleric'
      ? '<ellipse data-part="halo" cx="60" cy="22" rx="21" ry="5.5" fill="none" stroke="#e0b64a" stroke-width="2.6" opacity=".7"/>'
      : '';

    /* --- marks --- */
    const marks = {
      freckles: '<g fill="#b4713f" opacity=".55"><circle cx="45" cy="66" r="1.3"/><circle cx="50" cy="69" r="1.3"/><circle cx="55" cy="66" r="1.3"/><circle cx="62" cy="69" r="1.3"/><circle cx="67" cy="66" r="1.3"/><circle cx="41" cy="70" r="1.2"/><circle cx="71" cy="70" r="1.2"/></g>',
      scar: '<path d="M66 58 q4 6 1 13" stroke="#c98a6a" stroke-width="2" fill="none" stroke-linecap="round"/>',
      gap: '<rect x="55" y="79" width="4" height="4" fill="#f6ead2"/>',
      tattoo: '<g stroke="#b3352b" stroke-width="1.4" fill="none" opacity=".8"><circle cx="24" cy="86" r="4"/><path d="M24 82 v-4 M20 86 h-3"/></g>',
      glasses: '<g stroke="#5c4630" stroke-width="2" fill="none"><circle cx="47" cy="60" r="9"/><circle cx="73" cy="60" r="9"/><path d="M56 60 h8"/></g>',
      none: ''
    };

    const brows = dwarf
      ? '<g data-part="brows" fill="' + hair + '"><path d="M37 49 q11 -7 20 -1 l-2 6 q-9 -4 -17 1 z"/><path d="M63 48 q11 -6 20 1 l-1 6 q-10 -5 -17 -1 z"/></g>'
      : '<g data-part="brows"><path d="M40 50 q7 -4 14 -1" stroke="' + hair + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".85"/><path d="M66 49 q7 -3 14 1" stroke="' + hair + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".85"/></g>';

    const face = dragon ? '' :
      '<path d="M58 64 q2 8 0 10" stroke="rgba(0,0,0,.18)" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M50 80 q10 7 20 0" stroke="#8a4a3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      (fem ? '<ellipse cx="40" cy="72" rx="6" ry="3.6" fill="#d9736a" opacity=".28"/><ellipse cx="80" cy="72" rx="6" ry="3.6" fill="#d9736a" opacity=".28"/>' : '');

    /* halflings stay young-faced: bigger eyes, rounder head */
    const headRx = elf ? 30 : halfling ? 33 : 32;
    const eyeRx = halfling ? 5.8 : 5;
    const eyeP = halfling ? 3.5 : 3.1;
    const w = size || 96;

    return '<svg viewBox="0 0 120 130" width="' + w + '" height="' + (w * 130 / 120) + '" role="img" aria-label="character portrait">' +
      '<ellipse cx="60" cy="120" rx="42" ry="10" fill="rgba(138,83,34,.16)"/>' +
      '<g data-part="figure"' + scale + '>' +
        tail + (behind[cl] || '') +
        hairBack + braidStrand +
        torso + bodyDeco +
        hoodBack + (onBody[cl] || '') +
        ears + earring +
        '<ellipse cx="60" cy="62" rx="' + headRx + '" ry="36" fill="' + skin + '"/>' +
        snout +
        hairTop + curls + bunTop + hat + cap +
        '<ellipse cx="47" cy="60" rx="' + eyeRx + '" ry="' + (eyeRx + 0.6) + '" fill="#fff"/><ellipse cx="73" cy="60" rx="' + eyeRx + '" ry="' + (eyeRx + 0.6) + '" fill="#fff"/>' +
        '<circle cx="47.6" cy="60.6" r="' + eyeP + '" fill="' + eyes + '"/><circle cx="73.6" cy="60.6" r="' + eyeP + '" fill="' + eyes + '"/>' +
        '<circle cx="48.6" cy="59.4" r="1.1" fill="#fff"/><circle cx="74.6" cy="59.4" r="1.1" fill="#fff"/>' +
        brows + face + fangs + beard + beardRings + stubble +
        (marks[mark] || '') +
        horns + crest + halo + notes +
      '</g></svg>';
  }

  return Object.freeze({
    STANDARD_ARRAY, ABILITIES, SKILLS, SKILL_BY_KEY, SPECIES, CLASSES, BACKGROUNDS,
    HAIR_STYLES, HAIR_COLORS, EYE_COLORS, SKIN_TONES, MARKS, OUTFITS, TRINKETS, HEIGHTS, SPECIES_DEFAULT_SKIN,
    ENEMIES, INGREDIENTS, ENDINGS, avatarSVG
  });
});
