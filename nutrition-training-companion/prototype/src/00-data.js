/* Companion prototype — sample data.
   Everything here is illustrative sample data for the prototype, except the
   three research citations, which are real publications (see docs/06 §6.8). */
(function () {
  'use strict';

  const C = (window.Companion = window.Companion || {});

  /* ---------------------------------------------------------------- dates */
  const DAY = 24 * 60 * 60 * 1000;
  const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const daysAgo = (n, hour = 9, minute = 0) => {
    const d = new Date(startOfToday() - n * DAY);
    d.setHours(hour, minute, 0, 0);
    return d.getTime();
  };
  /* Monday of the current week (local time). */
  const startOfWeek = () => {
    const d = new Date(startOfToday());
    const offset = (d.getDay() + 6) % 7; // Monday = 0
    return d.getTime() - offset * DAY;
  };

  /* ------------------------------------------------------- barcode helper */
  /* GTIN check digit: weights 3,1,3,1… from the right of the body. */
  function checkDigit(body) {
    let sum = 0;
    for (let i = 0; i < body.length; i++) {
      const digit = Number(body[body.length - 1 - i]);
      sum += digit * (i % 2 === 0 ? 3 : 1);
    }
    return String((10 - (sum % 10)) % 10);
  }
  const ean13 = (twelve) => twelve + checkDigit(twelve);

  /* --------------------------------------------------------------- muscles */
  const MUSCLES = [
    { id: 'chest', name: 'Chest', group: 'Chest' },
    { id: 'front_delts', name: 'Front delts', group: 'Shoulders' },
    { id: 'side_delts', name: 'Side delts', group: 'Shoulders' },
    { id: 'rear_delts', name: 'Rear delts', group: 'Shoulders' },
    { id: 'lats', name: 'Lats', group: 'Back' },
    { id: 'upper_back', name: 'Upper back', group: 'Back' },
    { id: 'biceps', name: 'Biceps', group: 'Arms' },
    { id: 'triceps', name: 'Triceps', group: 'Arms' },
    { id: 'quads', name: 'Quads', group: 'Legs' },
    { id: 'hamstrings', name: 'Hamstrings', group: 'Legs' },
    { id: 'glutes', name: 'Glutes', group: 'Legs' },
    { id: 'calves', name: 'Calves', group: 'Legs' },
    { id: 'abs', name: 'Abs', group: 'Core' }
  ];

  /* Words people use for each muscle (intent parsing). */
  const MUSCLE_WORDS = {
    lats: ['back', 'lats', 'lat', 'wider back', 'v-taper'],
    upper_back: ['upper back', 'traps', 'rhomboids', 'thicker back'],
    chest: ['chest', 'pecs', 'pec'],
    side_delts: ['shoulders', 'shoulder', 'delts', 'side delts', 'wider shoulders'],
    rear_delts: ['rear delts', 'rear delt'],
    front_delts: ['front delts'],
    biceps: ['biceps', 'bicep', 'arms', 'arm'],
    triceps: ['triceps', 'tricep'],
    quads: ['quads', 'quad', 'thighs', 'legs', 'leg'],
    hamstrings: ['hamstrings', 'hamstring', 'hams'],
    glutes: ['glutes', 'glute', 'bum', 'butt'],
    calves: ['calves', 'calf'],
    abs: ['abs', 'core', 'six pack']
  };

  /* ------------------------------------------------------------ exercises */
  /* credit: how much one hard set counts toward each muscle (1 primary, 0.5 secondary). */
  const EXERCISES = [
    { id: 'bench-press', name: 'Barbell bench press', equipment: ['barbell', 'bench', 'rack'], region: 'upper', credit: { chest: 1, triceps: 0.5, front_delts: 0.5 } },
    { id: 'incline-db-press', name: 'Incline dumbbell press', equipment: ['dumbbells', 'bench'], region: 'upper', credit: { chest: 1, front_delts: 0.5, triceps: 0.5 } },
    { id: 'incline-bb-press', name: 'Incline barbell press', equipment: ['barbell', 'bench', 'rack'], region: 'upper', credit: { chest: 1, front_delts: 0.5, triceps: 0.5 } },
    { id: 'cable-fly', name: 'Cable fly', equipment: ['cable'], region: 'upper', credit: { chest: 1 } },
    { id: 'overhead-press', name: 'Overhead press', equipment: ['barbell', 'rack'], region: 'upper', credit: { front_delts: 1, triceps: 0.5, side_delts: 0.5 } },
    { id: 'lateral-raise', name: 'Dumbbell lateral raise', equipment: ['dumbbells'], region: 'upper', credit: { side_delts: 1 } },
    { id: 'cable-lateral-raise', name: 'Cable lateral raise', equipment: ['cable'], region: 'upper', credit: { side_delts: 1 } },
    { id: 'face-pull', name: 'Face pull', equipment: ['cable'], region: 'upper', credit: { rear_delts: 1, upper_back: 0.5 } },
    { id: 'lat-pulldown', name: 'Lat pulldown', equipment: ['cable'], region: 'upper', credit: { lats: 1, upper_back: 0.5, biceps: 0.5 } },
    { id: 'pull-up', name: 'Pull-up', equipment: ['pull-up bar'], region: 'upper', credit: { lats: 1, upper_back: 0.5, biceps: 0.5 } },
    { id: 'chest-supported-row', name: 'Chest-supported row', equipment: ['dumbbells', 'bench'], region: 'upper', credit: { upper_back: 1, lats: 0.5, rear_delts: 0.5, biceps: 0.5 } },
    { id: 'seated-cable-row', name: 'Seated cable row', equipment: ['cable'], region: 'upper', credit: { upper_back: 1, lats: 0.5, biceps: 0.5 } },
    { id: 'barbell-row', name: 'Barbell row', equipment: ['barbell'], region: 'upper', credit: { upper_back: 1, lats: 0.5, biceps: 0.5 } },
    { id: 'db-curl', name: 'Dumbbell curl', equipment: ['dumbbells'], region: 'upper', credit: { biceps: 1 } },
    { id: 'triceps-pushdown', name: 'Triceps pushdown', equipment: ['cable'], region: 'upper', credit: { triceps: 1 } },
    { id: 'overhead-triceps-ext', name: 'Overhead triceps extension', equipment: ['cable'], region: 'upper', credit: { triceps: 1 } },
    { id: 'back-squat', name: 'Back squat', equipment: ['barbell', 'rack'], region: 'lower', credit: { quads: 1, glutes: 0.5 } },
    { id: 'leg-press', name: 'Leg press', equipment: ['machine'], region: 'lower', credit: { quads: 1, glutes: 0.5 } },
    { id: 'leg-extension', name: 'Leg extension', equipment: ['machine'], region: 'lower', credit: { quads: 1 } },
    { id: 'bulgarian-split-squat', name: 'Bulgarian split squat', equipment: ['dumbbells', 'bench'], region: 'lower', credit: { quads: 1, glutes: 0.5 } },
    { id: 'romanian-deadlift', name: 'Romanian deadlift', equipment: ['barbell'], region: 'lower', credit: { hamstrings: 1, glutes: 0.5 } },
    { id: 'leg-curl', name: 'Seated leg curl', equipment: ['machine'], region: 'lower', credit: { hamstrings: 1 } },
    { id: 'hip-thrust', name: 'Barbell hip thrust', equipment: ['barbell', 'bench'], region: 'lower', credit: { glutes: 1, hamstrings: 0.5 } },
    { id: 'calf-raise', name: 'Standing calf raise', equipment: ['machine'], region: 'lower', credit: { calves: 1 } },
    { id: 'hanging-leg-raise', name: 'Hanging leg raise', equipment: ['pull-up bar'], region: 'core', credit: { abs: 1 } },
    { id: 'cable-crunch', name: 'Cable crunch', equipment: ['cable'], region: 'core', credit: { abs: 1 } }
  ];

  const EQUIPMENT = ['barbell', 'rack', 'bench', 'dumbbells', 'cable', 'machine', 'pull-up bar'];

  /* ---------------------------------------------------------------- splits */
  const item = (exercise, sets, repMin, repMax, rir, restS) => ({ exercise, sets, repMin, repMax, rir, restS });

  /* Version 1 (imported), version 2 (added face pulls), version 3 (swapped the
     incline barbell press for dumbbells). Version 3 is current. */
  const SPLIT_V1 = {
    style: 'hypertrophy',
    days: [
      { key: 'upper_a', label: 'Upper A', weekday: 1, items: [
        item('bench-press', 4, 6, 8, 2, 150), item('incline-db-press', 3, 8, 12, 2, 120),
        item('chest-supported-row', 2, 8, 12, 2, 120), item('lateral-raise', 3, 12, 15, 1, 75),
        item('triceps-pushdown', 3, 10, 15, 1, 75)
      ] },
      { key: 'lower_a', label: 'Lower A', weekday: 2, items: [
        item('back-squat', 4, 5, 8, 2, 180), item('romanian-deadlift', 3, 8, 10, 2, 150),
        item('leg-extension', 2, 10, 15, 1, 90), item('calf-raise', 3, 10, 15, 1, 75),
        item('hanging-leg-raise', 3, 10, 15, 2, 75)
      ] },
      { key: 'upper_b', label: 'Upper B', weekday: 4, items: [
        item('overhead-press', 3, 6, 10, 2, 150), item('incline-bb-press', 3, 6, 10, 2, 150),
        item('pull-up', 3, 6, 10, 2, 150), item('chest-supported-row', 2, 8, 12, 2, 120),
        item('cable-fly', 3, 12, 15, 1, 75), item('db-curl', 3, 10, 12, 1, 75)
      ] },
      { key: 'lower_b', label: 'Lower B', weekday: 5, items: [
        item('leg-press', 3, 10, 12, 2, 150), item('leg-curl', 3, 10, 15, 1, 90),
        item('hip-thrust', 3, 8, 12, 2, 120), item('calf-raise', 3, 10, 15, 1, 75),
        item('cable-crunch', 3, 10, 15, 2, 75)
      ] }
    ]
  };
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const SPLIT_V2 = clone(SPLIT_V1);
  SPLIT_V2.days[2].items.push(item('face-pull', 2, 12, 15, 1, 75));
  const SPLIT_V3 = clone(SPLIT_V2);
  SPLIT_V3.days[2].items[1] = item('incline-db-press', 3, 8, 12, 2, 120);

  /* --------------------------------------------------------------- foods */
  /* nutrients are per 100 g, or per 100 ml when isBeverage. */
  const n = (energyKcal, proteinG, carbohydrateG, sugarsG, fatG, saturatedFatG, fiberG, sodiumMg) =>
    ({ energyKcal, proteinG, carbohydrateG, sugarsG, fatG, saturatedFatG, fiberG, sodiumMg });

  const OFF = 'open_food_facts';
  const FDC = 'usda_fdc';
  const ODBL = 'Product data from Open Food Facts (ODbL)';
  const CC0 = 'Data from USDA FoodData Central (public domain)';

  /* The "mirror": packaged products findable by barcode. */
  const PRODUCTS = [
    { id: 'p-oat-bar', gtin: ean13('501234567890'), name: 'Oat and chocolate bar', brand: 'Example Foods', source: OFF, attribution: ODBL,
      serving: { grams: 40, label: '1 bar (40 g)' }, nutrients: n(412, 6.1, 64, 28, 13, 5.8, 4.2, 240), nova: 4,
      additives: ['emulsifier (E471)', 'flavouring'],
      ingredients: 'Oats (42%), sugar, chocolate (14%) (sugar, cocoa butter, cocoa mass, emulsifier: E471), glucose syrup, palm oil, flavouring, salt' },
    { id: 'p-yogurt', gtin: ean13('501234567101'), name: 'Greek-style yogurt, plain', brand: 'Example Dairy', source: OFF, attribution: ODBL,
      serving: { grams: 150, label: '1 pot (150 g)' }, nutrients: n(97, 9, 4, 4, 5, 3.4, 0, 40), nova: 1,
      additives: [], ingredients: 'Milk, cream, live cultures' },
    { id: 'p-bread', gtin: ean13('501234567202'), name: 'Wholegrain seeded bread', brand: 'Example Bakery', source: OFF, attribution: ODBL,
      serving: { grams: 44, label: '1 slice (44 g)' }, nutrients: n(247, 11, 38, 3, 4.5, 0.6, 7, 400), nova: 3,
      additives: [], ingredients: 'Wholemeal wheat flour (48%), water, mixed seeds (12%) (sunflower seeds, linseed, sesame seeds), wheat gluten, yeast, salt, rapeseed oil' },
    { id: 'p-orange-drink', gtin: ean13('501234567303'), name: 'Sparkling orange drink', brand: 'Example Drinks', source: OFF, attribution: ODBL, isBeverage: true,
      serving: { grams: 330, label: '1 can (330 ml)' }, nutrients: n(42, 0, 10.3, 10.3, 0, 0, 0, 10), nova: 4,
      additives: ['acid (citric acid)', 'flavouring', 'colour (carotenes)'], ingredients: 'Carbonated water, sugar, orange juice from concentrate (5%), citric acid, flavouring, colour: carotenes' },
    { id: 'p-protein-shake', gtin: ean13('501234567404'), name: 'Protein shake, chocolate', brand: 'Example Nutrition', source: OFF, attribution: ODBL, isBeverage: true,
      serving: { grams: 330, label: '1 bottle (330 ml)' }, nutrients: n(63, 10, 3.2, 3, 1.1, 0.7, 0.6, 60), nova: 4,
      additives: ['stabiliser (E407)', 'sweetener (sucralose)', 'flavouring'], ingredients: 'Skimmed milk, milk protein concentrate, cocoa powder (1.5%), stabiliser: carrageenan, sweetener: sucralose, flavouring' },
    { id: 'p-granola', gtin: ean13('501234567505'), name: 'Honey granola', brand: 'Example Cereals', source: OFF, attribution: ODBL,
      serving: { grams: 45, label: '1 bowl (45 g)' }, nutrients: n(448, 8.4, 62, 21, 17, 3.1, 6.5, 120), nova: 4,
      additives: ['flavouring'], ingredients: 'Oats (58%), sugar, sunflower oil, honey (5%), maltodextrin, coconut, salt, flavouring' },
    { id: 'p-oat-clusters', gtin: ean13('501234567606'), name: 'Crunchy oat clusters', brand: 'Example Cereals', source: OFF, attribution: ODBL,
      serving: { grams: 45, label: '1 bowl (45 g)' }, nutrients: n(436, 8, 66, 24, 14, 2.4, 5.8, 160), nova: 4,
      additives: [], ingredients: 'Oats (50%), sugar, rapeseed oil, glucose syrup, honey (3%), salt' },
    { id: 'p-muesli-bar', gtin: ean13('501234567707'), name: 'Fruit and nut muesli bar', brand: 'Example Foods', source: OFF, attribution: ODBL,
      serving: { grams: 35, label: '1 bar (35 g)' }, nutrients: n(405, 7.2, 60, 30, 14, 3.9, 5, 90), nova: 4,
      additives: ['emulsifier (E322)'], ingredients: 'Oats (32%), glucose syrup, sugar, raisins (10%), hazelnuts (6%), sunflower oil, honey, emulsifier: E322, salt' },
    /* Open Food Facts has a page for this one but no nutrition data, so the
       lookup falls through to FoodData Central. */
    { id: 'p-peanuts', gtin: ean13('501234567808'), name: 'Salted peanuts', brand: 'Example Snacks', source: FDC, attribution: CC0,
      offIncomplete: true, serving: { grams: 25, label: '1 handful (25 g)' }, nutrients: n(599, 26, 16, 4, 50, 7, 8, 410), nova: 3,
      additives: [], ingredients: 'Peanuts (97%), sunflower oil, salt' }
  ];
  /* A barcode that exists in neither database. */
  const UNKNOWN_GTIN = ean13('501234567909');

  /* Generic foods for search (FoodData Central style). */
  const GENERIC_FOODS = [
    { id: 'g-oats', name: 'Rolled oats', serving: { grams: 40, label: '40 g' }, nutrients: n(379, 13, 68, 1, 6.5, 1.1, 10, 6), nova: 1 },
    { id: 'g-banana', name: 'Banana, raw', serving: { grams: 120, label: '1 medium (120 g)' }, nutrients: n(89, 1.1, 23, 12, 0.3, 0.1, 2.6, 1), nova: 1 },
    { id: 'g-apple', name: 'Apple, raw', serving: { grams: 180, label: '1 medium (180 g)' }, nutrients: n(52, 0.3, 14, 10, 0.2, 0, 2.4, 1), nova: 1 },
    { id: 'g-chicken', name: 'Chicken breast, cooked', serving: { grams: 150, label: '150 g' }, nutrients: n(165, 31, 0, 0, 3.6, 1, 0, 74), nova: 1 },
    { id: 'g-salmon', name: 'Salmon, baked', serving: { grams: 140, label: '1 fillet (140 g)' }, nutrients: n(206, 22, 0, 0, 12, 2.5, 0, 61), nova: 1 },
    { id: 'g-eggs', name: 'Eggs, scrambled', serving: { grams: 120, label: '2 eggs (120 g)' }, nutrients: n(149, 10, 1.6, 1.4, 11, 3.3, 0, 145), nova: 1 },
    { id: 'g-rice', name: 'White rice, cooked', serving: { grams: 180, label: '1 cup (180 g)' }, nutrients: n(130, 2.7, 28, 0.1, 0.3, 0.1, 0.4, 1), nova: 1 },
    { id: 'g-lentils', name: 'Lentils, boiled', serving: { grams: 150, label: '150 g' }, nutrients: n(116, 9, 20, 1.8, 0.4, 0.1, 7.9, 2), nova: 1 },
    { id: 'g-broccoli', name: 'Broccoli, boiled', serving: { grams: 100, label: '100 g' }, nutrients: n(35, 2.4, 7.2, 1.4, 0.4, 0.1, 3.3, 41), nova: 1 },
    { id: 'g-olive-oil', name: 'Olive oil', serving: { grams: 10, label: '1 tbsp (10 g)' }, nutrients: n(884, 0, 0, 0, 100, 13.8, 0, 2), nova: 2 },
    { id: 'g-almonds', name: 'Almonds', serving: { grams: 30, label: '1 handful (30 g)' }, nutrients: n(579, 21, 22, 4.4, 50, 3.8, 12.5, 1), nova: 1 },
    { id: 'g-milk', name: 'Whole milk', isBeverage: true, serving: { grams: 250, label: '1 glass (250 ml)' }, nutrients: n(61, 3.2, 4.8, 5, 3.3, 1.9, 0, 43), nova: 1 }
  ].map((f) => ({ ...f, source: FDC, attribution: CC0, additives: [], ingredients: null }));

  /* ------------------------------------------------------------- labels */
  /* What on-device OCR returned for two sample label photos. */
  const LABEL_SAMPLES = [
    {
      id: 'label-crackers',
      title: 'Seeded rye crackers',
      description: 'Ingredient list and nutrition panel',
      ocrConfidence: 0.94,
      hasPanel: true,
      ingredientsText: 'Wholegrain rye flour (62%), sunflower seeds (12%), sesame seeds (8%), linseed (6%), rapeseed oil, salt, yeast',
      panelText: 'Energy 1766 kJ / 421 kcal\nFat 14 g\nof which saturates 1.5 g\nCarbohydrate 52 g\nof which sugars 2.1 g\nFibre 15 g\nProtein 13 g\nSalt 1.1 g',
      uncertainTokens: []
    },
    {
      id: 'label-granola',
      title: 'Granola clusters',
      description: 'Ingredient list only',
      ocrConfidence: 0.71,
      hasPanel: false,
      ingredientsText: 'Oats (45%), sugar, maltodextr1n, sunflower oil, honey (4%), coconut, salt, natural flavouring',
      panelText: null,
      uncertainTokens: ['maltodextr1n']
    }
  ];

  /* Canonical ingredient taxonomy (a small slice of Open Food Facts'). */
  const INGREDIENTS = {
    'en:oat': ['oats', 'oat', 'rolled oats', 'oat flakes'],
    'en:sugar': ['sugar', 'cane sugar'],
    'en:maltodextrin': ['maltodextrin'],
    'en:sunflower-oil': ['sunflower oil'],
    'en:rapeseed-oil': ['rapeseed oil', 'canola oil'],
    'en:palm-oil': ['palm oil'],
    'en:honey': ['honey'],
    'en:coconut': ['coconut', 'desiccated coconut'],
    'en:salt': ['salt', 'sea salt'],
    'en:flavouring': ['flavouring', 'natural flavouring', 'flavourings', 'natural flavourings'],
    'en:glucose-syrup': ['glucose syrup'],
    'en:chocolate': ['chocolate'],
    'en:cocoa-butter': ['cocoa butter'],
    'en:cocoa-mass': ['cocoa mass'],
    'en:emulsifier': ['emulsifier'],
    'en:rye-flour': ['wholegrain rye flour', 'rye flour'],
    'en:wheat-flour': ['wholemeal wheat flour', 'wheat flour'],
    'en:sunflower-seeds': ['sunflower seeds'],
    'en:sesame-seeds': ['sesame seeds'],
    'en:linseed': ['linseed', 'flaxseed'],
    'en:yeast': ['yeast'],
    'en:raisins': ['raisins'],
    'en:hazelnuts': ['hazelnuts'],
    'en:milk': ['milk', 'skimmed milk'],
    'en:cream': ['cream'],
    'en:peanuts': ['peanuts']
  };

  /* ------------------------------------------------- evidence library */
  /* Claims, studies and the dataset catalogue come from data/ through
     src/01-evidence.generated.js, which prototype/build.mjs writes. */

  /* ------------------------------------------------------- wearables */
  /* Deterministic pseudo-random series so the sample data is stable. */
  function seeded(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function series(seed, days, mean, sd, lastValues) {
    const rnd = seeded(seed);
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const u = rnd() + rnd() + rnd() - 1.5; // roughly normal, sd ~0.5
      out.push({ daysAgo: i, value: Math.round((mean + u * 2 * sd) * 10) / 10 });
    }
    /* Pin the most recent values so the story reads consistently. */
    (lastValues || []).forEach((v, idx) => {
      out[out.length - 1 - idx].value = v;
    });
    return out;
  }
  const WEARABLE_SERIES = {
    oura: {
      hrv_rmssd_ms: { unit: 'ms', label: 'HRV (RMSSD)', points: series(11, 35, 52, 5, [44]) },
      resting_hr_bpm: { unit: 'bpm', label: 'Resting heart rate', points: series(12, 35, 53, 2, [54]) },
      sleep_total_min: { unit: 'min', label: 'Sleep', points: series(13, 35, 435, 25, [370]) },
      vendor_readiness_score: { unit: '', label: 'Oura readiness score', points: series(14, 35, 80, 6, [68]) }
    },
    apple_health: {
      hrv_sdnn_ms: { unit: 'ms', label: 'HRV (SDNN)', points: series(21, 35, 61, 7, [55]) },
      steps: { unit: 'steps', label: 'Steps', points: series(22, 35, 8400, 1600, [3200]) },
      active_energy_kcal: { unit: 'kcal', label: 'Active energy', points: series(23, 35, 520, 90, [180]) }
    },
    whoop: {
      hrv_rmssd_ms: { unit: 'ms', label: 'HRV (RMSSD)', points: series(31, 35, 64, 6, []) },
      vendor_recovery_score: { unit: '%', label: 'WHOOP recovery', points: series(32, 35, 62, 12, []) }
    }
  };

  const PROVIDERS = {
    apple_health: { name: 'Apple Health', short: 'Apple Health', cloud: false,
      dataTypes: ['hrv', 'resting_hr', 'sleep', 'workouts', 'daily_activity', 'heart_rate'] },
    oura: { name: 'Oura', short: 'Oura', cloud: true,
      dataTypes: ['sleep', 'hrv', 'resting_hr', 'readiness', 'workouts', 'daily_activity'] },
    whoop: { name: 'WHOOP', short: 'WHOOP', cloud: true,
      dataTypes: ['recovery', 'hrv', 'resting_hr', 'sleep', 'workouts'] },
    google_health: { name: 'Fitbit, via Google', short: 'Fitbit', cloud: true,
      dataTypes: ['sleep', 'hrv', 'resting_hr', 'workouts', 'daily_activity', 'heart_rate'] }
  };
  const DATA_TYPE_LABELS = {
    sleep: 'Sleep', hrv: 'Heart rate variability', resting_hr: 'Resting heart rate', readiness: 'Readiness score',
    recovery: 'Recovery score', workouts: 'Workouts', daily_activity: 'Daily activity', heart_rate: 'Heart rate'
  };
  /* Which stored metrics each shareable data type covers. */
  const DATA_TYPE_METRICS = {
    hrv: ['hrv_rmssd_ms', 'hrv_sdnn_ms'], resting_hr: ['resting_hr_bpm'], sleep: ['sleep_total_min'],
    readiness: ['vendor_readiness_score'], recovery: ['vendor_recovery_score'],
    daily_activity: ['steps', 'active_energy_kcal'], workouts: [], heart_rate: []
  };

  /* ------------------------------------------------------- disclaimer */
  const DISCLAIMER = {
    version: 'disc-2026.10',
    short: 'General fitness information, not medical advice. If you have an injury or a medical condition, check with a qualified professional before changing your training or diet.',
    full: 'This app provides general fitness and nutrition information. It is not medical advice and does not diagnose, treat or prevent any condition. If you have an injury, a medical condition, are pregnant, or have a history of disordered eating, talk to a qualified healthcare professional before changing your training or diet.'
  };

  C.data = {
    DAY, startOfToday, startOfWeek, daysAgo, checkDigit, ean13, clone,
    MUSCLES, MUSCLE_WORDS, EXERCISES, EQUIPMENT,
    SPLIT_V1, SPLIT_V2, SPLIT_V3,
    PRODUCTS, UNKNOWN_GTIN, GENERIC_FOODS, LABEL_SAMPLES, INGREDIENTS,
    WEARABLE_SERIES, PROVIDERS, DATA_TYPE_LABELS, DATA_TYPE_METRICS,
    DISCLAIMER
  };
})();
