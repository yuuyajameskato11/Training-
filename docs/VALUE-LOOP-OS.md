# VALUE LOOP OS — the operating manual

**The operating system that tells a business what to fix next.**

This document is the manual half of the system. The app in [`/vloop`](../vloop)
is the scoring half. Neither one works without the other, and the manual half
comes first.

---

## What this is

A business is five questions, asked continuously:

| | Pillar | The question |
|---|---|---|
| **V** | Visibility | Where is attention coming from? |
| **A** | Acquisition | Where is money leaking? |
| **L** | Lifetime Value | Are customers staying and buying more? |
| **U** | User Outcome | Are customers getting results? |
| **E** | Efficiency | Does the machine keep its margin? |

And one loop, run forever:

```
MEASURE → SCORE → FIND CONSTRAINT → PRESCRIBE → TRACK → REPEAT
```

The whole company rolls up into one chain —

```
Attention → Lead → Qualified → Meeting → Sale → Payment → Activation →
Implementation → Outcome → Proof → Retention → Expansion → Referral
```

— sitting on top of `Revenue → Gross profit → Operating profit → Cash`.

Everything else in this repository is a diagnostic metric hanging off that chain.

## What this is not

It is **not** an integration layer. Nothing is piped in from Instagram, LINE,
Stripe or a CRM, and that is on purpose. Numbers get typed in by a human who
knows what they mean, because the failure mode of analytics software is a
dashboard of 200 automatically-collected numbers nobody uses and nobody trusts.

Automate the collection *after* you know which numbers predict money — not before.

---

## The rule: run it manually first

**Three to six months of clean, manually-entered data before any automation.**

During that window the job is not to grow the dashboard. It is to find out:

1. Which metrics actually predict revenue, and which are decoration.
2. Which definitions people disagree about (they always disagree about "lead").
3. Which numbers are impossible to collect honestly at this size.

At the end of it, **delete the metrics that predicted nothing.** A metric that
survived six months of scrutiny is worth automating. The rest were noise with a
chart attached.

---

## The rhythm

**Once a month** (or weekly, if you want the habit to bite), one person sits
down for twenty minutes and fills in the period on the **Data** screen. Not a
committee. One owner, one keyboard.

| Block | Where the numbers come from | Minutes |
|---|---|---|
| Attention + LINE | Instagram insights, LINE OA manager | 5 |
| Funnel | Application sheet, calendar, sales log | 5 |
| Money | Bank + payment processor, **not** the contracts folder | 3 |
| Network | Subscription list at period start and end | 2 |
| Outcome | Leader reports, verified only | 4 |
| Cost & capacity | Bookkeeping, payroll, leader roster | 3 |

Then, in the same sitting:

1. Open **Company**. Read the five pillar scores and the alerts.
2. Open **Diagnose**. Read the one-sentence bottleneck and the ranked money list.
3. Pick **one** prescription. Press *Start & track*. Assign the owner named on it.
4. Review last period's tracked interventions. Close each one: *worked*,
   *no effect*, or *made it worse*.

That last step is the one everybody skips, and it is the only step that
compounds. An intervention nobody judged is an opinion, not a system.

---

## Definitions are the whole game

Most funnel reporting fails for one boring reason: two people counted
differently. So the definitions live in exactly one place —
[`docs/METRIC-DICTIONARY.md`](METRIC-DICTIONARY.md), generated straight from the
schema the engine computes with, so the written definition and the calculated
one cannot drift apart.

The three that cause the most arguments, settled here:

- **Lead** — a person who gave you a way to contact them, this period. A
  follower is not a lead. A view is not a lead.
- **Revenue** — signed contract value and collected cash are two different
  numbers and both are tracked. Flat "revenue" is banned. Instalments, partial
  payments and cancellations mean the two diverge, and the gap between them is
  reported as **cash collection rate**.
- **Result** — a day-90 economic outcome you could show a stranger, with
  evidence. Self-reported is not verified. "Feeling more confident" is not an
  economic outcome.

Every field also carries a first-touch **source**. Missing lead-source data is
what makes a funnel look measured when it is being guessed at, and the app says
so out loud: it shows record completeness on the CEO screen and downgrades its
own confidence in the alerts.

---

## How the diagnosis works

Every lever is put through one equation:

```
leads      = views × leadRate  +  activeStudents × referralRate
apps       = leads × appRate
qualified  = apps × qualRate
booked     = qualified × bookRate
attended   = booked × showRate
customers  = attended × closeRate

value      = customers × ( price × collectionRate × (1 − refundRate)     # front end
                         + networkConv × networkFee × monthsRetained     # recurring
                         + expansionPerCustomer )                        # expansion
```

To rank the levers, each one in turn is moved to its benchmark **with everything
else held still**, and the change in `value` is the number you see in yen. The
biggest number is the constraint.

The loop closes through `referralRate`, which is coupled to the 90-day result
rate (×1.0) and drags Network conversion with it (×0.5). That coupling is the
central thesis of the business — **outcome → proof → referrals → cheaper
acquisition** — and it is an *assumption* until your own data confirms it. The
**LTV by result level** table on the Success screen is where you find out. If
median LTV does not climb with result level, the thesis is wrong and the growth
plan changes. The table exists to be able to say that.

---

## What the record must grow into

The app captures 47 fields today. The full record it is designed to hold is 52
domains, listed in the dictionary and browsable in-app under **Data → system**,
each marked *live*, *partial* or *planned*.

Add them in this order — earliest payback first:

1. **Attribution on every person** (domain 2). Without first-touch source, you
   cannot tell a cheap lead from a good customer, and every channel decision is
   a guess.
2. **Payments, per instalment** (10). Cash timing is where growth quietly dies.
3. **Lead quality score** (6). Then compare it to close rate *and* to day-90
   success. Expect a surprise: the easiest people to close are often not the
   best customers.
4. **Failure reasons on every unsuccessful student** (18). If a third of them
   fail for the same reason, the next product change is decided for you.
5. **Content IDs** (4). Views → leads → sales per post turns content from taste
   into economics.
6. **Case studies, structured** (21). Filterable proof is a sales asset; a
   folder of screenshots is not.

Everything after that is a refinement.

---

## Governance

- Every number has exactly **one owner**. A number owned by "the team" is owned
  by nobody.
- The CEO screen shows **12 numbers**. If a thirteenth is genuinely needed,
  something else comes off. Everything else is drill-down.
- **Activity is never the metric.** Lessons watched, calls held, posts published
  — these are diagnostics you consult *after* an outcome moved, to explain why.
- Averages are for reporting; **medians** are for the truth. One member earning
  ¥6M does not make a median member.
- **Cohorts, not months.** Monthly totals mix a good February into a bad July.
  A product change is only proven by a cohort that outperforms the one before it.

---

## The end state

Collect everything in the back end. Show the CEO only the five to fifteen
numbers that currently matter, plus one sentence naming what to fix next and
what fixing it is worth.

That difference — between a dashboard and a decision — is the entire product.
