/* ============================================================================
   store.js — Local persistence. Everything lives in the browser (localStorage),
   private to the device. Export/import lets the athlete back up or move data.
   ========================================================================== */

const Store = (() => {
  const KEY = 'apex_journal_v1';

  const DEFAULT = {
    profile: {
      name: '',
      bodyweightKg: 77,
      startDateISO: '2026-06-15', // Week 1 anchor (Mon) — race 2027-01-24 lands end of wk 32
      phaseId: 1,          // fallback phase if no start date set
      phaseWeek: 1,        // fallback week
      variant: 'C',        // Phase-5 sport variant: A=Football, B=HYROX, C=Track
      hrMax: 190,          // for zone calibration
      criticalPower: 308,  // Stryd CP (W) — re-anchor zones after testing
      goalDateISO: '2027-01-24', // A-race date
    },
    // Personal bests / current standing per goal id -> value
    bests: {},
    // Daily logs keyed by ISO date "YYYY-MM-DD"
    days: {},
    // Test results: array of { date, metric, value }
    tests: [],
    // AI coach chat history: array of { role, content }
    chat: [],
    settings: { hrvEnabled: true, useMetric: true, aiKey: '', aiModel: 'claude-opus-4-8' },
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULT);
      const parsed = JSON.parse(raw);
      return { ...structuredClone(DEFAULT), ...parsed,
        profile: { ...DEFAULT.profile, ...(parsed.profile || {}) },
        settings: { ...DEFAULT.settings, ...(parsed.settings || {}) } };
    } catch (e) {
      console.warn('Store load failed, resetting', e);
      return structuredClone(DEFAULT);
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.error('Save failed', e); }
  }

  /* ---- Day accessors --------------------------------------------------- */
  function blankDay(date) {
    return {
      date,
      wellness: null,          // { sleepH, sleepQ, hrv, rhr, soreness, energy, mood, stress, motivation }
      readiness: null,         // computed { score, band, components }
      session: null,           // { type, exercises:[{name,cat,sets:[{...}]}], sRPE, durationMin, load }
      recoveryDone: [],        // recovery actions checked off
      notes: '',
    };
  }

  function getDay(date) {
    if (!state.days[date]) state.days[date] = blankDay(date);
    return state.days[date];
  }

  function setDay(date, patch) {
    state.days[date] = { ...getDay(date), ...patch };
    save();
    return state.days[date];
  }

  function lastNDays(n, uptoDate) {
    const dates = Object.keys(state.days).sort();
    const upto = uptoDate || dates[dates.length - 1];
    return dates.filter(d => d <= upto).slice(-n).map(d => state.days[d]);
  }

  function allDaysSorted() {
    return Object.keys(state.days).sort().map(d => state.days[d]);
  }

  /* ---- Tests ----------------------------------------------------------- */
  function addTest(metric, value, date) {
    state.tests.push({ metric, value: Number(value), date });
    state.tests.sort((a, b) => a.date.localeCompare(b.date));
    save();
  }
  function testsFor(metric) {
    return state.tests.filter(t => t.metric === metric).sort((a, b) => a.date.localeCompare(b.date));
  }
  function latestTest(metric) {
    const t = testsFor(metric);
    return t.length ? t[t.length - 1] : null;
  }

  /* ---- Profile / bests ------------------------------------------------- */
  function setProfile(patch) { state.profile = { ...state.profile, ...patch }; save(); }
  function setBest(goalId, value) { state.bests[goalId] = Number(value); save(); }

  /* ---- Backup ---------------------------------------------------------- */
  function exportJSON() { return JSON.stringify(state, null, 2); }
  function importJSON(str) {
    const parsed = JSON.parse(str);
    state = { ...structuredClone(DEFAULT), ...parsed };
    save();
  }
  function reset() { state = structuredClone(DEFAULT); save(); }

  return {
    get state() { return state; },
    save, getDay, setDay, blankDay, lastNDays, allDaysSorted,
    addTest, testsFor, latestTest, setProfile, setBest,
    exportJSON, importJSON, reset,
  };
})();
