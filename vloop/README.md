# ◍ VALUE LOOP OS

**The operating system that tells a business what to fix next.**

A private, offline, on-device business operating system. Type the period in,
and it scores the company across **V·A·L·U·E**, names the single constraint,
quotes what closing it is worth **in yen**, prescribes what to do about it, and
tracks whether the prescription worked.

No accounts. No server. No data leaves the device.

```
MEASURE → SCORE → FIND CONSTRAINT → PRESCRIBE → TRACK → REPEAT
```

Open `index.html`, or drop `standalone.html` (one self-contained file) anywhere
and open it. Add it to a phone home screen and it runs as an app, offline.

---

## The five screens

| Screen | What you get |
|---|---|
| **Company** | The VALUE LOOP score, the five pillar bars, the current constraint with its yen value, the 12 CEO numbers, live alerts, and how complete the record actually is. |
| **Acquire** | Attention → cash as one funnel with every conversion rate, the V and A metrics against benchmark, and revenue + median LTV **by source** — because a cheap lead and a good customer are different things. |
| **Success** | Activation, day-14 implementation, the 90-day verified result rate, proof, time-to-result percentiles, failure reasons ranked, the at-risk list, and **LTV by result level** — the table that proves or kills the thesis that outcomes drive lifetime value. |
| **Retain** | Network flow, churn, expected months retained, NRR, expansion, and LTV by cohort / source / salesperson / leader. |
| **Diagnose** | *"Your current bottleneck is X."* Every lever ranked by the yen it would add, each opening into concrete prescriptions with an owner and a horizon. Start one and it enters the tracked-intervention ledger, to be closed later as **worked / no effect / made it worse**. |
| **Data** | The manual layer: type the period in, keep the customer master record, edit every benchmark, browse the 52-domain backend registry, export JSON/CSV. |

## How the constraint is found

Every lever goes through one funnel equation — views → leads (+ referrals) →
applications → qualified → booked → attended → customers → cash + recurring +
expansion. Each lever in turn is moved to its benchmark with everything else
held still, and the change in value is the number on the screen. Biggest number
wins.

Referrals are coupled to the 90-day result rate, so the loop feeds itself:
**outcome → proof → referrals → cheaper acquisition.** That coupling is an
assumption, stated on the screen, and the *LTV by result* table is where you
verify it against your own data.

Full method, definitions and the manual operating rhythm:
[`docs/VALUE-LOOP-OS.md`](../docs/VALUE-LOOP-OS.md) ·
[`docs/METRIC-DICTIONARY.md`](../docs/METRIC-DICTIONARY.md)

## Deliberately not automated

Nothing is piped in from Instagram, LINE, Stripe or a CRM. Numbers are typed by
someone who knows what they mean.

Run it manually for three to six months, find out which metrics actually predict
money, **delete the ones that predicted nothing**, and only then automate the
collection. The worst possible outcome is an automated dashboard of 200 numbers
nobody uses.

## Files

```
vloop/
  index.html            app shell + tab bar
  standalone.html       the whole app inlined into one file (generated)
  css/styles.css
  js/schema.js          pillars, 47 input fields, 43 derived metrics, 52-domain registry
  js/store.js           localStorage: periods, people, interventions, benchmarks
  js/engine.js          measure, score, the funnel model, lever ranking, alerts, risk
  js/prescribe.js       the prescription book + how an intervention gets judged
  js/seed.js            synthetic demo data (clearly labelled; not anyone's real numbers)
  js/ui.js              the five screens + the data layer
  js/app.js             routing, service worker
  build_dictionary.js   regenerates docs/METRIC-DICTIONARY.md from schema.js
```

## Build

```bash
python3 build_standalone.py vloop     # → vloop/standalone.html
node vloop/build_dictionary.js        # → docs/METRIC-DICTIONARY.md
```

## Privacy

Everything lives in `localStorage` on the device that typed it. Export JSON
before clearing your browser — there is no copy anywhere else.
