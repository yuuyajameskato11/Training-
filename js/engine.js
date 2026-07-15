/* ============================================================================
   engine.js — The coach's brain.
   Deterministic sports-science logic: readiness (WHOOP-style), training load
   & ACWR, goal projections, per-set auto-regulation, recovery & daily emphasis.
   No external calls — instant, offline, private.
   ========================================================================== */

const Engine = (() => {

  const clamp = (x, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));
  const mean  = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
  const std   = a => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };

  /* ==========================================================================
     TRAINING LOAD — session RPE method (sRPE = RPE × minutes), + ACWR.
     ======================================================================== */
  function sessionLoad(session) {
    if (!session) return 0;
    if (session.load) return session.load;
    const rpe = session.sRPE || 5;
    const min = session.durationMin || 45;
    return Math.round(rpe * min);
  }

  // Acute:Chronic Workload Ratio — 7-day avg / 28-day avg. Sweet spot 0.8–1.3.
  function acwr(date) {
    const load = d => sessionLoad(d.session);
    const last7  = Store.lastNDays(7, date).map(load);
    const last28 = Store.lastNDays(28, date).map(load);
    const acute  = mean(last7);
    const chronic = mean(last28);
    if (chronic === 0) return { ratio: null, acute, chronic };
    return { ratio: +(acute / chronic).toFixed(2), acute: Math.round(acute), chronic: Math.round(chronic) };
  }

  /* ==========================================================================
     READINESS — 0–100, WHOOP-style. Blends HRV, sleep, subjective wellness,
     neuromuscular (CMJ) and workload. Weights renormalize to available inputs.
     Metrics compared against the athlete's own rolling baseline.
     ======================================================================== */
  function baselineFor(field, date, n = 21) {
    const vals = Store.lastNDays(n, date)
      .map(d => d.wellness && d.wellness[field])
      .filter(v => typeof v === 'number' && !isNaN(v));
    // exclude today (last element may be today) — use prior values for baseline
    return vals;
  }

  function readiness(date) {
    const day = Store.getDay(date);
    const w = day.wellness;
    if (!w) return null;

    const parts = [];   // { key, score, weight, note }

    // --- Sleep (hours vs 8h target, blended with quality 1–5) ---
    if (typeof w.sleepH === 'number') {
      const hoursScore = clamp((w.sleepH / 8) * 100);
      const qScore = w.sleepQ ? (w.sleepQ / 5) * 100 : hoursScore;
      parts.push({ key: 'Sleep', score: clamp(0.6 * hoursScore + 0.4 * qScore), weight: 25,
        note: `${w.sleepH}h${w.sleepQ ? ', quality ' + w.sleepQ + '/5' : ''}` });
    }

    // --- HRV vs personal baseline (z-score) — the strongest recovery signal ---
    if (typeof w.hrv === 'number') {
      const hist = baselineFor('hrv', date).slice(0, -1); // prior days
      if (hist.length >= 5) {
        const z = std(hist) ? (w.hrv - mean(hist)) / std(hist) : 0;
        // z=0 -> 72, +1sd -> ~92, -1sd -> ~52, floor/ceiling clamped
        parts.push({ key: 'HRV', score: clamp(72 + z * 20), weight: 30,
          note: `${w.hrv}ms vs ${Math.round(mean(hist))}ms base (${z >= 0 ? '+' : ''}${z.toFixed(1)}σ)` });
      } else {
        parts.push({ key: 'HRV', score: 70, weight: 15, note: `${w.hrv}ms (building baseline)` });
      }
    }

    // --- Resting HR vs baseline (lower is better) ---
    if (typeof w.rhr === 'number') {
      const hist = baselineFor('rhr', date).slice(0, -1);
      if (hist.length >= 5) {
        const z = std(hist) ? (w.rhr - mean(hist)) / std(hist) : 0;
        parts.push({ key: 'Resting HR', score: clamp(72 - z * 18), weight: 10,
          note: `${w.rhr}bpm vs ${Math.round(mean(hist))}bpm base` });
      }
    }

    // --- Subjective wellness: energy, mood, motivation up; soreness, stress down ---
    const subj = [];
    if (w.energy)     subj.push((w.energy / 5) * 100);
    if (w.mood)       subj.push((w.mood / 5) * 100);
    if (w.motivation) subj.push((w.motivation / 5) * 100);
    if (w.soreness)   subj.push(((6 - w.soreness) / 5) * 100);   // invert
    if (w.stress)     subj.push(((6 - w.stress) / 5) * 100);     // invert
    if (subj.length) {
      parts.push({ key: 'Wellness', score: clamp(mean(subj)), weight: 20,
        note: `energy ${w.energy || '–'}, sore ${w.soreness || '–'}, stress ${w.stress || '–'}` });
    }

    // --- Neuromuscular: morning/most-recent CMJ vs baseline (>5% drop = fatigue) ---
    const cmjHist = Store.testsFor('cmj').filter(t => t.date < date).map(t => t.value);
    const cmjToday = Store.testsFor('cmj').find(t => t.date === date);
    if (cmjToday && cmjHist.length >= 3) {
      const base = mean(cmjHist.slice(-10));
      const pct = ((cmjToday.value - base) / base) * 100;
      parts.push({ key: 'Neuromuscular', score: clamp(75 + pct * 3), weight: 15,
        note: `CMJ ${cmjToday.value}cm (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% vs base)` });
    }

    // --- Workload penalty via ACWR (applied after weighted blend) ---
    const acw = acwr(date);
    let loadPenalty = 0, loadNote = '';
    if (acw.ratio !== null) {
      if (acw.ratio > 1.5)      { loadPenalty = 12; loadNote = `high spike (ACWR ${acw.ratio})`; }
      else if (acw.ratio > 1.3) { loadPenalty = 6;  loadNote = `elevated (ACWR ${acw.ratio})`; }
      else if (acw.ratio < 0.8) { loadPenalty = 0;  loadNote = `detraining risk (ACWR ${acw.ratio})`; }
      else                      { loadNote = `optimal (ACWR ${acw.ratio})`; }
    }

    // --- Weighted blend, renormalized to present components ---
    const totalW = parts.reduce((s, p) => s + p.weight, 0) || 1;
    let score = parts.reduce((s, p) => s + p.score * p.weight, 0) / totalW;
    score = clamp(score - loadPenalty);
    score = Math.round(score);

    const band = score >= 67 ? 'green' : score >= 40 ? 'amber' : 'red';
    return { score, band, components: parts, load: { ...acw, penalty: loadPenalty, note: loadNote } };
  }

  /* ==========================================================================
     GOAL PROJECTIONS — linear trend over recent tests → ETA to target.
     ======================================================================== */
  function daysBetween(a, b) { return (new Date(b) - new Date(a)) / 86400000; }

  function projectGoal(goal) {
    const hist = Store.testsFor(goal.id).length
      ? Store.testsFor(goal.id)
      : (Store.state.bests[goal.id] != null
          ? [{ date: Object.keys(Store.state.days).sort()[0] || todayISO(), value: Store.state.bests[goal.id] }]
          : []);
    if (!hist.length) return { status: 'no-data', goal };

    const current = hist[hist.length - 1].value;
    const gapPct = goal.lowerBetter
      ? ((current - goal.target) / goal.target) * 100
      : ((goal.target - current) / goal.target) * 100;

    if (hist.length < 2) {
      return { status: 'need-trend', goal, current, gapPct: +gapPct.toFixed(1) };
    }

    // Linear regression: value vs days-from-first
    const x0 = hist[0].date;
    const xs = hist.map(h => daysBetween(x0, h.date));
    const ys = hist.map(h => h.value);
    const n = xs.length, mx = mean(xs), my = mean(ys);
    const denom = xs.reduce((s, x) => s + (x - mx) ** 2, 0) || 1;
    const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / denom; // per day
    const perWeek = slope * 7;

    const improving = goal.lowerBetter ? slope < 0 : slope > 0;
    let etaWeeks = null, projDate = null, reached = false;

    if (goal.lowerBetter ? current <= goal.target : current >= goal.target) {
      reached = true;
    } else if (improving) {
      const remaining = goal.lowerBetter ? current - goal.target : goal.target - current;
      const ratePerWeek = Math.abs(perWeek);
      etaWeeks = ratePerWeek > 0 ? Math.ceil(remaining / ratePerWeek) : null;
    }

    return {
      status: 'ok', goal, current,
      gapPct: +gapPct.toFixed(1),
      perWeek: +perWeek.toFixed(3),
      improving, reached, etaWeeks,
      trendPoints: hist.length,
    };
  }

  /* ==========================================================================
     DAILY EMPHASIS — Decide step. Combines phase plan + today's readiness.
     ======================================================================== */
  function topEmphasis(phase) {
    return Object.entries(phase.mix).sort((a, b) => b[1] - a[1])[0][0];
  }

  function decideDay(date) {
    const phase = DATA.PHASES.find(p => p.id === Store.state.profile.phaseId) || DATA.PHASES[0];
    const r = readiness(date);
    const plannedFocus = topEmphasis(phase);
    const catLabel = c => (DATA.CATEGORIES[c] ? DATA.CATEGORIES[c].label : c);

    if (!r) {
      return { phase, readiness: null, headline: 'Log your morning check-in to get today\'s call.',
        emphasis: plannedFocus, emphasisLabel: catLabel(plannedFocus), advice: [], recovery: [] };
    }

    let emphasis = plannedFocus;
    let headline, advice = [];
    const highCNS = ['speed', 'power', 'plyo', 'strength'].includes(plannedFocus);

    if (r.band === 'green') {
      headline = `Green light — attack today's ${catLabel(plannedFocus)} work.`;
      advice.push(`Readiness ${r.score}. This is a day to spend quality. Hit prescribed intensity.`);
      if (highCNS) advice.push('CNS is fresh — full-intent reps, full recoveries between them.');
    } else if (r.band === 'amber') {
      headline = `Amber — train, but auto-regulate.`;
      advice.push(`Readiness ${r.score}. Keep the ${catLabel(plannedFocus)} intent, trim volume ~20%.`);
      if (highCNS) { emphasis = plannedFocus; advice.push('Stop each lift/sprint 1 rep before form or speed drops — leave a rep in reserve.'); }
    } else {
      // red — protect the athlete, pivot away from high CNS
      if (highCNS) {
        emphasis = 'zone2';
        headline = `Red — pull the plug on high-intensity work today.`;
        advice.push(`Readiness ${r.score}. Skip the ${catLabel(plannedFocus)} session. Zone 2 flush or full rest instead.`);
        advice.push('Forcing a hard session now digs the hole deeper and risks the whole block.');
      } else {
        headline = `Red — keep it very easy.`;
        advice.push(`Readiness ${r.score}. Zone 2 only, conversational. No threshold or VO₂.`);
      }
    }

    // Load context
    if (r.load && r.load.note) {
      if (r.load.ratio > 1.5) advice.push(`Workload spike detected — ${r.load.note}. High injury-risk zone; back volume off this week.`);
      else if (r.load.ratio && r.load.ratio < 0.8) advice.push(`Workload is dropping (${r.load.note}) — fine for a taper, but don't detrain if you're mid-block.`);
    }

    const recovery = DATA.RECOVERY[r.band] || [];
    return { phase, readiness: r, headline, emphasis, emphasisLabel: catLabel(emphasis), advice, recovery };
  }

  /* ==========================================================================
     PER-SET AUTO-REGULATION — feedback after each logged set.
     ======================================================================== */
  function nextSetAdvice(exercise, setIndex, sets) {
    const cat = DATA.CATEGORIES[exercise.cat];
    if (!cat) return { rest: '', cue: '' };
    const set = sets[setIndex];
    const rpe = set.rpe;
    const advice = [];
    const restMin = Math.round(cat.restSec / 60 * 10) / 10;
    const restLabel = cat.restSec >= 60 ? `${restMin} min` : `${cat.restSec}s`;

    // Velocity-based stop (power/speed)
    if (cat.velDropStop && set.velocity != null) {
      const best = Math.max(...sets.slice(0, setIndex + 1).map(s => s.velocity || 0));
      if (best > 0) {
        const dropPct = ((best - set.velocity) / best) * 100;
        if (dropPct >= cat.velDropStop) {
          advice.push(`⛔ Velocity down ${dropPct.toFixed(0)}% from best — power quality is gone. End this exercise.`);
        } else {
          advice.push(`✅ Speed holding (${dropPct.toFixed(0)}% off best). Keep going with full intent.`);
        }
      }
    }

    // RPE-based auto-regulation
    if (rpe != null && cat.targetRPE) {
      const [lo, hi] = cat.targetRPE;
      if (rpe > hi) {
        advice.push(exercise.cat === 'speed'
          ? `Effort ${rpe}/10 above target — you're fatiguing. Extend rest or cut the rep count.`
          : `RPE ${rpe} above target ${hi} — drop load ~5–10% next set to keep bar speed / intent.`);
      } else if (rpe < lo && ['strength', 'power', 'iso'].includes(exercise.cat)) {
        advice.push(`RPE ${rpe} below target ${lo} — you've got more. Add load next set.`);
      } else {
        advice.push(`RPE ${rpe} on target — hold this load.`);
      }
    }

    if (cat.restSec > 0) advice.push(`Rest ~${restLabel} before the next set.`);
    else advice.push('Continuous — no rest prescribed.');

    return { rest: restLabel, cue: advice.join(' ') };
  }

  /* ==========================================================================
     WEEKLY COMPLIANCE — how the week's volume tracks vs phase prescription.
     ======================================================================== */
  function weeklyReport(date) {
    const phase = DATA.PHASES.find(p => p.id === Store.state.profile.phaseId) || DATA.PHASES[0];
    const days = Store.lastNDays(7, date);
    const tally = { sprintM: 0, thresholdMin: 0, zone2Min: 0, plyoContacts: 0, loads: [] };
    days.forEach(d => {
      if (!d.session || !d.session.exercises) return;
      d.session.exercises.forEach(ex => {
        (ex.sets || []).forEach(s => {
          if (ex.cat === 'speed') tally.sprintM += (s.distance || 0) * (s.reps || 1);
          if (ex.cat === 'threshold') tally.thresholdMin += (s.minutes || 0);
          if (ex.cat === 'zone2') tally.zone2Min += (s.minutes || 0);
          if (ex.cat === 'plyo') tally.plyoContacts += (s.contacts || 0);
        });
      });
    });
    const band = (val, [lo, hi]) => val < lo ? 'under' : val > hi ? 'over' : 'on';
    return {
      phase,
      items: [
        { label: 'Sprint volume', unit: 'm',        val: Math.round(tally.sprintM),      target: phase.dose.sprintM,     band: band(tally.sprintM, phase.dose.sprintM) },
        { label: 'Threshold',     unit: 'min',      val: Math.round(tally.thresholdMin), target: phase.dose.thresholdMin,band: band(tally.thresholdMin, phase.dose.thresholdMin) },
        { label: 'Zone 2',        unit: 'min',      val: Math.round(tally.zone2Min),     target: phase.dose.zone2Min,    band: band(tally.zone2Min, phase.dose.zone2Min) },
        { label: 'Plyo contacts', unit: '',         val: Math.round(tally.plyoContacts), target: phase.dose.plyoContacts,band: band(tally.plyoContacts, phase.dose.plyoContacts) },
      ],
    };
  }

  function todayISO(d = new Date()) {
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d - tz).toISOString().slice(0, 10);
  }

  return {
    readiness, acwr, sessionLoad, projectGoal, decideDay,
    nextSetAdvice, weeklyReport, topEmphasis, todayISO,
  };
})();
