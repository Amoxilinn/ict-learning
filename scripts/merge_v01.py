#!/usr/bin/env python3
"""V01 整合：把 content/rewrite/v01-drafts/*.json 的场景并入 content/visualizations.json，
并把 visualCue 写入对应 out/batch-XX.json、把 visuals 条目补进 source/batch-XX.json。
用法：python3 scripts/merge_v01.py [--dry]
之后需人工跑：validate_rewrite（变更批次）→ freeze_batch → merge_rewrite --frozen → build.py
"""
import json, sys, glob, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DRY = '--dry' in sys.argv
drafts_dir = ROOT / 'content/rewrite/v01-drafts'

STYLES = [{'indent': 1, 'ensure_ascii': False}, {'indent': 2, 'ensure_ascii': False},
          {'indent': 2, 'ensure_ascii': True}, {'indent': 1, 'ensure_ascii': True},
          {'ensure_ascii': False}, {}]
STYLE_CACHE = {}

def detect_style(p):
    """Detect dump style on the UNMODIFIED file, cache it, so writes stay byte-compatible."""
    if p in STYLE_CACHE:
        return STYLE_CACHE[p]
    raw = p.read_text(encoding='utf-8')
    obj = json.loads(raw)
    found = {'style': {'indent': 1, 'ensure_ascii': False}, 'newline': True}
    for cand in STYLES:
        for nl in (True, False):
            tail = '\n' if nl else ''
            try:
                if json.dumps(obj, **cand) + tail == raw:
                    found = {'style': cand, 'newline': nl}
            except Exception:
                continue
    STYLE_CACHE[p] = found
    return found

def load(p):
    p = pathlib.Path(p)
    detect_style(p)
    with open(p, encoding='utf-8') as f:
        return json.load(f)

def save(p, obj):
    if DRY:
        print(f'[dry] would write {p}')
        return
    found = detect_style(pathlib.Path(p))
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(obj, f, **found['style'])
        if found['newline']:
            f.write('\n')

viz_path = ROOT / 'content/visualizations.json'
viz = load(viz_path)
existing_ids = {s['id'] for s in viz['scenarios']}

# unit -> batch file
batch_of = {}
for p in sorted(glob.glob(str(ROOT / 'content/rewrite/out/batch-*.json'))):
    b = load(p)
    for uid in b.get('units', {}):
        batch_of[uid] = pathlib.Path(p)

draft_files = sorted(drafts_dir.glob('*.json'))
if not draft_files:
    print('no drafts found')
    sys.exit(0)

scenes, cues, visuals, tests = [], {}, {}, {}
seen = set()
for p in draft_files:
    try:
        d = load(p)
    except Exception as e:
        print(f'SKIP {p.name}: bad JSON {e}')
        continue
    s = d.get('scene')
    if not s:
        print(f'SKIP {p.name}: no scene')
        continue
    sid = s['id']
    if sid in seen:
        print(f'SKIP {sid}: duplicate among drafts')
        continue
    seen.add(sid)
    uid = s['unit']
    if uid not in batch_of:
        print(f'ABORT {sid}: unit {uid} in no out batch — check unit id')
        sys.exit(1)
    if sid not in existing_ids:
        scenes.append(s)
        print(f'+ scene {sid} -> {uid}')
    else:
        print(f'~ {sid}: already in visualizations.json (cue/visual pass only)')
    if d.get('visualCue'):
        cues[uid] = d['visualCue']
    visuals[uid] = (sid, {'id': sid, 'title': s['title'], 'summary': s['summary'], 'boundary': s['boundary']})
    for t in d.get('tests') or []:
        tests.setdefault(sid, []).append(t)

scenes.sort(key=lambda s: s['unit'])
if scenes:
    viz['scenarios'].extend(scenes)
    save(viz_path, viz)

touched = {}
for uid, cue in cues.items():
    bp = batch_of[uid]
    out = load(bp)
    changed = False
    if out['units'][uid].get('visualCue') != cue:
        out['units'][uid]['visualCue'] = cue
        changed = True
    sp = ROOT / 'content/rewrite/source' / bp.name
    src = load(sp)
    for item in src['units']:
        if item.get('id') == uid:
            vis = item.setdefault('visuals', [])
            sid, payload = visuals[uid]
            if sid not in {v.get('id') for v in vis}:
                vis.append(payload)
                changed = True
            break
    if changed:
        save(bp, out)
        save(sp, src)
        touched[bp.stem] = uid

print('\nbatches touched:', ', '.join(sorted(touched)) or 'none (cues unchanged)')
print('\nnext steps:')
if touched:
    bs = ' '.join(sorted(touched))
    print(f'  python3 scripts/validate_rewrite.py {bs}')
    print(f'  python3 scripts/freeze_batch.py {bs}')
    print('  python3 scripts/merge_rewrite.py --frozen')
print('  python3 build.py')
print('\ndraft test snippets (to append into test-teaching.cjs):')
for sid, ts in tests.items():
    for t in ts:
        print('  ' + t)
