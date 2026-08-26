/* ============================================================================
   prescribe.js — PRESCRIBE.

   A diagnosis nobody can act on is trivia. For every metric the engine can
   name as the constraint, this file holds the two or three things that
   actually move it, who owns it, and how long before you are allowed to
   judge it. Starting one writes an intervention into the ledger, which is
   the TRACK half of the loop.
   ========================================================================== */

const Rx = (() => {

  const BOOK = {
    /* ---------------- V ---------------- */
    leadRate: [
      { a:'Put one unmissable CTA in every piece of content — same offer, same words, every time.',
        w:'Attention that never gets asked for anything converts at zero.', o:'Content', h:'2 weeks' },
      { a:'Build one lead magnet that solves the single problem your best customers had in week one, and gate it behind LINE.',
        w:'Turns passive viewers into contactable humans without a sales conversation.', o:'Content', h:'3 weeks' },
      { a:'Tag every post with a content ID and start recording views → leads per post.',
        w:'You cannot raise a rate you only measure in aggregate.', o:'Content', h:'1 week' },
    ],
    ctaClickRate: [
      { a:'Move the CTA to the first 3 seconds and repeat it at the end.', w:'Most viewers never reach the end.', o:'Content', h:'2 weeks' },
      { a:'Cut the number of different CTAs to one per account per month.', w:'Split attention converts worse than a boring single ask.', o:'Content', h:'1 month' },
    ],
    profileVisitRate: [
      { a:'Rewrite the hook of the five highest-reach posts to name the avatar and the problem explicitly.',
        w:'Reach without recognition does not produce a profile visit.', o:'Content', h:'2 weeks' },
    ],
    lineBlockRate: [
      { a:'Cut broadcast frequency and segment: only send the offer to people who clicked something in the last 30 days.',
        w:'Blocks are the audience telling you the message did not match why they joined.', o:'Content', h:'1 month' },
      { a:'Log topic and CTA for every broadcast, then compare block-after-message by topic.',
        w:'One recurring message type is usually doing most of the damage.', o:'Content', h:'1 month' },
    ],
    revPerMilleViews: [
      { a:'Rank last quarter\'s content by revenue per 1,000 views and rebuild the top three formats.',
        w:'View count is not the product; downstream revenue is.', o:'Content', h:'1 month' },
    ],

    /* ---------------- A ---------------- */
    appRate: [
      { a:'Shorten the application to the questions that actually predict a close, and nothing else.',
        w:'Every extra field costs completions without improving qualification.', o:'Sales', h:'2 weeks' },
      { a:'Send an automatic reminder to anyone who starts and does not finish, within 1 hour.',
        w:'Intent decays in hours, not days.', o:'Sales', h:'1 week' },
    ],
    qualRate: [
      { a:'Write the qualification bar down as a score out of 100 and apply it to every application.',
        w:'A low qualified rate means the audience is wrong — that is a content problem, not a sales problem.', o:'Sales', h:'2 weeks' },
      { a:'Compare qualified rate by acquisition source and cut spend on the worst source.',
        w:'Cheap leads from the wrong page cost more than they save.', o:'Marketing', h:'1 month' },
    ],
    bookRate: [
      { a:'Contact every qualified application within 15 minutes; measure time-to-first-contact.',
        w:'Speed to lead is usually the whole gap between qualified and booked.', o:'Sales', h:'1 week' },
      { a:'Let the applicant self-book from the confirmation screen instead of waiting for a reply.',
        w:'Removes a full human round-trip from the funnel.', o:'Ops', h:'2 weeks' },
    ],
    showRate: [
      { a:'Confirm 24h and 2h before, by LINE, with the person\'s own stated goal in the message.',
        w:'No-shows are mostly forgetting, not rejection.', o:'Sales', h:'2 weeks' },
      { a:'Book meetings inside 72 hours of the application.', w:'Show rate falls with every day of delay.', o:'Sales', h:'2 weeks' },
    ],
    closeRate: [
      { a:'Record every call and tag the reason lost. Review the top objection weekly.',
        w:'Sales training built on data beats sales training built on memory.', o:'Sales', h:'1 month' },
      { a:'Give reps three filterable case studies matching the prospect\'s avatar.',
        w:'Proof closes the gap between wanting the outcome and believing it.', o:'Sales', h:'3 weeks' },
      { a:'Split close rate by qualification score and stop taking calls below the bar.',
        w:'Protects rep hours and raises the rate without changing anything else.', o:'Sales', h:'1 month' },
    ],
    collectionRate: [
      { a:'Take payment on the call. Card first, instalments only as an exception with the first payment taken live.',
        w:'Signed is not collected. Cash that arrives later often does not arrive.', o:'Sales', h:'2 weeks' },
      { a:'Automate failed-payment retries and a same-day human follow-up.',
        w:'Most instalment default is mechanical, not intentional.', o:'Ops', h:'1 month' },
    ],
    refundRate: [
      { a:'Compare refunds by salesperson and by objection handled. Retrain the outlier.',
        w:'Refunds are usually sold in, not delivered in.', o:'Sales', h:'1 month' },
      { a:'Make the first 14 days deliver one visible win.', w:'Buyer\'s remorse dies the moment the product works once.', o:'Delivery', h:'1 month' },
    ],
    avgPrice: [
      { a:'Stop discounting; replace the discount with a payment plan at full price.',
        w:'Discounting lowers price and lowers commitment at the same time.', o:'Sales', h:'1 month' },
      { a:'Build one higher-tier offer for the applicants who already have a business.',
        w:'Same funnel, higher ceiling.', o:'CEO', h:'2 months' },
    ],
    revPerMeeting: [
      { a:'Cut the lowest-scoring third of meetings and give those hours to follow-up on the top third.',
        w:'Revenue per attended call is the honest measure of sales-team capacity.', o:'Sales', h:'1 month' },
    ],

    /* ---------------- L ---------------- */
    networkConv: [
      { a:'Make the Network invitation part of graduation, not an email afterwards.',
        w:'The moment of proof is the moment of conversion.', o:'Delivery', h:'1 month' },
      { a:'Show the invitee what members earned through the Network last quarter.',
        w:'Recurring fees are bought with expected return, not community language.', o:'CEO', h:'1 month' },
    ],
    retentionMonths: [
      { a:'Tag every cancellation with a reason and publish churn-by-reason monthly.',
        w:'Retention problems get guessed at far more often than they get measured.', o:'Ops', h:'1 month' },
      { a:'Give every member one concrete thing per month: an opportunity, an introduction, or a booked collaboration.',
        w:'Members leave when nothing has happened to them recently.', o:'Delivery', h:'2 months' },
      { a:'Call every member whose attendance and engagement hit zero for 30 days.',
        w:'Churn is visible weeks before it is paid for.', o:'Delivery', h:'1 month' },
    ],
    monthlyChurn: [
      { a:'Run the LTV risk list weekly and intervene on anyone with two or more flags.',
        w:'Cheaper to save a member than to acquire one.', o:'Delivery', h:'1 month' },
    ],
    expansionPerCust: [
      { a:'Define one paid next step for a member who hits their first ¥300K.',
        w:'Expansion revenue is sold to success, not to everyone.', o:'CEO', h:'2 months' },
      { a:'Put events on a fixed calendar so members can plan to spend.', w:'Irregular offers produce irregular revenue.', o:'Ops', h:'2 months' },
    ],
    nrr: [
      { a:'Track recurring, expansion and churned recurring separately every month.',
        w:'Net revenue retention above 100% means growth without new customers.', o:'CEO', h:'1 month' },
    ],
    ltv: [
      { a:'Segment LTV by acquisition source and reallocate spend to the highest-LTV source, not the cheapest lead.',
        w:'Cheap leads that never renew are the most expensive thing you can buy.', o:'CEO', h:'1 month' },
    ],

    /* ---------------- U ---------------- */
    successRate: [
      { a:'Define the 90-day verified result in one sentence, and verify it with evidence, not self-report.',
        w:'An undefined outcome cannot be improved and cannot be sold.', o:'CEO', h:'2 weeks' },
      { a:'Tag every unsuccessful student with a failure reason and count them.',
        w:'If a third fail for the same reason, the next product change is obvious.', o:'Delivery', h:'1 month' },
      { a:'Move the first real implementation into week one of the program.',
        w:'Time-to-first-action predicts the day-90 result better than anything else you track.', o:'Delivery', h:'1 month' },
    ],
    day14Rate: [
      { a:'Make day 14 a gate: no student passes it without one completed real action.',
        w:'Students with no implementation by day 14 rarely produce a result at day 90.', o:'Delivery', h:'1 month' },
      { a:'Assign the leader on day 0 and require contact within 48 hours.',
        w:'Unassigned students drift, and drift is irreversible by week three.', o:'Delivery', h:'2 weeks' },
    ],
    activationRate: [
      { a:'Book onboarding during the sales call itself.', w:'Every day between payment and onboarding costs completion.', o:'Sales', h:'2 weeks' },
      { a:'Capture the day-1 baseline in onboarding — income, clients, audience, constraint.',
        w:'Without a baseline you can never prove the transformation you sell.', o:'Delivery', h:'1 month' },
    ],
    firstClientRate: [
      { a:'Require a fixed number of outreach attempts per week and count them.',
        w:'The most common failure reason is that outreach never happened.', o:'Delivery', h:'1 month' },
      { a:'Put unclaimed client work from the opportunity board in front of students who have none.',
        w:'A first client removes the belief problem permanently.', o:'Delivery', h:'2 months' },
    ],
    proofRate: [
      { a:'Make a structured case study part of graduation: before → action → after → number → time.',
        w:'A result you cannot show does not compound into acquisition.', o:'Delivery', h:'1 month' },
      { a:'Ask for the testimonial at the moment of the win, not at the end of the program.',
        w:'Recall decays and so does enthusiasm.', o:'Delivery', h:'2 weeks' },
    ],
    referralRate: [
      { a:'Ask every member who hits a verified result for two introductions, by name, that week.',
        w:'Referrals follow results — but only if somebody asks.', o:'Delivery', h:'1 month' },
      { a:'Track referral rate by outcome level to prove where referrals actually come from.',
        w:'It tells you whether to spend on ads or on delivery.', o:'CEO', h:'2 months' },
    ],
    dropoutRate: [
      { a:'Run the customer risk list weekly and contact anyone with two or more flags.',
        w:'Day-14 intervention costs an hour; a day-90 failure costs the customer.', o:'Delivery', h:'1 month' },
    ],

    /* ---------------- E ---------------- */
    cac: [
      { a:'Kill the worst-performing source by revenue per lead, not by cost per lead.',
        w:'CAC falls fastest by removing spend that never converts.', o:'Marketing', h:'1 month' },
      { a:'Raise the referred share of leads — referrals arrive at a CAC of nearly zero.',
        w:'The cheapest acquisition channel is a customer who got a result.', o:'CEO', h:'2 months' },
    ],
    ltvCac: [
      { a:'Fix the denominator first: cut unprofitable spend before trying to raise LTV.',
        w:'LTV moves in quarters; CAC moves in weeks.', o:'CEO', h:'1 month' },
    ],
    grossMargin: [
      { a:'Raise students per leader toward the tested ceiling before hiring another leader.',
        w:'Margin leaks through under-loaded delivery capacity.', o:'Ops', h:'2 months' },
    ],
    opProfit: [
      { a:'List every operating cost against the number it is supposed to move; cut anything that owns no number.',
        w:'Costs without an owned metric never get questioned.', o:'CEO', h:'1 month' },
    ],
    capacityUse: [
      { a:'Cap monthly intake at tested delivery capacity and hold the rest in a waitlist.',
        w:'Selling past capacity converts future results — and referrals — into refunds.', o:'CEO', h:'immediate' },
      { a:'Write down what breaks at 2×, 5× and 10× before the next campaign.',
        w:'Growth breaks fulfilment first and reports it last.', o:'Ops', h:'1 month' },
    ],
    founderDependence: [
      { a:'Take the founder out of one recurring delivery slot per month and document it as a system.',
        w:'Founder hours are the hardest capacity ceiling in the company.', o:'CEO', h:'3 months' },
    ],
    cacPayback: [
      { a:'Collect more of the contract up front — payback is a cash-timing problem before it is a pricing one.',
        w:'A long payback is a growth speed limit even when the unit economics work.', o:'CEO', h:'1 month' },
    ],
  };

  const GENERIC = [
    { a:'Write the definition of this metric down and make one person own it.',
      w:'Metrics without an owner and a definition drift until they mean nothing.', o:'CEO', h:'1 week' },
    { a:'Start recording this metric by segment (source, salesperson, cohort) instead of in aggregate.',
      w:'Aggregates hide the segment that is actually broken.', o:'Ops', h:'1 month' },
  ];

  const forMetric = id => (BOOK[id] || GENERIC).map(r => ({ ...r, metricId:id }));

  /* ---- TRACK: judge an intervention on the evidence, not on effort ------- */
  function review(x, periodId) {
    const d = Schema.metric(x.metricId);
    const now = Engine.metricsFor(periodId).metrics[x.metricId];
    if (now == null || x.baseline == null) return { verdict:'unknown', now, delta:null };
    const raw = now - x.baseline;
    const good = d.dir === 'down' ? -raw : raw;
    const rel = x.baseline ? good / Math.abs(x.baseline) : null;
    const verdict = rel == null ? 'unknown' : rel >= 0.1 ? 'worked' : rel <= -0.1 ? 'worse' : 'no-effect';
    return { verdict, now, delta:raw, rel };
  }

  const VERDICT_LABEL = { worked:'Worked', 'no-effect':'No effect', worse:'Made it worse', unknown:'Not enough data' };

  return { BOOK, forMetric, review, VERDICT_LABEL };
})();
