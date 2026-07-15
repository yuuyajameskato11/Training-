# ▲ APEX — KNCT Hybrid Apex System Journal

A private, WHOOP-style daily journal and AI coach that runs your **32-week
conjugate-block hybrid** program (sprint · middle-distance · endurance · jumps).
Run the morning readiness gate, tap to load today's prescribed session, log your
sets, and get a **readiness score**, the **day's call**, **per-set
auto-regulation**, **goal projections**, and **coach analysis** — all computed
on-device, offline, with **no accounts and no data leaving your phone**.

It encodes your actual program document: the **7 equipment systems**, the
**5-phase macrocycle** (Engine → Max Strength → Power → Speed → Competition
across weeks 1–32), the **High/Low weekly architecture** (CNS work clustered
Mon/Wed/Fri), the **CMJ + hard-gate readiness system**, the **80/20 intensity**
rule, and every **day-by-day prescribed session** — plus your current marks,
32-week checkpoints, and North Stars (10.9 / 49 / 4:45 / 15:00 / 40″).

---

## What it does

| Tab | What you get |
|-----|--------------|
| **Today** | A big readiness ring (0–100, green/amber/red), the day's *call*, the **Mon–Sun High/Low strip** with today highlighted, **today's prescribed AM/PM session** pulled straight from your program, one-tap **"Start today's session"**, the readiness-gate breakdown, and a recovery checklist. |
| **Log** | **Load today's prescribed session** in one tap (pre-fills every exercise with its target sets/reps/load), or add movements manually. Each logged set returns **live coaching** — velocity/RPE/RSI auto-regulation and a rest prescription. |
| **Progress** | All 10 goals shown **current → 32-week checkpoint → North Star** with an **ETA-to-checkpoint** from your trend, plus test-metric history (force plate, OVR, Keiser, Stryd…) with sparklines. |
| **Coach** | A **live Claude AI chat** (optional — add an API key) that knows your full program, today's readiness, and your logs, plus an always-on synthesized briefing: readiness + workload, this block's driver/MED/diagnostic strategy, **2-week diagnostic-drift alerts**, 80/20 checks, goal-watch flags, weekly volume-vs-plan compliance, your **HR + Stryd power zones**, and fuel/recovery anchors. |
| **You** | Profile, **Week-1 start date** (auto-computes your current program week & phase), sport variant (Football / HYROX / Track), HR max & Stryd CP for zones, current marks, and JSON backup/restore. |

## How the coach thinks (the engine)

- **Readiness gate** — exactly the document's system: **CMJ vs your rolling
  7-day baseline** is the primary readout (within 5% = green, 5–10% down = amber,
  >10% down = red), modified by HRV/sleep/subjective, with **hard gates** that
  force a downgrade (resting HR +7 over baseline, sleep <6h, subjective <5/10,
  overnight bodyweight >2% down, any sharp pain). One gate → amber, two → red.
- **Program awareness** — set your Week-1 date and the app knows your **program
  week (1–32), phase, deload weeks, weekly diagnostic**, and the prescribed
  session for every day.
- **Training load & ACWR** — session-RPE load (RPE × minutes) → **acute:chronic
  workload ratio**, flagging the 1.5+ spike and <0.8 detraining zones.
- **Daily call** — the High/Low architecture + today's gate. On a red HIGH day it
  tells you to convert to Z1 + mobility (no CNS work), per the doc.
- **Per-set auto-regulation** — power/speed sets stop when **velocity drops**
  past threshold; strength sets nudge load to hold the target RPE band; plyo
  watches RSI; rest windows prescribed per category.
- **Goal projection** — trend over your tests → **weeks-to-checkpoint**, or a
  plateau warning when a quality needs its own block.
- **Diagnostic drift** — if the phase's weekly diagnostic declines two tests
  running, you get an alert to add a maintenance dose immediately.

## Run it

It's a static Progressive Web App — no build step, no server needed.

**On your phone (recommended):**
1. Host the folder anywhere static (GitHub Pages, Netlify, or any web server).
2. Open the URL in mobile Safari/Chrome → **Share → Add to Home Screen**.
3. It launches full-screen like a native app and works **offline**.

**Locally:**
```bash
# from the repo root
python3 -m http.server 8080
# open http://localhost:8080
```
> Open via a server (not `file://`) so the service worker / offline cache works.

**GitHub Pages:** push to your repo, then Settings → Pages → deploy from branch
(root). Your app will be at `https://<user>.github.io/<repo>/`.

## Your data

Everything lives in your browser's `localStorage`, on your device only. Use
**You → Export backup** to save a JSON snapshot (and **Import** to restore or
move to a new phone). Nothing is ever uploaded.

## Structure

```
index.html              app shell + tab bar
css/styles.css          dark athletic UI
js/data.js              knowledge base: 7 systems, exercises, goals, macrocycle,
                        weekly architecture, readiness-gate thresholds, zones
js/program.js           every prescribed day-by-day session, all 5 phases + variants
js/store.js             local persistence + backup/restore
js/engine.js            the coach's brain (gate, ACWR, program week, projections, auto-reg)
js/coach.js             optional live Claude AI chat (streaming, on-device key)
js/ui.js                rendering + interaction for all tabs
js/app.js               bootstrap, routing, service-worker
sw.js                   offline cache
manifest.webmanifest    installable-app metadata
icons/                  app icons (+ dependency-free generator script)
```

## First-run setup

1. **You** tab → set your **Week-1 start date** (the app computes your current
   program week & phase), your **sport variant**, **HR max**, and confirm your
   **current marks**.
2. Each morning → **Today → Run the gate** (CMJ best-of-3, sleep, HRV, soreness…).
3. Train → **Load today's prescribed session** and log your actuals; read the
   per-set cues.
4. On diagnostic/test days → **Progress → Log a test result**. Weekly retesting
   powers the projections and the drift alerts.

## Live AI coach (optional)

The **Coach** tab has a conversational Claude coach layered on top of the
built-in engine. Add an Anthropic API key in **You → Live AI coach**, and the
chat gets your full context every message — program week/phase, today's
readiness gate, your prescribed session, what you've logged, your goals and
trends, and your zones — then answers in the voice of an elite S&C coach
(streaming, prompt-cached to keep cost down). Ask "how hard today?", "what
should I do after this set?", "am I on track for 40 inches?".

- Your API key is stored **only** on this device (localStorage) and sent only
  to `api.anthropic.com`. Chat is billed to your own Anthropic account.
- Pick the model in Settings — Opus 4.8 (sharpest), Sonnet 5 (faster/cheaper),
  or Haiku 4.5 (cheapest).
- The built-in briefing works fully **without** a key — the AI layer is a bonus.

## Roadmap ideas

- Apple Health / Garmin / WHOOP import for HRV, sleep, and runs.
- Charts for readiness trend and force-velocity profile over a block.

---

*Built as a private performance lab in your pocket — Assess → Decide → Train →
Measure → Adjust, every day.*
