/* ============================================================================
   coach.js — Live Claude AI chat coach (optional layer over the built-in engine).
   Calls the Anthropic Messages API directly from the browser. The API key is
   stored only in this device's localStorage and sent only to api.anthropic.com.
   Streams responses via SSE. The system prompt is prompt-cached to cut cost.
   ========================================================================== */

const AICoach = (() => {
  const API = 'https://api.anthropic.com/v1/messages';
  const VERSION = '2023-06-01';

  function enabled() { return !!(Store.state.settings.aiKey); }
  function model() { return Store.state.settings.aiModel || 'claude-opus-4-8'; }

  /* ---- Build the coaching system prompt from the athlete's live data ----- */
  function buildSystem(date) {
    const p = Store.state.profile;
    const dec = Engine.decideDay(date);
    const r = dec.readiness;
    const phase = dec.phase;
    const acw = Engine.acwr(date);
    const wk = Engine.weeklyReport(date);

    const line = [];
    line.push(`You are an elite strength & conditioning coach — the kind a professional athlete pays a fortune for. You coach ${p.name || 'this athlete'} through the KNCT Hybrid Apex System: a 32-week conjugate-block hybrid targeting elite sprint, middle-distance, endurance and jump qualities at once.`);
    line.push(`Your voice: direct, precise, evidence-based, encouraging but never fluffy. Reference the athlete's ACTUAL numbers below. Give specific, actionable guidance — loads, paces, rest, recovery, per-set cues. Keep replies tight (a few sentences to a short list) unless asked for depth. Never invent data you don't have; if you need a number, tell them what to log.`);
    line.push('');
    line.push('## Coaching system (fixed logic)');
    line.push('- Readiness gate: CMJ vs rolling baseline is primary (within 5% green / 5–10% amber / >10% red), with hard gates (RHR +7, sleep <6h, subjective <5/10, overnight bodyweight >2% drop, sharp pain). One gate → amber, two → red. Red on a high-CNS day = convert to Z1 + mobility, no CNS work.');
    line.push('- High/Low weekly architecture: CNS-intensive work clustered Mon/Wed/Fri; keep easy days genuinely easy (80/20).');
    line.push('- One primary quality drives each block; three secondaries held at minimum effective dose; one weekly diagnostic guards against drift.');
    line.push('- Per-set auto-regulation: power/speed stops when velocity drops past threshold; strength holds a target RPE band; plyos watch RSI.');
    line.push('');
    line.push('## Today');
    line.push(`- Date ${date}, ${dec.day}, ${dec.arch ? dec.arch.load + ' day' : ''}. Program week ${dec.wk ?? '—'} of 32, Phase ${phase.id}: ${phase.name} (${phase.driver}).${dec.deload ? ' DELOAD WEEK (~40% volume, intensity held).' : ''}`);
    if (r) {
      line.push(`- Readiness ${r.score}/100 (${r.band}). ${dec.headline}`);
      if (r.gates && r.gates.length) line.push(`- Hard gates triggered: ${r.gates.join('; ')}.`);
      r.components.forEach(c => line.push(`- ${c.key}: ${c.note}`));
    } else {
      line.push('- No morning readiness gate logged yet today.');
    }
    if (acw.ratio != null) line.push(`- Acute:chronic workload ${acw.ratio} (acute ${acw.acute}, chronic ${acw.chronic} AU).`);
    if (dec.prescribed) {
      const items = [...dec.prescribed.am.items, ...dec.prescribed.pm.items]
        .map(i => `${i.name} ${[i.sets, i.reps].filter(Boolean).join('×')}${i.load && i.load !== '—' ? ' @' + i.load : ''}`).join('; ');
      line.push(`- Prescribed today — AM: ${dec.prescribed.am.focus}. PM: ${dec.prescribed.pm.focus}. Movements: ${items || 'recovery'}.`);
    }
    // today's logged session so far
    const day = Store.getDay(date);
    if (day.session && day.session.exercises && day.session.exercises.length) {
      const logged = day.session.exercises.map(ex => {
        const sets = (ex.sets || []).filter(s => Object.keys(s).length).map(s =>
          [s.load && s.load + 'kg', s.reps && s.reps + 'r', s.rpe && 'RPE' + s.rpe, s.velocity && s.velocity + 'm/s', s.distance && s.distance + 'm', s.minutes && s.minutes + 'min'].filter(Boolean).join('/')).join(', ');
        return `${ex.name}${sets ? ' [' + sets + ']' : ''}`;
      }).join('; ');
      line.push(`- Logged so far today: ${logged}.`);
    }
    line.push('');
    line.push('## Goals (current → 32-wk checkpoint → North Star)');
    DATA.GOALS.forEach(g => {
      const pr = Engine.projectGoal(g);
      const cur = pr.status === 'ok' ? pr.current : g.current;
      const ck = g.checkpoint ? `${g.checkpoint[0]}–${g.checkpoint[1]}` : '—';
      const trend = pr.status === 'ok' && pr.trendPoints >= 2 ? ` (${pr.perWeek > 0 ? '+' : ''}${pr.perWeek}${g.unit}/wk${pr.etaCkWeeks != null ? ', ~' + pr.etaCkWeeks + 'wk to checkpoint' : ''})` : '';
      line.push(`- ${g.name}: ${cur ?? '—'}${g.unit} → ${ck} → ${g.northStar ?? '—'}${g.unit}${trend}. Limiters: ${g.limiters.join(', ')}.`);
    });
    line.push('');
    line.push('## This week vs plan');
    wk.items.forEach(it => line.push(`- ${it.label}: ${it.val}${it.unit} (target ${it.target[0]}–${it.target[1]}${it.unit}) — ${it.band}.`));
    if (p.criticalPower) {
      line.push('');
      line.push(`## Stryd power zones (CP ${p.criticalPower} W)`);
      DATA.STRYD_ZONES.forEach(z => line.push(`- ${z.id} ${z.name}: ${Math.round(z.pct[0] * p.criticalPower)}–${Math.round(z.pct[1] * p.criticalPower)} W`));
    }
    return line.join('\n');
  }

  /* ---- Stream a chat completion ---------------------------------------- */
  async function send(history, userText, { onDelta, onDone, onError }) {
    if (!enabled()) { onError && onError(new Error('No API key set')); return; }
    const messages = [...history.slice(-10), { role: 'user', content: userText }];
    const body = {
      model: model(),
      max_tokens: 1200,
      system: [{ type: 'text', text: buildSystem(UI.date), cache_control: { type: 'ephemeral' } }],
      messages,
      stream: true,
    };
    let acc = '';
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': Store.state.settings.aiKey,
          'anthropic-version': VERSION,
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const e = await res.json(); msg = (e.error && e.error.message) || msg; } catch (_) {}
        throw new Error(msg);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const ln of lines) {
          const s = ln.trim();
          if (!s.startsWith('data:')) continue;
          const payload = s.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const ev = JSON.parse(payload);
            if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') {
              acc += ev.delta.text; onDelta && onDelta(ev.delta.text, acc);
            } else if (ev.type === 'error') {
              throw new Error((ev.error && ev.error.message) || 'stream error');
            }
          } catch (_) { /* ignore partial */ }
        }
      }
      onDone && onDone(acc);
    } catch (err) {
      onError && onError(err);
    }
  }

  return { enabled, model, buildSystem, send };
})();
