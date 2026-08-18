/* ============================================================================
   logger.js — Natural-language logging. Turns a plain sentence like
   "slept 7h, HRV 58, CMJ 33, front squat 4x4 @100kg RPE8, 1000m tempo RPE7,
   12 depth jumps RSI 2.3, felt good, session 7" into structured wellness +
   session data written straight into the journal. Runs 100% on-device — no
   API key needed. The live AI coach (if enabled) layers on top.
   ========================================================================== */

const NaturalLog = (() => {

  /* ---- movement lexicon: keyword -> category -------------------------- */
  const LEX = [
    // strength
    ['front squat','strength'],['back squat','strength'],['box squat','strength'],
    ['split squat','strength'],['squat','strength'],['deadlift','strength'],
    ['romanian','strength'],['rdl','strength'],['hip thrust','strength'],
    ['bench','strength'],['overhead press','strength'],['ohp','strength'],
    ['push press','strength'],['press','strength'],['pull-up','strength'],
    ['pullup','strength'],['chin','strength'],['row','strength'],['lunge','strength'],
    ['power clean','strength'],['hang clean','strength'],['clean','strength'],
    ['snatch','strength'],['jerk','strength'],['curl','strength'],['calf','strength'],
    ['nordic','strength'],['glute','strength'],['core','accessory'],['plank','accessory'],
    // plyometric
    ['depth jump','plyo'],['drop jump','plyo'],['box jump','plyo'],['broad jump','plyo'],
    ['pogo','plyo'],['hurdle hop','plyo'],['bound','plyo'],['hop','plyo'],
    ['plyo','plyo'],['cmj','plyo'],['jump','plyo'],
    // speed
    ['flying sprint','speed'],['fly','speed'],['sprint','speed'],['accel','speed'],
    ['acceleration','speed'],['wicket','speed'],['stride','speed'],['block start','speed'],
    // conditioning / endurance
    ['tempo run','conditioning'],['tempo','conditioning'],['easy run','conditioning'],
    ['long run','conditioning'],['interval','conditioning'],['run','conditioning'],
    ['jog','conditioning'],['bike','conditioning'],['erg','conditioning'],
    ['ski','conditioning'],['ruck','conditioning'],['swim','conditioning'],
    ['zone 2','conditioning'],['z2','conditioning'],['row erg','conditioning'],
  ];

  const FEEL = {
    great:5, amazing:5, excellent:5, strong:5, fresh:5, awesome:5, incredible:5, primed:5,
    good:4, solid:4, nice:4, decent:4, sharp:4,
    ok:3, okay:3, fine:3, alright:3, average:3, 'so-so':3, meh:3, normal:3,
    tired:2, flat:2, rough:2, sluggish:2, off:2, low:2, sore:2, heavy:2,
    exhausted:1, terrible:1, awful:1, dead:1, wrecked:1, shattered:1, drained:1,
  };

  const first = (re, s, i = 1) => { const m = s.match(re); return m ? parseFloat(m[i]) : null; };
  const titleCase = s => s.replace(/\b\w/g, c => c.toUpperCase());

  /* ---- wellness ------------------------------------------------------- */
  function parseWellness(t) {
    const w = {}, cap = [];
    const put = (k, v, label) => { if (v != null && !Number.isNaN(v)) { w[k] = v; cap.push(label); } };

    put('sleepH',
      first(/\bslept?\s*(?:for\s*)?(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours)?\b/, t) ??
      first(/(\d+(?:\.\d+)?)\s*(?:h|hrs|hours)\s*(?:of\s*)?sleep/, t), 'sleep');
    put('sleepQ', first(/sleep\s*(?:quality|q)\s*(\d)(?:\s*\/\s*5)?/, t) ??
      first(/quality\s*(\d)\s*\/\s*5/, t), 'sleep quality');
    put('hrv', first(/\bhrv\s*(?:of|was|is|=|:|at)?\s*(\d+(?:\.\d+)?)/, t), 'HRV');
    put('rhr', first(/(?:resting\s*(?:hr|heart\s*rate)|\brhr\b)\s*(?:of|was|is|=|:|at)?\s*(\d+(?:\.\d+)?)/, t), 'resting HR');
    put('cmj', first(/\bcmj\b\D{0,15}(\d+(?:\.\d+)?)/, t) ??
      first(/(?:vertical|jump(?:ed)?)\D{0,8}(\d+(?:\.\d+)?)\s*cm/, t), 'CMJ');
    put('bodyweightKg', first(/(?:bodyweight|body\s*weight|\bbw\b)\s*(?:of|was|is|=|:|at)?\s*(\d+(?:\.\d+)?)/, t), 'bodyweight');

    ['energy','mood','stress','motivation'].forEach(k => {
      const v = first(new RegExp(k + '\\w*\\s*(?:of|was|is|=|:|at)?\\s*(\\d)(?:\\s*\\/\\s*5)?'), t);
      put(k, v, k);
    });
    const soreN = first(/sore(?:ness)?\s*(?:of|was|is|=|:|at)?\s*(\d)(?:\s*\/\s*5)?/, t);
    put('soreness', soreN, 'soreness');

    // subjective feel words -> energy + mood if not explicitly given
    const fm = t.match(/(?:felt|feeling|feel)\s+(?:like\s+|a\s+|really\s+|pretty\s+|very\s+)?([a-z-]+)/);
    if (fm && FEEL[fm[1]] != null) {
      if (w.energy == null) { w.energy = FEEL[fm[1]]; cap.push('energy'); }
      if (w.mood == null) w.mood = FEEL[fm[1]];
      if (fm[1] === 'sore' && w.soreness == null) w.soreness = 4;
    }
    return { w, cap };
  }

  /* ---- session RPE ---------------------------------------------------- */
  function parseSessionRPE(t) {
    return first(/(?:session|whole session|overall)\s*(?:felt like|was|rpe)?\s*(?:a\s*)?(\d+(?:\.\d+)?)/, t) ??
           first(/\bs\s*rpe\s*(\d+(?:\.\d+)?)/, t) ??
           first(/felt like\s*(?:a\s*)?(\d+(?:\.\d+)?)\s*(?:\/\s*10)?\s*$/, t);
  }

  /* ---- exercises ------------------------------------------------------ */
  function parseExercises(t) {
    const clauses = t.split(/[,;\n]|\band\b|\bthen\b|\bplus\b/g).map(s => s.trim()).filter(Boolean);
    const out = [];
    for (const c of clauses) {
      // skip pure-wellness clauses
      if (/\b(slept|sleep|hrv|resting|rhr|bodyweight|body weight)\b/.test(c)) continue;
      if (/\bcmj\b/.test(c) && !/[x×]/.test(c)) continue;

      const sr = c.match(/(\d+)\s*[x×]\s*(\d+)/) || c.match(/(\d+)\s*by\s*(\d+)/);
      // load: "@100", "@ 100kg", or whole-word "at 100" (NOT the "at" inside "squat")
      const load = first(/(?:@\s*|\bat\s+)(\d+(?:\.\d+)?)\s*(?:kg|kgs|lb|lbs|pounds)?/, c) ??
                   first(/(\d+(?:\.\d+)?)\s*(?:kg|kgs)\b/, c);
      const isLb = /(?:@\s*|\bat\s+)?\d+(?:\.\d+)?\s*(?:lb|lbs|pounds)\b/.test(c);
      const rpe = first(/rpe\s*(\d+(?:\.\d+)?)/, c);
      const vel = first(/(\d+(?:\.\d+)?)\s*m\/s/, c);
      let dist = first(/(\d+(?:\.\d+)?)\s*(?:km)\b/, c);
      if (dist != null) dist *= 1000; else dist = first(/(\d+(?:\.\d+)?)\s*(?:m|meters?|metres?)\b(?!\/)/, c);
      const mins = first(/(\d+(?:\.\d+)?)\s*(?:min|mins|minutes)\b/, c);
      // contacts: "12 contacts", "12 jumps", or "12 depth jumps" (words between number and noun)
      const contacts = first(/(\d+)\s*(?:contacts|jumps|bounds|hops|throws|reps)\b/, c) ??
                       first(/(\d+)\s+(?:[a-z]+\s+){1,2}(?:contacts|jumps|bounds|hops|throws)\b/, c);
      const rsi = first(/rsi\s*(?:of|~|around|=|:)?\s*(\d+(?:\.\d+)?)/, c);

      // category / name from lexicon
      let cat = null, hit = null;
      for (const [kw, k] of LEX) { if (c.includes(kw)) { cat = k; hit = kw; break; } }

      const accept = sr || load != null || dist != null || contacts != null || rsi != null ||
                     (mins != null && cat) || (cat && cat !== 'plyo');
      if (!accept) continue;
      if (!cat) cat = load != null || sr ? 'strength' : 'accessory';

      // build a display name: clause minus the numeric tokens
      let name = c
        .replace(/(\d+)\s*[x×]\s*(\d+)/g, ' ').replace(/(\d+)\s*by\s*(\d+)/g, ' ')
        .replace(/(?:@|at)\s*\d+(?:\.\d+)?\s*(?:kg|kgs|lb|lbs|pounds)?/g, ' ')
        .replace(/\d+(?:\.\d+)?\s*(?:kg|kgs|lb|lbs|pounds|m\/s|km|m|meters?|metres?|min|mins|minutes|contacts|jumps|bounds|hops|throws|reps|cm)\b/g, ' ')
        .replace(/rpe\s*\d+(?:\.\d+)?/g, ' ').replace(/rsi\s*(?:of|~|around|=|:)?\s*\d+(?:\.\d+)?/g, ' ')
        .replace(/\b(did|a|of|for|the|some|my|felt|like|run)\b/g, ' ')
        .replace(/\b\d+(?:\.\d+)?\b/g, ' ')
        .replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!name || name.length < 2) name = hit || 'Exercise';
      name = titleCase(name);

      const ld = isLb && load != null ? Math.round(load * 0.4536 * 2) / 2 : load;
      const base = {};
      if (ld != null) base.load = ld;
      if (rpe != null) base.rpe = rpe;
      if (vel != null) base.velocity = vel;

      let sets;
      if (sr) {
        const n = Math.min(20, Math.max(1, parseInt(sr[1], 10)));
        const reps = parseInt(sr[2], 10);
        sets = Array.from({ length: n }, () => ({ ...base, reps }));
      } else {
        const one = { ...base };
        if (dist != null) one.distance = dist;
        if (mins != null) one.minutes = mins;
        if (contacts != null) one.reps = contacts;
        if (rsi != null) one.rsi = rsi;
        sets = [one];
      }
      out.push({ name, cat, sets });
    }
    return out;
  }

  function parse(text) {
    const t = ' ' + String(text).toLowerCase().replace(/[，]/g, ',') + ' ';
    const { w, cap } = parseWellness(t);
    const exercises = parseExercises(t);
    const sRPE = parseSessionRPE(t);
    return { wellness: w, wellnessCap: cap, exercises, sRPE,
      captured: cap.length > 0 || exercises.length > 0 || sRPE != null };
  }

  /* ---- write it into the journal -------------------------------------- */
  function apply(date, text) {
    const p = parse(text);
    if (!p.captured) return { ...p, readiness: null };

    const day = Store.getDay(date);

    // wellness (merge, don't wipe existing fields)
    if (p.wellnessCap.length) {
      const wellness = { ...(day.wellness || {}), ...p.wellness };
      Store.setDay(date, { wellness });
      if (p.wellness.cmj != null && !Store.testsFor('cmj').some(tt => tt.date === date))
        Store.addTest('cmj', p.wellness.cmj, date);
    }

    // session (append to any existing)
    if (p.exercises.length || p.sRPE != null) {
      const s = day.session && day.session.exercises
        ? day.session
        : { type: 'Logged', durationMin: 0, sRPE: 0, exercises: [] };
      s.exercises = s.exercises.concat(p.exercises);
      const totalMins = s.exercises.reduce((a, ex) =>
        a + (ex.sets || []).reduce((b, st) => b + (st.minutes || 0), 0), 0);
      if (totalMins) s.durationMin = Math.max(s.durationMin || 0, totalMins);
      if (!s.durationMin) s.durationMin = 60;
      if (p.sRPE != null) s.sRPE = p.sRPE;
      if (!s.sRPE) s.sRPE = 6;
      s.load = (typeof Engine !== 'undefined' && Engine.sessionLoad) ? Engine.sessionLoad(s) : 0;
      Store.setDay(date, { session: s });
    }

    // recompute readiness
    let readiness = null;
    if (typeof Engine !== 'undefined' && Engine.readiness) {
      readiness = Engine.readiness(date);
      if (readiness) Store.setDay(date, { readiness });
    }
    return { ...p, readiness };
  }

  return { parse, apply };
})();
