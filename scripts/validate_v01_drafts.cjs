#!/usr/bin/env node
/* V01 草稿校验：node scripts/validate_v01_drafts.cjs content/rewrite/v01-drafts/<file>.json [...]
 * 校验对象是单个（或若干）草稿文件，但 id 唯一性会对照现有场景 + 目录内全部草稿。
 * 契约见 docs/reviews/v01-contract.md。error 非零退出；warning 不阻塞。 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2).filter((a) => a !== '--allow-existing');
const ALLOW_EXISTING = process.argv.includes('--allow-existing');
if (!args.length) { console.error('usage: node scripts/validate_v01_drafts.cjs <draft.json> ...'); process.exit(2); }

const units = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/teaching-units.json'), 'utf8'));
const existing = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/visualizations.json'), 'utf8')).scenarios;
const usedIds = new Set(existing.map((s) => s.id).concat(['switch-learning']));
const draftsDir = path.join(ROOT, 'content/rewrite/v01-drafts');
let draftIds = [];
if (fs.existsSync(draftsDir)) {
  for (const f of fs.readdirSync(draftsDir)) {
    if (!f.endsWith('.json')) continue;
    try {
      const d = JSON.parse(fs.readFileSync(path.join(draftsDir, f), 'utf8'));
      if (d.scene && d.scene.id) draftIds.push([d.scene.id, f]);
    } catch (e) { /* 他人未完成草稿忽略 */ }
  }
}

const BANNED = ['richSequence', 'events', 'prediction', 'packet', 'actions', 'actorStates', 'stateKind'];
let errors = 0, warnings = 0;
const err = (m) => { errors++; console.log('ERROR ' + m); };
const warn = (m) => { warnings++; console.log('WARN  ' + m); };
const str = (v) => typeof v === 'string' && v.trim().length > 0;
const seenIds = new Set();

function checkHtml(strings, id) {
  const re = /<[a-zA-Z/][^>]*>/;
  const walk = (v, p) => {
    if (typeof v === 'string') { if (re.test(v)) err(id + ': HTML-like text in ' + p + ' would render literally'); }
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, p + '[' + i + ']'));
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], p + '.' + k);
  };
  walk(strings, '$');
}

for (const file of args) {
  const fp = path.resolve(ROOT, file);
  let d;
  try { d = JSON.parse(fs.readFileSync(fp, 'utf8')); }
  catch (e) { err(file + ': cannot parse JSON: ' + e.message); continue; }
  const s = d.scene;
  if (!s || typeof s !== 'object') { err(file + ': missing "scene" object'); continue; }
  const id = s.id || '(no-id)';
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) err(id + ': id must be kebab-case [a-z0-9-]');
  if (seenIds.has(id)) err(id + ': duplicate scene id among args');
  seenIds.add(id);
  if (usedIds.has(id)) (ALLOW_EXISTING ? console.log('INFO  ' + id + ': already merged into visualizations.json (edit pass)') : err(id + ': scene id collides with existing scenario'));
  for (const [did, df] of draftIds) if (did === id && df !== path.basename(fp)) err(id + ': scene id collides with draft ' + df);

  if (!str(s.unit) || !units[s.unit]) err(id + ': unit missing or not in teaching-units.json');
  if (s.unit && s.unit.indexOf('ICT-002.') !== 0)
    for (const b of BANNED) if (s[b] !== undefined || (s.steps || []).some((st) => st && st[b] !== undefined)) err(id + ': field "' + b + '" is reserved for ICT-002 scenes (test-teaching.cjs:40)');
  if (!str(s.title)) err(id + ': title required');
  if (!str(s.summary)) err(id + ': summary required');
  if (!Array.isArray(s.columns) || s.columns.length < 2 || s.columns.length > 3) err(id + ': columns must be 2-3 items (even for hideTable)');
  if (!str(s.boundary) || s.boundary.length <= 30) err(id + ': boundary required, >30 chars (state what is assumed / not simulated)');
  if (!Array.isArray(s.sources) || !s.sources.length) err(id + ': sources required >=1');
  else for (const src of s.sources) {
    if (!Array.isArray(src) || src.length !== 2 || !str(src[0]) || !/^https:\/\//.test(src[1] || '')) err(id + ': each source must be ["标题","https://…"]');
  }
  if (!Array.isArray(s.steps) || s.steps.length < 2) err(id + ': steps required >=2');
  const isSeq = Array.isArray(s.actors) && s.actors.length >= 2;
  const isTopo = Array.isArray(s.nodes) && s.nodes.length >= 2;
  if (!isSeq && !isTopo && (!Array.isArray(s.steps) || !s.steps.every((st) => !st.message && !st.active))) err(id + ': neither valid actors nor nodes; message/active will not render');
  const nodeIds = new Set(isTopo ? s.nodes.map((n) => n[0]) : []);
  const linkSet = new Set(isTopo ? (s.links || []).map((l) => l[0] + '>' + l[1]) : []);
  if (isTopo) {
    for (const n of s.nodes) {
      if (!Array.isArray(n) || n.length !== 4 || !str(n[0]) || !str(n[1]) || typeof n[2] !== 'number' || typeof n[3] !== 'number') err(id + ': node must be [id,label,x,y]: ' + JSON.stringify(n));
      else { if (n[2] < 80 || n[2] > 560 || n[3] < 35 || n[3] > 135) warn(id + ': node ' + n[0] + ' outside suggested x80-560/y35-135');
        if (n[1].length > 12) warn(id + ': node label long: ' + n[1]); }
    }
    for (const l of s.links || []) if (!nodeIds.has(l[0]) || !nodeIds.has(l[1])) err(id + ': link references unknown node: ' + JSON.stringify(l));
  }
  (s.steps || []).forEach((st, i) => {
    const at = id + ' step' + i;
    if (!st || typeof st !== 'object') { err(at + ': object required'); return; }
    if (!str(st.title)) err(at + ': title required');
    if (!str(st.text)) err(at + ': text required (build.py asserts non-empty)');
    if (!Array.isArray(st.rows)) err(at + ': rows required (use [] when no table entries)');
    else {
      for (const r of st.rows) if (!Array.isArray(r) || r.length !== (s.columns || []).length) err(at + ': row width must equal columns (' + (s.columns || []).length + '): ' + JSON.stringify(r));
      for (const r of st.rows) for (const c of r) if (!str(c)) err(at + ': row cells must be non-empty strings');
      if (st.rows.some((r) => r.some((c) => String(c).length > 60))) warn(at + ': row cell text >60 chars may break table layout');
    }
    if (st.active !== undefined) {
      if (!isTopo) err(at + ': active without nodes/links');
      else for (const p of st.active) if (!linkSet.has(p[0] + '>' + p[1]) && !linkSet.has(p[1] + '>' + p[0])) err(at + ': active pair not in links: ' + JSON.stringify(p));
    }
    if (st.message !== undefined) {
      if (!isSeq) err(at + ': message without actors');
      else { const m = st.message;
        if (!Array.isArray(m) || m.length !== 3 || !Number.isInteger(m[0]) || !Number.isInteger(m[1]) || !str(m[2])) err(at + ': message must be [fromIdx,toIdx,"label"]');
        else if (m[0] === m[1] || m[0] < 0 || m[1] < 0 || m[0] >= s.actors.length || m[1] >= s.actors.length) err(at + ': message endpoint invalid for actors.length=' + s.actors.length); }
    }
    if (st.fields !== undefined && (!Array.isArray(st.fields) || !st.fields.length)) err(at + ': fields must be non-empty [[label,detail],…]');
    if (st.fields) for (const f of st.fields) if (!Array.isArray(f) || f.length !== 2 || !str(f[0]) || !str(f[1])) err(at + ': field must be [label,detail]');
    if (st.next !== undefined && (!Number.isInteger(st.next) || st.next < 0 || st.next >= s.steps.length)) err(at + ': next index out of range');
  });
  if (isSeq && (s.steps || []).some((st) => st.message === undefined && !st.terminal)) warn(id + ': sequence step without message (state-only step is legal, double-check intent)');
  if (!str(d.visualCue) || d.visualCue.length > 160) err(id + ': visualCue required, 10-160 chars (schema.json:160), says "看什么/为什么变", not a redraw of the graphic');
  if (d.visualCue && d.visualCue.length < 10) err(id + ': visualCue too short (<10)');
  if (d.tests !== undefined && (!Array.isArray(d.tests) || d.tests.some((t) => typeof t !== 'string'))) err(id + ': tests must be array of JS strings');
  checkHtml(s, id);
}
console.log((errors ? 'FAIL ' : 'PASS ') + args.length + ' draft(s), ' + errors + ' errors, ' + warnings + ' warnings');
process.exit(errors ? 1 : 0);
