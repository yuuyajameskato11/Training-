/* ============================================================================
   app.js — Bootstrap, tab routing, service-worker registration.
   ========================================================================== */

const App = (() => {
  const $  = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  const RENDER = {
    today:    UI.renderToday,
    log:      UI.renderLog,
    progress: UI.renderProgress,
    coach:    UI.renderCoach,
    settings: UI.renderSettings,
  };

  let currentTab = 'today';

  function go(tab) {
    if (!RENDER[tab]) tab = 'today';
    currentTab = tab;
    $$('.tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tab));
    window.scrollTo(0, 0);
    RENDER[tab]();
  }

  function updatePhasePill() {
    const date = Engine.todayISO();
    const phase = Engine.currentPhase(date);
    const wk = Engine.programWeek(date);
    const deload = Engine.isDeloadWeek(date);
    $('#phasePill').textContent = `P${phase.id} · ${phase.name}${wk ? ' · wk ' + wk : ''}${deload ? ' · DELOAD' : ''}`;
  }

  function init() {
    // ensure today's date is the working date
    UI.setDate(Engine.todayISO());
    updatePhasePill();

    $$('.tab').forEach(t => t.onclick = () => go(t.getAttribute('data-tab')));
    $('#phasePill').onclick = () => go('settings');

    // first-run: seed a friendly default phase week
    go('today');

    // PWA service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return { go, updatePhasePill };
})();
