/* ============================================================================
   engine.js — The coach's brain (KNCT Hybrid Apex System).
   Readiness = CMJ-vs-baseline gate + hard-gate overrides (per the doc).
   Plus training load/ACWR, program-week + phase awareness, the High/Low weekly
   architecture, goal projections (checkpoint + North Star), per-set auto-reg,
   weekly diagnostic drift, and daily emphasis. Deterministic, offline, private.
   ========================================================================== */

const Engine = (() => {

  const clamp = (x, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));
  const mean  = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
  const std   = a => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
  const BANDS = { green: 0, amber: 1, red: 2 };
  const worst = (...bs) => Object.keys(BANDS)[Math.max(...bs.filter(Boolean).map(b => BANDS[b]))] || 'green';

  const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function todayISO(d = new Date()) { const tz = d.getTimezoneOffset() * 60000; return new Date(d - tz).toISOString().slice(0, 10); }
  function weekdayOf(dateISO) { return DAY_ABBR[new Date(dateISO + 'T12:00:00').getDay()]; }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }

  /* ---- Program week (1..32) from the anchored start date ---------------- */
  function programWeek(dateISO) {
    const start = Store.state.profile.startDateISO;
    if (!start) return null;
    const d = daysBetween(start, dateISO);
    if (d < 0) return null;
    return Math.floor(d / 7) + 1;
  }
  function phaseForWeek(wk) {
    if (wk == null) return null;
    return DATA.PHASES.find(p => wk >= p.weeks[0] && wk <= p.weeks[1]) || null;
  }
  function currentPhase(dateISO) {
    return phaseForWeek(programWeek(dateISO)) || DATA.PHASES.find(p => p.id === Store.state.profile.phaseId) || DATA.PHASES[0];
  }
  function isDeloadWeek(dateISO) {
    const wk = programWeek(dateISO), ph = phaseForWeek(wk);
    return !!(ph && wk != null && ph.deloads.includes(wk));
  }

  /* ==========================================================================
     TRAINING LOAD — session RPE (RPE × min) + ACWR (7d avg / 28d avg).
     ======================================================================== */
  function sessionLoad(session) {
    if (!session) return 0;
    if (session.load) return session.load;
    return Math.round((session.sRPE || 5) * (session.durationMin || 45));
  }
  function acwr(date) {
    const load = d => sessionLoad(d.session);
    const acute = mean(Store.lastNDays(7, date).map(load));
    const chronic = mean(Store.lastNDays(28, date).map(load));
    if (chronic === 0) return { ratio: null, acute: Math.round(acute), chronic: 0 };
    return { ratio: +(acute / chronic).toFixed(2), acute: Math.round(acute), chronic: Math.round(chronic) };
  }

  /* ==========================================================================
     READINESS GATE — CMJ vs rolling baseline is the primary readout; hard
     gates (RHR / sleep / subjective / bodyweight / pain) can force downgrade.
     ======================================================================== */
  function priorWellness(field, date, n = 7) {
    return Store.lastNDays(n + 1, date)
      .filter(d => d.date < date && d.wellness && typeof d.wellness[field] === 'number')
      .map(d => d.wellness[field]);
  }
  function subjective10(w) {
    // derive a 1–10 subjective readiness from the 1–5 scales
    const up = [w.energy, w.mood, w.motivation].filter(v => v);
    const down = [w.soreness, w.stress].filter(v => v);
    if (!up.length && !down.length) return null;
    const pos = up.length ? mean(up) : 3;                 // 1–5
    const neg = down.length ? mean(down.map(v => 6 - v)) : 3; // invert, 1–5
    return +(((pos + neg) / 2) * 2).toFixed(1);           // → 1–10
  }

  function readiness(date) {
    const w = Store.getDay(date).wellness;
    if (!w) return null;
    const G = DATA.GATE;
    const parts = [];
    let cmjBand = null, score = null, cmjNote = '';

    // --- CMJ gate (primary) ---
    const cmjHist = priorWellness('cmj', date, 7);
    if (typeof w.cmj === 'number' && cmjHist.length >= 3) {
      const base = mean(cmjHist);
      const dPct = ((w.cmj - base) / base) * 100;
      cmjBand = dPct >= -G.cmj.greenWithinPct ? 'green' : dPct >= -G.cmj.amberDownPct ? 'amber' : 'red';
      // numeric score
      score = dPct >= 0 ? clamp(85 + dPct * 2, 85, 100)
            : dPct >= -5 ? clamp(70 + (dPct + 5) * 3, 70, 85)
            : dPct >= -10 ? clamp(45 + (dPct + 10) * 5, 45, 70)
            : clamp(45 + (dPct + 10) * 3, 12, 45);
      cmjNote = `CMJ ${w.cmj}cm vs ${base.toFixed(1)}cm base (${dPct >= 0 ? '+' : ''}${dPct.toFixed(1)}%)`;
      parts.push({ key: 'CMJ (neuromuscular)', score: Math.round(score), note: cmjNote });
    }

    // --- HRV (modifier / signal) ---
    if (typeof w.hrv === 'number') {
      const h = priorWellness('hrv', date, 14);
      if (h.length >= 5) {
        const z = std(h) ? (w.hrv - mean(h)) / std(h) : 0;
        const s = clamp(72 + z * 20);
        parts.push({ key: 'HRV', score: Math.round(s), note: `${w.hrv}ms vs ${Math.round(mean(h))}ms base (${z >= 0 ? '+' : ''}${z.toFixed(1)}σ)` });
        if (score == null) score = s;                          // fallback base if no CMJ
        else score = clamp(score * 0.85 + s * 0.15);           // small HRV nudge
      }
    }

    // --- Sleep (context) ---
    if (typeof w.sleepH === 'number') {
      const s = clamp((w.sleepH / 8) * 100);
      parts.push({ key: 'Sleep', score: Math.round(s), note: `${w.sleepH}h${w.sleepQ ? ', q' + w.sleepQ + '/5' : ''}` });
      if (score == null) score = s;
    }

    // --- Subjective (context) ---
    const subj = subjective10(w);
    if (subj != null) {
      parts.push({ key: 'Subjective', score: Math.round(subj * 10), note: `${subj}/10 (energy ${w.energy || '–'}, sore ${w.soreness || '–'}, stress ${w.stress || '–'})` });
      if (score == null) score = subj * 10;
    }

    if (score == null) score = 60;

    // --- Hard gates (any one → ≥amber, two → red) ---
    const gates = [];
    const rhrHist = priorWellness('rhr', date, 14);
    if (typeof w.rhr === 'number' && rhrHist.length >= 3 && (w.rhr - mean(rhrHist)) >= G.hard.rhrOverBaseline)
      gates.push(`Resting HR +${Math.round(w.rhr - mean(rhrHist))} over baseline`);
    if (typeof w.sleepH === 'number' && w.sleepH < G.hard.sleepMinH) gates.push(`Sleep ${w.sleepH}h (<6h)`);
    if (subj != null && subj < G.hard.subjMin) gates.push(`Subjective ${subj}/10 (<5)`);
    const bwHist = priorWellness('bodyweightKg', date, 4);
    if (typeof w.bodyweightKg === 'number' && bwHist.length) {
      const dropPct = ((bwHist[bwHist.length - 1] - w.bodyweightKg) / bwHist[bwHist.length - 1]) * 100;
      if (dropPct >= G.hard.bwOvernightDropPct) gates.push(`Bodyweight ${dropPct.toFixed(1)}% down overnight (hydration/glycogen)`);
    }
    if (w.pain) gates.push('Sharp/localized pain flagged — assess before loading');

    let gateBand = gates.length >= 2 ? 'red' : gates.length === 1 ? 'amber' : null;

    // --- Final band = worst of CMJ gate, HRV/subjective fallback, hard gates ---
    let scoreBand = score >= 67 ? 'green' : score >= 40 ? 'amber' : 'red';
    let band = worst(cmjBand || scoreBand, gateBand);

    // clamp numeric score to the band so the ring and the call agree
    if (band === 'red') score = Math.min(score, 39);
    else if (band === 'amber') score = Math.min(Math.max(score, 40), 66);
    else score = Math.max(score, 67);
    score = Math.round(score);

    return {
      score, band, components: parts, gates,
      action: DATA.GATE.action[band],
      cmjBand, load: acwr(date),
      hasCMJ: cmjBand != null,
    };
  }

  /* ==========================================================================
     DAILY DECISION — weekday architecture + prescribed session + readiness.
     ======================================================================== */
  function decideDay(date) {
    const phase = currentPhase(date);
    const wk = programWeek(date);
    const day = weekdayOf(date);
    const arch = DATA.WEEK_ARCH.find(a => a.day === day);
    const prescribed = PROGRAM.forDay(phase.id, day);
    const deload = isDeloadWeek(date);
    const r = readiness(date);
    const highDay = DATA.HIGH_DAYS.includes(day);

    let headline, advice = [];
    if (!r) {
      headline = 'Run the morning readiness gate to get today\'s call.';
      advice.push('HRV + 3× CMJ on the force plate → log it and I\'ll set green/amber/red.');
    } else if (r.band === 'green') {
      headline = `GREEN — ${arch ? arch.load : ''} day, full session as written.`;
      advice.push(`Readiness ${r.score}. ${DATA.GATE.action.green}`);
      if (highDay) advice.push('CNS is fresh — full-intent reps, full recoveries. This is a day to spend quality.');
    } else if (r.band === 'amber') {
      headline = `AMBER — auto-regulate today.`;
      advice.push(`Readiness ${r.score}. ${DATA.GATE.action.amber}`);
      if (r.gates.length) advice.push(`Flag: ${r.gates.join('; ')}.`);
    } else {
      headline = highDay ? `RED — pull the plug on CNS work.` : `RED — keep it genuinely easy.`;
      advice.push(`Readiness ${r.score}. ${DATA.GATE.action.red}`);
      if (r.gates.length) advice.push(`Flag: ${r.gates.join('; ')}.`);
      advice.push('A red day taken is cheaper than a torn hamstring taken. The force plate exists so you stop guessing on this.');
    }

    if (deload) advice.push(`Deload week (wk ${wk}) — ~40% volume, intensity held. Bank the adaptation.`);

    if (r && r.load && r.load.ratio != null) {
      if (r.load.ratio > 1.5) advice.push(`Workload spike (ACWR ${r.load.ratio}) — high injury-risk zone; trim volume this week.`);
      else if (r.load.ratio < 0.8 && !deload) advice.push(`Workload low (ACWR ${r.load.ratio}) — fine for a taper, don't detrain mid-block.`);
    }

    return { phase, wk, day, arch, prescribed, deload, readiness: r, headline, advice };
  }

  /* ==========================================================================
     GOAL PROJECTIONS — trend → ETA to 32-week checkpoint & North Star.
     ======================================================================== */
  function projectGoal(goal) {
    const tests = Store.testsFor(goal.id);
    const bestOverride = Store.state.bests[goal.id];
    let hist = tests.length ? tests.map(t => ({ date: t.date, value: t.value })) : [];
    let current = tests.length ? tests[tests.length - 1].value
                : bestOverride != null ? bestOverride
                : goal.current;
    if (current == null) return { status: 'no-data', goal };

    const ckMid = goal.checkpoint ? (goal.checkpoint[0] + goal.checkpoint[1]) / 2 : null;
    const nsTarget = goal.northStar;
    const gapTo = t => t == null ? null : (goal.lowerBetter ? current - t : t - current);

    let perWeek = null, improving = null, etaCkWeeks = null;
    if (hist.length >= 2) {
      const x0 = hist[0].date;
      const xs = hist.map(h => daysBetween(x0, h.date));
      const ys = hist.map(h => h.value);
      const mx = mean(xs), my = mean(ys);
      const denom = xs.reduce((s, x) => s + (x - mx) ** 2, 0) || 1;
      const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / denom;
      perWeek = +(slope * 7).toFixed(3);
      improving = goal.lowerBetter ? slope < 0 : slope > 0;
      const rem = gapTo(ckMid);
      if (rem != null && rem > 0 && improving && Math.abs(perWeek) > 0)
        etaCkWeeks = Math.ceil(rem / Math.abs(perWeek));
    }

    // progress bar: current position from goal.current → North Star (or checkpoint hi)
    const anchorStart = goal.current;
    const anchorEnd = nsTarget != null ? nsTarget : (goal.checkpoint ? goal.checkpoint[goal.lowerBetter ? 0 : 1] : current);
    let pct = 50;
    if (anchorStart != null && anchorEnd != null && anchorStart !== anchorEnd) {
      pct = clamp(((anchorStart - current) / (anchorStart - anchorEnd)) * 100);
    }

    return {
      status: 'ok', goal, current, ckMid, nsTarget,
      gapToCk: gapTo(ckMid), gapToNs: gapTo(nsTarget),
      perWeek, improving, etaCkWeeks, trendPoints: hist.length, pct: Math.round(pct),
    };
  }

  /* ==========================================================================
     WEEKLY DIAGNOSTIC DRIFT — flag a maintained quality declining 2 weeks.
     ======================================================================== */
  function diagnosticDrift(metricId) {
    const t = Store.testsFor(metricId);
    if (t.length < 3) return null;
    const meta = DATA.METRICS.find(m => m.id === metricId) || { lowerBetter: false };
    const [a, b, c] = t.slice(-3);
    const worse = (x, y) => meta.lowerBetter ? x.value > y.value : x.value < y.value;
    const declining = worse(c, b) && worse(b, a);   // two consecutive down
    return { metricId, declining, latest: c.value, prev: b.value };
  }

  /* ==========================================================================
     PER-SET AUTO-REGULATION — feedback after each logged set.
     ======================================================================== */
  function nextSetAdvice(exercise, setIndex, sets) {
    const cat = DATA.CATEGORIES[exercise.cat];
    if (!cat) return { rest: '', cue: '' };
    const set = sets[setIndex];
    const advice = [];
    const restLabel = cat.restSec >= 60 ? `${Math.round(cat.restSec / 60 * 10) / 10} min` : `${cat.restSec}s`;

    if (cat.velDropStop && set.velocity != null) {
      const best = Math.max(...sets.slice(0, setIndex + 1).map(s => s.velocity || 0));
      if (best > 0) {
        const drop = ((best - set.velocity) / best) * 100;
        advice.push(drop >= cat.velDropStop
          ? `⛔ Velocity down ${drop.toFixed(0)}% from best — power quality is gone. End this exercise.`
          : `✅ Speed holding (${drop.toFixed(0)}% off best). Keep full intent.`);
      }
    }
    if (exercise.cat === 'speed' && set.time != null && set.best != null) { /* reserved */ }

    if (set.rpe != null && cat.targetRPE) {
      const [lo, hi] = cat.targetRPE;
      if (set.rpe > hi) advice.push(exercise.cat === 'speed'
        ? `Effort ${set.rpe}/10 above target — fatiguing. Extend rest or cut reps.`
        : `RPE ${set.rpe} above target ${hi} — drop load ~5–10% next set to keep bar speed.`);
      else if (set.rpe < lo && ['strength', 'power', 'iso'].includes(exercise.cat))
        advice.push(`RPE ${set.rpe} below target ${lo} — add load next set.`);
      else advice.push(`RPE ${set.rpe} on target — hold this load.`);
    }
    if (exercise.cat === 'plyo' && set.rsi != null) advice.push(set.rsi >= 2.0 ? `RSI ${set.rsi} — stiff and reactive.` : `RSI ${set.rsi} below 2.0 — contacts are damping; reduce volume.`);

    advice.push(cat.restSec > 0 ? `Rest ~${restLabel} before the next set.` : 'Continuous — no rest prescribed.');
    return { rest: restLabel, cue: advice.join(' ') };
  }

  /* ==========================================================================
     WEEKLY COMPLIANCE — logged volume vs phase prescription.
     ======================================================================== */
  function weeklyReport(date) {
    const phase = currentPhase(date);
    const days = Store.lastNDays(7, date);
    const t = { sprintM: 0, thresholdMin: 0, zone2Min: 0, plyoContacts: 0 };
    days.forEach(d => (d.session && d.session.exercises || []).forEach(ex => (ex.sets || []).forEach(s => {
      const n = parseFloat(s.distance) || 0, reps = parseFloat(s.reps) || 1;
      if (ex.cat === 'speed') t.sprintM += n * reps;
      if (ex.cat === 'threshold') t.thresholdMin += parseFloat(s.minutes) || 0;
      if (ex.cat === 'zone2') t.zone2Min += parseFloat(s.minutes) || 0;
      if (ex.cat === 'plyo') t.plyoContacts += parseFloat(s.contacts) || 0;
    })));
    const band = (v, [lo, hi]) => v < lo * 0.85 ? 'under' : v > hi * 1.15 ? 'over' : 'on';
    return { phase, items: [
      { label: 'Sprint volume', unit: 'm',   val: Math.round(t.sprintM),      target: phase.dose.sprintM,      band: band(t.sprintM, phase.dose.sprintM) },
      { label: 'Threshold',     unit: 'min', val: Math.round(t.thresholdMin), target: phase.dose.thresholdMin, band: band(t.thresholdMin, phase.dose.thresholdMin) },
      { label: 'Zone 2',        unit: 'min', val: Math.round(t.zone2Min),     target: phase.dose.zone2Min,     band: band(t.zone2Min, phase.dose.zone2Min) },
      { label: 'Plyo contacts', unit: '',    val: Math.round(t.plyoContacts), target: phase.dose.plyoContacts, band: band(t.plyoContacts, phase.dose.plyoContacts) },
    ] };
  }

  return {
    readiness, acwr, sessionLoad, projectGoal, decideDay, nextSetAdvice, weeklyReport,
    todayISO, weekdayOf, programWeek, currentPhase, isDeloadWeek, diagnosticDrift, phaseForWeek,
  };
})();
