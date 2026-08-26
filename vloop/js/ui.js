/* ============================================================================
   ui.js — five screens plus the data layer underneath them.

   Screen 1 COMPANY    the 12 numbers, the loop, the constraint
   Screen 2 ACQUIRE    attention → lead → meeting → sale → cash
   Screen 3 SUCCESS    activation → implementation → result → proof
   Screen 4 RETAIN     Network, churn, expansion, LTV by segment
   Screen 5 DIAGNOSE   what to fix next, in yen, with a prescription
   Screen 6 DATA       the manual layer: type the period in, keep the record
   ========================================================================== */

const UI = (() => {
  const $  = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const view = () => $('#view');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  let periodId = null;
  const pid = () => periodId || (periodId = Store.currentId());
  function setPeriod(id) { periodId = id; }

  /* ---- small components -------------------------------------------------- */
  const F = Schema.fmt, Y = Schema.yen;

  function ring(score, label) {
    const r = 74, c = 2 * Math.PI * r, s = score == null ? 0 : score;
    const col = s >= 75 ? 'var(--green)' : s >= 45 ? 'var(--amber)' : 'var(--red)';
    return `<div class="ring-wrap"><div class="ring">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="${r}" stroke="var(--card2)" stroke-width="12" fill="none"/>
        <circle cx="90" cy="90" r="${r}" stroke="${col}" stroke-width="12" fill="none"
          stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - s / 100)}"/>
      </svg>
      <div class="score"><div class="num">${score == null ? '—' : score}</div>
        <div class="lbl">${esc(label)}</div></div>
    </div></div>`;
  }

  function pillarBars(pillars, opts) {
    return `<div class="pillars">` + pillars.map(p => {
      const s = p.score == null ? 0 : p.score;
      return `<div class="pillar ${opts && opts.click ? 'clickable' : ''}" data-pillar="${p.id}">
        <div class="pl-head"><b style="color:${p.color}">${p.id}</b>
          <span>${esc(p.name)}</span><em>${p.score == null ? '—' : p.score}</em></div>
        <div class="bar"><i style="width:${s}%;background:${p.color}"></i></div>
        <div class="pl-q">${esc(p.q)}</div>
      </div>`;
    }).join('') + `</div>`;
  }

  function kpi(label, value, sub, tone) {
    return `<div class="kpi ${tone || ''}"><div class="k-lbl">${esc(label)}</div>
      <div class="k-val">${value}</div>${sub ? `<div class="k-sub">${sub}</div>` : ''}</div>`;
  }

  function deltaChip(delta, dir) {
    if (delta == null || !isFinite(delta)) return '';
    const good = dir === 'down' ? delta < 0 : delta > 0;
    const cls = Math.abs(delta) < 0.02 ? 'flat' : good ? 'up' : 'down';
    const arrow = delta > 0 ? '▲' : '▼';
    return `<span class="chip ${cls}">${arrow} ${Math.abs(delta * 100).toFixed(0)}%</span>`;
  }

  function metricRow(metricId, id) {
    const r = Engine.benchmarkRow(metricId, id || pid());
    const d = r.def;
    return `<div class="mrow" data-metric="${d.id}">
      <div class="m-main">
        <div class="m-lbl">${esc(d.label)}</div>
        <div class="m-sub">target ${F(r.target, d.fmt)}${r.previous != null ? ' · prev ' + F(r.previous, d.fmt) : ''}</div>
      </div>
      <div class="m-val">
        <div class="v ${r.band}">${F(r.current, d.fmt)}</div>
        <div class="m-sub">${deltaChip(r.delta, d.dir)}</div>
      </div>
      <div class="m-score ${r.band}">${r.score == null ? '—' : r.score}</div>
    </div>`;
  }

  function metricList(ids, id) {
    return `<div class="mlist">${ids.map(m => metricRow(m, id)).join('')}</div>`;
  }

  function table(cols, rows) {
    return `<div class="tblwrap"><table class="tbl">
      <thead><tr>${cols.map(c => `<th${c.num ? ' class="num"' : ''}>${esc(c.h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map((c, i) =>
        `<td${cols[i] && cols[i].num ? ' class="num"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
  }

  function periodBar() {
    const ids = Store.periodIds();
    const cur = pid();
    if (!ids.length) return '';
    return `<div class="periodbar">
      <button class="pbtn" data-act="prevP">‹</button>
      <select id="periodSel">${ids.map(i =>
        `<option value="${i}"${i === cur ? ' selected' : ''}>${esc(Store.labelFor(i))}</option>`).join('')}</select>
      <button class="pbtn" data-act="nextP">›</button>
    </div>`;
  }

  function empty(msg, cta) {
    return `<div class="card empty"><p>${msg}</p>${cta || ''}</div>`;
  }

  function noData() {
    return empty(
      `Nothing measured yet. The system scores nothing until a period exists — that is the point.`,
      `<div class="row"><button class="btn" data-act="newPeriod">Start a period</button>
       <button class="btn ghost" data-act="demo">Load demo data</button></div>`);
  }

  /* ---- SCREEN 1 — COMPANY ------------------------------------------------ */
  function renderCompany() {
    if (!Store.periodIds().length) return paint(noData());
    const id = pid();
    const c = Engine.constraint(id);
    const a = c.assessment;
    const al = Engine.alerts(id);
    const focus = Store.state.focus;

    const ceo = Schema.CEO.map(row => {
      if (row.raw) {
        const f = Schema.field(row.id);
        const v = a.inputs[row.id];
        const prevId = Store.previousId(id);
        const pv = prevId ? (Store.state.periods[prevId].inputs[row.id]) : null;
        const dl = (v != null && pv) ? (v - pv) / Math.abs(pv) : null;
        return kpi(row.label, Schema.fmtField(v, f.unit), deltaChip(dl, 'up'));
      }
      const r = Engine.benchmarkRow(row.id, id);
      return kpi(row.label, `<span class="${r.band}">${F(r.current, r.def.fmt)}</span>`,
                 deltaChip(r.delta, r.def.dir));
    }).join('');

    const cons = c.constraint ? `
      <div class="constraint">
        <div class="c-tag">CURRENT CONSTRAINT</div>
        <div class="c-name">${esc(c.constraint.label)}</div>
        <div class="c-line">${F(c.constraint.current, c.constraint.fmt)}
          <span class="arrow">→</span> ${F(c.constraint.target, c.constraint.fmt)} target</div>
        ${c.constraint.gain > 0 ? `<div class="c-money">Closing it is worth <b>${Y(c.constraint.gain)}</b> of value per ${id.includes('W') ? 'week' : 'month'}</div>` : ''}
        <button class="btn" data-act="go" data-tab="diagnose">Open diagnosis</button>
      </div>` : '';

    paint(`
      ${periodBar()}
      <div class="card tight">
        ${ring(a.overall, 'VALUE LOOP')}
        <div class="loopline">MEASURE → SCORE → FIND CONSTRAINT → PRESCRIBE → TRACK → REPEAT</div>
        ${pillarBars(a.pillars, { click:true })}
      </div>
      ${cons}
      <div class="section-title">The numbers that matter now</div>
      <div class="kpis">${ceo}</div>
      ${focus.length ? `<div class="section-title">Pinned</div>${metricList(focus, id)}` : ''}
      <div class="section-title">Alerts</div>
      ${al.length ? `<div class="alerts">${al.slice(0, 8).map(x => `
        <div class="alert ${x.level}"><div class="a-t">${esc(x.title)}</div>
        <div class="a-b">${esc(x.body)}</div></div>`).join('')}</div>`
        : `<div class="card tight muted">Nothing screaming. Check the diagnosis screen anyway — quiet is not the same as optimal.</div>`}
      <div class="card tight">
        <h3>Record completeness</h3>
        <div class="bar"><i style="width:${Math.round(a.completeness.pct * 100)}%;background:var(--accent)"></i></div>
        <p class="sub">${a.completeness.filled} of ${a.completeness.total} fields entered for ${esc(Store.labelFor(id))}.
        Every blank field is a rate the system has to guess at.</p>
        <button class="btn ghost" data-act="go" data-tab="data">Fill the period in</button>
      </div>
    `);
  }

  /* ---- funnel drawing ---------------------------------------------------- */
  function funnel(stages) {
    const top = stages[0].value || 1;
    return `<div class="funnel">` + stages.map((s, i) => {
      const prev = i ? stages[i - 1].value : null;
      const conv = (prev && s.value != null) ? s.value / prev : null;
      const w = Math.max(14, Math.round(((s.value || 0) / top) ** 0.42 * 100));
      return `${i ? `<div class="f-conv">${conv == null ? '—' : (conv * 100).toFixed(conv < 0.1 ? 1 : 0) + '%'}
        <span>${esc(s.convLabel || '')}</span></div>` : ''}
        <div class="f-stage"><div class="f-bar" style="width:${w}%"></div>
          <div class="f-txt"><b>${esc(s.label)}</b><em>${s.value == null ? '—' : Math.round(s.value).toLocaleString()}</em></div>
        </div>`;
    }).join('') + `</div>`;
  }

  /* ---- SCREEN 2 — ACQUIRE ------------------------------------------------ */
  function renderAcquire() {
    if (!Store.periodIds().length) return paint(noData());
    const id = pid(), a = Engine.assess(id), p = a.inputs;

    const src = Engine.segmentTable(x => x.source).filter(r => r.key !== '—');
    const srcTable = src.length ? table(
      [{ h:'Source' }, { h:'Cust', num:true }, { h:'Revenue', num:true },
       { h:'Median LTV', num:true }, { h:'90-day result', num:true }],
      src.map(r => [esc(r.key), r.n, Y(r.revenue), Y(r.ltvMedian), F(r.successRate, 'pct')]))
      : empty('No customer records with a source yet. Until every customer carries a first-touch source, every number on this screen is an estimate.');

    paint(`
      ${periodBar()}
      <div class="card tight">
        <h3>Attention → cash</h3>
        <p class="sub">${esc(Store.labelFor(id))}. Each gap is a place money leaks.</p>
        ${funnel([
          { label:'Views', value:p.views },
          { label:'Leads', value:p.leads, convLabel:'lead rate' },
          { label:'Applications', value:p.applications, convLabel:'apply' },
          { label:'Qualified', value:p.applicationsQual, convLabel:'qualify' },
          { label:'Booked', value:p.meetingsBooked, convLabel:'book' },
          { label:'Attended', value:p.meetingsAttended, convLabel:'show' },
          { label:'Customers', value:p.sales, convLabel:'close' },
        ])}
        <div class="kpis two">
          ${kpi('Contract value signed', Schema.fmtField(p.grossSigned, '¥'))}
          ${kpi('Cash collected', Schema.fmtField(p.cashCollected, '¥'),
                a.metrics.collectionRate != null ? F(a.metrics.collectionRate, 'pct') + ' of signed' : '')}
        </div>
      </div>

      <div class="section-title">V · Visibility</div>
      ${metricList(['leadRate','ctaClickRate','profileVisitRate','revPerMilleViews','lineBlockRate','lineNetGrowth','revPerLineRecipient'], id)}

      <div class="section-title">A · Acquisition</div>
      ${metricList(['appRate','qualRate','bookRate','showRate','closeRate','avgPrice','collectionRate','refundRate','revPerLead','revPerMeeting'], id)}

      <div class="section-title">Attribution — revenue and LTV by source</div>
      ${srcTable}
      <div class="card tight muted small">
        Cheap leads are not the same as good customers. Judge a source by median LTV and
        90-day result rate, never by cost per lead.
      </div>
    `);
  }

  /* ---- SCREEN 3 — SUCCESS ------------------------------------------------ */
  function renderSuccess() {
    if (!Store.periodIds().length) return paint(noData());
    const id = pid(), a = Engine.assess(id), p = a.inputs;

    const byResult = Engine.ltvByResult().filter(r => r.n);
    const thesis = byResult.length >= 2 ? table(
      [{ h:'Result level' }, { h:'n', num:true }, { h:'Median LTV', num:true },
       { h:'Network', num:true }, { h:'Referrals', num:true }],
      byResult.map(r => [esc(r.key), r.n, Y(r.ltvMedian), F(r.networkRate, 'pct'), r.referrals.toFixed(2)]))
      : empty('Not enough customer records yet to test whether results drive lifetime value.');

    const t = Engine.timeToResult();
    const ttr = (label, s) => s ? kpi(label, s.median + ' d',
      `p25 ${s.p25} · p75 ${s.p75} · best ${s.best} (n=${s.n})`) : kpi(label, '—', 'no dated records');

    const fails = {};
    Store.people().forEach(x => { if (x.failReason) fails[x.failReason] = (fails[x.failReason] || 0) + 1; });
    const failRows = Object.entries(fails).sort((x, y) => y[1] - x[1]);
    const failTotal = failRows.reduce((s, r) => s + r[1], 0);

    const risk = Engine.atRisk().slice(0, 12);

    paint(`
      ${periodBar()}
      <div class="card tight">
        <h3>Customer → result</h3>
        <p class="sub">Activity is not outcome. This is the outcome. Each block is its own
        population observed in ${esc(Store.labelFor(id))} — they are not one cohort walking
        down a single funnel, and pretending otherwise is how success rates get inflated.</p>

        <div class="fgroup">Activation — this period's new customers</div>
        ${funnel([
          { label:'New customers', value:p.sales },
          { label:'Onboarding completed', value:p.onboarded, convLabel:'activate' },
        ])}

        <div class="fgroup">Day 14 — students who reached it this period</div>
        ${funnel([
          { label:'Reached day 14', value:p.reachedDay14 },
          { label:'Implemented something real', value:p.implementedBy14, convLabel:'act' },
        ])}

        <div class="fgroup">Day 90 — students who reached it this period</div>
        ${funnel([
          { label:'Reached day 90', value:p.reached90 },
          { label:'Verified economic result', value:p.verified90, convLabel:'succeed' },
          { label:'Case study written', value:p.caseStudies, convLabel:'provable' },
        ])}

        <div class="kpis two">
          ${kpi('First paid clients won', Schema.fmtField(p.firstClients, '#'), 'this period, any cohort')}
          ${kpi('Median member income gain', Schema.fmtField(p.medianIncomeGain, '¥'), 'median, not average')}
        </div>
        <div class="kpis two">
          ${kpi('Verified member earnings', Schema.fmtField(p.memberValueCreated, '¥'), 'value created for members and their clients')}
          ${kpi('Drop-outs', Schema.fmtField(p.dropouts, '#'), 'every one has a reason worth tagging')}
        </div>
      </div>

      <div class="section-title">U · User outcome</div>
      ${metricList(['activationRate','day14Rate','successRate','firstClientRate','proofRate','dropoutRate','referralRate','referralShare','valuePerMember'], id)}

      <div class="section-title">Time to result</div>
      <div class="kpis two">${ttr('Days → first client', t.firstClient)}${ttr('Days → first verified result', t.firstResult)}</div>

      <div class="section-title">Does the result drive the money?</div>
      ${thesis}
      <div class="card tight muted small">
        If median LTV does not rise with result level, the thesis that outcomes drive
        retention is wrong and the growth plan has to change. This table is here to be
        able to say so.
      </div>

      <div class="section-title">Why students fail</div>
      ${failRows.length ? `<div class="card tight">${failRows.map(([k, n]) => `
        <div class="fbar"><div class="f-l">${esc(k)}</div>
          <div class="bar"><i style="width:${Math.round(n / failTotal * 100)}%;background:var(--red)"></i></div>
          <div class="f-n">${n} · ${Math.round(n / failTotal * 100)}%</div></div>`).join('')}
        <p class="sub">The largest bar is the next product change.</p></div>`
        : empty('No failure reasons tagged yet. This becomes more valuable than the success data.')}

      <div class="section-title">At risk now — intervene on day 14, not day 90</div>
      ${risk.length ? `<div class="card tight risklist">${risk.map(r => `
        <div class="rrow"><div><b>${esc(r.person.name || r.person.id)}</b>
          <div class="sub">${r.risk.flags.map(esc).join(' · ')}</div></div>
          <div class="m-score ${r.risk.band}">${r.risk.score}</div></div>`).join('')}</div>`
        : empty('No risk flags — or no people in the record yet.')}
    `);
  }

  /* ---- SCREEN 4 — RETAIN ------------------------------------------------- */
  let segKey = 'cohort';
  function renderRetain() {
    if (!Store.periodIds().length) return paint(noData());
    const id = pid(), a = Engine.assess(id), p = a.inputs;
    const end = (p.networkStart || 0) + (p.networkJoined || 0) - (p.networkChurned || 0);

    const keyFn = { cohort:x => x.cohort, source:x => x.source,
                    salesperson:x => x.salesperson, leader:x => x.leader }[segKey];
    const seg = Engine.segmentTable(keyFn).filter(r => r.key !== '—');
    const segTable = seg.length ? table(
      [{ h:segKey[0].toUpperCase() + segKey.slice(1) }, { h:'n', num:true }, { h:'Median LTV', num:true },
       { h:'Result rate', num:true }, { h:'Network', num:true }, { h:'Refunds', num:true }],
      seg.map(r => [esc(r.key), r.n, Y(r.ltvMedian), F(r.successRate, 'pct'),
                    F(r.networkRate, 'pct'), F(r.refundRate, 'pct')]))
      : empty('No customer records for this segment yet.');

    paint(`
      ${periodBar()}
      <div class="card tight">
        <h3>Network</h3>
        <div class="netflow">
          <div><em>${p.networkStart || 0}</em><span>start</span></div>
          <div class="plus">+<em>${p.networkJoined || 0}</em><span>joined</span></div>
          <div class="minus">−<em>${p.networkChurned || 0}</em><span>churned</span></div>
          <div class="eq">=<em>${end}</em><span>end</span></div>
        </div>
        <div class="kpis two">
          ${kpi('Recurring revenue', F(a.metrics.recurringRev, 'yen'), 'members × fee')}
          ${kpi('Expected months retained', F(a.metrics.retentionMonths, 'mo'), '1 ÷ monthly churn')}
        </div>
      </div>

      <div class="section-title">L · Lifetime value</div>
      ${metricList(['networkConv','inviteAccept','monthlyChurn','retentionMonths','recurringRev','expansionPerCust','nrr','ltv'], id)}

      <div class="section-title">LTV by segment</div>
      <div class="segtabs">${['cohort','source','salesperson','leader'].map(k =>
        `<button class="segtab ${k === segKey ? 'on' : ''}" data-act="seg" data-seg="${k}">${k}</button>`).join('')}</div>
      ${segTable}
      <div class="card tight muted small">
        Cohorts are the only honest way to see whether a product change worked. Monthly
        totals mix a good February into a bad July and tell you nothing.
      </div>
    `);
  }

  /* ---- SCREEN 5 — DIAGNOSE ----------------------------------------------- */
  let openLever = null;
  function renderDiagnose() {
    if (!Store.periodIds().length) return paint(noData());
    const id = pid();
    const c = Engine.constraint(id);
    const per = id.includes('W') ? 'week' : 'month';
    const top = c.levers[0];

    const verdict = c.constraint ? `
      <div class="verdict">
        <div class="v-tag">DIAGNOSIS · ${esc(Store.labelFor(id))}</div>
        <div class="v-h">Your current bottleneck is
          <b style="color:${Schema.pillar(c.constraint.pillar).color}">${esc(Schema.pillar(c.constraint.pillar).name)}</b>.</div>
        <div class="v-p">Specifically: <b>${esc(c.constraint.label)}</b> at
          ${F(c.constraint.current, c.constraint.fmt)} against a target of
          ${F(c.constraint.target, c.constraint.fmt)}.</div>
        ${top && top.gain > 0 ? `<div class="v-money">Moving it to target is modelled at
          <b>${Y(top.gain)}</b> more value per ${per} — the largest single opportunity on the board.</div>` : ''}
        <div class="v-def">${esc(c.constraint.def || '')}</div>
      </div>` : '';

    const maxGain = c.levers.length ? c.levers[0].gain : 1;
    const levers = c.levers.length ? c.levers.map(l => {
      const pl = Schema.pillar(l.pillar);
      const open = openLever === l.metricId;
      const rx = Rx.forMetric(l.metricId);
      return `<div class="lever ${open ? 'open' : ''}" data-lever="${l.metricId}">
        <div class="lv-head" data-act="toggleLever" data-metric="${l.metricId}">
          <div class="lv-name"><span class="dot" style="background:${pl.color}"></span>${esc(l.label)}</div>
          <div class="lv-money">${Y(l.gain)}</div>
        </div>
        <div class="bar"><i style="width:${Math.round(l.gain / maxGain * 100)}%;background:${pl.color}"></i></div>
        <div class="lv-sub">${F(l.current, l.fmt)} <span class="arrow">→</span> ${F(l.target, l.fmt)}
          · score ${l.score == null ? '—' : l.score}/100</div>
        ${open ? `<div class="lv-body">
          <p class="def">${esc(l.def || '')}</p>
          <div class="rx-title">Prescriptions</div>
          ${rx.map((r, i) => `<div class="rx">
            <div class="rx-a">${esc(r.a)}</div>
            <div class="rx-w">${esc(r.w)}</div>
            <div class="rx-meta"><span>${esc(r.o)}</span><span>${esc(r.h)}</span>
              <button class="btn tiny" data-act="startRx" data-metric="${l.metricId}" data-i="${i}">Start &amp; track</button></div>
          </div>`).join('')}
        </div>` : ''}
      </div>`;
    }).join('') : empty('Every modelled lever is already at or above benchmark for this period. Either raise the targets or go find a new constraint — the loop never ends.');

    const runs = Store.state.interventions.slice().reverse();
    const ledger = runs.length ? runs.map(x => {
      const d = Schema.metric(x.metricId);
      const rv = Rx.review(x, id);
      const cls = x.status === 'closed' ? x.verdict : 'running';
      return `<div class="ivn ${cls}">
        <div class="iv-top"><b>${esc(d ? d.label : x.metricId)}</b>
          <span class="pill ${cls}">${x.status === 'closed' ? Rx.VERDICT_LABEL[x.verdict] : 'running'}</span></div>
        <div class="iv-a">${esc(x.action)}</div>
        <div class="iv-m">started ${esc(x.created)} · baseline ${F(x.baseline, d ? d.fmt : 'num')}
          → now ${F(rv.now, d ? d.fmt : 'num')}${x.valueAtStake ? ' · at stake ' + Y(x.valueAtStake) : ''}</div>
        ${x.status !== 'closed' ? `<div class="row">
          <button class="btn tiny" data-act="closeRx" data-id="${x.id}">Review &amp; close</button>
          <button class="btn tiny ghost" data-act="dropRx" data-id="${x.id}">Delete</button></div>` : ''}
      </div>`;
    }).join('') : empty('Nothing being tracked. A prescription nobody wrote down was never really made.');

    const comp = c.assessment.completeness;
    const thin = comp.pct < 0.7 ? `<div class="alert info">
      <div class="a-t">Provisional — the record is ${Math.round(comp.pct * 100)}% complete</div>
      <div class="a-b">${comp.filled} of ${comp.total} fields entered. Where a rate is missing the
      model falls back to your trailing average, then to a generic default, so this ranking is a
      starting point rather than a finding. Fill the period in and read it again.</div></div>` : '';

    paint(`
      ${periodBar()}
      ${verdict}
      ${thin}
      <div class="section-title">Where the money is — ranked</div>
      <div class="card tight">${levers}</div>
      <div class="card tight muted small">
        <b>How this is calculated.</b> Every lever is put through one funnel equation:
        views → leads (+ referrals) → applications → qualified → booked → attended →
        customers → cash + recurring + expansion. One lever is moved to its benchmark,
        everything else held still, and the difference in value is what you see.
        Referrals scale with the 90-day result rate (×${Engine.LOOP.referralElasticity.toFixed(1)}) and
        Network conversion at half that rate (×${Engine.LOOP.networkElasticity.toFixed(1)}) —
        that coupling is an assumption, and the LTV-by-result table on the Success screen
        is where you find out whether it is true for you.
      </div>
      <div class="section-title">Tracked interventions</div>
      ${ledger}
    `);
  }

  /* ---- SCREEN 6 — DATA --------------------------------------------------- */
  let dataTab = 'period';
  function renderData() {
    const id = pid();
    const tabs = ['period','people','benchmarks','system'].map(t =>
      `<button class="segtab ${t === dataTab ? 'on' : ''}" data-act="dataTab" data-t="${t}">${t}</button>`).join('');
    let body = '';
    if (dataTab === 'period')      body = dataPeriod(id);
    else if (dataTab === 'people') body = dataPeople();
    else if (dataTab === 'benchmarks') body = dataBenchmarks(id);
    else body = dataSystem();
    paint(`<div class="segtabs wide">${tabs}</div>${body}`);
  }

  function dataPeriod(id) {
    if (!Store.periodIds().length) return noData();
    const p = Store.ensurePeriod(id);
    const groups = Schema.PILLARS.map(pl => {
      const gs = Schema.fieldGroups(pl.id);
      return `<div class="section-title" style="color:${pl.color}">${pl.id} · ${esc(pl.name)}</div>` +
        gs.map(g => `<div class="card tight">
          <h3>${esc(g.name)}</h3>
          ${g.fields.map(f => `<label class="fld">
            <span class="f-l">${esc(f.label)}<em>${f.unit}</em></span>
            <input type="number" step="any" inputmode="decimal" data-field="${f.id}"
              value="${p.inputs[f.id] != null ? p.inputs[f.id] : ''}" placeholder="—" />
            ${f.help ? `<span class="f-h">${esc(f.help)}</span>` : ''}
          </label>`).join('')}
        </div>`).join('');
    }).join('');

    const comp = Engine.completeness(p.inputs);
    return `${periodBar()}
      <div class="card tight">
        <h3>${esc(Store.labelFor(id))}</h3>
        <p class="sub">${esc(p.startISO)} → ${esc(p.endISO)} · ${comp.filled}/${comp.total} fields</p>
        <div class="row"><button class="btn" data-act="newPeriod">New period</button>
          <button class="btn ghost" data-act="delPeriod">Delete this period</button></div>
      </div>
      ${groups}
      <div class="card tight"><h3>Notes</h3>
        <textarea id="periodNotes" rows="4" placeholder="What changed this period? Campaigns, hires, price changes, anything that will explain a number later.">${esc(p.notes)}</textarea>
      </div>`;
  }

  function dataPeople() {
    const ppl = Store.people();
    const rows = ppl.slice().sort((a, b) => (b.datePurchase || '').localeCompare(a.datePurchase || ''));
    return `<div class="card tight">
        <h3>Customer master record</h3>
        <p class="sub">${ppl.length} records. This is the spine: one row per human, every date, every source, every outcome.</p>
        <button class="btn" data-act="newPerson">Add person</button>
      </div>
      ${rows.length ? `<div class="card tight plist">${rows.map(p => `
        <div class="prow" data-act="editPerson" data-id="${p.id}">
          <div><b>${esc(p.name || p.id)}</b>
            <div class="sub">${esc(p.source || 'no source')} · ${esc(p.cohort || 'no cohort')} ·
              ${esc(Engine.OUTCOME_LABEL[p.outcome] || p.outcome)}${p.network === 'joined' ? ' · Network' : ''}</div></div>
          <div class="p-ltv">${Y(Engine.ltvOf(p))}</div>
        </div>`).join('')}</div>` : empty('No people yet. Add one, or load the demo data to see the shape.')}`;
  }

  function dataBenchmarks(id) {
    return `<div class="card tight">
        <h3>Benchmarks</h3>
        <p class="sub">Target = healthy. Floor = this is the constraint. Everything on every
        screen is scored between these two numbers, so they are the most opinionated thing
        in the system. Change them as you learn what is actually achievable here.</p>
      </div>` +
      Schema.PILLARS.map(pl => `<div class="section-title" style="color:${pl.color}">${pl.id} · ${esc(pl.name)}</div>
        <div class="card tight">${Schema.metricsOf(pl.id).map(d => {
          const b = Store.benchmark(d.id);
          const pctish = d.fmt === 'pct';
          const val = v => v == null ? '' : (pctish ? +(v * 100).toFixed(2) : v);
          return `<div class="bmrow">
            <div class="bm-l">${esc(d.label)}<span class="f-h">${esc(d.def)}</span></div>
            <div class="bm-in">
              <label>target<input type="number" step="any" data-bm="${d.id}" data-k="target" value="${val(b.target)}"></label>
              <label>floor<input type="number" step="any" data-bm="${d.id}" data-k="floor" value="${val(b.floor)}"></label>
              <span class="unit">${pctish ? '%' : d.fmt === 'yen' ? '¥' : d.fmt === 'x' ? '×' : d.fmt === 'mo' ? 'mo' : ''}</span>
            </div></div>`;
        }).join('')}</div>`).join('');
  }

  function dataSystem() {
    const st = { live:'live', partial:'partial', planned:'planned' };
    const counts = { live:0, partial:0, planned:0 };
    Schema.DOMAINS.forEach(d => counts[d.status]++);
    return `<div class="card tight">
        <h3>Backup</h3>
        <p class="sub">Everything is stored on this device only. Export before you clear your browser.</p>
        <div class="row">
          <button class="btn" data-act="exportJSON">Export JSON</button>
          <button class="btn ghost" data-act="exportCSV">Periods CSV</button>
          <button class="btn ghost" data-act="exportPeopleCSV">People CSV</button>
        </div>
        <div class="row"><button class="btn ghost" data-act="importJSON">Import JSON</button></div>
      </div>
      <div class="card tight">
        <h3>Company</h3>
        <label class="fld"><span class="f-l">Name</span>
          <input type="text" data-co="name" value="${esc(Store.state.company.name)}"></label>
        <label class="fld"><span class="f-l">Cadence</span>
          <select data-co="cadence">
            <option value="month"${Store.state.company.cadence === 'month' ? ' selected' : ''}>Monthly</option>
            <option value="week"${Store.state.company.cadence === 'week' ? ' selected' : ''}>Weekly</option>
          </select></label>
        <p class="sub">Weekly forces the habit; monthly is enough for outcome metrics. Churn is
        normalised to a month either way.</p>
      </div>
      <div class="card tight">
        <h3>Demo data</h3>
        <p class="sub">Synthetic, invented numbers — not anyone's real business. Loading it replaces everything on this device.</p>
        <div class="row"><button class="btn ghost" data-act="demo">Load demo</button>
          <button class="btn ghost" data-act="wipe">Erase everything</button></div>
      </div>
      <div class="card tight">
        <h3>The record it is designed to hold</h3>
        <p class="sub">${counts.live} domains live · ${counts.partial} partly captured · ${counts.planned} designed but not yet collected.
        Collect everything in the back end; show the CEO only what currently matters.</p>
      </div>
      ${Schema.DOMAINS.map(d => `<div class="dom ${d.status}">
        <div class="d-top"><span class="d-n">${d.n}</span><b>${esc(d.name)}</b>
          <span class="pill ${d.status}">${st[d.status]}</span></div>
        <div class="d-f">${esc(d.fields)}</div>
      </div>`).join('')}`;
  }

  /* ---- person editor ----------------------------------------------------- */
  const PF = [
    ['name','Name','text'], ['contact','Contact (email / LINE)','text'],
    ['source','Acquisition source','text'], ['campaign','Campaign','text'],
    ['cohort','Cohort','text'], ['salesperson','Salesperson','text'], ['leader','Leader','text'],
    ['dateLead','Date became lead','date'], ['dateCall','Date of sales call','date'],
    ['datePurchase','Date purchased','date'],
    ['price','Contract price','number'], ['collected','Cash collected','number'],
    ['refunded','Refunded','number'],
    ['baselineIncome','Baseline monthly income','number'], ['currentIncome','Current monthly income','number'],
    ['status','Status','select:lead,customer,active,graduated,churned,lost'],
    ['outcome','Outcome level','select:none,implemented,firstClient,result100k,result300k,result1m'],
    ['dateFirstClient','Date of first paid client','date'], ['dateFirstResult','Date of first verified result','date'],
    ['network','Network','select:no,invited,joined,churned'],
    ['networkMonths','Months in Network','number'], ['networkFee','Network fee / mo','number'],
    ['expansion','Expansion revenue','number'], ['referrals','Referrals given','number'],
    ['failReason','Failure reason (if no result)','text'], ['churnReason','Cancellation reason','text'],
    ['notes','Notes','text'],
  ];
  function editPerson(rec) {
    const p = rec || Store.blankPerson();
    const fld = ([k, label, type]) => {
      if (type.startsWith('select:')) {
        const opts = type.slice(7).split(',');
        return `<label class="fld"><span class="f-l">${esc(label)}</span><select data-p="${k}">${
          opts.map(o => `<option value="${o}"${p[k] === o ? ' selected' : ''}>${esc(Engine.OUTCOME_LABEL[o] || o)}</option>`).join('')}</select></label>`;
      }
      return `<label class="fld"><span class="f-l">${esc(label)}</span>
        <input type="${type}" data-p="${k}" value="${esc(p[k] == null ? '' : p[k])}"></label>`;
    };
    const risk = Engine.riskScore(p);
    modal(`<h3>${rec ? 'Edit' : 'New'} record</h3>
      ${risk.flags.length ? `<div class="alert ${risk.band === 'red' ? 'red' : 'amber'}">
        <div class="a-t">Risk ${risk.score}/100</div><div class="a-b">${risk.flags.map(esc).join(' · ')}</div></div>` : ''}
      <div class="pform">${PF.map(fld).join('')}</div>
      <div class="row">
        <button class="btn" data-act="savePerson" data-id="${p.id}">Save</button>
        <button class="btn ghost" data-act="closeModal">Cancel</button>
        ${rec ? `<button class="btn ghost danger" data-act="delPerson" data-id="${p.id}">Delete</button>` : ''}
      </div>`);
  }

  /* ---- CSV --------------------------------------------------------------- */
  function periodsCSV() {
    const fields = Schema.FIELDS.map(f => f.id);
    const mets = Schema.METRICS.map(m => m.id);
    const head = ['period', 'label', 'start', 'end', ...fields, ...mets.map(m => 'm_' + m), 'notes'];
    const rows = Store.periods().map(p => {
      const m = Engine.metricsFor(p.id).metrics;
      return [p.id, p.label, p.startISO, p.endISO,
        ...fields.map(f => p.inputs[f] != null ? p.inputs[f] : ''),
        ...mets.map(k => m[k] != null ? +m[k].toFixed(6) : ''),
        (p.notes || '').replace(/[\r\n]+/g, ' ')];
    });
    return [head, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
  }
  function peopleCSV() {
    const keys = Object.keys(Store.blankPerson());
    const head = [...keys, 'ltv', 'riskScore'];
    const rows = Store.people().map(p => [...keys.map(k => Array.isArray(p[k]) ? p[k].join('|') : p[k]),
      Engine.ltvOf(p), Engine.riskScore(p).score]);
    return [head, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
  }
  const csvCell = v => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  function download(name, text, type) {
    const blob = new Blob([text], { type: type || 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ---- modal ------------------------------------------------------------- */
  function modal(html) {
    $('#modalRoot').innerHTML = `<div class="modal-bg" data-act="closeModal"></div>
      <div class="modal">${html}</div>`;
    bind();
  }
  function closeModal() { $('#modalRoot').innerHTML = ''; }

  function sparkline(vals, dir) {
    if (vals.length < 2) return '';
    const min = Math.min(...vals), max = Math.max(...vals), span = (max - min) || 1;
    const pts = vals.map((v, i) => `${(i / (vals.length - 1) * 100).toFixed(1)},${(28 - (v - min) / span * 26).toFixed(1)}`);
    return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none">
      <polyline points="${pts.join(' ')}" fill="none" stroke="var(--accent)" stroke-width="1.6"/></svg>`;
  }

  function metricDetail(metricId) {
    const id = pid(), r = Engine.benchmarkRow(metricId, id), d = r.def;
    const pl = Schema.pillar(d.pillar);
    const rx = Rx.forMetric(metricId);
    const pinned = Store.state.focus.includes(metricId);
    modal(`
      <div class="md-head"><span class="dot" style="background:${pl.color}"></span>
        <b>${esc(d.label)}</b><span class="pill ${r.band}">${r.score == null ? '—' : r.score}/100</span></div>
      <p class="def">${esc(d.def)}</p>
      <div class="mdgrid">
        ${kpi('Now', F(r.current, d.fmt))}
        ${kpi('Previous', F(r.previous, d.fmt), deltaChip(r.delta, d.dir))}
        ${kpi('Target', F(r.target, d.fmt))}
        ${kpi('Floor', F(r.floor, d.fmt))}
        ${kpi('Best ever', F(r.best, d.fmt))}
        ${kpi('Avg last 3', F(r.avg3, d.fmt))}
      </div>
      ${sparkline(r.history, d.dir)}
      <div class="rx-title">If this is the constraint</div>
      ${rx.map((x, i) => `<div class="rx"><div class="rx-a">${esc(x.a)}</div>
        <div class="rx-w">${esc(x.w)}</div>
        <div class="rx-meta"><span>${esc(x.o)}</span><span>${esc(x.h)}</span>
        <button class="btn tiny" data-act="startRx" data-metric="${metricId}" data-i="${i}">Start &amp; track</button></div></div>`).join('')}
      <div class="row">
        <button class="btn ghost" data-act="pin" data-metric="${metricId}">${pinned ? 'Unpin from CEO screen' : 'Pin to CEO screen'}</button>
        <button class="btn ghost" data-act="closeModal">Close</button>
      </div>`);
  }

  /* ---- paint + bind ------------------------------------------------------ */
  function paint(html) { view().innerHTML = html; bind(); }

  function nextPeriodId() {
    const ids = Store.periodIds();
    const cadence = Store.state.company.cadence;
    if (!ids.length) return Store.periodIdFor(Store.todayISO(), cadence);
    const last = ids[ids.length - 1];
    const b = Store.boundsFor(last);
    const d = new Date(b.endISO + 'T12:00:00'); d.setDate(d.getDate() + 1);
    return Store.periodIdFor(d.toISOString().slice(0, 10), cadence);
  }

  function bind() {
    $$('[data-act]').forEach(el => { el.onclick = e => { e.stopPropagation(); act(el); }; });
    const sel = $('#periodSel');
    if (sel) sel.onchange = () => { setPeriod(sel.value); App.render(); };
    $$('[data-field]').forEach(el => el.onchange = () => {
      Store.setInput(pid(), el.getAttribute('data-field'), el.value === '' ? '' : Number(el.value));
      App.updateHeader();
    });
    $$('[data-bm]').forEach(el => el.onchange = () => {
      const mid = el.getAttribute('data-bm'), d = Schema.metric(mid), b = Store.benchmark(mid);
      const raw = el.value === '' ? null : Number(el.value);
      const v = raw == null ? null : (d.fmt === 'pct' ? raw / 100 : raw);
      const t = el.getAttribute('data-k') === 'target' ? v : b.target;
      const f = el.getAttribute('data-k') === 'floor'  ? v : b.floor;
      Store.setBenchmark(mid, t, f);
    });
    $$('[data-co]').forEach(el => el.onchange = () => {
      Store.setCompany({ [el.getAttribute('data-co')]: el.value }); App.updateHeader();
    });
    const nt = $('#periodNotes');
    if (nt) nt.onchange = () => Store.setNotes(pid(), nt.value);
    $$('.mrow').forEach(el => el.onclick = () => metricDetail(el.getAttribute('data-metric')));
  }

  function act(el) {
    const a = el.getAttribute('data-act');
    const id = pid();
    switch (a) {
      case 'go': App.go(el.getAttribute('data-tab')); break;
      case 'prevP': case 'nextP': {
        const ids = Store.periodIds(), i = ids.indexOf(id);
        const j = a === 'prevP' ? i - 1 : i + 1;
        if (j >= 0 && j < ids.length) { setPeriod(ids[j]); App.render(); }
        break;
      }
      case 'newPeriod': {
        const guess = nextPeriodId();
        modal(`<h3>New period</h3>
          <p class="sub">Any date inside the period you want to open. Cadence is
            <b>${Store.state.company.cadence}ly</b>; change it under Data → system.</p>
          <label class="fld"><span class="f-l">Date</span>
            <input type="date" id="newPeriodDate" value="${Store.boundsFor(guess).startISO}"></label>
          <div class="row"><button class="btn" data-act="createPeriod">Create</button>
            <button class="btn ghost" data-act="closeModal">Cancel</button></div>`);
        break;
      }
      case 'createPeriod': {
        const d = $('#newPeriodDate').value || Store.todayISO();
        const nid = Store.periodIdFor(d, Store.state.company.cadence);
        Store.ensurePeriod(nid); setPeriod(nid); closeModal(); dataTab = 'period'; App.go('data');
        break;
      }
      case 'delPeriod':
        if (confirm('Delete ' + Store.labelFor(id) + '? The numbers go with it.')) {
          Store.deletePeriod(id); setPeriod(Store.currentId()); App.render();
        }
        break;
      case 'seg': segKey = el.getAttribute('data-seg'); App.render(); break;
      case 'dataTab': dataTab = el.getAttribute('data-t'); App.render(); break;
      case 'toggleLever': {
        const m = el.getAttribute('data-metric');
        openLever = openLever === m ? null : m; App.render(); break;
      }
      case 'startRx': {
        const mid = el.getAttribute('data-metric');
        const r = Rx.forMetric(mid)[Number(el.getAttribute('data-i'))];
        const cur = Engine.metricsFor(id).metrics[mid];
        const lev = Engine.leverImpact(id).levers.find(l => l.metricId === mid);
        Store.addIntervention({ periodId:id, metricId:mid, action:r.a, owner:r.o, horizon:r.h,
          baseline:cur, target:Store.benchmark(mid).target, valueAtStake: lev ? lev.gain : 0 });
        closeModal(); App.go('diagnose');
        break;
      }
      case 'closeRx': {
        const x = Store.state.interventions.find(i => i.id === el.getAttribute('data-id'));
        const rv = Rx.review(x, id);
        Store.updateIntervention(x.id, { status:'closed', verdict:rv.verdict,
          reviewedPeriodId:id, delta:rv.delta });
        App.render(); break;
      }
      case 'dropRx': Store.deleteIntervention(el.getAttribute('data-id')); App.render(); break;
      case 'pin': Store.toggleFocus(el.getAttribute('data-metric')); closeModal(); App.render(); break;
      case 'newPerson': editPerson(null); break;
      case 'editPerson': editPerson(Store.state.people[el.getAttribute('data-id')]); break;
      case 'savePerson': {
        const pid_ = el.getAttribute('data-id');
        const rec = Store.state.people[pid_] || { ...Store.blankPerson(), id:pid_ };
        $$('[data-p]').forEach(inp => {
          const k = inp.getAttribute('data-p');
          rec[k] = inp.type === 'number' ? (inp.value === '' ? 0 : Number(inp.value)) : inp.value;
        });
        Store.upsertPerson(rec); closeModal(); App.render(); break;
      }
      case 'delPerson':
        if (confirm('Delete this record?')) { Store.deletePerson(el.getAttribute('data-id')); closeModal(); App.render(); }
        break;
      case 'closeModal': closeModal(); break;
      case 'demo':
        if (confirm('Load synthetic demo data? This replaces everything stored on this device.')) {
          Seed.load(); setPeriod(Store.currentId()); closeModal(); App.go('company');
        }
        break;
      case 'wipe':
        if (confirm('Erase every period, person and intervention on this device?')) {
          Store.reset(); setPeriod(Store.currentId()); App.render();
        }
        break;
      case 'exportJSON': download('valueloop-' + Store.todayISO() + '.json', Store.exportJSON(), 'application/json'); break;
      case 'exportCSV': download('valueloop-periods-' + Store.todayISO() + '.csv', periodsCSV(), 'text/csv'); break;
      case 'exportPeopleCSV': download('valueloop-people-' + Store.todayISO() + '.csv', peopleCSV(), 'text/csv'); break;
      case 'importJSON': {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = '.json,application/json';
        inp.onchange = () => {
          const f = inp.files[0]; if (!f) return;
          const rd = new FileReader();
          rd.onload = () => { try { Store.importJSON(rd.result); setPeriod(Store.currentId()); App.render(); }
            catch (e) { alert('That file did not parse: ' + e.message); } };
          rd.readAsText(f);
        };
        inp.click(); break;
      }
    }
  }

  return { setPeriod, pid, renderCompany, renderAcquire, renderSuccess, renderRetain,
           renderDiagnose, renderData, periodsCSV, peopleCSV, metricDetail };
})();
