/* ============================================================================
   data.js — The knowledge base
   Encodes the 7 equipment systems, exercise library, the 5-phase annual plan,
   and the goal definitions from the athlete's brief. Pure data, no logic.
   ========================================================================== */

const DATA = (() => {

  /* --------------------------------------------------------------------------
     GOALS — target performance standards. `lowerBetter` = time events.
     `proxies` = the tech metrics that predict this goal (used by projections).
     ------------------------------------------------------------------------ */
  const GOALS = [
    { id: '100m',     name: '100 m',        unit: 's',  target: 10.9,  lowerBetter: true,  limiters: ['Max velocity', 'Power', 'RFD'],                         proxies: ['fly10', 'fly20', 'cmj', 'keiserWatts'] },
    { id: '400m',     name: '400 m',        unit: 's',  target: 49.0,  lowerBetter: true,  limiters: ['Speed', 'Speed endurance', 'Glycolytic capacity'],      proxies: ['fly30', 'sprint30'] },
    { id: 'mile',     name: 'Mile',         unit: 's',  target: 285,   lowerBetter: true,  limiters: ['Threshold', 'Running economy', 'VO₂max'],               proxies: ['criticalPower', 'runEconomy'] },
    { id: '5k',       name: '5K',           unit: 's',  target: 900,   lowerBetter: true,  limiters: ['Aerobic capacity', 'Threshold', 'Economy'],             proxies: ['criticalPower', 'runEconomy'] },
    { id: 'vertical', name: 'Vertical Jump', unit: 'in', target: 40,   lowerBetter: false, limiters: ['Relative force', 'RFD', 'Tendon stiffness'],            proxies: ['cmj', 'rsi', 'peakForce'] },
  ];

  /* --------------------------------------------------------------------------
     TEST METRICS — objective device numbers. Grouped by assessment tool.
     `lowerBetter` marks metrics where a drop = improvement (times, GCT).
     ------------------------------------------------------------------------ */
  const METRICS = [
    // Force plates
    { id: 'cmj',          name: 'Countermovement Jump', unit: 'cm',  tool: 'Force Plate', lowerBetter: false, readiness: true },
    { id: 'sj',           name: 'Squat Jump',           unit: 'cm',  tool: 'Force Plate', lowerBetter: false },
    { id: 'rsi',          name: 'RSI (Drop Jump)',      unit: '',    tool: 'Force Plate', lowerBetter: false, readiness: true },
    { id: 'peakForce',    name: 'Peak Force',           unit: 'N',   tool: 'Force Plate', lowerBetter: false },
    { id: 'relForce',     name: 'Relative Force',       unit: 'N/kg',tool: 'Force Plate', lowerBetter: false },
    { id: 'rfd',          name: 'RFD',                  unit: 'N/s', tool: 'Force Plate', lowerBetter: false, readiness: true },
    { id: 'asymmetry',    name: 'Asymmetry',            unit: '%',   tool: 'Force Plate', lowerBetter: true },
    { id: 'isoPull',      name: 'Isometric Pull',       unit: 'N',   tool: 'Force Plate', lowerBetter: false },
    // Timing gates / Freelap
    { id: 'sprint5',      name: '5 m',                  unit: 's',   tool: 'OVR Gates', lowerBetter: true },
    { id: 'sprint10',     name: '10 m',                 unit: 's',   tool: 'OVR Gates', lowerBetter: true, readiness: true },
    { id: 'sprint20',     name: '20 m',                 unit: 's',   tool: 'OVR Gates', lowerBetter: true },
    { id: 'sprint30',     name: '30 m',                 unit: 's',   tool: 'OVR Gates', lowerBetter: true },
    { id: 'fly10',        name: 'Flying 10',            unit: 's',   tool: 'Freelap', lowerBetter: true },
    { id: 'fly20',        name: 'Flying 20',            unit: 's',   tool: 'Freelap', lowerBetter: true },
    { id: 'fly30',        name: 'Flying 30',            unit: 's',   tool: 'Freelap', lowerBetter: true },
    { id: 'fly40',        name: 'Flying 40',            unit: 's',   tool: 'Freelap', lowerBetter: true },
    { id: 'maxVelocity',  name: 'Max Velocity',         unit: 'm/s', tool: 'OVR Gates', lowerBetter: false },
    // Vertical jump tester
    { id: 'standingJump', name: 'Standing Jump',        unit: 'in',  tool: 'Vert Tester', lowerBetter: false, readiness: true },
    { id: 'approachJump', name: 'Approach Jump',        unit: 'in',  tool: 'Vert Tester', lowerBetter: false },
    // Keiser
    { id: 'keiserWatts',  name: 'Keiser Peak Watts',    unit: 'W',   tool: 'Keiser', lowerBetter: false },
    // Voltra force-velocity
    { id: 'fvProfile',    name: 'F-V Profile (slope)',  unit: '',    tool: 'Voltra', lowerBetter: false },
    // Stryd
    { id: 'runPower',     name: 'Running Power',        unit: 'W',   tool: 'Stryd', lowerBetter: false },
    { id: 'criticalPower',name: 'Critical Power',       unit: 'W',   tool: 'Stryd', lowerBetter: false },
    { id: 'legStiffness', name: 'Leg Spring Stiffness', unit: 'kN/m',tool: 'Stryd', lowerBetter: false },
    { id: 'gct',          name: 'Ground Contact Time',  unit: 'ms',  tool: 'Stryd', lowerBetter: true },
    { id: 'runEconomy',   name: 'Running Economy',      unit: '',    tool: 'Stryd', lowerBetter: false },
  ];

  /* --------------------------------------------------------------------------
     EXERCISE LIBRARY — grouped by the 7 systems. `cat` drives auto-regulation
     (rest windows, velocity/RPE rules). `track` = what to log per set.
     ------------------------------------------------------------------------ */
  const EX = (name, cat, equip) => ({ name, cat, equip });
  const EXERCISES = [
    // 2. Strength Development
    EX('Back Squat', 'strength', 'Olympic Bar'),
    EX('Front Squat', 'strength', 'Olympic Bar'),
    EX('Deadlift', 'strength', 'Olympic Bar'),
    EX('Bench Press', 'strength', 'Olympic Bar'),
    EX('RDL', 'strength', 'Olympic Bar'),
    EX('Split Squat', 'strength', 'Olympic Bar'),
    EX('Weighted Chin', 'strength', 'Olympic Bar'),
    EX('Nordics', 'strength', 'Bodyweight'),
    EX('Belt Squat (Heavy)', 'strength', 'Belt Squat'),
    EX('Belt Squat March', 'strength', 'Belt Squat'),
    EX('Belt Squat (Unilateral)', 'strength', 'Belt Squat'),
    EX('Trap Bar Heavy Pull', 'strength', 'Trap Bar'),
    EX('Heavy Carry', 'strength', 'Strongman'),
    EX('Yoke Carry', 'strength', 'Strongman'),
    EX('Farmer Carry', 'strength', 'Strongman'),
    EX('Sandbag Load', 'strength', 'Strongman'),
    EX('Stone Load', 'strength', 'Strongman'),
    EX('Voltra Heavy Squat', 'strength', 'Voltra'),
    EX('Voltra Heavy Row', 'strength', 'Voltra'),
    EX('Voltra Isometric', 'iso', 'Voltra'),
    // 3. Power Development
    EX('Power Clean', 'power', 'Olympic Bar'),
    EX('Snatch', 'power', 'Olympic Bar'),
    EX('Jump Shrug', 'power', 'Trap Bar'),
    EX('Trap Bar Jump', 'power', 'Trap Bar'),
    EX('Jump Squat', 'power', 'Keiser'),
    EX('Keiser Squat (Power)', 'power', 'Keiser'),
    EX('Keiser Push Press', 'power', 'Keiser'),
    EX('Keiser Hip Extension', 'power', 'Keiser'),
    EX('Jammer Explosive Press', 'power', 'Jammer Arms'),
    EX('Jammer Rotational Press', 'power', 'Jammer Arms'),
    EX('Jammer Football Punch', 'power', 'Jammer Arms'),
    EX('Voltra Jump Squat', 'power', 'Voltra'),
    EX('Voltra Explosive Press', 'power', 'Voltra'),
    EX('Voltra Reactive (Catch-Release)', 'power', 'Voltra'),
    EX('Belt Squat Explosive Jump', 'power', 'Belt Squat'),
    // 4. Sprint
    EX('Acceleration Sprint', 'speed', 'Track'),
    EX('Max Velocity Sprint', 'speed', 'Track'),
    EX('Flying 10', 'speed', 'Freelap'),
    EX('Flying 20', 'speed', 'Freelap'),
    EX('Flying 30', 'speed', 'Freelap'),
    EX('Heavy Sled Push', 'speed', 'Sleds'),
    EX('Light Sled Sprint', 'speed', 'Sleds'),
    EX('Resisted Sprint (Voltra)', 'speed', 'Voltra'),
    EX('Overspeed Sprint (Voltra)', 'speed', 'Voltra'),
    EX('Keiser Resisted Sprint', 'speed', 'Keiser'),
    EX('AirRunner Sprint', 'speed', 'AirRunner'),
    // 5. Plyometrics
    EX('Depth Jump', 'plyo', 'Bodyweight'),
    EX('Drop Jump', 'plyo', 'Bodyweight'),
    EX('Box Jump', 'plyo', 'Bodyweight'),
    EX('Broad Jump', 'plyo', 'Bodyweight'),
    EX('Repeated Bound', 'plyo', 'Bodyweight'),
    EX('Single-leg Hop', 'plyo', 'Bodyweight'),
    EX('Reactive Hurdle Hop', 'plyo', 'Bodyweight'),
    EX('Loaded Jump', 'plyo', 'Trap Bar'),
    // 6. Conditioning
    EX('Zone 2 Run', 'zone2', 'Track'),
    EX('Zone 2 BikeErg', 'zone2', 'BikeErg'),
    EX('Zone 2 RowErg', 'zone2', 'RowErg'),
    EX('Zone 2 SkiErg', 'zone2', 'SkiErg'),
    EX('Zone 2 Swim', 'zone2', 'Pool'),
    EX('Threshold Run', 'threshold', 'Track'),
    EX('Threshold AirRunner', 'threshold', 'AirRunner'),
    EX('Threshold RowErg', 'threshold', 'RowErg'),
    EX('VO₂ Bike Intervals', 'vo2', 'BikeErg'),
    EX('VO₂ Row Intervals', 'vo2', 'RowErg'),
    EX('VO₂ Ski Intervals', 'vo2', 'SkiErg'),
    EX('Hybrid Circuit', 'vo2', 'Mixed'),
    EX('Strongman Intervals', 'vo2', 'Strongman'),
  ];

  /* --------------------------------------------------------------------------
     CATEGORY RULES — auto-regulation defaults per exercise category.
     restSec: recommended rest. velDrop: % bar-speed loss that ends the set.
     ------------------------------------------------------------------------ */
  const CATEGORIES = {
    strength:  { label: 'Max Strength',   restSec: 240, targetRPE: [7, 9],  velDropStop: null, log: ['load', 'reps', 'rpe'] },
    power:     { label: 'Power / Ballistic', restSec: 210, targetRPE: [6, 8], velDropStop: 10, log: ['load', 'reps', 'rpe', 'velocity'] },
    iso:       { label: 'Isometric',      restSec: 180, targetRPE: [8, 10], velDropStop: null, log: ['load', 'holdSec', 'rpe'] },
    speed:     { label: 'Sprint / Speed', restSec: 300, targetRPE: [9, 10], velDropStop: 3,  log: ['distance', 'time', 'rpe'] },
    plyo:      { label: 'Plyometric',     restSec: 120, targetRPE: [7, 9],  velDropStop: null, log: ['contacts', 'rpe'] },
    zone2:     { label: 'Zone 2 Aerobic', restSec: 0,   targetRPE: [2, 4],  velDropStop: null, log: ['minutes', 'rpe'] },
    threshold: { label: 'Threshold',      restSec: 90,  targetRPE: [6, 7],  velDropStop: null, log: ['minutes', 'rpe'] },
    vo2:       { label: 'VO₂ / Intervals',restSec: 120, targetRPE: [8, 10], velDropStop: null, log: ['minutes', 'rpe'] },
  };

  /* --------------------------------------------------------------------------
     ANNUAL PLAN — the 5 phases. `mix` = weekly emphasis %. `dose` = weekly
     volume prescriptions. `weightPct` = working intensity band.
     ------------------------------------------------------------------------ */
  const PHASES = [
    {
      id: 1, name: 'Build the Engine', weeks: 8, focus: 'Aerobic + Strength base — raise the ceiling.',
      mix: { strength: 30, threshold: 25, zone2: 25, speed: 10, power: 5, plyo: 5 },
      weightPct: [75, 85], repRange: [3, 5], setRange: [4, 6],
      dose: { sprintM: [250, 400], thresholdMin: [60, 90], zone2Min: [180, 300], plyoContacts: [20, 40] },
      primary: 'strength', secondary: ['threshold', 'zone2'], diagnostic: 'cmj',
    },
    {
      id: 2, name: 'Maximum Strength', weeks: 6, focus: 'Heavy neural strength; strongman for robustness.',
      mix: { strength: 45, power: 20, speed: 15, threshold: 10, zone2: 10 },
      weightPct: [90, 97], repRange: [1, 4], setRange: [3, 6],
      dose: { sprintM: [300, 500], thresholdMin: [30, 45], zone2Min: [90, 150], plyoContacts: [40, 60] },
      primary: 'strength', secondary: ['speed', 'threshold', 'zone2'], diagnostic: 'isoPull',
    },
    {
      id: 3, name: 'Convert to Power', weeks: 6, focus: 'Turn strength into speed — max intent, Olympic + ballistic.',
      mix: { power: 40, speed: 25, strength: 15, threshold: 10, zone2: 10 },
      weightPct: [50, 70], repRange: [2, 5], setRange: [3, 5],
      dose: { sprintM: [500, 700], thresholdMin: [20, 40], zone2Min: [90, 120], plyoContacts: [60, 100] },
      primary: 'power', secondary: ['speed', 'zone2'], diagnostic: 'keiserWatts',
    },
    {
      id: 4, name: 'Maximum Speed', weeks: 6, focus: 'Top-end velocity + speed endurance. Quality only.',
      mix: { speed: 45, threshold: 5, power: 15, strength: 10, zone2: 25 },
      weightPct: [80, 85], repRange: [2, 3], setRange: [3, 4],
      dose: { sprintM: [700, 1000], thresholdMin: [20, 30], zone2Min: [90, 120], plyoContacts: [100, 140] },
      primary: 'speed', secondary: ['power', 'zone2'], diagnostic: 'fly30',
    },
    {
      id: 5, name: 'Competition', weeks: 6, focus: 'Everything specific — sharpen, don\'t build.',
      mix: { speed: 40, power: 20, threshold: 15, strength: 15, zone2: 10 },
      weightPct: [70, 80], repRange: [2, 3], setRange: [2, 3],
      dose: { sprintM: [300, 700], thresholdMin: [10, 20], zone2Min: [60, 90], plyoContacts: [40, 60] },
      primary: 'speed', secondary: ['power'], diagnostic: 'fly30',
    },
  ];

  /* --------------------------------------------------------------------------
     RECOVERY MENU — from the athlete's Recovery System.
     ------------------------------------------------------------------------ */
  const RECOVERY = {
    green:  ['Full send — hard/quality session cleared', 'Normal mobility warm-up', 'Fuel: protein + carbs around session'],
    amber:  ['Keep intensity but trim volume ~20%', 'Extend warm-up, add mobility', 'Sauna or contrast shower post-session', 'Prioritize 8h+ sleep tonight'],
    red:    ['Downgrade to Zone 2 flush or full rest', 'Cold exposure + compression', 'Extra sleep, hydration, +20g protein', 'No high-CNS work (heavy/max-velocity/plyo)'],
  };

  return { GOALS, METRICS, EXERCISES, CATEGORIES, PHASES, RECOVERY };
})();
