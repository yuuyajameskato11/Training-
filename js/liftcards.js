/* ============================================================================
   KNCT Lift Cards — every prescribed weight is a percentage of one of your
   maxes, so the whole block re-writes itself the moment you edit a number.
   Data comes from js/liftcards-data.js (generated from the coach's workbooks).
   ========================================================================== */
(function () {
  'use strict';

  var DATA = window.LIFT_CARDS || { programs: [] };
  var KEY = 'knct.liftcards.v1';
  var LIFTS = [
    { k: 'clean', label: 'Clean' },
    { k: 'squat', label: 'Squat' },
    { k: 'bench', label: 'Bench' },
    { k: 'jerk',  label: 'Jerk'  },
    { k: 'snatch',label: 'Snatch'},
    { k: 'bw',    label: 'Bodyweight' }
  ];
  var LB_PER_KG = 2.2046226218;

  /* ── maths ───────────────────────────────────────────────────────────── */

  // Excel keeps 15 significant digits before it rounds; 325*0.7 is 227.5 to it
  // and 227.49999999999997 to us, which is the difference between 230 and 225.
  function excelish(n) { return parseFloat(n.toPrecision(12)); }

  function snap(n, step) { return Math.round(excelish(n) / step) * step; }

  // A prescription is { b: base lift, c: coefficient } — plus `sys` for the
  // single-leg work, which is a percentage of squat + bodyweight with the
  // bodyweight taken back off so the number is what you load on the bar.
  function resolve(spec, maxes, step) {
    if (!spec) return null;
    if (spec.s) return { cue: spec.s };
    if (typeof spec.n === 'number') return { load: snap(spec.n, step) };
    var base = maxes[spec.b];
    if (!base) return null;
    if (spec.sys) {
      var bw = maxes.bw || 0;
      return { load: snap((base + bw) * spec.c, step) - bw, pct: spec.c, of: spec.b + '+bw' };
    }
    return { load: snap(base * spec.c, step), pct: spec.c, of: spec.b };
  }

  /* ── state ───────────────────────────────────────────────────────────── */

  var state = {
    program: DATA.programs[0] ? DATA.programs[0].id : '',
    week: 0,
    unit: 'lb',
    maxes: Object.assign({}, DATA.programs[0] ? DATA.programs[0].defaults : {}),
    done: {}
  };

  function step() { return state.unit === 'kg' ? 2.5 : 5; }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && typeof saved === 'object') {
        state.unit = saved.unit === 'kg' ? 'kg' : 'lb';
        state.program = saved.program || state.program;
        state.week = saved.week || 0;
        state.done = saved.done || {};
        if (saved.maxes) state.maxes = Object.assign({}, state.maxes, saved.maxes);
      }
    } catch (e) {}
  }

  function program() {
    for (var i = 0; i < DATA.programs.length; i++) {
      if (DATA.programs[i].id === state.program) return DATA.programs[i];
    }
    return DATA.programs[0];
  }
  function week() {
    var p = program();
    if (!p) return null;
    return p.weeks[Math.min(state.week, p.weeks.length - 1)] || p.weeks[0];
  }

  /* ── unit switching ──────────────────────────────────────────────────── */

  function convertMaxes(to) {
    var next = {}, s = to === 'kg' ? 2.5 : 5;
    LIFTS.forEach(function (l) {
      var v = state.maxes[l.k];
      if (typeof v !== 'number' || !v) return;
      next[l.k] = snap(to === 'kg' ? v / LB_PER_KG : v * LB_PER_KG, s);
    });
    state.maxes = next;
    state.unit = to;
  }

  /* ── rendering ───────────────────────────────────────────────────────── */

  var el = {};
  function $(sel) { return document.querySelector(sel); }
  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderMaxes() {
    var grid = el.maxes;
    grid.innerHTML = '';
    LIFTS.forEach(function (lift) {
      var cell = make('div', 'max-cell');
      var id = 'max-' + lift.k;
      var label = make('label', null, lift.label);
      label.appendChild(make('span', 'unit', state.unit));
      label.htmlFor = id;
      var input = document.createElement('input');
      input.id = id;
      input.type = 'number';
      input.inputMode = 'decimal';
      input.min = '0';
      input.step = String(step());
      input.value = state.maxes[lift.k] != null ? state.maxes[lift.k] : '';
      input.addEventListener('input', function () {
        var v = parseFloat(input.value);
        state.maxes[lift.k] = isNaN(v) ? 0 : v;
        save();
        renderWeek(true);
      });
      cell.appendChild(label);
      cell.appendChild(input);
      grid.appendChild(cell);
    });
  }

  function renderPrograms() {
    el.programs.innerHTML = '';
    DATA.programs.forEach(function (p) {
      var b = make('button', null, p.name);
      b.setAttribute('aria-current', p.id === state.program ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (state.program === p.id) return;
        state.program = p.id;
        state.week = 0;
        save();
        renderPrograms(); renderWeeks(); renderWeek();
      });
      el.programs.appendChild(b);
    });
  }

  function renderWeeks() {
    var p = program();
    el.weeks.innerHTML = '';
    if (!p) return;
    p.weeks.forEach(function (w, i) {
      var b = make('button', null, w.label);
      b.setAttribute('aria-current', i === state.week ? 'true' : 'false');
      b.addEventListener('click', function () {
        state.week = i;
        save();
        renderWeeks(); renderWeek();
        window.scrollTo({ top: el.weekHead.offsetTop - 120, behavior: 'smooth' });
      });
      el.weeks.appendChild(b);
    });
  }

  function doneKey(dayIndex, blockIndex, setIndex) {
    return [state.program, state.week, dayIndex, blockIndex, setIndex].join('/');
  }

  function renderSet(spec, reps, index, key, animate, prev) {
    var row = make('div', 'set');
    row.appendChild(make('span', 'n', index));

    var val = make('span', 'load');
    var out = resolve(spec, state.maxes, step());
    if (!out) {
      val.className = 'load empty';
      val.textContent = '—';
    } else if (out.cue) {
      val.className = 'load cue';
      val.textContent = out.cue;
    } else {
      val.textContent = Math.round(out.load * 10) / 10;
      val.appendChild(make('span', 'u', state.unit));
      if (animate) {
        val.classList.add('flash');
        setTimeout(function () { val.classList.remove('flash'); }, 500);
      }
    }
    var mid = make('span');
    mid.appendChild(val);
    var caption = out && out.pct ? Math.round(out.pct * 1000) / 10 + '% ' + out.of : '';
    if (caption && caption !== prev) mid.appendChild(make('span', 'pct', caption));
    row.appendChild(mid);
    row.appendChild(make('span', 'reps', reps || ''));

    row.dataset.pct = caption;
    if (state.done[key]) row.classList.add('done');
    row.addEventListener('click', function () {
      if (state.done[key]) delete state.done[key]; else state.done[key] = 1;
      row.classList.toggle('done');
      save();
    });
    return row;
  }

  function renderWeek(animate) {
    var w = week(), p = program();
    if (!p || !w) { el.days.innerHTML = '<div class="empty-state">No card loaded.</div>'; return; }

    el.title.textContent = w.label;
    el.eyebrow.textContent = w.note || 'Card';
    el.count.textContent = w.days.length + ' days · ' + p.name;
    el.topWeek.textContent = p.name + ' · ' + w.label;

    el.days.innerHTML = '';
    w.days.forEach(function (day, di) {
      var card = make('section', 'day');
      card.appendChild(make('h2', null, day.name));
      day.blocks.forEach(function (block, bi) {
        var wrap = make('div', 'block' + (block.heading ? ' heading' : ''));
        var split = block.heading ? /^(.*?)\s*\((.*)\)\s*$/.exec(block.label) : null;
        var cues = (block.notes || []).slice();
        wrap.appendChild(make('h3', null, split ? split[1] : block.label));
        if (split) cues.unshift(split[2]);
        if (cues.length) wrap.appendChild(make('p', 'cues', cues.join(' · ')));
        if (block.sets.length) {
          var sets = make('div', 'sets'), prev = '';
          block.sets.forEach(function (s, si) {
            var row = renderSet(s.w, s.r, si + 1, doneKey(di, bi, si), animate, prev);
            prev = row.dataset.pct || '';
            sets.appendChild(row);
          });
          wrap.appendChild(sets);
        }
        card.appendChild(wrap);
      });
      el.days.appendChild(card);
    });
  }

  /* ── boot ────────────────────────────────────────────────────────────── */

  function init() {
    el.maxes = $('#maxes');
    el.programs = $('#programs');
    el.weeks = $('#weeks');
    el.days = $('#days');
    el.title = $('#weekTitle');
    el.count = $('#weekCount');
    el.topWeek = $('#topWeek');
    el.weekHead = $('#weekHead');
    el.eyebrow = $('#weekEyebrow');

    load();

    document.querySelectorAll('[data-unit]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.unit === state.unit ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (b.dataset.unit === state.unit) return;
        convertMaxes(b.dataset.unit);
        document.querySelectorAll('[data-unit]').forEach(function (o) {
          o.setAttribute('aria-pressed', o.dataset.unit === state.unit ? 'true' : 'false');
        });
        save();
        renderMaxes(); renderWeek(true);
      });
    });

    $('#reset').addEventListener('click', function () {
      var p = program();
      if (!p) return;
      state.unit = 'lb';
      state.maxes = Object.assign({}, p.defaults);
      document.querySelectorAll('[data-unit]').forEach(function (o) {
        o.setAttribute('aria-pressed', o.dataset.unit === 'lb' ? 'true' : 'false');
      });
      save();
      renderMaxes(); renderWeek(true);
    });

    $('#print').addEventListener('click', function () { window.print(); });

    renderMaxes();
    renderPrograms();
    renderWeeks();
    renderWeek();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.KNCT_LIFTCARDS = { resolve: resolve, snap: snap, state: state };
})();
