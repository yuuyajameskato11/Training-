/* ============================================================================
   engine.js — MEASURE → SCORE → FIND CONSTRAINT.

   Three things happen here:
     1. MEASURE  every derived metric for a period from the typed inputs
     2. SCORE    each metric 0–100 against its benchmark, roll up to V/A/L/U/E
     3. MODEL    the funnel end-to-end so a gap can be quoted in yen, not in
                 percentage points — that is what turns a dashboard into a
                 decision.
   ========================================================================== */

const Engine = (() => {

  /* How the loop feeds itself. Stated openly because every projection below
     depends on it, and an assumption you cannot see is a lie you cannot audit. */
  const LOOP = {
    referralElasticity: 1.0,   // referrals move 1:1 with the 90-day result rate
    networkElasticity:  0.5,   // Network conversion moves at half the rate
  };

  const clamp01 = x => Math.max(0, Math.min(1, x));
  const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;
  const median = a => { if (!a.length) return null; const s=[...a].sort((x,y)=>x-y), h=s.length>>1;
    return s.length % 2 ? s[h] : (s[h-1]+s[h])/2; };
  function pct(a, q) { if (!a.length) return null; const s=[...a].sort((x,y)=>x-y);
    return s[Math.min(s.length-1, Math.floor(q*(s.length-1)))]; }

  /* ---- 1. MEASURE -------------------------------------------------------- */
  function metricsFor(periodId) {
    const p = Store.state.periods[periodId];
    const inputs = p ? p.inputs : {};
    const ctx = { monthsInPeriod: Store.monthsIn(periodId), periodId };
    const m = {};
    Schema.METRICS.forEach(def => {
      let v = null;
      try { v = def.fn(inputs, m, ctx); } catch (e) { v = null; }
      m[def.id] = num(v);
    });
    return { inputs, metrics: m, ctx };
  }

  /* ---- 2. SCORE ---------------------------------------------------------- */
  function scoreOf(metricId, value) {
    if (value == null) return null;
    const b = Store.benchmark(metricId), d = Schema.metric(metricId);
    if (!d || b.target == null || b.floor == null) return null;
    const s = d.dir === 'down'
      ? (b.floor - value) / (b.floor - b.target)
      : (value - b.floor) / (b.target - b.floor);
    return Math.round(clamp01(s) * 100);
  }
  const band = s => s == null ? 'none' : s >= 75 ? 'green' : s >= 45 ? 'amber' : 'red';

  function assess(periodId) {
    const { inputs, metrics } = metricsFor(periodId);
    const scores = {};
    Schema.METRICS.forEach(d => scores[d.id] = scoreOf(d.id, metrics[d.id]));

    const pillars = Schema.PILLARS.map(pl => {
      const rows = Schema.metricsOf(pl.id)
        .map(d => ({ def:d, value:metrics[d.id], score:scores[d.id] }))
        .filter(r => r.score != null);
      const wSum = rows.reduce((a, r) => a + r.def.weight, 0);
      const score = wSum ? Math.round(rows.reduce((a, r) => a + r.score * r.def.weight, 0) / wSum) : null;
      return { ...pl, score, band: band(score), rows,
               coverage: rows.length / Schema.metricsOf(pl.id).length };
    });
    const scored = pillars.filter(p => p.score != null);
    const overall = scored.length ? Math.round(scored.reduce((a, p) => a + p.score, 0) / scored.length) : null;

    return { periodId, inputs, metrics, scores, pillars, overall,
             completeness: completeness(inputs) };
  }

  function completeness(inputs) {
    const filled = Schema.FIELDS.filter(f => inputs[f.id] != null).length;
    return { filled, total: Schema.FIELDS.length, pct: filled / Schema.FIELDS.length };
  }

  /* ---- 3. THE MODEL ------------------------------------------------------ *
     Every lever in one equation, so moving any one of them produces a yen
     number instead of an opinion.                                            */
  const LEVERS = [
    'leadRate','appRate','qualRate','bookRate','showRate','closeRate',
    'avgPrice','collectionRate','networkConv','retentionMonths',
    'expansionPerCust','successRate','referralRate',
  ];

  function baseline(periodId) {
    const { inputs, metrics } = metricsFor(periodId);
    // Fall back to the trailing average when a period is thin, so one blank
    // field cannot make the model claim the business earns nothing.
    const trail = Store.trailing(periodId, 4).map(p => metricsFor(p.id).metrics);
    const avg = id => { const v = trail.map(t => t[id]).filter(x => x != null);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    const pick = (id, dflt) => metrics[id] != null ? metrics[id] : (avg(id) != null ? avg(id) : dflt);

    return {
      views:           inputs.views || 0,
      studentsActive:  inputs.studentsActive || 0,
      networkFee:      inputs.networkFee || 0,
      leadRate:        pick('leadRate', 0.01),
      appRate:         pick('appRate', 0.2),
      qualRate:        pick('qualRate', 0.5),
      bookRate:        pick('bookRate', 0.5),
      showRate:        pick('showRate', 0.7),
      closeRate:       pick('closeRate', 0.2),
      avgPrice:        pick('avgPrice', 0),
      collectionRate:  pick('collectionRate', 1),
      refundRate:      pick('refundRate', 0),
      networkConv:     pick('networkConv', 0),
      retentionMonths: pick('retentionMonths', 0),
      expansionPerCust:pick('expansionPerCust', 0),
      successRate:     pick('successRate', 0),
      referralRate:    pick('referralRate', 0),
      leadsActual:     inputs.leads != null ? inputs.leads : null,
    };
  }

  function project(base, overrides) {
    const v = { ...base, ...(overrides || {}) };
    // The loop: results → proof → referrals → leads you did not pay for.
    const successRatio = base.successRate ? v.successRate / base.successRate : 1;
    const referralRate = v.referralRate * (1 + (successRatio - 1) * LOOP.referralElasticity);
    const networkConv  = v.networkConv  * (1 + (successRatio - 1) * LOOP.networkElasticity);

    const paidLeads     = v.views * v.leadRate;
    const referralLeads = v.studentsActive * referralRate;
    const leads         = paidLeads + referralLeads;
    const apps      = leads * v.appRate;
    const qualified = apps * v.qualRate;
    const booked    = qualified * v.bookRate;
    const attended  = booked * v.showRate;
    const customers = attended * v.closeRate;

    const frontCash = customers * v.avgPrice * v.collectionRate * (1 - v.refundRate);
    const recurring = customers * networkConv * v.networkFee * v.retentionMonths;
    const expansion = customers * v.expansionPerCust;

    return { leads, paidLeads, referralLeads, apps, qualified, booked, attended, customers,
             frontCash, recurring, expansion,
             value: frontCash + recurring + expansion,
             ltv: customers ? (frontCash + recurring + expansion) / customers : 0 };
  }

  /* What each lever is worth if it reaches its benchmark, everything else held. */
  function leverImpact(periodId) {
    const base = baseline(periodId);
    const now  = project(base);
    const out  = [];
    LEVERS.forEach(id => {
      const d = Schema.metric(id); if (!d) return;
      const b = Store.benchmark(id);
      const cur = base[id];
      if (cur == null || b.target == null) return;
      const better = d.dir === 'down' ? cur > b.target : cur < b.target;
      if (!better) return;                       // already at or past benchmark
      const at = project(base, { [id]: b.target });
      const gain = at.value - now.value;
      if (!(gain > 0)) return;
      out.push({ metricId:id, label:d.label, pillar:d.pillar, current:cur, target:b.target,
                 score:scoreOf(id, cur), gain, gainPct: now.value ? gain / now.value : null,
                 fmt:d.fmt, def:d.def });
    });
    out.sort((a, b) => b.gain - a.gain);
    return { base, now, levers: out };
  }

  /* ---- FIND CONSTRAINT --------------------------------------------------- */
  function constraint(periodId) {
    const a = assess(periodId);
    const { levers, now } = leverImpact(periodId);
    const weakPillar = a.pillars.filter(p => p.score != null).sort((x, y) => x.score - y.score)[0] || null;

    // Money first: the biggest gap that is also genuinely below par.
    const money = levers.find(l => l.score != null && l.score < 75) || levers[0] || null;

    // Fallback when the model has nothing to chew on: worst scored metric.
    let worst = null;
    Schema.METRICS.forEach(d => {
      const s = a.scores[d.id];
      if (s == null) return;
      if (!worst || s * d.weight < worst.score * worst.def.weight) worst = { def:d, score:s, value:a.metrics[d.id] };
    });

    const chosen = money
      ? { metricId:money.metricId, label:money.label, pillar:money.pillar, score:money.score,
          current:money.current, target:money.target, fmt:money.fmt, gain:money.gain, def:money.def }
      : worst
      ? { metricId:worst.def.id, label:worst.def.label, pillar:worst.def.pillar, score:worst.score,
          current:worst.value, target:Store.benchmark(worst.def.id).target, fmt:worst.def.fmt,
          gain:0, def:worst.def.def }
      : null;

    return { assessment:a, weakPillar, constraint:chosen, levers, projection:now };
  }

  /* ---- Benchmarks table -------------------------------------------------- */
  function benchmarkRow(metricId, periodId) {
    const d = Schema.metric(metricId), b = Store.benchmark(metricId);
    const cur = metricsFor(periodId).metrics[metricId];
    const prevId = Store.previousId(periodId);
    const prev = prevId ? metricsFor(prevId).metrics[metricId] : null;
    const hist = Store.periodIds().map(id => metricsFor(id).metrics[metricId]).filter(v => v != null);
    const trail = n => { const v = Store.trailing(periodId, n).map(p => metricsFor(p.id).metrics[metricId]).filter(x => x != null);
      return v.length ? v.reduce((a, x) => a + x, 0) / v.length : null; };
    const best = hist.length ? (d.dir === 'down' ? Math.min(...hist) : Math.max(...hist)) : null;
    const score = scoreOf(metricId, cur);
    const delta = (cur != null && prev != null && prev !== 0) ? (cur - prev) / Math.abs(prev) : null;
    return { def:d, current:cur, previous:prev, delta, target:b.target, floor:b.floor,
             best, avg3:trail(3), avg6:trail(6), score, band:band(score), history:hist };
  }

  /* ---- ALERTS ------------------------------------------------------------ */
  function alerts(periodId) {
    const a = assess(periodId), out = [];
    const push = (level, title, body, metricId) => out.push({ level, title, body, metricId });

    // Trend breaks — a fall matters more than a low absolute number.
    Schema.METRICS.forEach(d => {
      const r = benchmarkRow(d.id, periodId);
      if (r.current == null || r.previous == null || r.delta == null) return;
      const worse = d.dir === 'down' ? r.delta > 0 : r.delta < 0;
      const mag = Math.abs(r.delta);
      if (!worse || mag < 0.15) return;
      const line = `${Schema.fmt(r.previous, d.fmt)} → ${Schema.fmt(r.current, d.fmt)} (${(r.delta*100).toFixed(0)}%)`;
      if (mag >= 0.25 && r.score != null && r.score < 60) push('red', `${d.label} fell hard`, line, d.id);
      else if (mag >= 0.15) push('amber', `${d.label} is sliding`, line, d.id);
    });

    // Hard economic gates.
    const m = a.metrics;
    if (m.ltvCac != null && m.ltvCac < 3)
      push(m.ltvCac < 2 ? 'red' : 'amber', 'LTV:CAC below 3',
           `${Schema.fmt(m.ltvCac,'x')} — you are buying customers at a price the product does not repay.`, 'ltvCac');
    if (m.capacityUse != null && m.capacityUse > 1)
      push('red', 'Delivery is over capacity',
           `${Schema.fmt(m.capacityUse,'pct')} of leader capacity. Results fall before anyone reports it.`, 'capacityUse');
    if (m.collectionRate != null && m.collectionRate < 0.7) {
      const gap = (a.inputs.grossSigned || 0) - (a.inputs.cashCollected || 0);
      push('red', 'Signed revenue is not becoming cash',
           `${Schema.fmt(m.collectionRate,'pct')} collected — ${Schema.yen(gap)} signed but not banked.`, 'collectionRate');
    }
    if (m.day14Rate != null && m.day14Rate < 0.5)
      push('amber', 'Day-14 implementation is low',
           `${Schema.fmt(m.day14Rate,'pct')}. Students who have not acted by day 14 rarely produce a day-90 result.`, 'day14Rate');
    if (m.opProfit != null && m.opProfit < 0)
      push('red', 'Operating loss', `${Schema.yen(m.opProfit)} this period.`, 'opProfit');
    if (m.lineBlockRate != null && m.lineBlockRate > 0.05)
      push('amber', 'LINE block rate climbing', `${Schema.fmt(m.lineBlockRate,'pct')} of reachable friends left.`, 'lineBlockRate');
    if (m.proofRate != null && m.proofRate < 0.3 && m.successRate != null && m.successRate > 0.2)
      push('amber', 'Results are not becoming proof',
           `${Schema.fmt(m.proofRate,'pct')} of verified results have a case study. Unshown proof sells nothing.`, 'proofRate');

    // Data quality — the weakness that makes every other number arguable.
    if (a.completeness.pct < 0.8)
      push('info', 'The record is incomplete',
           `${a.completeness.filled}/${a.completeness.total} fields entered. Missing lead-source and funnel fields make the rates below unreliable.`, null);

    const rank = { red:0, amber:1, info:2 };
    return out.sort((x, y) => rank[x.level] - rank[y.level]);
  }

  /* ---- PEOPLE ANALYTICS -------------------------------------------------- */
  const OUTCOME_ORDER = ['none','implemented','firstClient','result100k','result300k','result1m'];
  const OUTCOME_LABEL = { none:'No result', implemented:'Implemented', firstClient:'First client',
                          result100k:'¥100K+', result300k:'¥300K+', result1m:'¥1M+' };

  const ltvOf = p => (p.collected || 0) - (p.refunded || 0)
    + (p.networkMonths || 0) * (p.networkFee || 0) + (p.expansion || 0);

  const days = (a, b) => (a && b) ? Math.round((new Date(b) - new Date(a)) / 86400000) : null;

  function groupBy(list, keyFn) {
    const g = {};
    list.forEach(p => { const k = keyFn(p) || '—'; (g[k] = g[k] || []).push(p); });
    return g;
  }
  function segmentTable(keyFn) {
    const customers = Store.people().filter(p => p.datePurchase);
    const g = groupBy(customers, keyFn);
    return Object.keys(g).map(k => {
      const rows = g[k], ltvs = rows.map(ltvOf);
      const succ = rows.filter(p => OUTCOME_ORDER.indexOf(p.outcome) >= 2).length;
      return { key:k, n:rows.length,
               ltvAvg: ltvs.reduce((a, b) => a + b, 0) / rows.length,
               ltvMedian: median(ltvs),
               successRate: succ / rows.length,
               networkRate: rows.filter(p => p.network === 'joined').length / rows.length,
               refundRate: rows.reduce((a, p) => a + (p.refunded || 0), 0) /
                           Math.max(1, rows.reduce((a, p) => a + (p.collected || 0), 0)),
               revenue: rows.reduce((a, p) => a + (p.collected || 0), 0) };
    }).sort((a, b) => b.ltvMedian - a.ltvMedian);
  }

  /* Does the thesis hold — do customers who get results pay more over time? */
  function ltvByResult() {
    const customers = Store.people().filter(p => p.datePurchase);
    return OUTCOME_ORDER.map(o => {
      const rows = customers.filter(p => p.outcome === o);
      if (!rows.length) return { key:OUTCOME_LABEL[o], outcome:o, n:0 };
      const ltvs = rows.map(ltvOf);
      return { key:OUTCOME_LABEL[o], outcome:o, n:rows.length,
               ltvMedian: median(ltvs),
               ltvAvg: ltvs.reduce((a, b) => a + b, 0) / rows.length,
               networkRate: rows.filter(p => p.network === 'joined').length / rows.length,
               referrals: rows.reduce((a, p) => a + (p.referrals || 0), 0) / rows.length };
    });
  }

  function timeToResult() {
    const c = Store.people().filter(p => p.datePurchase);
    const set = f => c.map(f).filter(v => v != null && v >= 0);
    const stat = a => a.length ? { n:a.length, p25:pct(a,.25), median:median(a), p75:pct(a,.75), best:Math.min(...a) } : null;
    return {
      firstClient: stat(set(p => days(p.datePurchase, p.dateFirstClient))),
      firstResult: stat(set(p => days(p.datePurchase, p.dateFirstResult))),
      leadToSale:  stat(set(p => days(p.dateLead, p.datePurchase))),
    };
  }

  /* Section 50/51 — intervene on day 14, not day 90. */
  function riskScore(p, todayISO) {
    const today = todayISO || Store.todayISO();
    const flags = [];
    const since = days(p.datePurchase, today);
    if (p.datePurchase) {
      if (since > 14 && p.outcome === 'none') flags.push('No implementation past day 14');
      if (since > 90 && OUTCOME_ORDER.indexOf(p.outcome) < 2) flags.push('Past day 90 with no economic result');
      if ((p.collected || 0) < (p.price || 0) * 0.5 && since > 60) flags.push('Payments behind');
    }
    if (p.network === 'joined') {
      if ((p.referrals || 0) === 0 && (p.networkMonths || 0) >= 3) flags.push('3+ months in Network, zero referrals');
      if (OUTCOME_ORDER.indexOf(p.outcome) < 2) flags.push('Paying monthly without a result — churn risk');
    }
    if (p.status === 'active' && !p.leader) flags.push('No leader assigned');
    (p.riskFlags || []).forEach(f => flags.push(f));
    const score = Math.min(100, flags.length * 25);
    return { flags, score, band: score >= 75 ? 'red' : score >= 40 ? 'amber' : 'green' };
  }
  function atRisk() {
    return Store.people()
      .map(p => ({ person:p, risk:riskScore(p) }))
      .filter(r => r.risk.flags.length)
      .sort((a, b) => b.risk.score - a.risk.score);
  }

  return { LOOP, LEVERS, OUTCOME_ORDER, OUTCOME_LABEL,
           metricsFor, scoreOf, band, assess, completeness,
           baseline, project, leverImpact, constraint, benchmarkRow, alerts,
           ltvOf, segmentTable, ltvByResult, timeToResult, riskScore, atRisk,
           median, pct };
})();
