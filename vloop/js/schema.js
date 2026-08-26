/* ============================================================================
   schema.js — THE DICTIONARY.

   Everything the system knows how to measure lives here:
     PILLARS   — the VALUE LOOP (V·A·L·U·E) and the question each one answers
     FIELDS    — what a human types in each period (the manual layer)
     METRICS   — what the machine derives, with its benchmark and its weight
     LEVERS    — the subset of metrics that actually move money, wired into
                 the funnel model in engine.js
     DOMAINS   — the full 52-domain backend registry (collect everything;
                 show the CEO only what currently matters)

   Definitions are written down ONCE, here, because inconsistent definitions
   are what make funnel numbers unreliable in the first place.
   ========================================================================== */

const Schema = (() => {

  /* ---- The loop --------------------------------------------------------- */
  const PILLARS = [
    { id:'V', name:'Visibility',    q:'Where is attention coming from?',        color:'#4da6ff' },
    { id:'A', name:'Acquisition',   q:'Where is money leaking?',                color:'#00e0b8' },
    { id:'L', name:'Lifetime Value',q:'Are customers staying and buying more?', color:'#7b6cff' },
    { id:'U', name:'User Outcome',  q:'Are customers getting results?',         color:'#ffb020' },
    { id:'E', name:'Efficiency',    q:'Does the machine keep its margin?',      color:'#3ddc84' },
  ];
  const pillar = id => PILLARS.find(p => p.id === id);

  /* ---- What a human enters each period ---------------------------------- *
     Keep this list SHORT. If a number is not typed in under 20 minutes a week
     it will not get typed in at all. Everything else lives in DOMAINS until
     it earns a place here.                                                   */
  const FIELDS = [
    // ---------------- V — attention -------------------------------------
    { id:'views',            label:'Content views',        pillar:'V', group:'Attention', unit:'#',
      help:'Total views across every account for the period. One number.' },
    { id:'reach',            label:'Unique reach',         pillar:'V', group:'Attention', unit:'#',
      help:'Unique accounts reached. Blank if the platform will not give it.' },
    { id:'profileVisits',    label:'Profile visits',       pillar:'V', group:'Attention', unit:'#' },
    { id:'ctaClicks',        label:'CTA / link clicks',    pillar:'V', group:'Attention', unit:'#',
      help:'Clicks on the thing that starts the funnel (LINE, application, DM CTA).' },
    { id:'followersNet',     label:'Net new followers',    pillar:'V', group:'Attention', unit:'#' },
    { id:'lineMessagesSent', label:'LINE broadcasts sent', pillar:'V', group:'LINE',      unit:'#' },
    { id:'lineFriendsNew',   label:'New LINE friends',     pillar:'V', group:'LINE',      unit:'#' },
    { id:'lineTargetReach',  label:'LINE target reach',    pillar:'V', group:'LINE',      unit:'#',
      help:'Reachable friends at period end — the only LINE number that pays.' },
    { id:'lineBlocks',       label:'LINE blocks',          pillar:'V', group:'LINE',      unit:'#' },

    // ---------------- A — acquisition ------------------------------------
    { id:'leads',            label:'New leads',            pillar:'A', group:'Funnel', unit:'#',
      help:'DEFINITION: a person who gave you a way to contact them this period. Not a follower.' },
    { id:'leadsReferral',    label:'…of which referred',   pillar:'A', group:'Funnel', unit:'#' },
    { id:'applications',     label:'Applications completed',pillar:'A',group:'Funnel', unit:'#' },
    { id:'applicationsQual', label:'…qualified',           pillar:'A', group:'Funnel', unit:'#',
      help:'Passed your qualification bar — not merely submitted.' },
    { id:'meetingsBooked',   label:'Meetings booked',      pillar:'A', group:'Funnel', unit:'#' },
    { id:'meetingsAttended', label:'Meetings attended',    pillar:'A', group:'Funnel', unit:'#',
      help:'Prospect actually showed up. Booked − attended = no-shows.' },
    { id:'sales',            label:'New customers closed', pillar:'A', group:'Funnel', unit:'#' },
    { id:'grossSigned',      label:'Contract value signed',pillar:'A', group:'Money',  unit:'¥',
      help:'Face value of what was signed. NOT cash.' },
    { id:'cashCollected',    label:'Cash actually collected',pillar:'A',group:'Money', unit:'¥',
      help:'Money in the bank this period, including instalments from old deals.' },
    { id:'refunds',          label:'Refunds / cancellations',pillar:'A',group:'Money', unit:'¥' },

    // ---------------- L — lifetime value ---------------------------------
    { id:'networkStart',     label:'Network members at start',pillar:'L',group:'Recurring', unit:'#' },
    { id:'networkInvited',   label:'Invited to Network',   pillar:'L', group:'Recurring', unit:'#' },
    { id:'networkJoined',    label:'Joined Network',       pillar:'L', group:'Recurring', unit:'#' },
    { id:'networkChurned',   label:'Cancelled Network',    pillar:'L', group:'Recurring', unit:'#' },
    { id:'networkFee',       label:'Network fee / member / mo',pillar:'L',group:'Recurring', unit:'¥' },
    { id:'expansionRevenue', label:'Expansion revenue',    pillar:'L', group:'Recurring', unit:'¥',
      help:'Upsells, Business Builder, advanced programs, consulting — existing customers only.' },
    { id:'eventRevenue',     label:'Event revenue',        pillar:'L', group:'Recurring', unit:'¥' },

    // ---------------- U — user outcome -----------------------------------
    { id:'studentsActive',   label:'Active students',      pillar:'U', group:'Delivery', unit:'#' },
    { id:'onboarded',        label:'Onboarding completed', pillar:'U', group:'Delivery', unit:'#' },
    { id:'implementedBy14',  label:'Implemented by day 14',pillar:'U', group:'Delivery', unit:'#',
      help:'Of the students who reached day 14 this period, how many took a real action.' },
    { id:'reachedDay14',     label:'…students who hit day 14',pillar:'U',group:'Delivery', unit:'#' },
    { id:'firstClients',     label:'First paid client won',pillar:'U', group:'Results',  unit:'#' },
    { id:'reached90',        label:'Students who hit day 90',pillar:'U',group:'Results', unit:'#' },
    { id:'verified90',       label:'…with a verified result',pillar:'U',group:'Results', unit:'#',
      help:'Day-90 economic result you could show a stranger. Verified, not claimed.' },
    { id:'caseStudies',      label:'Case studies verified',pillar:'U', group:'Results',  unit:'#' },
    { id:'dropouts',         label:'Drop-outs',            pillar:'U', group:'Results',  unit:'#' },
    { id:'referralsFromCust',label:'Referrals from customers',pillar:'U',group:'Results',unit:'#' },
    { id:'medianIncomeGain', label:'Median member income gain',pillar:'U',group:'Results',unit:'¥',
      help:'MEDIAN, not average. One ¥6M outlier is not a product.' },
    { id:'memberValueCreated',label:'Verified member earnings',pillar:'U',group:'Results',unit:'¥',
      help:'Money members made / saved their clients, verified. The ultimate metric.' },

    // ---------------- E — efficiency -------------------------------------
    { id:'marketingSpend',   label:'Marketing spend',      pillar:'E', group:'Cost',     unit:'¥' },
    { id:'salesCost',        label:'Sales cost',           pillar:'E', group:'Cost',     unit:'¥',
      help:'Sales payroll + commissions. Part of CAC.' },
    { id:'cogs',             label:'Delivery cost (COGS)', pillar:'E', group:'Cost',     unit:'¥',
      help:'Coaches, leaders, venue, anything that scales with students.' },
    { id:'otherOpex',        label:'Other operating cost', pillar:'E', group:'Cost',     unit:'¥',
      help:'Rent, software, admin payroll, overhead.' },
    { id:'headcount',        label:'Team headcount',       pillar:'E', group:'Capacity', unit:'#' },
    { id:'leaders',          label:'Leaders / coaches',    pillar:'E', group:'Capacity', unit:'#' },
    { id:'studentsPerLeader',label:'Max students per leader',pillar:'E',group:'Capacity',unit:'#' },
    { id:'founderHours',     label:'Founder hours in delivery',pillar:'E',group:'Capacity',unit:'h',
      help:'Hours the founder personally had to be in the machine. Founder dependence.' },
    { id:'totalHours',       label:'Founder hours total',  pillar:'E', group:'Capacity', unit:'h' },
  ];
  const field = id => FIELDS.find(f => f.id === id);
  const fieldGroups = pid => {
    const out = [];
    FIELDS.filter(f => f.pillar === pid).forEach(f => {
      let g = out.find(x => x.name === f.group);
      if (!g) out.push(g = { name:f.group, fields:[] });
      g.fields.push(f);
    });
    return out;
  };

  /* ---- Derived metrics --------------------------------------------------- *
     fn(p, m) : p = the period's raw inputs, m = metrics computed before it.
     target   = the number that means "this is healthy".
     floor    = the number that means "this is the constraint".
     dir      = 'up' (higher is better) or 'down' (lower is better).
     weight   = how much this metric counts toward its pillar score.
     lever    = wired into the revenue model, so a gap here becomes a ¥ figure. */

  const div = (a, b) => (b ? a / b : null);

  const METRICS = [
    /* ---------- V ---------- */
    { id:'profileVisitRate', label:'Profile visit rate', pillar:'V', fmt:'pct', dir:'up', weight:1,
      def:'Profile visits ÷ reach', target:0.03, floor:0.005,
      fn:p => div(p.profileVisits, p.reach) },
    { id:'ctaClickRate', label:'CTA click rate', pillar:'V', fmt:'pct', dir:'up', weight:1,
      def:'CTA clicks ÷ views', target:0.02, floor:0.002,
      fn:p => div(p.ctaClicks, p.views) },
    { id:'leadRate', label:'Lead rate (views → leads)', pillar:'V', fmt:'pct', dir:'up', weight:3,
      def:'Leads ÷ views. The rate at which attention becomes a contactable human.',
      target:0.015, floor:0.002, lever:true,
      fn:p => div(p.leads, p.views) },
    { id:'revPerMilleViews', label:'Revenue per 1,000 views', pillar:'V', fmt:'yen', dir:'up', weight:2,
      def:'Cash collected ÷ views × 1,000. Lets you compare a Reel to a Reel economically.',
      target:3000, floor:200,
      fn:p => div(p.cashCollected, p.views) * 1000 },
    { id:'lineBlockRate', label:'LINE block rate', pillar:'V', fmt:'pct', dir:'down', weight:2,
      def:'Blocks ÷ (target reach + blocks) for the period.', target:0.02, floor:0.08,
      fn:p => div(p.lineBlocks, (p.lineTargetReach || 0) + (p.lineBlocks || 0)) },
    { id:'lineNetGrowth', label:'LINE net growth', pillar:'V', fmt:'num', dir:'up', weight:1,
      def:'New friends − blocks. Negative means the channel is dying.', target:200, floor:0,
      fn:p => (p.lineFriendsNew || 0) - (p.lineBlocks || 0) },
    { id:'revPerLineRecipient', label:'Revenue per LINE recipient', pillar:'V', fmt:'yen', dir:'up', weight:1,
      def:'Cash collected ÷ LINE target reach.', target:2000, floor:100,
      fn:p => div(p.cashCollected, p.lineTargetReach) },

    /* ---------- A ---------- */
    { id:'appRate', label:'Lead → application', pillar:'A', fmt:'pct', dir:'up', weight:2,
      def:'Applications completed ÷ leads.', target:0.25, floor:0.05, lever:true,
      fn:p => div(p.applications, p.leads) },
    { id:'qualRate', label:'Application → qualified', pillar:'A', fmt:'pct', dir:'up', weight:1,
      def:'Qualified applications ÷ applications. Low = the audience is wrong, not the sales team.',
      target:0.6, floor:0.2, lever:true,
      fn:p => div(p.applicationsQual, p.applications) },
    { id:'bookRate', label:'Qualified → booked', pillar:'A', fmt:'pct', dir:'up', weight:2,
      def:'Meetings booked ÷ qualified applications. Mostly a speed-of-contact problem.',
      target:0.7, floor:0.3, lever:true,
      fn:p => div(p.meetingsBooked, p.applicationsQual) },
    { id:'showRate', label:'Show rate', pillar:'A', fmt:'pct', dir:'up', weight:2,
      def:'Meetings attended ÷ meetings booked.', target:0.8, floor:0.5, lever:true,
      fn:p => div(p.meetingsAttended, p.meetingsBooked) },
    { id:'closeRate', label:'Meeting → close', pillar:'A', fmt:'pct', dir:'up', weight:3,
      def:'New customers ÷ meetings attended.', target:0.3, floor:0.12, lever:true,
      fn:p => div(p.sales, p.meetingsAttended) },
    { id:'avgPrice', label:'Average contract value', pillar:'A', fmt:'yen', dir:'up', weight:1,
      def:'Contract value signed ÷ new customers.', target:500000, floor:200000, lever:true,
      fn:p => div(p.grossSigned, p.sales) },
    { id:'collectionRate', label:'Cash collection rate', pillar:'A', fmt:'pct', dir:'up', weight:3,
      def:'Cash collected ÷ contract value signed. Signed is not collected.',
      target:0.85, floor:0.5, lever:true,
      fn:p => div(p.cashCollected, p.grossSigned) },
    { id:'refundRate', label:'Refund rate', pillar:'A', fmt:'pct', dir:'down', weight:2,
      def:'Refunds ÷ cash collected.', target:0.02, floor:0.1,
      fn:p => div(p.refunds, p.cashCollected) },
    { id:'revPerLead', label:'Revenue per lead', pillar:'A', fmt:'yen', dir:'up', weight:2,
      def:'Cash collected ÷ leads.', target:30000, floor:5000,
      fn:p => div(p.cashCollected, p.leads) },
    { id:'revPerMeeting', label:'Revenue per attended meeting', pillar:'A', fmt:'yen', dir:'up', weight:2,
      def:'Cash collected ÷ meetings attended. The single best sales-team number.',
      target:150000, floor:40000,
      fn:p => div(p.cashCollected, p.meetingsAttended) },

    /* ---------- L ---------- */
    { id:'networkConv', label:'University → Network', pillar:'L', fmt:'pct', dir:'up', weight:3,
      def:'Joined Network ÷ new customers.', target:0.5, floor:0.15, lever:true,
      fn:p => div(p.networkJoined, p.sales) },
    { id:'inviteAccept', label:'Invite → join', pillar:'L', fmt:'pct', dir:'up', weight:1,
      def:'Joined ÷ invited.', target:0.6, floor:0.25,
      fn:p => div(p.networkJoined, p.networkInvited) },
    { id:'monthlyChurn', label:'Network monthly churn', pillar:'L', fmt:'pct', dir:'down', weight:3,
      def:'Cancelled ÷ members at period start (normalised to a month).',
      target:0.03, floor:0.12,
      fn:(p,m,ctx) => { const c = div(p.networkChurned, p.networkStart); return c == null ? null : c / (ctx.monthsInPeriod || 1); } },
    { id:'retentionMonths', label:'Expected months retained', pillar:'L', fmt:'mo', dir:'up', weight:2,
      def:'1 ÷ monthly churn. How long a Network member is worth money.',
      target:24, floor:6, lever:true,
      fn:(p,m) => (m.monthlyChurn ? 1 / m.monthlyChurn : null) },
    { id:'recurringRev', label:'Recurring revenue (MRR)', pillar:'L', fmt:'yen', dir:'up', weight:2,
      def:'Members at period end × Network fee.', target:3000000, floor:500000,
      fn:p => ((p.networkStart || 0) + (p.networkJoined || 0) - (p.networkChurned || 0)) * (p.networkFee || 0) },
    { id:'expansionPerCust', label:'Expansion revenue per customer', pillar:'L', fmt:'yen', dir:'up', weight:2,
      def:'(Expansion + event revenue) ÷ active students.', target:80000, floor:5000, lever:true,
      fn:p => div((p.expansionRevenue || 0) + (p.eventRevenue || 0), p.studentsActive) },
    { id:'nrr', label:'Net revenue retention', pillar:'L', fmt:'pct', dir:'up', weight:2,
      def:'(Recurring + expansion − churned recurring) ÷ recurring at start.',
      target:1.1, floor:0.8,
      fn:(p,m) => { const base = (p.networkStart || 0) * (p.networkFee || 0);
        if (!base) return null;
        return (base + (p.expansionRevenue || 0) - (p.networkChurned || 0) * (p.networkFee || 0)) / base; } },
    { id:'ltv', label:'Customer LTV', pillar:'L', fmt:'yen', dir:'up', weight:3,
      def:'Front-end cash + Network conversion × fee × months retained + expansion per customer.',
      target:1200000, floor:400000,
      fn:(p,m) => {
        const front = (m.avgPrice || 0) * (m.collectionRate == null ? 1 : m.collectionRate) * (1 - (m.refundRate || 0));
        const rec   = (m.networkConv || 0) * (p.networkFee || 0) * (m.retentionMonths || 0);
        return front + rec + (m.expansionPerCust || 0);
      } },

    /* ---------- U ---------- */
    { id:'activationRate', label:'Onboarding completion', pillar:'U', fmt:'pct', dir:'up', weight:2,
      def:'Onboarding completed ÷ new customers.', target:0.95, floor:0.6,
      fn:p => div(p.onboarded, p.sales) },
    { id:'day14Rate', label:'Day-14 implementation', pillar:'U', fmt:'pct', dir:'up', weight:3,
      def:'Implemented by day 14 ÷ students who reached day 14. The earliest honest predictor of a result.',
      target:0.8, floor:0.4,
      fn:p => div(p.implementedBy14, p.reachedDay14) },
    { id:'successRate', label:'90-day verified result rate', pillar:'U', fmt:'pct', dir:'up', weight:4,
      def:'Verified day-90 results ÷ students who reached day 90. THE product metric.',
      target:0.5, floor:0.15, lever:true,
      fn:p => div(p.verified90, p.reached90) },
    { id:'firstClientRate', label:'First-client rate', pillar:'U', fmt:'pct', dir:'up', weight:2,
      def:'First paid clients won ÷ active students.', target:0.25, floor:0.05,
      fn:p => div(p.firstClients, p.studentsActive) },
    { id:'proofRate', label:'Case studies per result', pillar:'U', fmt:'pct', dir:'up', weight:2,
      def:'Verified case studies ÷ verified results. Results you cannot show do not sell anything.',
      target:0.6, floor:0.1,
      fn:p => div(p.caseStudies, p.verified90) },
    { id:'dropoutRate', label:'Drop-out rate', pillar:'U', fmt:'pct', dir:'down', weight:2,
      def:'Drop-outs ÷ active students.', target:0.03, floor:0.15,
      fn:p => div(p.dropouts, p.studentsActive) },
    { id:'referralRate', label:'Referrals per customer', pillar:'U', fmt:'num', dir:'up', weight:3,
      def:'Referrals from customers ÷ active students. The loop closing.',
      target:0.4, floor:0.05, lever:true,
      fn:p => div(p.referralsFromCust, p.studentsActive) },
    { id:'referralShare', label:'Referred share of leads', pillar:'U', fmt:'pct', dir:'up', weight:1,
      def:'Referred leads ÷ leads. Rises when the product works.', target:0.3, floor:0.05,
      fn:p => div(p.leadsReferral, p.leads) },
    { id:'valuePerMember', label:'Verified value created per member', pillar:'U', fmt:'yen', dir:'up', weight:2,
      def:'Verified member earnings ÷ active students.', target:300000, floor:30000,
      fn:p => div(p.memberValueCreated, p.studentsActive) },

    /* ---------- E ---------- */
    { id:'cac', label:'CAC', pillar:'E', fmt:'yen', dir:'down', weight:3,
      def:'(Marketing + sales cost) ÷ new customers.', target:80000, floor:300000,
      fn:p => div((p.marketingSpend || 0) + (p.salesCost || 0), p.sales) },
    { id:'ltvCac', label:'LTV : CAC', pillar:'E', fmt:'x', dir:'up', weight:4,
      def:'LTV ÷ CAC. Under 3 the machine is not really profitable.', target:4, floor:1.5,
      fn:(p,m) => (m.cac ? m.ltv / m.cac : null) },
    { id:'cacPayback', label:'CAC payback', pillar:'E', fmt:'mo', dir:'down', weight:2,
      def:'CAC ÷ front-end cash per customer, in months of a customer\'s payments.',
      target:1, floor:6,
      fn:(p,m) => { const front = (m.avgPrice || 0) * (m.collectionRate == null ? 1 : m.collectionRate);
        return front ? (m.cac || 0) / front : null; } },
    { id:'grossMargin', label:'Gross margin', pillar:'E', fmt:'pct', dir:'up', weight:3,
      def:'(Cash collected − refunds − delivery cost) ÷ (cash collected − refunds).',
      target:0.7, floor:0.4,
      fn:p => { const net = (p.cashCollected || 0) - (p.refunds || 0);
        return net ? (net - (p.cogs || 0)) / net : null; } },
    { id:'opProfit', label:'Operating profit', pillar:'E', fmt:'yen', dir:'up', weight:3,
      def:'Net collected − delivery − marketing − sales − other operating cost.',
      target:2000000, floor:0,
      fn:p => (p.cashCollected || 0) - (p.refunds || 0) - (p.cogs || 0)
              - (p.marketingSpend || 0) - (p.salesCost || 0) - (p.otherOpex || 0) },
    { id:'opMargin', label:'Operating margin', pillar:'E', fmt:'pct', dir:'up', weight:3,
      def:'Operating profit ÷ net collected.', target:0.25, floor:0,
      fn:(p,m) => { const net = (p.cashCollected || 0) - (p.refunds || 0);
        return net ? m.opProfit / net : null; } },
    { id:'revPerHead', label:'Revenue per team member', pillar:'E', fmt:'yen', dir:'up', weight:1,
      def:'Cash collected ÷ headcount.', target:1500000, floor:400000,
      fn:p => div(p.cashCollected, p.headcount) },
    { id:'capacityUse', label:'Delivery capacity used', pillar:'E', fmt:'pct', dir:'down', weight:2,
      def:'Active students ÷ (leaders × max students per leader). Over 100% the product breaks quietly.',
      target:0.75, floor:1.1,
      fn:p => div(p.studentsActive, (p.leaders || 0) * (p.studentsPerLeader || 0)) },
    { id:'founderDependence', label:'Founder dependence', pillar:'E', fmt:'pct', dir:'down', weight:2,
      def:'Founder hours inside delivery ÷ founder hours total.', target:0.15, floor:0.6,
      fn:p => div(p.founderHours, p.totalHours) },
  ];
  const metric = id => METRICS.find(m => m.id === id);
  const metricsOf = pid => METRICS.filter(m => m.pillar === pid);

  /* ---- The CEO screen: the 5–15 numbers that currently matter ------------ */
  const CEO = [
    { id:'cashCollected', raw:true, label:'Cash collected' },
    { id:'opProfit',  label:'Operating profit' },
    { id:'sales',     raw:true, label:'New customers' },
    { id:'closeRate', label:'Meeting → close' },
    { id:'cac',       label:'CAC' },
    { id:'ltv',       label:'LTV' },
    { id:'ltvCac',    label:'LTV : CAC' },
    { id:'grossMargin', label:'Gross margin' },
    { id:'successRate', label:'90-day result rate' },
    { id:'networkConv', label:'Univ → Network' },
    { id:'retentionMonths', label:'Months retained' },
    { id:'referralRate', label:'Referrals / customer' },
  ];

  /* ---- Formatting -------------------------------------------------------- */
  function fmt(v, kind) {
    if (v == null || (typeof v === 'number' && !isFinite(v))) return '—';
    switch (kind) {
      case 'pct':  return (v * 100).toFixed(v < 0.1 ? 1 : 0) + '%';
      case 'yen':  return yen(v);
      case 'x':    return v.toFixed(1) + '×';
      case 'mo':   return v.toFixed(1) + ' mo';
      case 'h':    return Math.round(v) + ' h';
      case 'num':  return Math.abs(v) >= 100 ? Math.round(v).toLocaleString() : (Math.round(v * 100) / 100).toString();
      default:     return Math.round(v).toLocaleString();
    }
  }
  function yen(v) {
    const n = Math.round(v), a = Math.abs(n), s = n < 0 ? '-' : '';
    if (a >= 100000000) return s + '¥' + (a / 100000000).toFixed(2) + '億';
    if (a >= 10000)     return s + '¥' + (a / 10000).toFixed(a >= 1000000 ? 0 : 1) + '万';
    return s + '¥' + a.toLocaleString();
  }
  function fmtField(v, unit) {
    if (v == null || v === '') return '—';
    return unit === '¥' ? yen(v) : Math.round(v).toLocaleString() + (unit === 'h' ? ' h' : '');
  }

  /* ---- The backend registry ---------------------------------------------- *
     The 52 domains the system is designed to hold. Anything with fields:true
     is captured today; the rest documents what the record must grow into so
     the schema is decided ONCE rather than improvised later.                 */
  const DOMAINS = [
    { n:1,  name:'Customer / lead master record', pillar:'A', status:'partial',
      fields:'id · name · contact · LINE · IG · age · location · occupation · income now · revenue now · skill · clients · desired income · desired result · cohort · product · salesperson · leader · source · campaign · first touch · last touch · referrer · every date from first touch to cancellation · status' },
    { n:2,  name:'Attribution', pillar:'V', status:'partial',
      fields:'channel · content ID · campaign · spend · first/last touch → leads, applications, meetings, customers, revenue, profit and LTV BY SOURCE' },
    { n:3,  name:'Attention / distribution', pillar:'V', status:'live',
      fields:'followers · impressions · reach · views · profile visits · watch time · completion · saves · shares · DMs · clicks → profile-visit rate, CTA rate, lead rate, revenue per 1,000 views' },
    { n:4,  name:'Content database', pillar:'V', status:'planned',
      fields:'content ID · creator · hook · format · purpose tag (attention / trust / proof / education / reframe / conversion / case study) · avatar · views → leads → sales → revenue per view' },
    { n:5,  name:'LINE health', pillar:'V', status:'live',
      fields:'friends · target reach · blocks · block rate · replies · clicks · revenue per recipient · revenue per broadcast · block-after-message by topic' },
    { n:6,  name:'Lead qualification', pillar:'A', status:'partial',
      fields:'income · ability to pay · urgency · problem severity · timeline · authority · skill · hours available · coachability → LEAD QUALITY SCORE /100 → meeting rate, close rate, success, LTV' },
    { n:7,  name:'Application funnel', pillar:'A', status:'live',
      fields:'started · completed · qualified · rejected · booked · response time · time to booking' },
    { n:8,  name:'Sales pipeline', pillar:'A', status:'partial',
      fields:'per call: date · rep · source · offer · price · quality score · attended · outcome · reason lost · objection · days to close → close rate by rep / source / offer / avatar / score' },
    { n:9,  name:'Sales call intelligence', pillar:'A', status:'planned',
      fields:'objections · questions · talk ratio · discovery depth · proof used · close attempt · phrases that precede a yes' },
    { n:10, name:'Payments', pillar:'A', status:'partial',
      fields:'invoiced · collected · outstanding · plan · instalment dates · failed · late · discount · refund · chargeback → cash collection rate, days to cash, default rate' },
    { n:11, name:'Onboarding', pillar:'U', status:'live',
      fields:'booked · attended · baseline done · goals set · leader assigned · first assignment · time to first action' },
    { n:12, name:'Baseline (day 1 snapshot)', pillar:'U', status:'partial',
      fields:'income · revenue · clients · audience · skill · portfolio · confidence · availability · runway · target · biggest constraint — without this you cannot prove transformation' },
    { n:13, name:'Student activity', pillar:'U', status:'planned',
      fields:'lessons · assignments · coaching · events · outreach · pitches — diagnostic only, activity is not outcome' },
    { n:14, name:'Skill development', pillar:'U', status:'planned',
      fields:'14 skill tracks × beginner → developing → competent → verified → certified, each with attached proof. No self-rating.' },
    { n:15, name:'Money milestones', pillar:'U', status:'partial',
      fields:'date of first ¥1 · ¥50K · ¥100K · ¥300K · ¥500K · ¥1M · ¥3M · ¥10M cumulative · revenue last 30/90 days · paying clients' },
    { n:16, name:'Time to result', pillar:'U', status:'partial',
      fields:'days to first implementation · first client · first ¥100K · first case study · certification (median, not average)' },
    { n:17, name:'Customer success rate', pillar:'U', status:'live',
      fields:'30-day implementation · 60-day project · 90-day verified economic result · partial · none · dropped' },
    { n:18, name:'Failure reasons', pillar:'U', status:'partial',
      fields:'18 tagged causes from "never did outreach" to "curriculum gap" — quantified, because this is where product improvements come from' },
    { n:19, name:'Customer outcome (non-money)', pillar:'U', status:'planned',
      fields:'jobs · promotions · clients · revenue lifted for others · hours saved · systems built · campaigns launched' },
    { n:20, name:'Verified business value', pillar:'U', status:'partial',
      fields:'per project: client · starting metric · target · intervention · ending metric · ¥ value · duration · verification · proof link' },
    { n:21, name:'Case study database', pillar:'U', status:'partial',
      fields:'member · avatar · starting point · diagnosis · action · result · timeframe · ¥ created · proof · permission · sales-use status — filterable by avatar for sales' },
    { n:22, name:'Testimonial system', pillar:'U', status:'planned',
      fields:'requested · received · quantified · verified · permission · published · performance. Strong = before → action → after → number → time' },
    { n:23, name:'Certification', pillar:'U', status:'planned',
      fields:'lessons · assessment · real project · client verification · case study · leader approval · level → certified operator income, placement, retention' },
    { n:24, name:'Opportunity marketplace', pillar:'L', status:'planned',
      fields:'opportunities × operators → matches · interviews · contracts · contract value → MEMBER EARNINGS GENERATED THROUGH THE NETWORK' },
    { n:25, name:'Network retention', pillar:'L', status:'live',
      fields:'invited · accepted · declined + reason · join date · months active · pause · cancel · reactivate → 30/90/180/365-day retention, monthly churn, revenue churn' },
    { n:26, name:'Why people stay', pillar:'L', status:'planned',
      fields:'tagged: clients · opportunities · community · accountability · mentors · status · workspace · access — this is what the Network actually sells' },
    { n:27, name:'Why people leave', pillar:'L', status:'partial',
      fields:'13 tagged cancellation reasons → churn by reason. Do not guess retention problems.' },
    { n:28, name:'LTV', pillar:'L', status:'live',
      fields:'front-end + recurring + upsell + events, segmented by source, rep, cohort, leader, certification and RESULT LEVEL' },
    { n:29, name:'Expansion revenue', pillar:'L', status:'live',
      fields:'Network · Business Builder · advanced · events · consulting → expansion rate, net revenue retention' },
    { n:30, name:'Referrals', pillar:'U', status:'live',
      fields:'referrer · referred · bought · revenue · reward · referrer result level → referral rate BY OUTCOME LEVEL' },
    { n:31, name:'Community health', pillar:'L', status:'planned',
      fields:'weekly / monthly active · posts · replies · introductions · collaborations · attendance — but the real metric is useful connections created' },
    { n:32, name:'Connections', pillar:'L', status:'planned',
      fields:'new person met · reason · collaboration · client · referral · job → economic connections per active member' },
    { n:33, name:'Events', pillar:'L', status:'partial',
      fields:'registrations · attendance · show rate · cost · satisfaction · connections · applications · sales → cost per attendee, revenue per event' },
    { n:34, name:'Training club / physical space', pillar:'L', status:'planned',
      fields:'visits · classes · retention · guests · referrals · revenue and cost per member · usage by high-LTV members → does the space actually lift retention?' },
    { n:35, name:'Leader performance', pillar:'U', status:'partial',
      fields:'students · attendance · implementation · success % · first-client % · certification % · response time · retention. Leader value = student outcome, not calls held.' },
    { n:36, name:'Cohort performance', pillar:'U', status:'live',
      fields:'cohort × leader × completion × success × income × certification × Network conversion × LTV × refund rate' },
    { n:37, name:'Curriculum performance', pillar:'U', status:'planned',
      fields:'per module: completion · time · rating · drop-out before/after · correlation with result. If a lesson does not predict success, why is it there?' },
    { n:38, name:'Support quality', pillar:'U', status:'planned',
      fields:'tickets · response time · resolution · category · repeated questions (these reveal broken curriculum) · escalations' },
    { n:39, name:'Product quality', pillar:'U', status:'partial',
      fields:'NPS · CSAT · completion · refunds · complaints · time to value — but economic outcome outranks all of them' },
    { n:40, name:'Financial scoreboard', pillar:'E', status:'live',
      fields:'gross · collected · refunds · net · COGS · gross profit · payroll · marketing · commissions · rent · software · overhead · operating profit · cash · AR · AP' },
    { n:41, name:'Unit economics', pillar:'E', status:'live',
      fields:'CAC · LTV · LTV:CAC · payback · gross profit per customer · revenue per lead / meeting / student / employee' },
    { n:42, name:'Capacity', pillar:'E', status:'live',
      fields:'students per leader · calls · support hours · room · gym · sales · onboarding → utilisation and what breaks at 2×, 5×, 10×' },
    { n:43, name:'Team performance', pillar:'E', status:'partial',
      fields:'per person: role · the ONE number they own · target · current · cost · revenue influenced' },
    { n:44, name:'CEO dashboard', pillar:'E', status:'live',
      fields:'growth · outcome · LTV · economics · current constraint — 12 numbers, everything else is drill-down' },
    { n:45, name:'Alerts', pillar:'E', status:'live',
      fields:'threshold and trend alerts that name the metric, the drop, the segment and the money at stake' },
    { n:46, name:'Benchmarks', pillar:'E', status:'live',
      fields:'current · previous · target · best ever · 30-day · 90-day average → green / yellow / red' },
    { n:47, name:'Cohort analysis', pillar:'U', status:'live',
      fields:'customers grouped by enrolment month, tracked to 30/90-day success, Network conversion, retention and LTV — monthly totals hide everything' },
    { n:48, name:'Funnel cohort analysis', pillar:'V', status:'partial',
      fields:'the same, grouped by acquisition source → content → customer quality → LTV' },
    { n:49, name:'Predictive success score', pillar:'U', status:'planned',
      fields:'attendance · assignments · outreach · baseline · leader · response time · early results → probability of success' },
    { n:50, name:'Customer risk score', pillar:'U', status:'live',
      fields:'missed onboarding · stopped attending · no outreach · no project · payment failed · no progress → intervene on day 14, not day 90' },
    { n:51, name:'LTV risk score', pillar:'L', status:'live',
      fields:'low attendance · no connections · no opportunities · no events · income down · missed payments → churn before it happens' },
    { n:52, name:'Business value created', pillar:'U', status:'live',
      fields:'member revenue generated · client revenue influenced · cost savings · salaries increased · contracts won · businesses started' },
  ];

  return { PILLARS, pillar, FIELDS, field, fieldGroups, METRICS, metric, metricsOf,
           CEO, DOMAINS, fmt, fmtField, yen };
})();
