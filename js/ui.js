/* ============================================================================
   ui.js — Rendering + interaction for all five tabs.
   Vanilla DOM. Each tab has a render() that returns HTML; handlers wired after.
   ========================================================================== */

const UI = (() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const view = () => $('#view');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const today = () => Engine.todayISO();

  let current = { date: today() };

  /* ---- time formatting for goals (seconds -> mm:ss for long events) ------ */
  function fmtGoal(goal, v) {
    if (v == null || isNaN(v)) return '–';
    if (goal.unit === 's' && v >= 100) {
      const m = Math.floor(v / 60), s = (v % 60).toFixed(1).padStart(4, '0');
      return `${m}:${s}`;
    }
    if (goal.unit === 's') return `${v.toFixed(2)}s`;
    return `${(+v).toFixed(v % 1 ? 1 : 0)}${goal.unit === 'in' ? '"' : ''}`;
  }

  /* ======================================================================
     TAB: TODAY
     ==================================================================== */
  function renderToday() {
    const date = current.date;
    const day = Store.getDay(date);
    const decision = Engine.decideDay(date);
    const r = decision.readiness;
    const phase = decision.phase;

    let html = '';

    // Readiness ring
    if (r) {
      const circ = 2 * Math.PI * 92;
      const off = circ * (1 - r.score / 100);
      const col = r.band === 'green' ? 'var(--green)' : r.band === 'amber' ? 'var(--amber)' : 'var(--red)';
      html += `<div class="ring-wrap"><div class="ring">
        <svg width="210" height="210" viewBox="0 0 210 210">
          <circle cx="105" cy="105" r="92" stroke="var(--card2)" stroke-width="16" fill="none"/>
          <circle cx="105" cy="105" r="92" stroke="${col}" stroke-width="16" fill="none"
            stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${off}"
            style="transition:stroke-dashoffset .8s cubic-bezier(.2,.7,.2,1)"/>
        </svg>
        <div class="score"><div class="num" style="color:${col}">${r.score}</div>
          <div class="lbl">Readiness</div>
          <div class="band band-${r.band}">${r.band.toUpperCase()}</div>
        </div></div></div>`;
    } else {
      html += `<div class="card center"><h3>No check-in yet</h3>
        <p class="sub" style="margin-bottom:14px">Log this morning's numbers to get your readiness and today's call.</p>
        <button class="btn" data-act="checkin">Morning check-in →</button></div>`;
    }

    // The call
    html += `<div class="call ${r ? r.band : ''}">
      <div class="h">${esc(decision.headline)}</div>
      <ul>${decision.advice.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
    </div>`;

    // Today's emphasis (from plan)
    html += `<div class="card tight"><div class="stat-row" style="border:0;padding:6px 0">
      <div class="l">Today's emphasis<small>${esc(phase.name)} · week ${Store.state.profile.phaseWeek}</small></div>
      <div class="r" style="color:var(--accent)">${esc(decision.emphasisLabel)}</div></div></div>`;

    // Readiness breakdown
    if (r && r.components.length) {
      html += `<div class="section-title">What's driving it</div><div class="card">`;
      r.components.forEach(c => {
        const col = c.score >= 67 ? 'var(--green)' : c.score >= 40 ? 'var(--amber)' : 'var(--red)';
        html += `<div class="comp"><div class="name">${esc(c.key)}</div>
          <div class="bar"><i style="width:${Math.round(c.score)}%;background:${col}"></i></div>
          <div class="val">${Math.round(c.score)}</div></div>
          <div class="note">${esc(c.note)}</div>`;
      });
      html += `</div>`;
    }

    // Recovery actions
    if (decision.recovery.length) {
      html += `<div class="section-title">Recovery protocol</div><div class="card"><div class="chips">`;
      decision.recovery.forEach((rec, i) => {
        const done = day.recoveryDone.includes(rec);
        html += `<div class="chip ${done ? 'done' : ''}" data-rec="${esc(rec)}">
          <span class="box"></span>${esc(rec)}</div>`;
      });
      html += `</div></div>`;
    }

    // Quick actions
    html += `<div class="btn-row" style="margin-top:16px">
      <button class="btn ghost" data-act="checkin">${r ? 'Edit check-in' : 'Check-in'}</button>
      <button class="btn" data-tab="log">Log session</button></div>`;

    view().innerHTML = html;

    // handlers
    $$('[data-act="checkin"]').forEach(b => b.onclick = openCheckin);
    $$('[data-tab="log"]', view()).forEach(b => b.onclick = () => App.go('log'));
    $$('.chip[data-rec]').forEach(ch => ch.onclick = () => {
      const rec = ch.getAttribute('data-rec');
      const d = Store.getDay(date);
      d.recoveryDone = d.recoveryDone.includes(rec) ? d.recoveryDone.filter(x => x !== rec) : [...d.recoveryDone, rec];
      Store.save(); renderToday();
    });
  }

  /* ---- Morning check-in modal ------------------------------------------ */
  function openCheckin() {
    const date = current.date;
    const w = Store.getDay(date).wellness || {};
    const scale = (field, label, inv = false) => `
      <div class="field"><label>${label}</label>
        <div class="scale ${inv ? 'inv' : ''}" data-scale="${field}">
          ${[1, 2, 3, 4, 5].map(n => `<button data-v="${n}" class="${w[field] === n ? 'sel' : ''}">${n}</button>`).join('')}
        </div></div>`;

    modal(`<h3>Morning check-in</h3>
      <div class="row">
        <div class="field"><label>Sleep (h)</label><input type="number" step="0.5" id="ci-sleepH" value="${w.sleepH ?? ''}" placeholder="7.5"></div>
        <div class="field"><label>Sleep quality</label><input type="number" min="1" max="5" id="ci-sleepQ" value="${w.sleepQ ?? ''}" placeholder="1-5"></div>
      </div>
      ${Store.state.settings.hrvEnabled ? `<div class="row">
        <div class="field"><label>HRV (ms)</label><input type="number" id="ci-hrv" value="${w.hrv ?? ''}" placeholder="optional"></div>
        <div class="field"><label>Resting HR</label><input type="number" id="ci-rhr" value="${w.rhr ?? ''}" placeholder="optional"></div>
      </div>` : ''}
      ${scale('soreness', 'Muscle soreness (5 = wrecked)', true)}
      ${scale('energy', 'Energy')}
      ${scale('mood', 'Mood')}
      ${scale('stress', 'Life stress (5 = high)', true)}
      ${scale('motivation', 'Motivation to train')}
      <button class="btn" id="ci-save">Save check-in</button>`);

    const picked = { ...w };
    $$('[data-scale]').forEach(sc => {
      const field = sc.getAttribute('data-scale');
      $$('button', sc).forEach(b => b.onclick = () => {
        $$('button', sc).forEach(x => x.classList.remove('sel'));
        b.classList.add('sel'); picked[field] = +b.getAttribute('data-v');
      });
    });
    $('#ci-save').onclick = () => {
      const num = id => { const v = $('#' + id); return v && v.value !== '' ? +v.value : undefined; };
      const wellness = {
        sleepH: num('ci-sleepH'), sleepQ: num('ci-sleepQ'),
        hrv: num('ci-hrv'), rhr: num('ci-rhr'),
        soreness: picked.soreness, energy: picked.energy, mood: picked.mood,
        stress: picked.stress, motivation: picked.motivation,
      };
      Store.setDay(date, { wellness });
      const d = Store.getDay(date);
      d.readiness = Engine.readiness(date); Store.save();
      closeModal(); renderToday();
    };
  }

  /* ======================================================================
     TAB: LOG (session builder with per-set auto-regulation)
     ==================================================================== */
  function renderLog() {
    const date = current.date;
    const day = Store.getDay(date);
    if (!day.session) day.session = { type: '', exercises: [], durationMin: 45, sRPE: 6 };
    const s = day.session;

    let html = `<div class="section-title">Session · ${date}</div>`;
    html += `<div class="card tight"><div class="row">
      <div class="field" style="margin:0"><label>Duration (min)</label><input type="number" id="s-dur" value="${s.durationMin || ''}"></div>
      <div class="field" style="margin:0"><label>Overall effort (sRPE 1-10)</label><input type="number" min="1" max="10" id="s-rpe" value="${s.sRPE || ''}"></div>
    </div></div>`;

    // Exercises
    if (!s.exercises.length) {
      html += `<div class="empty">No exercises yet. Add your first movement below —<br>the coach gives feedback after each set.</div>`;
    }
    s.exercises.forEach((ex, ei) => {
      const cat = DATA.CATEGORIES[ex.cat] || {};
      html += `<div class="exline" data-ei="${ei}">
        <div class="exhead"><span class="nm">${esc(ex.name)}</span>
          <span class="ct">${esc(cat.label || ex.cat)}</span></div>`;
      (ex.sets || []).forEach((set, si) => {
        html += renderSetLine(ex, ei, si, set);
        const adv = Engine.nextSetAdvice(ex, si, ex.sets);
        if (adv.cue) html += `<div class="setadvice ${/⛔|above target|fatigu/.test(adv.cue) ? 'warn' : ''}">${esc(adv.cue)}</div>`;
      });
      html += `<button class="btn ghost sm" data-addset="${ei}" style="margin-top:10px">+ Add set</button>
        </div>`;
    });

    html += `<button class="btn" id="add-ex">+ Add exercise</button>`;
    html += `<button class="btn ghost" id="save-session" style="margin-top:10px">Save session</button>`;

    view().innerHTML = html;

    $('#s-dur').oninput = e => { s.durationMin = +e.target.value || 0; Store.save(); };
    $('#s-rpe').oninput = e => { s.sRPE = +e.target.value || 0; Store.save(); };
    $('#add-ex').onclick = openExercisePicker;
    $('#save-session').onclick = () => {
      s.load = Engine.sessionLoad(s); Store.save();
      App.go('today');
    };
    $$('[data-addset]').forEach(b => b.onclick = () => {
      const ei = +b.getAttribute('data-addset');
      const ex = s.exercises[ei];
      const prev = ex.sets[ex.sets.length - 1];
      ex.sets.push(prev ? { ...prev } : {});
      Store.save(); renderLog();
    });
    wireSetInputs();
  }

  function renderSetLine(ex, ei, si, set) {
    const fields = (DATA.CATEGORIES[ex.cat] || {}).log || ['load', 'reps', 'rpe'];
    const inp = (f, ph) => `<input data-ei="${ei}" data-si="${si}" data-f="${f}" value="${set[f] ?? ''}" placeholder="${ph}" inputmode="decimal">`;
    const map = {
      load: ['load', 'kg'], reps: ['reps', 'reps'], rpe: ['rpe', 'RPE'],
      velocity: ['velocity', 'm/s'], holdSec: ['holdSec', 'sec'],
      distance: ['distance', 'm'], time: ['time', 'sec'],
      contacts: ['contacts', '#'], minutes: ['minutes', 'min'],
    };
    return `<div class="setline"><span class="idx">${si + 1}</span>
      ${fields.map(f => inp(map[f][0], map[f][1])).join('')}</div>`;
  }

  function wireSetInputs() {
    $$('.setline input').forEach(inp => {
      inp.onchange = () => {
        const ei = +inp.getAttribute('data-ei'), si = +inp.getAttribute('data-si'), f = inp.getAttribute('data-f');
        const s = Store.getDay(current.date).session;
        s.exercises[ei].sets[si][f] = inp.value === '' ? undefined : +inp.value;
        Store.save(); renderLog();
      };
    });
  }

  function openExercisePicker() {
    const byCat = {};
    DATA.EXERCISES.forEach(e => { (byCat[e.cat] = byCat[e.cat] || []).push(e); });
    let html = `<h3>Add exercise</h3>`;
    Object.keys(byCat).forEach(cat => {
      html += `<div class="section-title">${esc((DATA.CATEGORIES[cat] || {}).label || cat)}</div><div class="pickgrid">`;
      byCat[cat].forEach(e => {
        html += `<button data-name="${esc(e.name)}" data-cat="${e.cat}">${esc(e.name)}<small>${esc(e.equip)}</small></button>`;
      });
      html += `</div>`;
    });
    modal(html);
    $$('.pickgrid button').forEach(b => b.onclick = () => {
      const s = Store.getDay(current.date).session;
      s.exercises.push({ name: b.getAttribute('data-name'), cat: b.getAttribute('data-cat'), sets: [{}] });
      Store.save(); closeModal(); renderLog();
    });
  }

  /* ======================================================================
     TAB: PROGRESS (goal projections + test metrics)
     ==================================================================== */
  function renderProgress() {
    let html = `<div class="section-title">Goal projections</div>`;

    DATA.GOALS.forEach(goal => {
      const p = Engine.projectGoal(goal);
      if (p.status === 'no-data') {
        html += `<div class="goal"><div class="top"><span class="name">${esc(goal.name)}</span>
          <span class="tgt">target ${fmtGoal(goal, goal.target)}</span></div>
          <p class="eta" style="margin-top:8px">Set your current best in <b>You</b> tab, or log a test →</p>
          <div class="limiters">${goal.limiters.map(l => `<span>${esc(l)}</span>`).join('')}</div></div>`;
        return;
      }
      // progress toward target (0-100%)
      const best = p.current;
      let pct;
      if (goal.lowerBetter) {
        // assume a plausible starting point 30% worse than target for the bar scale
        const start = goal.target * 1.30;
        pct = Math.max(0, Math.min(100, ((start - best) / (start - goal.target)) * 100));
      } else {
        const start = goal.target * 0.55;
        pct = Math.max(0, Math.min(100, ((best - start) / (goal.target - start)) * 100));
      }
      let eta;
      if (p.reached) eta = `🏆 Target achieved — hold and specialize.`;
      else if (p.status === 'need-trend') eta = `Log another test to project a trend (${p.gapPct}% from target).`;
      else if (p.improving && p.etaWeeks != null) eta = `On trend: ~<b>${p.etaWeeks} weeks</b> to target · ${p.perWeek > 0 ? '+' : ''}${p.perWeek}${goal.unit}/wk`;
      else if (p.improving) eta = `Improving, but rate too small to project reliably.`;
      else eta = `⚠️ Plateau/regressing — this quality needs a dedicated block to move.`;

      html += `<div class="goal"><div class="top"><span class="name">${esc(goal.name)}</span>
        <span class="tgt">target ${fmtGoal(goal, goal.target)}</span></div>
        <div class="now">${fmtGoal(goal, best)}</div>
        <div class="prog"><i style="width:${pct}%"></i></div>
        <div class="eta">${eta}</div>
        <div class="limiters">${goal.limiters.map(l => `<span>${esc(l)}</span>`).join('')}</div></div>`;
    });

    // Test metrics
    html += `<div class="section-title">Test metrics</div>`;
    html += `<button class="btn ghost" id="log-test" style="margin-bottom:6px">+ Log a test result</button>`;

    const tested = [...new Set(Store.state.tests.map(t => t.metric))];
    if (!tested.length) {
      html += `<div class="empty">No test data yet. Log force-plate, sprint, Keiser, or Stryd numbers to track adaptation.</div>`;
    } else {
      html += `<div class="card">`;
      tested.forEach(mid => {
        const meta = DATA.METRICS.find(m => m.id === mid) || { name: mid, unit: '', lowerBetter: false };
        const hist = Store.testsFor(mid);
        const latest = hist[hist.length - 1], first = hist[0];
        const delta = latest.value - first.value;
        const improved = meta.lowerBetter ? delta < 0 : delta > 0;
        const cls = hist.length < 2 ? 'flat' : improved ? 'pos' : 'neg';
        const arrow = hist.length < 2 ? '' : improved ? '▲' : '▼';
        const spark = renderSpark(hist.map(h => h.value), meta.lowerBetter);
        html += `<div class="stat-row"><div class="l">${esc(meta.name)}<small>${esc(meta.tool || '')}</small>${spark}</div>
          <div class="r">${latest.value}${esc(meta.unit)}<small class="${cls}">${arrow} ${hist.length > 1 ? (delta > 0 ? '+' : '') + delta.toFixed(2) : 'baseline'}</small></div></div>`;
      });
      html += `</div>`;
    }

    view().innerHTML = html;
    $('#log-test').onclick = openTestLogger;
  }

  function renderSpark(vals, lowerBetter) {
    if (vals.length < 2) return '';
    const lo = Math.min(...vals), hi = Math.max(...vals), rng = hi - lo || 1;
    return `<div class="spark">${vals.map((v, i) => {
      const h = 10 + ((v - lo) / rng) * 90;
      return `<i class="${i === vals.length - 1 ? 'last' : ''}" style="height:${h}%"></i>`;
    }).join('')}</div>`;
  }

  function openTestLogger() {
    const byTool = {};
    DATA.METRICS.forEach(m => { (byTool[m.tool] = byTool[m.tool] || []).push(m); });
    let opts = '';
    Object.keys(byTool).forEach(tool => {
      opts += `<optgroup label="${esc(tool)}">${byTool[tool].map(m => `<option value="${m.id}">${esc(m.name)} (${esc(m.unit || 'ratio')})</option>`).join('')}</optgroup>`;
    });
    modal(`<h3>Log test result</h3>
      <div class="field"><label>Metric</label><select id="t-metric">${opts}</select></div>
      <div class="row">
        <div class="field"><label>Value</label><input type="number" step="0.01" id="t-val" placeholder="e.g. 42.5"></div>
        <div class="field"><label>Date</label><input type="date" id="t-date" value="${today()}"></div>
      </div>
      <button class="btn" id="t-save">Save result</button>`);
    $('#t-save').onclick = () => {
      const metric = $('#t-metric').value, val = $('#t-val').value, date = $('#t-date').value || today();
      if (val === '') return;
      Store.addTest(metric, val, date);
      closeModal(); renderProgress();
    };
  }

  /* ======================================================================
     TAB: COACH (synthesized analysis + weekly compliance)
     ==================================================================== */
  function renderCoach() {
    const date = current.date;
    const decision = Engine.decideDay(date);
    const wk = Engine.weeklyReport(date);
    const acw = Engine.acwr(date);
    const name = Store.state.profile.name || 'athlete';

    let html = `<div class="section-title">Your coach</div>`;

    // Headline briefing
    let brief = [];
    if (decision.readiness) {
      brief.push(`Readiness is <strong>${decision.readiness.score}</strong> (${decision.readiness.band}). ${esc(decision.headline)}`);
    } else {
      brief.push(`I need this morning's check-in before I can read your recovery. Two taps in <strong>Today</strong>.`);
    }
    if (acw.ratio != null) {
      const zone = acw.ratio > 1.5 ? 'a danger spike' : acw.ratio > 1.3 ? 'slightly elevated' : acw.ratio < 0.8 ? 'low — a taper or a gap' : 'right in the sweet spot';
      brief.push(`Your acute:chronic workload is <strong>${acw.ratio}</strong> — ${zone}. Acute ${acw.acute}, chronic ${acw.chronic} AU.`);
    }
    html += coachMsg('Daily briefing', brief);

    // Phase strategy — conjugate-block hybrid
    const phase = decision.phase;
    const primary = (DATA.CATEGORIES[phase.primary] || {}).label || phase.primary;
    const secs = phase.secondary.map(s => (DATA.CATEGORIES[s] || {}).label || s).join(', ');
    const diagMeta = DATA.METRICS.find(m => m.id === phase.diagnostic);
    html += coachMsg('This block', [
      `<strong>Phase ${phase.id}: ${esc(phase.name)}</strong>, week ${Store.state.profile.phaseWeek}. ${esc(phase.focus)}`,
      `Drive one quality: <strong>${esc(primary)}</strong>. Maintain <strong>${esc(secs)}</strong> at the minimum effective dose so you don't rebuild them next phase.`,
      `Weekly diagnostic to watch for drift: <strong>${esc(diagMeta ? diagMeta.name : phase.diagnostic)}</strong>. Test it every week — if it slides, you're drifting too far from a quality you're supposed to be holding.`,
      `Lifting band this phase: <strong>${phase.weightPct[0]}–${phase.weightPct[1]}%</strong>, ${phase.repRange[0]}–${phase.repRange[1]} reps × ${phase.setRange[0]}–${phase.setRange[1]} sets.`,
    ]);

    // 80/20 reminder if volume skewed hard
    const hardDays = Store.lastNDays(7, date).filter(d => d.session && (d.session.sRPE || 0) >= 7).length;
    if (hardDays >= 4) {
      html += coachMsg('Intensity distribution', [
        `You've logged <strong>${hardDays} hard days</strong> in the last 7. Elite programs run ~80/20 — most volume easy so the hard days can be truly hard. Pull one of those back to genuine Zone 2.`,
      ]);
    }

    // Goal watch — flag the most off-track goal
    const projections = DATA.GOALS.map(g => Engine.projectGoal(g)).filter(p => p.status === 'ok');
    const stalled = projections.filter(p => !p.reached && !p.improving);
    if (stalled.length) {
      html += coachMsg('Goal watch', [
        `These qualities are flat or slipping: <strong>${stalled.map(p => p.goal.name).join(', ')}</strong>. They won't move as maintenance work — each needs a dedicated block. Given your current phase drives ${esc(primary)}, slot the others in as your rotating primary in an upcoming block.`,
      ]);
    }

    // Weekly compliance
    html += `<div class="section-title">This week vs plan</div><div class="card">`;
    wk.items.forEach(it => {
      const [lo, hi] = it.target;
      const pct = Math.min(100, (it.val / hi) * 100);
      const col = it.band === 'on' ? 'var(--green)' : it.band === 'under' ? 'var(--amber)' : 'var(--red)';
      html += `<div class="comp-item"><div class="cl">${esc(it.label)}</div>
        <div class="cbar"><i style="width:${pct}%;background:${col}"></i></div>
        <div class="cv">${it.val}${esc(it.unit)} <span class="tag ${it.band}">${it.band}</span></div></div>
        <div class="note" style="margin-left:120px;margin-top:-6px">target ${lo}–${hi}${esc(it.unit)}</div>`;
    });
    html += `</div>`;

    html += `<div class="card tight center small muted">Coaching logic is built in and runs offline. It follows your periodization, readiness, and workload rules — no data leaves this device.</div>`;

    view().innerHTML = html;
  }

  function coachMsg(who, lines) {
    return `<div class="coach-msg"><div class="who">${esc(who)}</div>
      ${lines.map(l => `<p>${l}</p>`).join('')}</div>`;
  }

  /* ======================================================================
     TAB: SETTINGS / YOU
     ==================================================================== */
  function renderSettings() {
    const p = Store.state.profile;
    let phaseOpts = DATA.PHASES.map(ph => `<option value="${ph.id}" ${ph.id === p.phaseId ? 'selected' : ''}>Phase ${ph.id}: ${ph.name}</option>`).join('');

    let html = `<div class="section-title">Athlete</div><div class="card">
      <div class="field"><label>Name</label><input id="p-name" value="${esc(p.name)}" placeholder="Your name"></div>
      <div class="row">
        <div class="field"><label>Bodyweight (kg)</label><input type="number" id="p-bw" value="${p.bodyweightKg || ''}"></div>
        <div class="field"><label>Goal date</label><input type="date" id="p-gdate" value="${p.goalDateISO || ''}"></div>
      </div>
    </div>`;

    html += `<div class="section-title">Current block</div><div class="card">
      <div class="field"><label>Phase</label><select id="p-phase">${phaseOpts}</select></div>
      <div class="field"><label>Week in phase</label><input type="number" min="1" id="p-week" value="${p.phaseWeek || 1}"></div>
    </div>`;

    html += `<div class="section-title">Current bests</div><div class="card">`;
    DATA.GOALS.forEach(g => {
      const v = Store.state.bests[g.id] ?? '';
      html += `<div class="field" style="margin:8px 0"><label>${esc(g.name)} <span class="muted">(target ${fmtGoal(g, g.target)}${g.unit === 's' ? '' : ''})</span></label>
        <input type="number" step="0.01" data-best="${g.id}" value="${v}" placeholder="${g.unit === 's' ? 'seconds' : g.unit}"></div>`;
    });
    html += `</div>`;

    html += `<div class="section-title">Settings</div><div class="card">
      <div class="stat-row"><div class="l">Track HRV / resting HR</div><div class="r">
        <input type="checkbox" id="set-hrv" ${Store.state.settings.hrvEnabled ? 'checked' : ''} style="width:auto"></div></div>
    </div>`;

    html += `<div class="section-title">Data</div><div class="card">
      <div class="btn-row"><button class="btn ghost sm" id="d-export">Export backup</button>
      <button class="btn ghost sm" id="d-import">Import</button></div>
      <button class="btn ghost sm" id="d-reset" style="margin-top:10px;color:var(--red);width:100%">Reset all data</button>
    </div>`;

    html += `<div class="center small muted" style="margin:20px 0">APEX · your private performance journal</div>`;

    view().innerHTML = html;

    $('#p-name').onchange = e => Store.setProfile({ name: e.target.value });
    $('#p-bw').onchange = e => Store.setProfile({ bodyweightKg: +e.target.value });
    $('#p-gdate').onchange = e => Store.setProfile({ goalDateISO: e.target.value });
    $('#p-phase').onchange = e => { Store.setProfile({ phaseId: +e.target.value }); App.updatePhasePill(); };
    $('#p-week').onchange = e => Store.setProfile({ phaseWeek: +e.target.value });
    $$('[data-best]').forEach(inp => inp.onchange = () => { if (inp.value !== '') Store.setBest(inp.getAttribute('data-best'), inp.value); });
    $('#set-hrv').onchange = e => { Store.state.settings.hrvEnabled = e.target.checked; Store.save(); };
    $('#d-export').onclick = doExport;
    $('#d-import').onclick = doImport;
    $('#d-reset').onclick = () => { if (confirm('Erase all logged data? This cannot be undone.')) { Store.reset(); App.go('today'); App.updatePhasePill(); } };
  }

  function doExport() {
    const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `apex-backup-${today()}.json`; a.click();
    URL.revokeObjectURL(url);
  }
  function doImport() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { try { Store.importJSON(rd.result); App.go('today'); App.updatePhasePill(); alert('Backup restored.'); } catch (e) { alert('Invalid backup file.'); } };
      rd.readAsText(f);
    };
    inp.click();
  }

  /* ---- Modal helpers --------------------------------------------------- */
  function modal(inner) {
    $('#modalRoot').innerHTML = `<div class="modal-bg"><div class="modal"><div class="grab"></div>${inner}</div></div>`;
    $('.modal-bg').onclick = e => { if (e.target.classList.contains('modal-bg')) closeModal(); };
  }
  function closeModal() { $('#modalRoot').innerHTML = ''; }

  return {
    setDate: d => { current.date = d; },
    get date() { return current.date; },
    renderToday, renderLog, renderProgress, renderCoach, renderSettings,
    fmtGoal,
  };
})();
