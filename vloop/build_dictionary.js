#!/usr/bin/env node
/* Regenerates docs/METRIC-DICTIONARY.md straight from js/schema.js, so the
   written definitions and the ones the engine actually computes can never
   drift apart.  Run:  node vloop/build_dictionary.js                        */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(__dirname, 'js', 'schema.js'), 'utf8');
const Schema = new Function(src + '\nreturn Schema;')();

const F = (v, kind) => v == null ? '—' : Schema.fmt(v, kind);
const out = [];
out.push('# Metric dictionary');
out.push('');
out.push('> Generated from `vloop/js/schema.js` by `node vloop/build_dictionary.js`. Do not edit by hand.');
out.push('');
out.push('One definition per metric, written down once. Inconsistent definitions are the');
out.push('reason funnel numbers stop being trusted, so this file is the tiebreaker.');
out.push('');
out.push(`**${Schema.FIELDS.length} typed inputs → ${Schema.METRICS.length} derived metrics → 5 pillar scores → 1 constraint.**`);
out.push('');

Schema.PILLARS.forEach(pl => {
  out.push(`## ${pl.id} — ${pl.name}`);
  out.push('');
  out.push(`*${pl.q}*`);
  out.push('');
  out.push('### What you type in');
  out.push('');
  out.push('| Field | Unit | Definition |');
  out.push('|---|---|---|');
  Schema.FIELDS.filter(f => f.pillar === pl.id).forEach(f =>
    out.push(`| ${f.label} | ${f.unit} | ${f.help || '—'} |`));
  out.push('');
  out.push('### What the engine derives');
  out.push('');
  out.push('| Metric | Definition | Target | Floor | Better | Weight |');
  out.push('|---|---|---|---|---|---|');
  Schema.metricsOf(pl.id).forEach(m =>
    out.push(`| **${m.label}**${m.lever ? ' ⚙︎' : ''} | ${m.def} | ${F(m.target, m.fmt)} | ${F(m.floor, m.fmt)} | ${m.dir === 'down' ? 'lower' : 'higher'} | ${m.weight} |`));
  out.push('');
});

out.push('⚙︎ = wired into the revenue model, so a gap here is quoted in yen on the diagnosis screen.');
out.push('');
out.push('## Scoring');
out.push('');
out.push('```');
out.push('score = clamp01((value − floor) / (target − floor)) × 100      # higher-is-better');
out.push('score = clamp01((floor − value) / (floor − target)) × 100      # lower-is-better');
out.push('pillar score = weighted mean of its metric scores');
out.push('green ≥ 75   amber ≥ 45   red < 45');
out.push('```');
out.push('');
out.push('Targets and floors are opinions, not physics. Every one of them is editable under');
out.push('**Data → benchmarks**, and they should be re-cut once you have real history.');
out.push('');
out.push('## The backend registry');
out.push('');
out.push('The record the system is designed to hold, whether or not it is captured yet.');
out.push('');
out.push('| # | Domain | Pillar | Status | Fields |');
out.push('|---|---|---|---|---|');
Schema.DOMAINS.forEach(d =>
  out.push(`| ${d.n} | ${d.name} | ${d.pillar} | ${d.status} | ${d.fields} |`));
out.push('');

fs.writeFileSync(path.join(root, 'docs', 'METRIC-DICTIONARY.md'), out.join('\n'));
console.log('docs/METRIC-DICTIONARY.md written —',
  Schema.METRICS.length, 'metrics,', Schema.FIELDS.length, 'fields,', Schema.DOMAINS.length, 'domains');
