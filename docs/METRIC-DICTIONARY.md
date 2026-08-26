# Metric dictionary

> Generated from `vloop/js/schema.js` by `node vloop/build_dictionary.js`. Do not edit by hand.

One definition per metric, written down once. Inconsistent definitions are the
reason funnel numbers stop being trusted, so this file is the tiebreaker.

**47 typed inputs → 43 derived metrics → 5 pillar scores → 1 constraint.**

## V — Visibility

*Where is attention coming from?*

### What you type in

| Field | Unit | Definition |
|---|---|---|
| Content views | # | Total views across every account for the period. One number. |
| Unique reach | # | Unique accounts reached. Blank if the platform will not give it. |
| Profile visits | # | — |
| CTA / link clicks | # | Clicks on the thing that starts the funnel (LINE, application, DM CTA). |
| Net new followers | # | — |
| LINE broadcasts sent | # | — |
| New LINE friends | # | — |
| LINE target reach | # | Reachable friends at period end — the only LINE number that pays. |
| LINE blocks | # | — |

### What the engine derives

| Metric | Definition | Target | Floor | Better | Weight |
|---|---|---|---|---|---|
| **Profile visit rate** | Profile visits ÷ reach | 3.0% | 0.5% | higher | 1 |
| **CTA click rate** | CTA clicks ÷ views | 2.0% | 0.2% | higher | 1 |
| **Lead rate (views → leads)** ⚙︎ | Leads ÷ views. The rate at which attention becomes a contactable human. | 1.5% | 0.2% | higher | 3 |
| **Revenue per 1,000 views** | Cash collected ÷ views × 1,000. Lets you compare a Reel to a Reel economically. | ¥3,000 | ¥200 | higher | 2 |
| **LINE block rate** | Blocks ÷ (target reach + blocks) for the period. | 2.0% | 8.0% | lower | 2 |
| **LINE net growth** | New friends − blocks. Negative means the channel is dying. | 200 | 0 | higher | 1 |
| **Revenue per LINE recipient** | Cash collected ÷ LINE target reach. | ¥2,000 | ¥100 | higher | 1 |

## A — Acquisition

*Where is money leaking?*

### What you type in

| Field | Unit | Definition |
|---|---|---|
| New leads | # | DEFINITION: a person who gave you a way to contact them this period. Not a follower. |
| …of which referred | # | — |
| Applications completed | # | — |
| …qualified | # | Passed your qualification bar — not merely submitted. |
| Meetings booked | # | — |
| Meetings attended | # | Prospect actually showed up. Booked − attended = no-shows. |
| New customers closed | # | — |
| Contract value signed | ¥ | Face value of what was signed. NOT cash. |
| Cash actually collected | ¥ | Money in the bank this period, including instalments from old deals. |
| Refunds / cancellations | ¥ | — |

### What the engine derives

| Metric | Definition | Target | Floor | Better | Weight |
|---|---|---|---|---|---|
| **Lead → application** ⚙︎ | Applications completed ÷ leads. | 25% | 5.0% | higher | 2 |
| **Application → qualified** ⚙︎ | Qualified applications ÷ applications. Low = the audience is wrong, not the sales team. | 60% | 20% | higher | 1 |
| **Qualified → booked** ⚙︎ | Meetings booked ÷ qualified applications. Mostly a speed-of-contact problem. | 70% | 30% | higher | 2 |
| **Show rate** ⚙︎ | Meetings attended ÷ meetings booked. | 80% | 50% | higher | 2 |
| **Meeting → close** ⚙︎ | New customers ÷ meetings attended. | 30% | 12% | higher | 3 |
| **Average contract value** ⚙︎ | Contract value signed ÷ new customers. | ¥50.0万 | ¥20.0万 | higher | 1 |
| **Cash collection rate** ⚙︎ | Cash collected ÷ contract value signed. Signed is not collected. | 85% | 50% | higher | 3 |
| **Refund rate** | Refunds ÷ cash collected. | 2.0% | 10% | lower | 2 |
| **Revenue per lead** | Cash collected ÷ leads. | ¥3.0万 | ¥5,000 | higher | 2 |
| **Revenue per attended meeting** | Cash collected ÷ meetings attended. The single best sales-team number. | ¥15.0万 | ¥4.0万 | higher | 2 |

## L — Lifetime Value

*Are customers staying and buying more?*

### What you type in

| Field | Unit | Definition |
|---|---|---|
| Network members at start | # | — |
| Invited to Network | # | — |
| Joined Network | # | — |
| Cancelled Network | # | — |
| Network fee / member / mo | ¥ | — |
| Expansion revenue | ¥ | Upsells, Business Builder, advanced programs, consulting — existing customers only. |
| Event revenue | ¥ | — |

### What the engine derives

| Metric | Definition | Target | Floor | Better | Weight |
|---|---|---|---|---|---|
| **University → Network** ⚙︎ | Joined Network ÷ new customers. | 50% | 15% | higher | 3 |
| **Invite → join** | Joined ÷ invited. | 60% | 25% | higher | 1 |
| **Network monthly churn** | Cancelled ÷ members at period start (normalised to a month). | 3.0% | 12% | lower | 3 |
| **Expected months retained** ⚙︎ | 1 ÷ monthly churn. How long a Network member is worth money. | 24.0 mo | 6.0 mo | higher | 2 |
| **Recurring revenue (MRR)** | Members at period end × Network fee. | ¥300万 | ¥50.0万 | higher | 2 |
| **Expansion revenue per customer** ⚙︎ | (Expansion + event revenue) ÷ active students. | ¥8.0万 | ¥5,000 | higher | 2 |
| **Net revenue retention** | (Recurring + expansion − churned recurring) ÷ recurring at start. | 110% | 80% | higher | 2 |
| **Customer LTV** | Front-end cash + Network conversion × fee × months retained + expansion per customer. | ¥120万 | ¥40.0万 | higher | 3 |

## U — User Outcome

*Are customers getting results?*

### What you type in

| Field | Unit | Definition |
|---|---|---|
| Active students | # | — |
| Onboarding completed | # | — |
| Implemented by day 14 | # | Of the students who reached day 14 this period, how many took a real action. |
| …students who hit day 14 | # | — |
| First paid client won | # | — |
| Students who hit day 90 | # | — |
| …with a verified result | # | Day-90 economic result you could show a stranger. Verified, not claimed. |
| Case studies verified | # | — |
| Drop-outs | # | — |
| Referrals from customers | # | — |
| Median member income gain | ¥ | MEDIAN, not average. One ¥6M outlier is not a product. |
| Verified member earnings | ¥ | Money members made / saved their clients, verified. The ultimate metric. |

### What the engine derives

| Metric | Definition | Target | Floor | Better | Weight |
|---|---|---|---|---|---|
| **Onboarding completion** | Onboarding completed ÷ new customers. | 95% | 60% | higher | 2 |
| **Day-14 implementation** | Implemented by day 14 ÷ students who reached day 14. The earliest honest predictor of a result. | 80% | 40% | higher | 3 |
| **90-day verified result rate** ⚙︎ | Verified day-90 results ÷ students who reached day 90. THE product metric. | 50% | 15% | higher | 4 |
| **First-client rate** | First paid clients won ÷ active students. | 25% | 5.0% | higher | 2 |
| **Case studies per result** | Verified case studies ÷ verified results. Results you cannot show do not sell anything. | 60% | 10% | higher | 2 |
| **Drop-out rate** | Drop-outs ÷ active students. | 3.0% | 15% | lower | 2 |
| **Referrals per customer** ⚙︎ | Referrals from customers ÷ active students. The loop closing. | 0.4 | 0.05 | higher | 3 |
| **Referred share of leads** | Referred leads ÷ leads. Rises when the product works. | 30% | 5.0% | higher | 1 |
| **Verified value created per member** | Verified member earnings ÷ active students. | ¥30.0万 | ¥3.0万 | higher | 2 |

## E — Efficiency

*Does the machine keep its margin?*

### What you type in

| Field | Unit | Definition |
|---|---|---|
| Marketing spend | ¥ | — |
| Sales cost | ¥ | Sales payroll + commissions. Part of CAC. |
| Delivery cost (COGS) | ¥ | Coaches, leaders, venue, anything that scales with students. |
| Other operating cost | ¥ | Rent, software, admin payroll, overhead. |
| Team headcount | # | — |
| Leaders / coaches | # | — |
| Max students per leader | # | — |
| Founder hours in delivery | h | Hours the founder personally had to be in the machine. Founder dependence. |
| Founder hours total | h | — |

### What the engine derives

| Metric | Definition | Target | Floor | Better | Weight |
|---|---|---|---|---|---|
| **CAC** | (Marketing + sales cost) ÷ new customers. | ¥8.0万 | ¥30.0万 | lower | 3 |
| **LTV : CAC** | LTV ÷ CAC. Under 3 the machine is not really profitable. | 4.0× | 1.5× | higher | 4 |
| **CAC payback** | CAC ÷ front-end cash per customer, in months of a customer's payments. | 1.0 mo | 6.0 mo | lower | 2 |
| **Gross margin** | (Cash collected − refunds − delivery cost) ÷ (cash collected − refunds). | 70% | 40% | higher | 3 |
| **Operating profit** | Net collected − delivery − marketing − sales − other operating cost. | ¥200万 | ¥0 | higher | 3 |
| **Operating margin** | Operating profit ÷ net collected. | 25% | 0.0% | higher | 3 |
| **Revenue per team member** | Cash collected ÷ headcount. | ¥150万 | ¥40.0万 | higher | 1 |
| **Delivery capacity used** | Active students ÷ (leaders × max students per leader). Over 100% the product breaks quietly. | 75% | 110% | lower | 2 |
| **Founder dependence** | Founder hours inside delivery ÷ founder hours total. | 15% | 60% | lower | 2 |

⚙︎ = wired into the revenue model, so a gap here is quoted in yen on the diagnosis screen.

## Scoring

```
score = clamp01((value − floor) / (target − floor)) × 100      # higher-is-better
score = clamp01((floor − value) / (floor − target)) × 100      # lower-is-better
pillar score = weighted mean of its metric scores
green ≥ 75   amber ≥ 45   red < 45
```

Targets and floors are opinions, not physics. Every one of them is editable under
**Data → benchmarks**, and they should be re-cut once you have real history.

## The backend registry

The record the system is designed to hold, whether or not it is captured yet.

| # | Domain | Pillar | Status | Fields |
|---|---|---|---|---|
| 1 | Customer / lead master record | A | partial | id · name · contact · LINE · IG · age · location · occupation · income now · revenue now · skill · clients · desired income · desired result · cohort · product · salesperson · leader · source · campaign · first touch · last touch · referrer · every date from first touch to cancellation · status |
| 2 | Attribution | V | partial | channel · content ID · campaign · spend · first/last touch → leads, applications, meetings, customers, revenue, profit and LTV BY SOURCE |
| 3 | Attention / distribution | V | live | followers · impressions · reach · views · profile visits · watch time · completion · saves · shares · DMs · clicks → profile-visit rate, CTA rate, lead rate, revenue per 1,000 views |
| 4 | Content database | V | planned | content ID · creator · hook · format · purpose tag (attention / trust / proof / education / reframe / conversion / case study) · avatar · views → leads → sales → revenue per view |
| 5 | LINE health | V | live | friends · target reach · blocks · block rate · replies · clicks · revenue per recipient · revenue per broadcast · block-after-message by topic |
| 6 | Lead qualification | A | partial | income · ability to pay · urgency · problem severity · timeline · authority · skill · hours available · coachability → LEAD QUALITY SCORE /100 → meeting rate, close rate, success, LTV |
| 7 | Application funnel | A | live | started · completed · qualified · rejected · booked · response time · time to booking |
| 8 | Sales pipeline | A | partial | per call: date · rep · source · offer · price · quality score · attended · outcome · reason lost · objection · days to close → close rate by rep / source / offer / avatar / score |
| 9 | Sales call intelligence | A | planned | objections · questions · talk ratio · discovery depth · proof used · close attempt · phrases that precede a yes |
| 10 | Payments | A | partial | invoiced · collected · outstanding · plan · instalment dates · failed · late · discount · refund · chargeback → cash collection rate, days to cash, default rate |
| 11 | Onboarding | U | live | booked · attended · baseline done · goals set · leader assigned · first assignment · time to first action |
| 12 | Baseline (day 1 snapshot) | U | partial | income · revenue · clients · audience · skill · portfolio · confidence · availability · runway · target · biggest constraint — without this you cannot prove transformation |
| 13 | Student activity | U | planned | lessons · assignments · coaching · events · outreach · pitches — diagnostic only, activity is not outcome |
| 14 | Skill development | U | planned | 14 skill tracks × beginner → developing → competent → verified → certified, each with attached proof. No self-rating. |
| 15 | Money milestones | U | partial | date of first ¥1 · ¥50K · ¥100K · ¥300K · ¥500K · ¥1M · ¥3M · ¥10M cumulative · revenue last 30/90 days · paying clients |
| 16 | Time to result | U | partial | days to first implementation · first client · first ¥100K · first case study · certification (median, not average) |
| 17 | Customer success rate | U | live | 30-day implementation · 60-day project · 90-day verified economic result · partial · none · dropped |
| 18 | Failure reasons | U | partial | 18 tagged causes from "never did outreach" to "curriculum gap" — quantified, because this is where product improvements come from |
| 19 | Customer outcome (non-money) | U | planned | jobs · promotions · clients · revenue lifted for others · hours saved · systems built · campaigns launched |
| 20 | Verified business value | U | partial | per project: client · starting metric · target · intervention · ending metric · ¥ value · duration · verification · proof link |
| 21 | Case study database | U | partial | member · avatar · starting point · diagnosis · action · result · timeframe · ¥ created · proof · permission · sales-use status — filterable by avatar for sales |
| 22 | Testimonial system | U | planned | requested · received · quantified · verified · permission · published · performance. Strong = before → action → after → number → time |
| 23 | Certification | U | planned | lessons · assessment · real project · client verification · case study · leader approval · level → certified operator income, placement, retention |
| 24 | Opportunity marketplace | L | planned | opportunities × operators → matches · interviews · contracts · contract value → MEMBER EARNINGS GENERATED THROUGH THE NETWORK |
| 25 | Network retention | L | live | invited · accepted · declined + reason · join date · months active · pause · cancel · reactivate → 30/90/180/365-day retention, monthly churn, revenue churn |
| 26 | Why people stay | L | planned | tagged: clients · opportunities · community · accountability · mentors · status · workspace · access — this is what the Network actually sells |
| 27 | Why people leave | L | partial | 13 tagged cancellation reasons → churn by reason. Do not guess retention problems. |
| 28 | LTV | L | live | front-end + recurring + upsell + events, segmented by source, rep, cohort, leader, certification and RESULT LEVEL |
| 29 | Expansion revenue | L | live | Network · Business Builder · advanced · events · consulting → expansion rate, net revenue retention |
| 30 | Referrals | U | live | referrer · referred · bought · revenue · reward · referrer result level → referral rate BY OUTCOME LEVEL |
| 31 | Community health | L | planned | weekly / monthly active · posts · replies · introductions · collaborations · attendance — but the real metric is useful connections created |
| 32 | Connections | L | planned | new person met · reason · collaboration · client · referral · job → economic connections per active member |
| 33 | Events | L | partial | registrations · attendance · show rate · cost · satisfaction · connections · applications · sales → cost per attendee, revenue per event |
| 34 | Training club / physical space | L | planned | visits · classes · retention · guests · referrals · revenue and cost per member · usage by high-LTV members → does the space actually lift retention? |
| 35 | Leader performance | U | partial | students · attendance · implementation · success % · first-client % · certification % · response time · retention. Leader value = student outcome, not calls held. |
| 36 | Cohort performance | U | live | cohort × leader × completion × success × income × certification × Network conversion × LTV × refund rate |
| 37 | Curriculum performance | U | planned | per module: completion · time · rating · drop-out before/after · correlation with result. If a lesson does not predict success, why is it there? |
| 38 | Support quality | U | planned | tickets · response time · resolution · category · repeated questions (these reveal broken curriculum) · escalations |
| 39 | Product quality | U | partial | NPS · CSAT · completion · refunds · complaints · time to value — but economic outcome outranks all of them |
| 40 | Financial scoreboard | E | live | gross · collected · refunds · net · COGS · gross profit · payroll · marketing · commissions · rent · software · overhead · operating profit · cash · AR · AP |
| 41 | Unit economics | E | live | CAC · LTV · LTV:CAC · payback · gross profit per customer · revenue per lead / meeting / student / employee |
| 42 | Capacity | E | live | students per leader · calls · support hours · room · gym · sales · onboarding → utilisation and what breaks at 2×, 5×, 10× |
| 43 | Team performance | E | partial | per person: role · the ONE number they own · target · current · cost · revenue influenced |
| 44 | CEO dashboard | E | live | growth · outcome · LTV · economics · current constraint — 12 numbers, everything else is drill-down |
| 45 | Alerts | E | live | threshold and trend alerts that name the metric, the drop, the segment and the money at stake |
| 46 | Benchmarks | E | live | current · previous · target · best ever · 30-day · 90-day average → green / yellow / red |
| 47 | Cohort analysis | U | live | customers grouped by enrolment month, tracked to 30/90-day success, Network conversion, retention and LTV — monthly totals hide everything |
| 48 | Funnel cohort analysis | V | partial | the same, grouped by acquisition source → content → customer quality → LTV |
| 49 | Predictive success score | U | planned | attendance · assignments · outreach · baseline · leader · response time · early results → probability of success |
| 50 | Customer risk score | U | live | missed onboarding · stopped attending · no outreach · no project · payment failed · no progress → intervene on day 14, not day 90 |
| 51 | LTV risk score | L | live | low attendance · no connections · no opportunities · no events · income down · missed payments → churn before it happens |
| 52 | Business value created | U | live | member revenue generated · client revenue influenced · cost savings · salaries increased · contracts won · businesses started |
