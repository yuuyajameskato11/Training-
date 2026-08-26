/* ============================================================================
   app.js — Bootstrap, routing, service worker.
   ========================================================================== */

const App = (() => {
  const $  = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  const RENDER = {
    company:  UI.renderCompany,
    acquire:  UI.renderAcquire,
    success:  UI.renderSuccess,
    retain:   UI.renderRetain,
    diagnose: UI.renderDiagnose,
    data:     UI.renderData,
  };
  let tab = 'company';

  function go(t) {
    if (!RENDER[t]) t = 'company';
    tab = t;
    $$('.tab').forEach(el => el.classList.toggle('active', el.getAttribute('data-tab') === t));
    window.scrollTo(0, 0);
    render();
  }
  function render() { RENDER[tab](); updateHeader(); }

  function updateHeader() {
    const co = Store.state.company;
    $('#coName').textContent = co.name || 'Company';
    const ids = Store.periodIds();
    const pill = $('#scorePill');
    if (!ids.length) { pill.textContent = 'no data'; pill.className = 'phase-pill'; return; }
    const a = Engine.assess(UI.pid());
    pill.textContent = (a.overall == null ? '—' : a.overall) + ' · ' + Store.labelFor(UI.pid());
    pill.className = 'phase-pill ' + Engine.band(a.overall);
  }

  function init() {
    UI.setPeriod(Store.currentId());
    $$('.tab').forEach(el => el.onclick = () => go(el.getAttribute('data-tab')));
    $('#scorePill').onclick = () => go('data');
    go('company');
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', init);
  return { go, render, updateHeader };
})();
