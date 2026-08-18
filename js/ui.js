/* ============================================================================
   ui.js — Rendering + interaction for all five tabs (KNCT Hybrid Apex System).
   ========================================================================== */

const UI = (() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const view = () => $('#view');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const today = () => Engine.todayISO();
  let current = { date: today() };

  function fmtGoal(goal, v) {
    if (v == null || isNaN(v)) return '–';
    if (goal.unit === 's' && v >= 100) { const m = Math.floor(v / 60), s = (v % 60).toFixed(1).padStart(4, '0'); return `${m}:${s}`; }
    if (goal.unit === 's') return `${v.toFixed(2)}s`;
    if (goal.unit === 'min') return `${v} min`;
    return `${(+v).toFixed(v % 1 ? 2 : 0)}${goal.unit === 'in' ? '"' : goal.unit === 'm' ? ' m' : goal.unit === 'kg' ? ' kg' : goal.unit === 'lb' ? ' lb' : ''}`;
  }
  const bandColor = b => b === 'green' ? 'var(--green)' : b === 'amber' ? 'var(--amber)' : 'var(--red)';

  /* ======================================================================
     TAB: TODAY
     ==================================================================== */
  function renderToday() {
    const date = current.date;
    const day = Store.getDay(date);
    const dec = Engine.decideDay(date);
    const r = dec.readiness;
    let html = '';

    // Readiness ring
    if (r) {
      const circ = 2 * Math.PI * 92, off = circ * (1 - r.score / 100), col = bandColor(r.band);
      html += `<div class="ring-wrap"><div class="ring">
        <svg width="210" height="210" viewBox="0 0 210 210">
          <circle cx="105" cy="105" r="92" stroke="var(--card2)" stroke-width="16" fill="none"/>
          <circle cx="105" cy="105" r="92" stroke="${col}" stroke-width="16" fill="none" stroke-linecap="round"
            stroke-dasharray="${circ}" stroke-dashoffset="${off}" style="transition:stroke-dashoffset .8s cubic-bezier(.2,.7,.2,1)"/>
        </svg>
        <div class="score"><div class="num" style="color:${col}">${r.score}</div>
          <div class="lbl">Readiness</div><div class="band band-${r.band}">${r.band.toUpperCase()}</div></div></div></div>`;
    } else {
      html += `<div class="card center"><h3>Morning readiness gate</h3>
        <p class="sub" style="margin-bottom:14px">HRV + 3× CMJ + sleep. Two minutes → today's green/amber/red call.</p>
        <button class="btn" data-act="checkin">Run the gate →</button></div>`;
    }

    // The call
    html += `<div class="call ${r ? r.band : ''}"><div class="h">${esc(dec.headline)}</div>
      <ul>${dec.advice.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>`;

    // Weekly High/Low strip
    html += `<div class="section-title">The week · ${dec.phase.name}${dec.wk ? ' · wk ' + dec.wk : ''}${dec.deload ? ' · DELOAD' : ''}</div>`;
    html += `<div class="weekstrip">`;
    DATA.WEEK_ARCH.forEach(a => {
      const isToday = a.day === dec.day;
      const lc = a.load === 'HIGH' ? 'hi' : a.load === 'RECOVERY' ? 'rec' : 'lo';
      html += `<div class="wcell ${lc} ${isToday ? 'now' : ''}"><b>${a.day}</b><span>${a.load === 'MED-LOW' ? 'MED' : a.load}</span></div>`;
    });
    html += `</div>`;

    // Today's prescribed session
    if (dec.prescribed) {
      html += `<div class="section-title">Today's prescription</div>`;
      html += sessionBlock('AM', dec.prescribed.am) + sessionBlock('PM', dec.prescribed.pm);
      const hasItems = (dec.prescribed.am.items.length + dec.prescribed.pm.items.length) > 0;
      if (hasItems) html += `<button class="btn" data-act="loadrx">Start today's session →</button>`;
    }

    // Readiness breakdown + gates
    if (r && r.components.length) {
      html += `<div class="section-title">Readiness gate</div><div class="card">`;
      r.components.forEach(c => {
        const col = c.score >= 67 ? 'var(--green)' : c.score >= 40 ? 'var(--amber)' : 'var(--red)';
        html += `<div class="comp"><div class="name">${esc(c.key)}</div><div class="bar"><i style="width:${Math.round(c.score)}%;background:${col}"></i></div><div class="val">${Math.round(c.score)}</div></div><div class="note">${esc(c.note)}</div>`;
      });
      if (r.gates.length) html += `<div class="gatewarn">⚠ Hard gates: ${r.gates.map(esc).join(' · ')}</div>`;
      html += `</div>`;
    }

    // Recovery
    const rec = r ? DATA.RECOVERY[r.band] : null;
    if (rec) {
      html += `<div class="section-title">Recovery protocol</div><div class="card"><div class="chips">`;
      rec.forEach(x => { const done = day.recoveryDone.includes(x);
        html += `<div class="chip ${done ? 'done' : ''}" data-rec="${esc(x)}"><span class="box"></span>${esc(x)}</div>`; });
      html += `</div></div>`;
    }

    html += `<div class="btn-row" style="margin-top:16px">
      <button class="btn ghost" data-act="checkin">${r ? 'Edit gate' : 'Run gate'}</button>
      <button class="btn ghost" data-tab="log">Open log</button></div>`;

    view().innerHTML = html;
    $$('[data-act="checkin"]').forEach(b => b.onclick = openCheckin);
    $$('[data-tab="log"]', view()).forEach(b => b.onclick = () => App.go('log'));
    const rx = $('[data-act="loadrx"]'); if (rx) rx.onclick = () => { loadPrescribed(date); App.go('log'); };
    $$('.chip[data-rec]').forEach(ch => ch.onclick = () => {
      const x = ch.getAttribute('data-rec'), d = Store.getDay(date);
      d.recoveryDone = d.recoveryDone.includes(x) ? d.recoveryDone.filter(v => v !== x) : [...d.recoveryDone, x];
      Store.save(); renderToday();
    });
  }

  function sessionBlock(tag, blk) {
    if (!blk || (!blk.items.length && !blk.desc)) return '';
    let h = `<div class="rxblock"><div class="rxhead"><span class="rxtag">${tag}</span><b>${esc(blk.focus)}</b></div>`;
    if (blk.desc) h += `<p class="rxdesc">${esc(blk.desc)}</p>`;
    blk.items.forEach(it => {
      const scheme = [it.sets, it.reps].filter(v => v != null && v !== '').join(' × ');
      h += `<div class="rxitem"><span class="ri-n">${esc(it.name)}</span><span class="ri-s">${esc(scheme)}${it.load && it.load !== '—' ? ' · ' + esc(it.load) : ''}</span></div>`;
    });
    return h + `</div>`;
  }

  /* ---- Morning gate modal ---------------------------------------------- */
  function openCheckin() {
    const date = current.date;
    const w = Store.getDay(date).wellness || {};
    const scale = (f, label, inv = false) => `<div class="field"><label>${label}</label>
      <div class="scale ${inv ? 'inv' : ''}" data-scale="${f}">${[1, 2, 3, 4, 5].map(n => `<button data-v="${n}" class="${w[f] === n ? 'sel' : ''}">${n}</button>`).join('')}</div></div>`;

    modal(`<h3>Morning readiness gate</h3>
      <div class="row">
        <div class="field"><label>CMJ — best of 3 (cm)</label><input type="number" step="0.1" id="ci-cmj" value="${w.cmj ?? ''}" placeholder="force plate"></div>
        <div class="field"><label>Bodyweight (kg)</label><input type="number" step="0.1" id="ci-bw" value="${w.bodyweightKg ?? ''}" placeholder="${Store.state.profile.bodyweightKg}"></div>
      </div>
      <div class="row">
        <div class="field"><label>Sleep (h)</label><input type="number" step="0.5" id="ci-sleepH" value="${w.sleepH ?? ''}" placeholder="8"></div>
        <div class="field"><label>Sleep quality</label><input type="number" min="1" max="5" id="ci-sleepQ" value="${w.sleepQ ?? ''}" placeholder="1-5"></div>
      </div>
      ${Store.state.settings.hrvEnabled ? `<div class="row">
        <div class="field"><label>HRV (ms)</label><input type="number" id="ci-hrv" value="${w.hrv ?? ''}" placeholder="optional"></div>
        <div class="field"><label>Resting HR</label><input type="number" id="ci-rhr" value="${w.rhr ?? ''}" placeholder="optional"></div></div>` : ''}
      ${scale('soreness', 'Muscle soreness (5 = wrecked)', true)}
      ${scale('energy', 'Energy')}
      ${scale('mood', 'Mood')}
      ${scale('stress', 'Life stress (5 = high)', true)}
      ${scale('motivation', 'Motivation to train')}
      <div class="field"><label>Sharp / localized pain?</label>
        <div class="toggle" id="ci-pain" data-on="${w.pain ? 1 : 0}"><span>No</span><span>Yes</span></div></div>
      <button class="btn" id="ci-save">Save gate</button>`);

    const picked = { ...w };
    $$('[data-scale]').forEach(sc => { const f = sc.getAttribute('data-scale');
      $$('button', sc).forEach(b => b.onclick = () => { $$('button', sc).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); picked[f] = +b.getAttribute('data-v'); }); });
    const pain = $('#ci-pain'); pain.onclick = () => { pain.dataset.on = pain.dataset.on === '1' ? '0' : '1'; pain.classList.toggle('on', pain.dataset.on === '1'); };
    pain.classList.toggle('on', pain.dataset.on === '1');
    $('#ci-save').onclick = () => {
      const num = id => { const v = $('#' + id); return v && v.value !== '' ? +v.value : undefined; };
      const wellness = { cmj: num('ci-cmj'), bodyweightKg: num('ci-bw'), sleepH: num('ci-sleepH'), sleepQ: num('ci-sleepQ'),
        hrv: num('ci-hrv'), rhr: num('ci-rhr'), soreness: picked.soreness, energy: picked.energy, mood: picked.mood,
        stress: picked.stress, motivation: picked.motivation, pain: pain.dataset.on === '1' };
      Store.setDay(date, { wellness });
      // also log CMJ into the test series so trends + diagnostics see it
      if (wellness.cmj != null && !Store.testsFor('cmj').some(t => t.date === date)) Store.addTest('cmj', wellness.cmj, date);
      const d = Store.getDay(date); d.readiness = Engine.readiness(date); Store.save();
      closeModal(); renderToday(); notionSync(date);
    };
  }

  function notionSync(date) {
    if (!NotionSync.enabled()) return;
    NotionSync.syncDay(date)
      .then(res => { if (res && res.done && res.done.length) toast(`Synced to Notion: ${res.done.join(' + ')}`); })
      .catch(err => toast(`Notion sync failed: ${err.message}`, true));
  }
  let toastT;
  function toast(msg, bad) {
    let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
    el.textContent = msg; el.className = bad ? 'bad show' : 'show';
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3200);
  }

  /* ======================================================================
     TAB: LOG
     ==================================================================== */
  function loadPrescribed(date) {
    const dec = Engine.decideDay(date);
    if (!dec.prescribed) return;
    const items = [...dec.prescribed.am.items, ...dec.prescribed.pm.items];
    const exercises = items.map(it => {
      const n = (typeof it.sets === 'number' && it.sets > 0) ? it.sets : 1;
      return { name: it.name, cat: it.cat, target: it, sets: Array.from({ length: n }, () => ({})) };
    });
    const day = Store.getDay(date);
    day.session = { type: dec.day, durationMin: 60, sRPE: dec.arch && dec.arch.load === 'HIGH' ? 7 : 5, exercises, fromTemplate: true };
    Store.save();
  }

  function renderLog() {
    const date = current.date;
    const day = Store.getDay(date);
    if (!day.session) day.session = { type: '', exercises: [], durationMin: 45, sRPE: 6 };
    const s = day.session;

    let html = `<div class="section-title">Session · ${date}</div>`;
    if (!s.exercises.length) {
      const dec = Engine.decideDay(date);
      if (dec.prescribed && (dec.prescribed.am.items.length + dec.prescribed.pm.items.length))
        html += `<button class="btn" id="load-rx" style="margin-bottom:8px">⚡ Load today's prescribed session</button>`;
    }
    html += `<div class="card tight"><div class="row">
      <div class="field" style="margin:0"><label>Duration (min)</label><input type="number" id="s-dur" value="${s.durationMin || ''}"></div>
      <div class="field" style="margin:0"><label>Session RPE (1-10)</label><input type="number" min="1" max="10" id="s-rpe" value="${s.sRPE || ''}"></div></div></div>`;

    if (!s.exercises.length) html += `<div class="empty">No exercises yet. Load the prescription above, or add movements manually —<br>the coach gives feedback after each set.</div>`;

    s.exercises.forEach((ex, ei) => {
      const cat = DATA.CATEGORIES[ex.cat] || {};
      html += `<div class="exline" data-ei="${ei}"><div class="exhead"><span class="nm">${esc(ex.name)}</span><span class="ct">${esc(cat.label || ex.cat)}</span></div>`;
      if (ex.target) { const t = ex.target; const scheme = [t.sets, t.reps].filter(v => v != null && v !== '').join(' × ');
        html += `<div class="rxtarget">Target: ${esc(scheme)}${t.load && t.load !== '—' ? ' · ' + esc(t.load) : ''}${t.rest && t.rest !== '—' ? ' · rest ' + esc(t.rest) : ''}${t.note ? ' · ' + esc(t.note) : ''}</div>`; }
      (ex.sets || []).forEach((set, si) => {
        html += renderSetLine(ex, ei, si, set);
        const adv = Engine.nextSetAdvice(ex, si, ex.sets);
        if (adv.cue && Object.keys(set).length) html += `<div class="setadvice ${/⛔|above target|fatigu|below 2/.test(adv.cue) ? 'warn' : ''}">${esc(adv.cue)}</div>`;
      });
      html += `<button class="btn ghost sm" data-addset="${ei}" style="margin-top:10px">+ Add set</button></div>`;
    });

    html += `<button class="btn ghost" id="add-ex">+ Add exercise</button>`;
    html += `<button class="btn" id="save-session" style="margin-top:10px">Save session</button>`;
    view().innerHTML = html;

    const lrx = $('#load-rx'); if (lrx) lrx.onclick = () => { loadPrescribed(date); renderLog(); };
    $('#s-dur').oninput = e => { s.durationMin = +e.target.value || 0; Store.save(); };
    $('#s-rpe').oninput = e => { s.sRPE = +e.target.value || 0; Store.save(); };
    $('#add-ex').onclick = openExercisePicker;
    $('#save-session').onclick = () => { s.load = Engine.sessionLoad(s); Store.save(); notionSync(current.date); App.go('today'); };
    $$('[data-addset]').forEach(b => b.onclick = () => { const ei = +b.getAttribute('data-addset'); const ex = s.exercises[ei]; ex.sets.push({}); Store.save(); renderLog(); });
    wireSetInputs();
  }

  function renderSetLine(ex, ei, si, set) {
    const fields = (DATA.CATEGORIES[ex.cat] || {}).log || ['load', 'reps', 'rpe'];
    const map = { load: ['load', 'kg'], reps: ['reps', 'reps'], rpe: ['rpe', 'RPE'], velocity: ['velocity', 'm/s'],
      holdSec: ['holdSec', 'sec'], distance: ['distance', 'm'], time: ['time', 'sec'], contacts: ['contacts', '#'], rsi: ['rsi', 'RSI'], minutes: ['minutes', 'min'] };
    const inp = f => `<input data-ei="${ei}" data-si="${si}" data-f="${f}" value="${set[f] ?? ''}" placeholder="${map[f][1]}" inputmode="decimal">`;
    return `<div class="setline"><span class="idx">${si + 1}</span>${fields.map(f => inp(map[f][0])).join('')}</div>`;
  }

  function wireSetInputs() {
    $$('.setline input').forEach(inp => inp.onchange = () => {
      const ei = +inp.getAttribute('data-ei'), si = +inp.getAttribute('data-si'), f = inp.getAttribute('data-f');
      const s = Store.getDay(current.date).session;
      s.exercises[ei].sets[si][f] = inp.value === '' ? undefined : +inp.value;
      Store.save(); renderLog();
    });
  }

  function openExercisePicker() {
    const byCat = {}; DATA.EXERCISES.forEach(e => (byCat[e.cat] = byCat[e.cat] || []).push(e));
    let html = `<h3>Add exercise</h3>`;
    Object.keys(byCat).forEach(cat => {
      html += `<div class="section-title">${esc((DATA.CATEGORIES[cat] || {}).label || cat)}</div><div class="pickgrid">`;
      byCat[cat].forEach(e => html += `<button data-name="${esc(e.name)}" data-cat="${e.cat}">${esc(e.name)}<small>${esc(e.equip)}</small></button>`);
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
     TAB: PROGRESS
     ==================================================================== */
  function renderProgress() {
    let html = `<div class="section-title">Goals · current → 32-wk → North Star</div>`;
    DATA.GOALS.forEach(goal => {
      const p = Engine.projectGoal(goal);
      if (p.status === 'no-data') { html += goalCard(goal, null); return; }
      html += goalCard(goal, p);
    });

    html += `<div class="section-title">Test metrics</div>`;
    html += `<button class="btn ghost" id="log-test" style="margin-bottom:6px">+ Log a test result</button>`;
    const tested = [...new Set(Store.state.tests.map(t => t.metric))];
    if (!tested.length) html += `<div class="empty">No test data yet. Log force-plate, sprint, Keiser, or Stryd numbers to power projections and drift-detection.</div>`;
    else {
      html += `<div class="card">`;
      tested.forEach(mid => {
        const meta = DATA.METRICS.find(m => m.id === mid) || { name: mid, unit: '', lowerBetter: false };
        const hist = Store.testsFor(mid), latest = hist[hist.length - 1], first = hist[0];
        const delta = latest.value - first.value, improved = meta.lowerBetter ? delta < 0 : delta > 0;
        const cls = hist.length < 2 ? 'flat' : improved ? 'pos' : 'neg', arrow = hist.length < 2 ? '' : improved ? '▲' : '▼';
        html += `<div class="stat-row"><div class="l">${esc(meta.name)}<small>${esc(meta.tool || '')}</small>${renderSpark(hist.map(h => h.value))}</div>
          <div class="r">${latest.value}${esc(meta.unit)}<small class="${cls}">${arrow} ${hist.length > 1 ? (delta > 0 ? '+' : '') + delta.toFixed(2) : 'baseline'}</small></div></div>`;
      });
      html += `</div>`;
    }
    view().innerHTML = html;
    $('#log-test').onclick = openTestLogger;
  }

  function goalCard(goal, p) {
    const cur = p ? p.current : goal.current;
    const ck = goal.checkpoint ? `${fmtGoal(goal, goal.checkpoint[0])}–${fmtGoal(goal, goal.checkpoint[1])}` : '—';
    const ns = goal.northStar != null ? fmtGoal(goal, goal.northStar) : '—';
    let eta;
    if (!p) eta = `Set current in <b>You</b> tab or log a test →`;
    else if (p.trendPoints < 2) eta = `Log another test to project a trend.`;
    else if (p.improving && p.etaCkWeeks != null) eta = `On trend: ~<b>${p.etaCkWeeks} wk</b> to checkpoint · ${p.perWeek > 0 ? '+' : ''}${p.perWeek}${goal.unit === 's' ? 's' : goal.unit}/wk`;
    else if (p.improving) eta = `Improving — rate too small to project reliably.`;
    else eta = `⚠️ Plateau/regressing — this quality needs its block to move.`;
    const pct = p ? p.pct : 0;
    return `<div class="goal"><div class="top"><span class="name">${esc(goal.name)}</span><span class="tgt">NS ${ns}</span></div>
      <div class="now">${fmtGoal(goal, cur)}</div>
      <div class="prog"><i style="width:${pct}%"></i></div>
      <div class="eta">${eta}</div>
      <div class="ckrow"><span>32-wk checkpoint: <b>${ck}</b></span></div>
      <div class="limiters">${goal.limiters.map(l => `<span>${esc(l)}</span>`).join('')}</div></div>`;
  }

  function renderSpark(vals) {
    if (vals.length < 2) return '';
    const lo = Math.min(...vals), hi = Math.max(...vals), rng = hi - lo || 1;
    return `<div class="spark">${vals.map((v, i) => `<i class="${i === vals.length - 1 ? 'last' : ''}" style="height:${10 + ((v - lo) / rng) * 90}%"></i>`).join('')}</div>`;
  }

  function openTestLogger() {
    const byTool = {}; DATA.METRICS.forEach(m => (byTool[m.tool] = byTool[m.tool] || []).push(m));
    let opts = '';
    Object.keys(byTool).forEach(tool => opts += `<optgroup label="${esc(tool)}">${byTool[tool].map(m => `<option value="${m.id}">${esc(m.name)} (${esc(m.unit || 'ratio')})</option>`).join('')}</optgroup>`);
    modal(`<h3>Log test result</h3>
      <div class="field"><label>Metric</label><select id="t-metric">${opts}</select></div>
      <div class="row"><div class="field"><label>Value</label><input type="number" step="0.01" id="t-val" placeholder="e.g. 34.5"></div>
      <div class="field"><label>Date</label><input type="date" id="t-date" value="${today()}"></div></div>
      <button class="btn" id="t-save">Save result</button>`);
    $('#t-save').onclick = () => { const metric = $('#t-metric').value, val = $('#t-val').value, d = $('#t-date').value || today();
      if (val === '') return; Store.addTest(metric, val, d); closeModal(); renderProgress(); };
  }

  /* ======================================================================
     TAB: COACH
     ==================================================================== */
  function renderCoach() {
    const date = current.date;
    const dec = Engine.decideDay(date);
    const phase = dec.phase, r = dec.readiness, acw = Engine.acwr(date), wk = Engine.weeklyReport(date);
    let html = '';

    // Chat = logger (works offline) + optional live AI coach
    const ai = AICoach.enabled();
    html += `<div class="section-title">Chat your day — I'll log it</div>`;
    html += `<div class="card tight"><div id="chatlog" class="chatlog">${renderChatLog()}</div>
        <div class="chatbar"><input id="chatin" placeholder="e.g. slept 7h, HRV 58, squats 5×3 @90 RPE8, felt good…" autocomplete="off">
        <button id="chatsend" class="chatsend">➤</button></div>
        <div class="chatmeta"><span class="muted small">${ai ? esc(AICoach.model()) + ' · logs + coaches' : 'on-device parser · no key needed'}</span>
        <button id="chatclear" class="linkbtn">clear</button></div></div>`;
    html += `<div class="chip-row" id="log-examples">
        <button class="chip" data-fill="Slept 7.5h, HRV 58, resting HR 49, CMJ 33, bodyweight 77, felt good">Morning check-in</button>
        <button class="chip" data-fill="Front squat 4×4 @100kg RPE8, RDL 4×6 @75kg, 1000m tempo RPE7, 12 depth jumps RSI 2.3, session 7">Log a session</button>
      </div>`;
    if (!ai) html += `<div class="card tight small muted" style="margin-top:8px">Want it to talk back with coaching too? Add an Anthropic API key in <b>You</b> — logging works either way.</div>`;

    html += `<div class="section-title">Your coach</div>`;

    const brief = [];
    if (r) brief.push(`Readiness <strong>${r.score}</strong> (${r.band}). ${esc(dec.headline)}`);
    else brief.push(`Run the morning gate (HRV + 3× CMJ) — two taps in <strong>Today</strong> — before I can read recovery.`);
    if (acw.ratio != null) { const z = acw.ratio > 1.5 ? 'a danger spike' : acw.ratio > 1.3 ? 'slightly elevated' : acw.ratio < 0.8 ? 'low (taper or gap)' : 'right in the sweet spot';
      brief.push(`Acute:chronic workload <strong>${acw.ratio}</strong> — ${z}. Acute ${acw.acute}, chronic ${acw.chronic} AU.`); }
    if (dec.deload) brief.push(`This is a <strong>deload week</strong> (wk ${dec.wk}) — ~40% volume, intensity held. Re-test baselines before the next phase.`);
    html += coachMsg('Daily briefing', brief);

    // Block strategy
    const primary = (DATA.CATEGORIES[phase.primary] || {}).label || phase.primary;
    const secs = phase.secondary.map(s => (DATA.CATEGORIES[s] || {}).label || s).join(', ');
    html += coachMsg('This block', [
      `<strong>Phase ${phase.id}: ${esc(phase.name)}</strong>${dec.wk ? `, week ${dec.wk} of 32` : ''}. ${esc(phase.mission)}`,
      `Driver: <strong>${esc(phase.driver)}</strong> (${esc(primary)}). Hold <strong>${esc(secs)}</strong> at minimum effective dose — enough to maintain, not enough to fatigue.`,
      `Weekly diagnostic: <strong>${esc(phase.diagName)}</strong>. If it drops two weeks running, the MED dose for that quality was too low — add a session immediately, don't wait for the phase transition.`,
      `Lifting band this phase: <strong>${phase.weightPct[0]}–${phase.weightPct[1]}%</strong>. High-CNS work stays clustered Mon/Wed/Fri so those days are truly hard and the rest genuinely easy.`,
    ]);

    // Diagnostic drift
    const drift = Engine.diagnosticDrift(phase.diagnostic);
    if (drift && drift.declining) {
      const meta = DATA.METRICS.find(m => m.id === phase.diagnostic) || { name: phase.diagnostic };
      html += coachMsg('⚠ Drift alert', [`<strong>${esc(meta.name)}</strong> has declined two tests running (${drift.prev} → ${drift.latest}). That's your early warning — add one maintenance session of this quality now.`]);
    }

    // 80/20 check
    const hardDays = Store.lastNDays(7, date).filter(d => d.session && (d.session.sRPE || 0) >= 7).length;
    if (hardDays >= 4) html += coachMsg('Intensity distribution', [`<strong>${hardDays} hard days</strong> in the last 7. The whole system runs ~80/20 — grey-zone days (medium-hard every day) guarantee mediocrity in every quality at once. Make one of those a genuine Z2.`]);

    // Goal watch
    const stalled = DATA.GOALS.map(g => Engine.projectGoal(g)).filter(p => p.status === 'ok' && p.trendPoints >= 2 && p.improving === false);
    if (stalled.length) html += coachMsg('Goal watch', [`Flat or slipping: <strong>${stalled.map(p => p.goal.name).join(', ')}</strong>. These won't move as maintenance — each needs to be the rotating primary in an upcoming block.`]);

    // Weekly compliance
    html += `<div class="section-title">This week vs plan</div><div class="card">`;
    wk.items.forEach(it => { const [lo, hi] = it.target, pct = Math.min(100, (it.val / hi) * 100);
      const col = it.band === 'on' ? 'var(--green)' : it.band === 'under' ? 'var(--amber)' : 'var(--red)';
      html += `<div class="comp-item"><div class="cl">${esc(it.label)}</div><div class="cbar"><i style="width:${pct}%;background:${col}"></i></div>
        <div class="cv">${it.val}${esc(it.unit)} <span class="tag ${it.band}">${it.band}</span></div></div>
        <div class="note" style="margin-left:120px;margin-top:-6px">target ${lo}–${hi}${esc(it.unit)}</div>`; });
    html += `</div>`;

    // Zones + nutrition
    const hm = Store.state.profile.hrMax;
    html += `<div class="section-title">HR zones (%HRmax ${hm})</div><div class="card">`;
    DATA.ZONES.forEach(z => html += `<div class="stat-row"><div class="l">${esc(z.id)} · ${esc(z.name)}<small>${z.pct[0]}–${z.pct[1]}% HRmax</small></div><div class="r">${Math.round(z.pct[0] / 100 * hm)}–${Math.round(z.pct[1] / 100 * hm)} bpm</div></div>`);
    html += `</div>`;
    const cp = Store.state.profile.criticalPower;
    if (cp) {
      html += `<div class="section-title">Stryd power zones (CP ${cp} W)</div><div class="card">`;
      DATA.STRYD_ZONES.forEach(z => html += `<div class="stat-row"><div class="l">${esc(z.id)} · ${esc(z.name)}<small>${Math.round(z.pct[0] * 100)}–${Math.round(z.pct[1] * 100)}% CP</small></div><div class="r">${Math.round(z.pct[0] * cp)}–${Math.round(z.pct[1] * cp)} W</div></div>`);
      html += `</div>`;
    }
    html += coachMsg('Fuel & recovery', [
      `Protein ${esc(DATA.NUTRITION.protein)}.`,
      `Carbs periodized to load — ${esc(DATA.NUTRITION.carbsHigh)}, ${esc(DATA.NUTRITION.carbsLow)}.`,
      `Peri: ${esc(DATA.NUTRITION.peri)}.`,
      `Micros: ${esc(DATA.NUTRITION.micros)}.`,
    ]);

    html += `<div class="card tight center small muted">Built-in coaching engine — runs offline, follows your 32-week program, readiness gate, and workload rules. No data leaves this device.</div>`;
    view().innerHTML = html;
    wireChat();
  }

  function coachMsg(who, lines) { return `<div class="coach-msg"><div class="who">${esc(who)}</div>${lines.map(l => `<p>${l}</p>`).join('')}</div>`; }

  /* ---- Chat / logger ---------------------------------------------------- */
  function renderChatLog() {
    const chat = Store.state.chat || [];
    if (!chat.length) return `<div class="chatempty">Type your day in plain words — <b>"slept 7h, HRV 58, front squat 4×4 @100 RPE8, 1000m tempo, felt good"</b> — and I'll log it to your journal. Ask me anything too.</div>`;
    return chat.map(m => m.role === 'log'
      ? m.content // pre-built, already-escaped HTML card
      : `<div class="bubble ${m.role}">${esc(m.content).replace(/\n/g, '<br>')}</div>`).join('');
  }

  // Build the "✅ Logged" confirmation card from a NaturalLog.apply() result
  function logCard(date, res) {
    const chips = [];
    const W = res.wellness;
    const lab = { sleepH: 'Sleep', sleepQ: 'Sleep q', hrv: 'HRV', rhr: 'Rest HR', cmj: 'CMJ',
      bodyweightKg: 'BW', energy: 'Energy', mood: 'Mood', stress: 'Stress', soreness: 'Sore', motivation: 'Motiv' };
    const unit = { sleepH: 'h', cmj: ' cm', bodyweightKg: ' kg' };
    Object.keys(lab).forEach(k => { if (W[k] != null) chips.push(`<span class="lchip">${lab[k]} <b>${W[k]}${unit[k] || ''}</b></span>`); });

    let exRows = '';
    res.exercises.forEach(ex => {
      const s0 = ex.sets[0] || {};
      const scheme = ex.sets.length > 1 && s0.reps != null ? `${ex.sets.length}×${s0.reps}`
        : (s0.distance ? `${s0.distance} m` : s0.reps != null ? `${s0.reps}` : s0.minutes ? `${s0.minutes} min` : '—');
      const load = s0.load != null ? `${s0.load} kg` : '—';
      const extra = [s0.rpe != null ? 'RPE ' + s0.rpe : '', s0.rsi != null ? 'RSI ' + s0.rsi : '', s0.velocity != null ? s0.velocity + ' m/s' : '']
        .filter(Boolean).join(' · ') || '—';
      exRows += `<tr><td>${esc(ex.name)}</td><td>${scheme}</td><td>${load}</td><td>${extra}</td></tr>`;
    });

    const r = res.readiness;
    const bandCol = r ? (r.band === 'green' ? 'var(--green)' : r.band === 'amber' ? 'var(--amber)' : 'var(--red)') : 'var(--muted)';
    const badge = r ? `<span class="lband" style="background:${bandCol}">${r.band.toUpperCase()} · ${r.score}</span>` : '';

    return `<div class="logcard">
      <div class="lhead">✅ Logged <span class="muted">· ${esc(date)}</span> ${badge}</div>
      ${chips.length ? `<div class="lchips">${chips.join('')}</div>` : ''}
      ${exRows ? `<table class="ltable"><thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Detail</th></tr></thead><tbody>${exRows}</tbody></table>` : ''}
      ${res.sRPE != null ? `<div class="small muted" style="margin-top:6px">Session RPE ${res.sRPE}</div>` : ''}
      <div class="small muted" style="margin-top:6px">Saved to your journal${NotionSync.enabled() ? ' · syncing to Notion' : ''}. See <b>Today</b> &amp; <b>Progress</b>.</div>
    </div>`;
  }

  function wireChat() {
    const inp = $('#chatin'); if (!inp) return;
    const log = $('#chatlog'), sendBtn = $('#chatsend'), clearBtn = $('#chatclear');
    const scroll = () => { log.scrollTop = log.scrollHeight; };
    scroll();
    if (clearBtn) clearBtn.onclick = () => { Store.state.chat = []; Store.save(); renderCoach(); };
    $$('#log-examples .chip').forEach(b => b.onclick = () => { inp.value = b.getAttribute('data-fill'); inp.focus(); });

    const submit = async () => {
      const text = inp.value.trim(); if (!text) return;
      inp.value = ''; inp.disabled = true; sendBtn.disabled = true;
      Store.state.chat.push({ role: 'user', content: text });

      // 1) Try to log it (on-device, no key needed)
      let logged = null;
      try { logged = NaturalLog.apply(current.date, text); } catch (e) { console.warn('parse failed', e); }
      if (logged && logged.captured) {
        Store.state.chat.push({ role: 'log', content: logCard(current.date, logged) });
        Store.save();
        try { notionSync(current.date); } catch (_) {}
      }

      // 2) Optionally get a coaching reply from the live AI
      if (AICoach.enabled()) {
        log.innerHTML = renderChatLog() + `<div class="bubble assistant" id="streaming"><span class="dots">●●●</span></div>`;
        scroll();
        const bubble = $('#streaming');
        const history = Store.state.chat.filter(m => m.role === 'user' || m.role === 'assistant').slice(0, -1);
        const prompt = logged && logged.captured
          ? `I just logged: "${text}". Give me one or two sharp coaching sentences on it — readiness call, what it means for today, or the next cue. Don't restate what I logged.`
          : text;
        await AICoach.send(history, prompt, {
          onDelta: (_d, acc) => { bubble.innerHTML = esc(acc).replace(/\n/g, '<br>'); scroll(); },
          onDone: (full) => { Store.state.chat.push({ role: 'assistant', content: full || '(no response)' }); Store.save(); inp.disabled = false; sendBtn.disabled = false; renderCoach(); },
          onError: (err) => { bubble.innerHTML = `<span style="color:var(--red)">⚠ ${esc(err.message)}</span>`; if (!(logged && logged.captured)) Store.state.chat.pop(); Store.save(); inp.disabled = false; sendBtn.disabled = false; renderCoach(); },
        });
        return;
      }

      // 3) No AI key: if nothing was captured, nudge with an example
      if (!(logged && logged.captured)) {
        Store.state.chat.push({ role: 'assistant', content: "I didn't catch anything to log there. Try something like:\n“slept 7h, HRV 58, front squat 4×4 @100kg RPE8, 1000m tempo RPE7, felt good”" });
        Store.save();
      }
      inp.disabled = false; sendBtn.disabled = false; renderCoach();
    };
    sendBtn.onclick = submit;
    inp.onkeydown = e => { if (e.key === 'Enter') submit(); };
  }

  /* ======================================================================
     TAB: YOU / SETTINGS
     ==================================================================== */
  function renderSettings() {
    const p = Store.state.profile;
    const variantOpts = Object.entries(PROGRAM.VARIANTS).map(([k, v]) => `<option value="${k}" ${p.variant === k ? 'selected' : ''}>${esc(v.name)}</option>`).join('');
    const phaseOpts = DATA.PHASES.map(ph => `<option value="${ph.id}" ${ph.id === p.phaseId ? 'selected' : ''}>Phase ${ph.id}: ${ph.name}</option>`).join('');
    const wkNow = Engine.programWeek(today());

    let html = `<div class="section-title">Athlete</div><div class="card">
      <div class="field"><label>Name</label><input id="p-name" value="${esc(p.name)}" placeholder="Your name"></div>
      <div class="row">
        <div class="field"><label>Bodyweight (kg)</label><input type="number" step="0.1" id="p-bw" value="${p.bodyweightKg || ''}"></div>
        <div class="field"><label>HR max</label><input type="number" id="p-hrmax" value="${p.hrMax || ''}"></div></div>
      <div class="field"><label>Stryd Critical Power (W) — re-anchor zones after testing</label><input type="number" id="p-cp" value="${p.criticalPower ?? ''}" placeholder="optional"></div>
    </div>`;

    html += `<div class="section-title">32-week program</div><div class="card">
      <div class="field"><label>Week 1 start date${wkNow ? ` — you're on week ${wkNow}` : ''}</label><input type="date" id="p-start" value="${p.startDateISO || ''}"></div>
      ${!p.startDateISO ? `<div class="field"><label>…or set phase manually</label><select id="p-phase">${phaseOpts}</select></div>` : ''}
      <div class="field"><label>Phase-5 sport variant (A-race)</label><select id="p-variant">${variantOpts}</select></div>
      <div class="field"><label>A-race date</label><input type="date" id="p-gdate" value="${p.goalDateISO || ''}"></div>
    </div>`;

    html += `<div class="section-title">Current marks</div><div class="card">`;
    DATA.GOALS.forEach(g => { const v = Store.state.bests[g.id] ?? g.current ?? '';
      html += `<div class="field" style="margin:8px 0"><label>${esc(g.name)} <span class="muted">(NS ${g.northStar != null ? fmtGoal(g, g.northStar) : '—'})</span></label>
        <input type="number" step="0.01" data-best="${g.id}" value="${v}" placeholder="${g.unit === 's' ? 'seconds' : g.unit}"></div>`; });
    html += `</div>`;

    html += `<div class="section-title">Settings</div><div class="card">
      <div class="stat-row"><div class="l">Track HRV / resting HR</div><div class="r"><input type="checkbox" id="set-hrv" ${Store.state.settings.hrvEnabled ? 'checked' : ''} style="width:auto"></div></div></div>`;

    const models = [['claude-opus-4-8', 'Opus 4.8 — sharpest coaching'], ['claude-sonnet-5', 'Sonnet 5 — faster / cheaper'], ['claude-haiku-4-5', 'Haiku 4.5 — cheapest']];
    html += `<div class="section-title">Live AI coach (optional)</div><div class="card">
      <div class="field"><label>Anthropic API key</label><input type="password" id="ai-key" value="${esc(Store.state.settings.aiKey)}" placeholder="sk-ant-..." autocomplete="off"></div>
      <div class="field"><label>Model</label><select id="ai-model">${models.map(([v, l]) => `<option value="${v}" ${Store.state.settings.aiModel === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
      <p class="small muted" style="margin:6px 0 0">Enables the conversational coach in the <b>Coach</b> tab. Your key is stored only on this device and sent only to api.anthropic.com. Chat costs per use, billed to your Anthropic account. Get a key at console.anthropic.com.</p>
    </div>`;

    html += `<div class="section-title">Notion dashboard</div><div class="card">
      <p class="small muted" style="margin:0 0 10px">Mirror your logs into the Notion databases. <b>Export CSV</b> works with zero setup — in Notion open a database → ••• → Merge with CSV.</p>
      <div class="btn-row"><button class="btn ghost sm" id="nx-csv-read">Readiness CSV</button><button class="btn ghost sm" id="nx-csv-sess">Sessions CSV</button></div>
      <hr class="hr">
      <p class="small muted" style="margin:0 0 8px">Or auto-push every log via your Cloudflare Worker proxy (see <b>notion-worker.js</b> in the repo).</p>
      <div class="field"><label>Worker URL</label><input id="nx-url" value="${esc(Store.state.settings.notionUrl)}" placeholder="https://apex-notion.you.workers.dev"></div>
      <div class="field"><label>Shared key (APEX_KEY)</label><input type="password" id="nx-key" value="${esc(Store.state.settings.notionKey)}" placeholder="your shared secret"></div>
      <button class="btn ghost sm" id="nx-test" style="width:100%">Sync today to Notion now</button>
    </div>`;

    html += `<div class="section-title">Data</div><div class="card">
      <div class="btn-row"><button class="btn ghost sm" id="d-export">Export backup</button><button class="btn ghost sm" id="d-import">Import</button></div>
      <button class="btn ghost sm" id="d-reset" style="margin-top:10px;color:var(--red);width:100%">Reset all data</button></div>`;
    html += `<div class="center small muted" style="margin:20px 0">APEX · KNCT Hybrid Apex System · private on-device</div>`;

    view().innerHTML = html;
    $('#p-name').onchange = e => Store.setProfile({ name: e.target.value });
    $('#p-bw').onchange = e => Store.setProfile({ bodyweightKg: +e.target.value });
    $('#p-hrmax').onchange = e => Store.setProfile({ hrMax: +e.target.value });
    $('#p-cp').onchange = e => Store.setProfile({ criticalPower: e.target.value === '' ? null : +e.target.value });
    $('#p-start').onchange = e => { Store.setProfile({ startDateISO: e.target.value }); App.updatePhasePill(); renderSettings(); };
    const ph = $('#p-phase'); if (ph) ph.onchange = e => { Store.setProfile({ phaseId: +e.target.value }); App.updatePhasePill(); };
    $('#p-variant').onchange = e => Store.setProfile({ variant: e.target.value });
    $('#p-gdate').onchange = e => Store.setProfile({ goalDateISO: e.target.value });
    $$('[data-best]').forEach(inp => inp.onchange = () => { if (inp.value !== '') Store.setBest(inp.getAttribute('data-best'), inp.value); });
    $('#set-hrv').onchange = e => { Store.state.settings.hrvEnabled = e.target.checked; Store.save(); };
    $('#ai-key').onchange = e => { Store.state.settings.aiKey = e.target.value.trim(); Store.save(); };
    $('#ai-model').onchange = e => { Store.state.settings.aiModel = e.target.value; Store.save(); };
    $('#nx-url').onchange = e => { Store.state.settings.notionUrl = e.target.value.trim(); Store.save(); };
    $('#nx-key').onchange = e => { Store.state.settings.notionKey = e.target.value.trim(); Store.save(); };
    $('#nx-csv-read').onclick = () => NotionSync.download(`apex-readiness-${today()}.csv`, NotionSync.readinessCSV());
    $('#nx-csv-sess').onclick = () => NotionSync.download(`apex-sessions-${today()}.csv`, NotionSync.sessionCSV());
    $('#nx-test').onclick = () => {
      if (!NotionSync.enabled()) { toast('Add the Worker URL and shared key first', true); return; }
      NotionSync.syncDay(today(), { force: true })
        .then(res => toast(res.done && res.done.length ? `Synced: ${res.done.join(' + ')}` : 'Nothing to sync today'))
        .catch(err => toast(`Failed: ${err.message}`, true));
    };
    $('#d-export').onclick = doExport; $('#d-import').onclick = doImport;
    $('#d-reset').onclick = () => { if (confirm('Erase all logged data? This cannot be undone.')) { Store.reset(); App.go('today'); App.updatePhasePill(); } };
  }

  function doExport() { const blob = new Blob([Store.exportJSON()], { type: 'application/json' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `apex-backup-${today()}.json`; a.click(); URL.revokeObjectURL(url); }
  function doImport() { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = () => { const f = inp.files[0]; if (!f) return; const rd = new FileReader();
      rd.onload = () => { try { Store.importJSON(rd.result); App.go('today'); App.updatePhasePill(); alert('Backup restored.'); } catch (e) { alert('Invalid backup file.'); } }; rd.readAsText(f); }; inp.click(); }

  function modal(inner) { $('#modalRoot').innerHTML = `<div class="modal-bg"><div class="modal"><div class="grab"></div>${inner}</div></div>`;
    $('.modal-bg').onclick = e => { if (e.target.classList.contains('modal-bg')) closeModal(); }; }
  function closeModal() { $('#modalRoot').innerHTML = ''; }

  return { setDate: d => { current.date = d; }, get date() { return current.date; },
    renderToday, renderLog, renderProgress, renderCoach, renderSettings, fmtGoal };
})();
