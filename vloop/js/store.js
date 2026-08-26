/* ============================================================================
   store.js — Local persistence. Periods, people, interventions, benchmarks.
   Everything stays in the browser (localStorage), private to the device,
   exportable as JSON or CSV. No accounts, no server, works on a plane.
   ========================================================================== */

const Store = (() => {
  const KEY = 'valueloop_os_v1';

  const DEFAULT = {
    company: { name:'KNCT', currency:'JPY', cadence:'month', fiscalStart:'2026-01' },
    periods: {},          // id -> { id, type, startISO, endISO, label, inputs:{}, notes }
    people:  {},          // id -> master record (section 1)
    interventions: [],    // the PRESCRIBE → TRACK ledger
    benchmarks: {},       // metricId -> { target, floor }  (overrides Schema defaults)
    focus: [],            // metric ids the CEO has pinned to screen 1
    settings: { demo:false },
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULT);
      const p = JSON.parse(raw);
      return { ...structuredClone(DEFAULT), ...p,
        company:  { ...DEFAULT.company,  ...(p.company  || {}) },
        settings: { ...DEFAULT.settings, ...(p.settings || {}) } };
    } catch (e) { console.warn('Store reset', e); return structuredClone(DEFAULT); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.error('Save failed — storage full?', e); }
  }

  /* ---- Period identity --------------------------------------------------- */
  const pad = n => String(n).padStart(2, '0');

  function isoWeek(d) {                       // ISO-8601 week number
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return { year: t.getUTCFullYear(), week: Math.ceil(((t - y0) / 86400000 + 1) / 7) };
  }
  function weekBounds(year, week) {
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const mon = new Date(jan4);
    mon.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (week - 1) * 7);
    const sun = new Date(mon); sun.setUTCDate(mon.getUTCDate() + 6);
    return { startISO: mon.toISOString().slice(0, 10), endISO: sun.toISOString().slice(0, 10) };
  }
  function periodIdFor(dateISO, type) {
    const d = new Date(dateISO + 'T12:00:00');
    if (type === 'week') { const { year, week } = isoWeek(d); return `${year}-W${pad(week)}`; }
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  }
  function boundsFor(id) {
    if (id.includes('W')) {
      const [y, w] = id.split('-W');
      return weekBounds(+y, +w);
    }
    const [y, m] = id.split('-').map(Number);
    const end = new Date(Date.UTC(y, m, 0));
    return { startISO: `${y}-${pad(m)}-01`, endISO: end.toISOString().slice(0, 10) };
  }
  function labelFor(id) {
    if (id.includes('W')) { const [y, w] = id.split('-W'); return `Week ${+w} · ${y}`; }
    const [y, m] = id.split('-');
    return new Date(+y, +m - 1, 1).toLocaleString('en', { month:'long' }) + ' ' + y;
  }
  // A month is 1.0; a week is 7/30.44 of a month. Used to normalise churn.
  const monthsIn = id => id.includes('W') ? 7 / 30.44 : 1;

  const todayISO = () => new Date().toISOString().slice(0, 10);

  /* ---- Periods ----------------------------------------------------------- */
  function ensurePeriod(id) {
    if (!state.periods[id]) {
      const b = boundsFor(id);
      state.periods[id] = { id, type: id.includes('W') ? 'week' : 'month',
        startISO:b.startISO, endISO:b.endISO, label:labelFor(id), inputs:{}, notes:'' };
      save();
    }
    return state.periods[id];
  }
  function setInput(id, fieldId, value) {
    const p = ensurePeriod(id);
    if (value === '' || value == null || (typeof value === 'number' && isNaN(value))) delete p.inputs[fieldId];
    else p.inputs[fieldId] = Number(value);
    save();
  }
  function setNotes(id, notes) { ensurePeriod(id).notes = notes; save(); }
  function deletePeriod(id) { delete state.periods[id]; save(); }

  const periodIds  = () => Object.keys(state.periods).sort();
  const periods    = () => periodIds().map(id => state.periods[id]);
  function currentId() {
    const ids = periodIds();
    const nowId = periodIdFor(todayISO(), state.company.cadence);
    if (state.periods[nowId]) return nowId;
    return ids.length ? ids[ids.length - 1] : nowId;
  }
  function previousId(id) {
    const ids = periodIds(); const i = ids.indexOf(id);
    return i > 0 ? ids[i - 1] : null;
  }
  function trailing(id, n) {                   // the n periods up to and including id
    const ids = periodIds(); const i = ids.indexOf(id);
    return (i < 0 ? ids.slice(-n) : ids.slice(Math.max(0, i - n + 1), i + 1)).map(x => state.periods[x]);
  }

  /* ---- People (section 1 — the spine) ------------------------------------ */
  function blankPerson() {
    return {
      id: 'P' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      name:'', contact:'', source:'', campaign:'', cohort:'', salesperson:'', leader:'',
      dateLead:'', dateCall:'', datePurchase:'',
      price:0, collected:0, refunded:0,
      baselineIncome:0, currentIncome:0,
      status:'lead',            // lead · customer · active · graduated · churned · lost
      outcome:'none',           // none · implemented · firstClient · result100k · result300k · result1m
      dateFirstClient:'', dateFirstResult:'',
      network:'no',             // no · invited · joined · churned
      networkMonths:0, networkFee:0, expansion:0,
      referrals:0, caseStudy:false, certified:false,
      riskFlags:[],             // see Engine.riskScore
      failReason:'', churnReason:'', notes:'',
    };
  }
  function upsertPerson(rec) { state.people[rec.id] = { ...blankPerson(), ...rec }; save(); return state.people[rec.id]; }
  function deletePerson(id) { delete state.people[id]; save(); }
  const people = () => Object.values(state.people);

  /* ---- Interventions (PRESCRIBE → TRACK) --------------------------------- */
  function addIntervention(rx) {
    state.interventions.push({
      id: 'X' + Date.now().toString(36),
      created: todayISO(),
      periodId: rx.periodId, metricId: rx.metricId,
      action: rx.action, owner: rx.owner || '', horizon: rx.horizon || '',
      baseline: rx.baseline == null ? null : Number(rx.baseline),
      target:   rx.target   == null ? null : Number(rx.target),
      valueAtStake: rx.valueAtStake || 0,
      status: 'running', verdict:'', reviewedPeriodId:'', delta:null,
    });
    save();
  }
  function updateIntervention(id, patch) {
    const x = state.interventions.find(i => i.id === id);
    if (x) { Object.assign(x, patch); save(); }
  }
  function deleteIntervention(id) {
    state.interventions = state.interventions.filter(i => i.id !== id); save();
  }

  /* ---- Benchmarks & focus ------------------------------------------------ */
  function benchmark(metricId) {
    const m = Schema.metric(metricId) || {};
    const o = state.benchmarks[metricId] || {};
    return { target: o.target != null ? o.target : m.target,
             floor:  o.floor  != null ? o.floor  : m.floor };
  }
  function setBenchmark(metricId, target, floor) {
    state.benchmarks[metricId] = { target:Number(target), floor:Number(floor) }; save();
  }
  function resetBenchmark(metricId) { delete state.benchmarks[metricId]; save(); }
  function toggleFocus(metricId) {
    const i = state.focus.indexOf(metricId);
    if (i >= 0) state.focus.splice(i, 1); else state.focus.push(metricId);
    save();
  }

  /* ---- Company ----------------------------------------------------------- */
  function setCompany(patch) { state.company = { ...state.company, ...patch }; save(); }

  /* ---- Backup ------------------------------------------------------------ */
  function exportJSON() { return JSON.stringify(state, null, 2); }
  function importJSON(str) {
    const p = JSON.parse(str);
    state = { ...structuredClone(DEFAULT), ...p }; save();
  }
  function reset() { state = structuredClone(DEFAULT); save(); }

  return {
    get state() { return state; },
    save, periodIdFor, boundsFor, labelFor, monthsIn, todayISO,
    ensurePeriod, setInput, setNotes, deletePeriod, periods, periodIds,
    currentId, previousId, trailing,
    blankPerson, upsertPerson, deletePerson, people,
    addIntervention, updateIntervention, deleteIntervention,
    benchmark, setBenchmark, resetBenchmark, toggleFocus, setCompany,
    exportJSON, importJSON, reset,
  };
})();
