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
  const HAIR_STYLES = ['Long braid', 'Short & tousled', 'Tightly curled', 'Shaved at the sides', 'Waist-length & wild', 'In a neat bun'];
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
    { name: 'Ashen', hex: '#cdbfae' }, { name: 'Frost-touched', hex: '#e8e3dc' }
  ];
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

  return Object.freeze({
    STANDARD_ARRAY, ABILITIES, SKILLS, SKILL_BY_KEY, SPECIES, CLASSES, BACKGROUNDS,
    HAIR_STYLES, HAIR_COLORS, EYE_COLORS, SKIN_TONES, MARKS, OUTFITS, TRINKETS,
    ENEMIES, INGREDIENTS, ENDINGS
  });
});
