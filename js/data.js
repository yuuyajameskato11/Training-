/* ============================================================================
   data.js — Knowledge base for the KNCT Hybrid Apex System (32-week program).
   Encodes: goals (current → 32-wk checkpoint → North Star), the 7 systems,
   exercise library, the 5-phase macrocycle, the High/Low weekly architecture,
   the readiness-gate thresholds, training zones, and nutrition anchors.
   Daily prescribed sessions live in program.js.
   ========================================================================== */

const DATA = (() => {

  /* --------------------------------------------------------------------------
     GOALS — current mark, 32-week checkpoint, and North Star.
     `lowerBetter` = time events. `proxies` = tech metrics that predict it.
     Times stored in seconds; vertical/broad in their native unit.
     ------------------------------------------------------------------------ */
  const GOALS = [
    { id: '100m',  name: '100 m',   unit: 's',  lowerBetter: true,  current: 11.9,  checkpoint: [11.3, 11.4],  northStar: 10.9,  limiters: ['Max velocity', 'RFD', 'Tendon stiffness'], proxies: ['fly30', 'sprint10', 'cmj', 'keiserWatts'] },
    { id: '200m',  name: '200 m',   unit: 's',  lowerBetter: true,  current: 23.9,  checkpoint: [22.8, 23.0],  northStar: null,  limiters: ['Speed', 'Speed endurance'],                proxies: ['fly30', 'sprint30'] },
    { id: '400m',  name: '400 m',   unit: 's',  lowerBetter: true,  current: 56.0,  checkpoint: [52.5, 53.5],  northStar: 49.0,  limiters: ['Glycolytic capacity', 'Speed reserve'],     proxies: ['fly30', 'sprint30'] },
    { id: 'mile',  name: 'Mile',    unit: 's',  lowerBetter: true,  current: 305,   checkpoint: [292, 296],    northStar: 285,   limiters: ['Threshold', 'VO₂', 'Economy'],             proxies: ['criticalPower', 'runEconomy'] },
    { id: '5k',    name: '5K',      unit: 's',  lowerBetter: true,  current: 1230,  checkpoint: [1095, 1125],  northStar: 900,   limiters: ['Aerobic floor (your #1 gap)', 'Threshold'], proxies: ['criticalPower', 'runEconomy'] },
    { id: 'vertical', name: 'Vertical (CMJ)', unit: 'in', lowerBetter: false, current: 31, checkpoint: [35, 37], northStar: 40, limiters: ['Relative force', 'RFD'],           proxies: ['cmj', 'rsi', 'relForce'] },
    { id: 'broad', name: 'Broad Jump', unit: 'm', lowerBetter: false, current: 2.95, checkpoint: [3.15, 3.25], northStar: null, limiters: ['Horizontal power'],                proxies: ['cmj'] },
    { id: 'clean', name: 'Power Clean', unit: 'lb', lowerBetter: false, current: null, checkpoint: [285, 300], northStar: null, limiters: ['Force expression'],                 proxies: ['isoPull', 'peakForce'] },
    { id: 'hyrox', name: 'HYROX Pro',  unit: 'min', lowerBetter: true,  current: 67,  checkpoint: [58, 61],     northStar: 57,   limiters: ['Compromised running', 'Station economy'], proxies: ['criticalPower'] },
    { id: 'bw',    name: 'Bodyweight', unit: 'kg', lowerBetter: true,  current: 77,  checkpoint: [74, 76],     northStar: null,  limiters: ['Power-to-weight'],                        proxies: [] },
  ];

  /* --------------------------------------------------------------------------
     TEST METRICS — objective device numbers, grouped by assessment tool.
     ------------------------------------------------------------------------ */
  const METRICS = [
    { id: 'cmj',          name: 'CMJ (best of 3)',      unit: 'cm',  tool: 'Force Plate', lowerBetter: false, readiness: true, gate: true },
    { id: 'rsi',          name: 'RSI (Drop/Pogo)',      unit: '',    tool: 'Force Plate', lowerBetter: false, readiness: true },
    { id: 'isoPull',      name: 'IMTP Peak Force',      unit: 'N',   tool: 'Force Plate', lowerBetter: false },
    { id: 'relForce',     name: 'Relative Force',       unit: 'N/kg',tool: 'Force Plate', lowerBetter: false },
    { id: 'peakForce',    name: 'Peak Force',           unit: 'N',   tool: 'Force Plate', lowerBetter: false },
    { id: 'sprint10',     name: '10 m',                 unit: 's',   tool: 'OVR Gates', lowerBetter: true },
    { id: 'sprint30',     name: '30 m',                 unit: 's',   tool: 'OVR Gates', lowerBetter: true },
    { id: 'fly20',        name: 'Flying 20',            unit: 's',   tool: 'Freelap', lowerBetter: true },
    { id: 'fly30',        name: 'Flying 30',            unit: 's',   tool: 'OVR Gates', lowerBetter: true, readiness: false },
    { id: 'maxVelocity',  name: 'Top Speed',            unit: 'm/s', tool: 'OVR Gates', lowerBetter: false },
    { id: 'speedDecay',   name: 'Speed Decay',          unit: '%',   tool: 'OVR Gates', lowerBetter: true },
    { id: 'keiserWatts',  name: 'Keiser Peak Watts',    unit: 'W',   tool: 'Keiser', lowerBetter: false },
    { id: 'fvProfile',    name: 'F-V Profile (slope)',  unit: '',    tool: 'Voltra', lowerBetter: false },
    { id: 'criticalPower',name: 'Stryd Critical Power', unit: 'W',   tool: 'Stryd', lowerBetter: false },
    { id: 'runEconomy',   name: 'Running Economy',      unit: '',    tool: 'Stryd', lowerBetter: false },
    { id: 'gct',          name: 'Ground Contact Time',  unit: 'ms',  tool: 'Stryd', lowerBetter: true },
    { id: 'broadTest',    name: 'Broad Jump',           unit: 'm',   tool: 'Vert Tester', lowerBetter: false },
  ];

  /* --------------------------------------------------------------------------
     EXERCISE LIBRARY — `cat` drives per-set auto-regulation.
     ------------------------------------------------------------------------ */
  const EX = (name, cat, equip) => ({ name, cat, equip });
  const EXERCISES = [
    // Strength
    EX('Back Squat', 'strength', 'Olympic Bar'), EX('Front Squat', 'strength', 'Olympic Bar'),
    EX('Box Squat', 'strength', 'Olympic Bar'), EX('Deadlift', 'strength', 'Olympic Bar'),
    EX('Trap-Bar Deadlift', 'strength', 'Trap Bar'), EX('Bench Press', 'strength', 'Olympic Bar'),
    EX('Incline Bench', 'strength', 'Olympic Bar'), EX('RDL', 'strength', 'Olympic Bar'),
    EX('Heavy RDL', 'strength', 'Olympic Bar'), EX('Weighted Chin-up', 'strength', 'Olympic Bar'),
    EX('Nordic Curl', 'strength', 'Bodyweight'), EX('Belt Squat (heavy)', 'strength', 'Belt Squat'),
    EX('Belt-Squat March', 'strength', 'Belt Squat'), EX('Voltra Isometric Hold', 'iso', 'Voltra'),
    EX('Weighted Plank', 'iso', 'Bodyweight'), EX('Pallof / Anti-rotation', 'strength', 'Cable'),
    EX('Copenhagen Plank', 'iso', 'Bodyweight'),
    // Strongman
    EX('Yoke Carry', 'strength', 'Strongman'), EX('Heavy Farmer Carry', 'strength', 'Strongman'),
    EX('Suitcase Carry', 'strength', 'Strongman'), EX('Sandbag Load-to-Shoulder', 'strength', 'Strongman'),
    EX('Stone-to-Platform', 'strength', 'Strongman'), EX('Heavy Sled Drag', 'strength', 'Sleds'),
    EX('Speed Farmer Carry', 'power', 'Strongman'), EX('Explosive Sandbag Load', 'power', 'Strongman'),
    EX('Med-ball Rotational Throw', 'power', 'Strongman'),
    // Power
    EX('Power Clean', 'power', 'Olympic Bar'), EX('Power Clean (blocks)', 'power', 'Olympic Bar'),
    EX('Hang Clean', 'power', 'Olympic Bar'), EX('Push Press', 'power', 'Olympic Bar'),
    EX('Trap-Bar Jump', 'power', 'Trap Bar'), EX('Trap-Bar Jump Shrug', 'power', 'Trap Bar'),
    EX('Jump Squat (barbell)', 'power', 'Olympic Bar'), EX('Box Squat (dynamic)', 'power', 'Olympic Bar'),
    EX('Keiser Jump Squat', 'power', 'Keiser'), EX('Keiser Split-Squat (power)', 'power', 'Keiser'),
    EX('Voltra Squat (velocity)', 'power', 'Voltra'), EX('Voltra Explosive Press', 'power', 'Voltra'),
    EX('Voltra Reactive (catch-release)', 'power', 'Voltra'), EX('Explosive Bench (Jammer)', 'power', 'Jammer Arms'),
    EX('Jammer Press (explosive)', 'power', 'Jammer Arms'), EX('Jammer Single-arm Press', 'power', 'Jammer Arms'),
    // Speed / Sprint
    EX('Acceleration Wickets', 'speed', 'Track'), EX('Block Starts', 'speed', 'Track'),
    EX('Hill Sprints', 'speed', 'Track'), EX('Acceleration Sprint', 'speed', 'Track'),
    EX('Flying 20', 'speed', 'Freelap'), EX('Flying 30', 'speed', 'OVR Gates'),
    EX('Flying 40', 'speed', 'OVR Gates'), EX('Flying 50', 'speed', 'OVR Gates'),
    EX('Heavy Sled Push', 'speed', 'Sleds'), EX('Light Sled Sprint', 'speed', 'Sleds'),
    EX('Voltra Resisted Sprint', 'speed', 'Voltra'), EX('Voltra/Band Overspeed', 'speed', 'Voltra'),
    EX('150 m rep', 'speed', 'Track'), EX('200 m rep', 'speed', 'Track'), EX('300 m rep', 'speed', 'Track'),
    // Plyo
    EX('Pogo Hops', 'plyo', 'Bodyweight'), EX('Low Box Jump', 'plyo', 'Bodyweight'),
    EX('Depth Jump', 'plyo', 'Bodyweight'), EX('Drop Jump', 'plyo', 'Bodyweight'),
    EX('Broad Jump', 'plyo', 'Bodyweight'), EX('Single-leg Bounds', 'plyo', 'Bodyweight'),
    EX('Reactive Hurdle Hops', 'plyo', 'Bodyweight'), EX('Ankle Pogos', 'plyo', 'Bodyweight'),
    EX('Depth Jump → Box Jump complex', 'plyo', 'Bodyweight'),
    // Conditioning
    EX('Zone 2 Run', 'zone2', 'Track'), EX('Zone 2 BikeErg', 'zone2', 'BikeErg'),
    EX('Zone 2 RowErg', 'zone2', 'RowErg'), EX('Zone 2 SkiErg', 'zone2', 'SkiErg'),
    EX('Zone 1 Shakeout', 'zone2', 'Track'), EX('Extensive Tempo', 'zone2', 'Track'),
    EX('Threshold Run (LT2)', 'threshold', 'Track'), EX('Threshold Bike (LT2)', 'threshold', 'BikeErg'),
    EX('VO₂ Intervals', 'vo2', 'Mixed'), EX('Station Sim (HYROX)', 'vo2', 'Mixed'),
    EX('Compromised-run Intervals', 'vo2', 'Track'), EX('COD Ladder (5-10-5 / T-drill)', 'speed', 'Track'),
    EX('RSA (repeat sprint)', 'speed', 'Track'),
  ];

  const CATEGORIES = {
    strength:  { label: 'Max Strength',      restSec: 240, targetRPE: [7, 9],  velDropStop: null, log: ['load', 'reps', 'rpe'] },
    power:     { label: 'Power / Ballistic', restSec: 180, targetRPE: [6, 8],  velDropStop: 10,   log: ['load', 'reps', 'velocity', 'rpe'] },
    iso:       { label: 'Isometric',         restSec: 180, targetRPE: [8, 10], velDropStop: null, log: ['load', 'holdSec', 'rpe'] },
    speed:     { label: 'Sprint / Speed',    restSec: 300, targetRPE: [9, 10], velDropStop: 3,    log: ['distance', 'time', 'rpe'] },
    plyo:      { label: 'Plyometric',        restSec: 120, targetRPE: [7, 9],  velDropStop: null, log: ['contacts', 'rsi', 'rpe'] },
    zone2:     { label: 'Zone 2 Aerobic',    restSec: 0,   targetRPE: [2, 4],  velDropStop: null, log: ['minutes', 'rpe'] },
    threshold: { label: 'Threshold',         restSec: 90,  targetRPE: [6, 7],  velDropStop: null, log: ['minutes', 'rpe'] },
    vo2:       { label: 'VO₂ / Intervals',   restSec: 120, targetRPE: [8, 10], velDropStop: null, log: ['minutes', 'rpe'] },
  };

  /* --------------------------------------------------------------------------
     MACROCYCLE — 5 phases across 32 weeks. Exact week ranges, drivers,
     MED secondaries, weekly diagnostic, deload weeks.
     ------------------------------------------------------------------------ */
  const PHASES = [
    { id: 1, name: 'Build the Engine', weeks: [1, 8],  driver: 'Aerobic base + general strength',
      mission: 'Close the 3-minute aerobic-floor gap and build a bigger chassis to load later.',
      mix: { zone2: 25, threshold: 25, strength: 30, speed: 10, power: 5, plyo: 5 },
      weightPct: [75, 85], dose: { sprintM: [250, 400], thresholdMin: [60, 90], zone2Min: [180, 300], plyoContacts: [20, 40] },
      primary: 'strength', secondary: ['threshold', 'zone2', 'speed'], diagnostic: 'criticalPower', diagName: 'Stryd Critical Power + CMJ', deloads: [4, 8] },
    { id: 2, name: 'Maximum Strength', weeks: [9, 14], driver: 'Maximal force',
      mission: 'Raise the force ceiling everything else expresses from. Strongman for structural robustness.',
      mix: { strength: 45, power: 20, speed: 15, threshold: 10, zone2: 10 },
      weightPct: [90, 97], dose: { sprintM: [300, 500], thresholdMin: [30, 45], zone2Min: [90, 150], plyoContacts: [40, 60] },
      primary: 'strength', secondary: ['speed', 'threshold', 'zone2'], diagnostic: 'isoPull', diagName: 'IMTP peak / relative force', deloads: [12] },
    { id: 3, name: 'Convert to Power', weeks: [15, 20], driver: 'Rate of force development',
      mission: 'Turn new strength into fast force. This is where vertical jump and acceleration climb.',
      mix: { power: 40, speed: 25, strength: 15, threshold: 10, zone2: 10 },
      weightPct: [50, 70], dose: { sprintM: [500, 700], thresholdMin: [20, 40], zone2Min: [90, 120], plyoContacts: [60, 100] },
      primary: 'power', secondary: ['speed', 'threshold', 'zone2'], diagnostic: 'keiserWatts', diagName: 'Keiser peak watts + CMJ + Voltra F-V', deloads: [18] },
    { id: 4, name: 'Maximum Speed', weeks: [21, 26], driver: 'Max velocity + speed-endurance',
      mission: 'The phase that moves your 100/200/400 and your acceleration for football.',
      mix: { speed: 45, power: 15, strength: 10, threshold: 5, zone2: 25 },
      weightPct: [80, 85], dose: { sprintM: [700, 1000], thresholdMin: [20, 30], zone2Min: [90, 120], plyoContacts: [100, 140] },
      primary: 'speed', secondary: ['power', 'threshold', 'zone2'], diagnostic: 'fly30', diagName: 'OVR Flying 30 + speed-decay', deloads: [24] },
    { id: 5, name: 'Competition / Peak', weeks: [27, 32], driver: 'Sport-specific expression + peaking',
      mission: 'Everything converts into the demand of your A-race. Sharpen weeks 27–30, taper 31–32.',
      mix: { speed: 40, power: 20, threshold: 15, strength: 15, zone2: 10 },
      weightPct: [70, 80], dose: { sprintM: [300, 700], thresholdMin: [10, 20], zone2Min: [60, 90], plyoContacts: [40, 60] },
      primary: 'speed', secondary: ['power', 'threshold'], diagnostic: 'fly30', diagName: 'Sport-specific test', deloads: [31, 32] },
  ];

  /* --------------------------------------------------------------------------
     UNIVERSAL WEEKLY ARCHITECTURE — High/Low (Charlie Francis). NEVER changes;
     only the content of each slot shifts by phase. High-CNS on Mon/Wed/Fri.
     ------------------------------------------------------------------------ */
  const WEEK_ARCH = [
    { day: 'Mon', load: 'HIGH',    am: 'Speed / Power (CNS)',        pm: 'Max Strength' },
    { day: 'Tue', load: 'LOW',     am: 'Aerobic Z2',                pm: 'Threshold' },
    { day: 'Wed', load: 'HIGH',    am: 'Speed-Endurance / Power',   pm: 'Strength' },
    { day: 'Thu', load: 'LOW',     am: 'Aerobic Z2',                pm: 'Mobility + plyo prep' },
    { day: 'Fri', load: 'HIGH',    am: 'Max Velocity / Power',      pm: 'Strength' },
    { day: 'Sat', load: 'MED-LOW', am: 'Long aerobic OR hybrid',    pm: 'Strongman' },
    { day: 'Sun', load: 'RECOVERY',am: 'Full recovery / opt. Z1',   pm: '—' },
  ];
  const HIGH_DAYS = ['Mon', 'Wed', 'Fri'];

  /* --------------------------------------------------------------------------
     READINESS GATE thresholds (from the doc). CMJ vs rolling 7-day baseline is
     the primary readout; hard gates can force a downgrade.
     ------------------------------------------------------------------------ */
  const GATE = {
    cmj:  { greenWithinPct: 5, amberDownPct: 10 },   // >10% down = red
    hard: {
      rhrOverBaseline: 7,        // +7 bpm over baseline
      sleepMinH: 6,              // <6h
      subjMin: 5,                // subjective readiness <5/10
      bwOvernightDropPct: 2,     // >2% overnight bodyweight drop
    },
    action: {
      green: 'Full session as written.',
      amber: 'Keep intensity, cut volume 20–30%, drop the last hard set.',
      red:   'Convert to Z1 + mobility + recovery only. No CNS work.',
    },
  };

  /* --------------------------------------------------------------------------
     TRAINING ZONES (% HRmax) — calibrate to Stryd Critical Power after testing.
     ------------------------------------------------------------------------ */
  const ZONES = [
    { id: 'Z1', name: 'Recovery', pct: [0, 72] },
    { id: 'Z2', name: 'Aerobic base', pct: [72, 80] },
    { id: 'LT2', name: 'Threshold', pct: [86, 90] },
    { id: 'VO2', name: 'VO₂', pct: [93, 97] },
  ];

  /* --------------------------------------------------------------------------
     RECOVERY + NUTRITION anchors (System 7).
     ------------------------------------------------------------------------ */
  const RECOVERY = {
    green: ['Full session cleared — fuel the CNS work', 'Normal mobility warm-up', 'Peri: 40–60g carb + 20g protein pre'],
    amber: ['Cut volume 20–30%, drop last hard set', 'Sauna 3–12 min post', 'Compression 15–20 min', 'Prioritize 8–9h sleep, fixed wake time'],
    red:   ['Z1 + mobility + recovery only — no CNS work', 'Cold 2–3 min (away from strength sessions)', 'Extra sleep, +hydration, protein 2.0–2.2 g/kg', 'Reassess any sharp/localized pain before loading'],
  };
  const NUTRITION = {
    protein: '2.0–2.2 g/kg/day across 4–5 feeds (~0.4 g/kg/feed)',
    carbsHigh: 'HIGH days ~6–8 g/kg',
    carbsLow: 'LOW days ~3–4 g/kg',
    peri: '40–60g carb + 20g protein pre high-CNS; 30–40g protein + carb within 45 min post',
    hydration: 'Sodium 800–1200 mg/L in sweat-heavy sessions; weigh in/out on long aerobic',
    micros: 'Iron (monitor ferritin), vitamin D, magnesium, omega-3, creatine 5 g/day',
  };

  return { GOALS, METRICS, EXERCISES, CATEGORIES, PHASES, WEEK_ARCH, HIGH_DAYS, GATE, ZONES, RECOVERY, NUTRITION };
})();
