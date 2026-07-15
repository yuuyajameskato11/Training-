# ▲ APEX — Personal High-Performance Journal

A private, WHOOP-style daily training journal and AI coach for a multi-domain
athlete (sprint, middle-distance, endurance, jumps). Log a few numbers each
morning and after each session; get a **readiness score**, a **daily call**,
**per-set auto-regulation**, **goal projections**, and **coach analysis** — all
computed on-device, offline, with **no accounts and no data leaving your phone**.

It encodes your own system: the **7 equipment systems**, the **5-phase annual
plan** (Engine → Max Strength → Power → Speed → Competition), the
**conjugate-block hybrid**, and the **80/20 intensity** principle.

---

## What it does

| Tab | What you get |
|-----|--------------|
| **Today** | A big readiness ring (0–100, green/amber/red), the day's *call* ("attack it" / "auto-regulate" / "pull the plug"), a breakdown of what's driving the score, and a recovery checklist. |
| **Log** | Build the session from your equipment library. Every exercise is categorized (strength / power / speed / plyo / conditioning) and each logged set returns **live coaching** — load/velocity/RPE auto-regulation and a rest prescription. |
| **Progress** | Projections for all five goals (10.9 100m, 49s 400m, 4:45 mile, 15:00 5K, 40″ vertical) with an **ETA-to-target** from your trend, plus test-metric history (force plate, OVR gates, Keiser, Stryd…) with sparklines. |
| **Coach** | A synthesized briefing that reads like a paid S&C coach: readiness + workload, this block's primary/secondary/diagnostic strategy, 80/20 intensity checks, goal-watch flags, and weekly volume-vs-plan compliance. |
| **You** | Profile, current phase & week, current bests, HRV toggle, and JSON backup/restore. |

## How the coach thinks (the engine)

- **Readiness** — WHOOP-style weighted blend of **HRV** (vs your rolling
  baseline, z-scored), **sleep**, **subjective wellness** (energy/mood/stress/
  soreness/motivation), **neuromuscular** freshness (CMJ vs baseline), minus a
  **workload-spike penalty**. Weights renormalize to whatever you logged.
- **Training load & ACWR** — session-RPE load (RPE × minutes) → **acute:chronic
  workload ratio**. Flags the 1.5+ danger zone and the <0.8 detraining zone.
- **Daily emphasis** — combines your **phase plan** with today's readiness. On a
  red day in a high-CNS block it *pivots you off* heavy/speed/plyo work to a
  Zone-2 flush.
- **Per-set auto-regulation** — power/speed sets stop when **bar/sprint velocity
  drops** past a threshold; strength sets nudge load up or down to keep you in
  the target RPE band; rest windows are prescribed per category.
- **Goal projection** — linear trend over your recent tests → weeks-to-target,
  or a plateau warning when a quality needs its own block.

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

## First-run setup

1. **You** tab → set your **current phase & week** and enter your **current
   bests** for each goal.
2. Each morning → **Today → Morning check-in** (sleep, HRV, soreness, energy…).
3. Train → **Log** your session; read the per-set cues.
4. On test days → **Progress → Log a test result** (force plate, sprint, Keiser,
   Stryd). Weekly retesting is what powers the projections and drift-detection.

## Structure

```
index.html              app shell + tab bar
css/styles.css          dark athletic UI
js/data.js              knowledge base: 7 systems, exercises, 5-phase plan, goals
js/store.js             local persistence + backup/restore
js/engine.js            the coach's brain (readiness, ACWR, projections, auto-reg)
js/ui.js                rendering + interaction for all tabs
js/app.js               bootstrap, routing, service-worker
sw.js                   offline cache
manifest.webmanifest    installable-app metadata
icons/                  app icons (+ dependency-free generator script)
```

## Roadmap ideas

- **Live Claude AI chat** layer on top of the built-in engine (paste an API key
  in Settings) for free-form conversational coaching.
- Apple Health / Garmin / WHOOP import for HRV, sleep, and runs.
- Charts for readiness trend and force-velocity profile over a block.

---

*Built as a private performance lab in your pocket — Assess → Decide → Train →
Measure → Adjust, every day.*
