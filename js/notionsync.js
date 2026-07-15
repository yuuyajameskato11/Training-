/* ============================================================================
   notionsync.js — Push logs to the Notion dashboard.
   Notion's API blocks direct browser calls (CORS) and needs a secret token,
   so this offers two paths:
     1) CSV export per database (zero setup — import/merge into Notion).
     2) Auto-push via a user-deployed Cloudflare Worker proxy that holds the
        Notion token and adds CORS (see worker.js + README).
   Column names + database IDs match the databases created in the workspace.
   ========================================================================== */

const NotionSync = (() => {
  // Database IDs of the dashboard created in "KNCT Hybrid Apex System".
  const DB = {
    readiness:  'ee69e5cfd78e413088a5555984c3c90e',
    session:    '4cae33d7550d451fbafe523ead9c82d0',
    diagnostic: '99d0a7652c11469c9d702624d61418bf',
    baseline:   '495c0eeed8e64ef292eb0f51f4de4cd6',
  };

  const enabled = () => !!(Store.state.settings.notionUrl && Store.state.settings.notionKey);

  /* ---- Notion native property builders --------------------------------- */
  const P = {
    title: v => ({ title: [{ text: { content: String(v ?? '') } }] }),
    text:  v => ({ rich_text: [{ text: { content: String(v ?? '') } }] }),
    num:   v => ({ number: (v == null || v === '' || isNaN(v)) ? null : Number(v) }),
    date:  v => ({ date: v ? { start: v } : null }),
    sel:   v => ({ select: v ? { name: String(v) } : null }),
    check: v => ({ checkbox: !!v }),
  };

  /* ---- Summarize a logged session into the DB2 text columns ------------ */
  function summarizeSession(session) {
    const out = { lifts: [], sprints: [], cond: [], plyo: 0, rsi: 0 };
    (session.exercises || []).forEach(ex => {
      const sets = (ex.sets || []).filter(s => Object.keys(s).length);
      if (['strength', 'power', 'iso'].includes(ex.cat)) {
        const parts = sets.map(s => [s.load && s.load + 'kg', s.reps && '×' + s.reps, s.velocity && '@' + s.velocity + 'm/s', s.rpe && ' RPE' + s.rpe].filter(Boolean).join('')).join(', ');
        out.lifts.push(`${ex.name}${parts ? ' ' + parts : ''}`);
      } else if (ex.cat === 'speed') {
        const parts = sets.map(s => [s.distance && s.distance + 'm', s.reps && '×' + s.reps, s.time && ' ' + s.time + 's'].filter(Boolean).join('')).join(', ');
        out.sprints.push(`${ex.name}${parts ? ' ' + parts : ''}`);
      } else if (['zone2', 'threshold', 'vo2'].includes(ex.cat)) {
        const mins = sets.reduce((a, s) => a + (parseFloat(s.minutes) || 0), 0);
        out.cond.push(`${ex.name}${mins ? ' ' + mins + 'min' : ''}`);
      } else if (ex.cat === 'plyo') {
        sets.forEach(s => { out.plyo += parseFloat(s.contacts) || 0; out.rsi = Math.max(out.rsi, parseFloat(s.rsi) || 0); });
      }
    });
    return out;
  }

  /* ---- Build Notion page bodies from a day ----------------------------- */
  function readinessProps(date) {
    const day = Store.getDay(date); const w = day.wellness; if (!w) return null;
    const r = Engine.readiness(date);
    const subj = w.energy || w.mood || w.motivation ? Math.round(((((w.energy || 3) + (w.mood || 3) + (w.motivation || 3)) / 3 + ((6 - (w.soreness || 3)) + (6 - (w.stress || 3))) / 2) / 2) * 2 * 10) / 10 : null;
    // cmj vs baseline %
    let cmjPct = null;
    const hist = Store.testsFor('cmj').filter(t => t.date < date).map(t => t.value);
    if (typeof w.cmj === 'number' && hist.length >= 3) { const base = hist.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, hist.length); cmjPct = +(((w.cmj - base) / base) * 100).toFixed(1); }
    return {
      'Day': P.title(date), 'Date': P.date(date), 'HRV (ms)': P.num(w.hrv), 'Morning CMJ (cm)': P.num(w.cmj),
      'CMJ vs baseline %': P.num(cmjPct), 'Resting HR': P.num(w.rhr), 'Sleep (h)': P.num(w.sleepH),
      'Subjective (1-10)': P.num(subj), 'Bodyweight (kg)': P.num(w.bodyweightKg), 'Status': P.sel(r ? r.band : null),
    };
  }
  function sessionProps(date) {
    const day = Store.getDay(date); const s = day.session; if (!s || !(s.exercises || []).length) return null;
    const sum = summarizeSession(s); const phase = Engine.currentPhase(date); const arch = DATA.WEEK_ARCH.find(a => a.day === Engine.weekdayOf(date));
    return {
      'Session': P.title(`${date} · ${s.type || Engine.weekdayOf(date)}`), 'Date': P.date(date), 'Phase': P.num(phase.id),
      'Session type': P.text(arch ? arch.load : ''), 'Main lifts (load/velocity)': P.text(sum.lifts.join('; ')),
      'Sprint reps (dist/time/OVR)': P.text(sum.sprints.join('; ')), 'Plyo contacts': P.num(sum.plyo || null),
      'RSI': P.num(sum.rsi || null), 'Conditioning (min/HR/power)': P.text(sum.cond.join('; ')),
      'Session RPE': P.num(s.sRPE), 'Notes': P.text(s.notes || ''),
    };
  }

  /* ---- POST one page through the proxy --------------------------------- */
  async function push(dbId, properties) {
    const res = await fetch(Store.state.settings.notionUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-apex-key': Store.state.settings.notionKey },
      body: JSON.stringify({ parent: { database_id: dbId }, properties }),
    });
    if (!res.ok) { let m = `HTTP ${res.status}`; try { const e = await res.json(); m = (e.message || (e.error && e.error.message)) || m; } catch (_) {} throw new Error(m); }
    return res.json();
  }

  /* ---- Sync a day's readiness + session (idempotent via flags) --------- */
  async function syncDay(date, { force = false } = {}) {
    if (!enabled()) return { skipped: true };
    const day = Store.getDay(date); day.synced = day.synced || {};
    const done = [];
    const rp = readinessProps(date);
    if (rp && (force || !day.synced.readiness)) { await push(DB.readiness, rp); day.synced.readiness = true; done.push('readiness'); }
    const sp = sessionProps(date);
    if (sp && (force || !day.synced.session)) { await push(DB.session, sp); day.synced.session = true; done.push('session'); }
    Store.save();
    return { done };
  }

  /* ---- CSV export (zero setup) ----------------------------------------- */
  const esc = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  function toCSV(headers, rows) { return [headers.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n'); }

  function readinessCSV() {
    const H = ['Day', 'Date', 'HRV (ms)', 'Morning CMJ (cm)', 'CMJ vs baseline %', 'Resting HR', 'Sleep (h)', 'Subjective (1-10)', 'Bodyweight (kg)', 'Status'];
    const rows = Store.allDaysSorted().filter(d => d.wellness).map(d => {
      const p = readinessProps(d.date);
      const val = (key, type) => { const o = p[key][type]; return type === 'number' ? (o ?? '') : type === 'title' || type === 'rich_text' ? (o[0] ? o[0].text.content : '') : type === 'date' ? (o ? o.start : '') : type === 'select' ? (o ? o.name : '') : ''; };
      return [val('Day', 'title'), val('Date', 'date'), val('HRV (ms)', 'number'), val('Morning CMJ (cm)', 'number'), val('CMJ vs baseline %', 'number'), val('Resting HR', 'number'), val('Sleep (h)', 'number'), val('Subjective (1-10)', 'number'), val('Bodyweight (kg)', 'number'), val('Status', 'select')];
    });
    return toCSV(H, rows);
  }
  function sessionCSV() {
    const H = ['Session', 'Date', 'Phase', 'Session type', 'Main lifts (load/velocity)', 'Sprint reps (dist/time/OVR)', 'Plyo contacts', 'RSI', 'Conditioning (min/HR/power)', 'Session RPE', 'Notes'];
    const rows = Store.allDaysSorted().filter(d => d.session && (d.session.exercises || []).length).map(d => {
      const p = sessionProps(d.date); const t = (k, ty) => { const o = p[k][ty]; return ty === 'number' ? (o ?? '') : ty === 'title' || ty === 'rich_text' ? (o[0] ? o[0].text.content : '') : ty === 'date' ? (o ? o.start : '') : ''; };
      return [t('Session', 'title'), t('Date', 'date'), t('Phase', 'number'), t('Session type', 'rich_text'), t('Main lifts (load/velocity)', 'rich_text'), t('Sprint reps (dist/time/OVR)', 'rich_text'), t('Plyo contacts', 'number'), t('RSI', 'number'), t('Conditioning (min/HR/power)', 'rich_text'), t('Session RPE', 'number'), t('Notes', 'rich_text')];
    });
    return toCSV(H, rows);
  }
  function download(name, text) {
    const blob = new Blob([text], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  }

  return { DB, enabled, syncDay, readinessCSV, sessionCSV, download };
})();
