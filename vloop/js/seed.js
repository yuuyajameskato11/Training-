/* ============================================================================
   seed.js — SYNTHETIC demo data.

   Not KNCT's numbers. Invented, deterministic, and clearly labelled, so the
   screens can be judged before a single real number has been collected.
   Loading it wipes local data; "Clear demo" puts you back to empty.
   ========================================================================== */

const Seed = (() => {
  // deterministic PRNG — same demo every time, so screenshots stay comparable
  let s = 20260601;
  const rnd  = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const between = (a, b) => a + rnd() * (b - a);
  const iRand = (a, b) => Math.round(between(a, b));
  const pick = a => a[Math.floor(rnd() * a.length)];

  const MONTHS = ['2026-02','2026-03','2026-04','2026-05','2026-06','2026-07'];
  const SOURCES = ['YJK Instagram','KNCT University IG','KNCT Consulting','LINE','Referral','Run club','Event','Paid ads'];
  const REPS = ['Yuya','Bianca','Sho'];
  const LEADERS = ['Bianca','Kenta','Mika'];

  function load() {
    Store.reset();
    Store.setCompany({ name:'KNCT (demo)', cadence:'month' });

    MONTHS.forEach((id, i) => {
      const g = 1 + i * 0.12;                       // the business is growing
      const views = Math.round(between(260000, 340000) * g);
      const leads = Math.round(views * between(0.004, 0.008) * (1 + i * 0.05));
      const apps  = Math.round(leads * between(0.14, 0.22));
      const qual  = Math.round(apps * between(0.45, 0.62));
      const booked= Math.round(qual * between(0.5, 0.72));
      const att   = Math.round(booked * between(0.66, 0.84));
      const sales = Math.round(att * between(0.17, 0.27));
      const price = iRand(420000, 520000);
      const signed= sales * price;
      const netStart = 40 + i * 6;
      const reached90 = iRand(28, 46);
      const verified  = Math.round(reached90 * between(0.16, 0.34));
      const d = {
        views, reach:Math.round(views * 0.42), profileVisits:Math.round(views * between(0.012,0.02)),
        ctaClicks:Math.round(views * between(0.01,0.018)), followersNet:iRand(900, 2600),
        lineMessagesSent:iRand(5, 10), lineFriendsNew:iRand(500, 1100),
        lineTargetReach:5200 + i * 420, lineBlocks:iRand(150, 320),
        leads, leadsReferral:Math.round(leads * between(0.05, 0.14)),
        applications:apps, applicationsQual:qual, meetingsBooked:booked, meetingsAttended:att,
        sales, grossSigned:signed,
        cashCollected:Math.round(signed * between(0.45, 0.72)) + iRand(600000, 1400000),
        refunds:iRand(0, 320000),
        networkStart:netStart, networkInvited:Math.round(sales * between(0.6, 0.95)),
        networkJoined:Math.round(sales * between(0.25, 0.5)), networkChurned:iRand(3, 8),
        networkFee:33000, expansionRevenue:iRand(400000, 1300000), eventRevenue:iRand(0, 700000),
        studentsActive:90 + i * 9, onboarded:Math.round(sales * between(0.75, 0.98)),
        reachedDay14:iRand(24, 44), implementedBy14:0,
        firstClients:iRand(8, 19), reached90, verified90:verified,
        caseStudies:Math.round(verified * between(0.15, 0.5)), dropouts:iRand(3, 9),
        referralsFromCust:iRand(6, 20), medianIncomeGain:iRand(60000, 190000),
        memberValueCreated:iRand(8000000, 22000000),
        marketingSpend:iRand(700000, 1400000), salesCost:iRand(700000, 1100000),
        cogs:iRand(1200000, 1900000), otherOpex:iRand(1100000, 1600000),
        headcount:6 + Math.floor(i / 2), leaders:3 + Math.floor(i / 3), studentsPerLeader:25,
        founderHours:iRand(70, 120), totalHours:iRand(190, 240),
      };
      d.implementedBy14 = Math.round(d.reachedDay14 * between(0.4, 0.72));
      Object.keys(d).forEach(k => Store.setInput(id, k, d[k]));
    });
    Store.setNotes(MONTHS[MONTHS.length - 1],
      'Demo month. Capacity is tight and collection is lagging — exactly the shape the diagnosis screen is built to catch.');

    // ---- People: outcome and LTV deliberately correlated, so the thesis
    //      "results → retention → referrals → LTV" is visible or falsifiable.
    for (let i = 0; i < 64; i++) {
      const cohort = pick(MONTHS.slice(0, 5));
      const outcome = pick(['none','none','none','implemented','implemented','firstClient','firstClient','result100k','result300k','result1m']);
      const tier = Engine.OUTCOME_ORDER.indexOf(outcome);
      const price = iRand(420000, 540000);
      const collected = Math.round(price * between(tier >= 3 ? 0.85 : 0.5, 1));
      const joined = rnd() < 0.15 + tier * 0.14;
      const p = Store.blankPerson();
      const purchase = cohort + '-' + String(iRand(2, 26)).padStart(2, '0');
      Object.assign(p, {
        name:'Member ' + (i + 1), source:pick(SOURCES), cohort,
        salesperson:pick(REPS), leader:pick(LEADERS),
        dateLead:cohort + '-01', dateCall:cohort + '-0' + iRand(2, 8), datePurchase:purchase,
        price, collected, refunded: rnd() < 0.06 ? Math.round(collected * 0.5) : 0,
        baselineIncome:iRand(180000, 320000),
        currentIncome:iRand(180000, 320000) + tier * iRand(30000, 120000),
        status: tier >= 2 ? 'active' : (rnd() < 0.15 ? 'churned' : 'active'),
        outcome,
        dateFirstClient: tier >= 2 ? addDays(purchase, iRand(18, 95)) : '',
        dateFirstResult: tier >= 3 ? addDays(purchase, iRand(45, 140)) : '',
        network: joined ? 'joined' : (rnd() < 0.5 ? 'invited' : 'no'),
        networkMonths: joined ? iRand(1, 9) + tier : 0, networkFee: joined ? 33000 : 0,
        expansion: tier >= 3 && rnd() < 0.5 ? iRand(150000, 700000) : 0,
        referrals: Math.max(0, Math.round(between(-0.4, 0.6) + tier * 0.45)),
        caseStudy: tier >= 3 && rnd() < 0.5, certified: tier >= 3 && rnd() < 0.4,
        failReason: tier < 2 ? pick(['never did outreach','no time / job conflict','unclear offer','fear of outreach','weak accountability','financial stress']) : '',
        churnReason:'',
      });
      Store.upsertPerson(p);
    }
    Store.state.settings.demo = true;
    Store.save();
  }

  function addDays(iso, n) {
    const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  return { load, MONTHS };
})();
