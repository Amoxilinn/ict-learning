# -*- coding: utf-8 -*-
"""Merge validated rewrite batches into content/teaching-*.json."""
import json, pathlib, sys, importlib.util
P=pathlib.Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('vw',P/'scripts/validate_rewrite.py')
vw=importlib.util.module_from_spec(spec);spec.loader.exec_module(vw)
manifest=json.loads((P/'content/rewrite/manifest.json').read_text(encoding='utf-8'))
partial='--partial' in sys.argv
skip=set()
use_frozen='--frozen' in sys.argv
for a in sys.argv:
    if a.startswith('--skip='):skip=set(a.split('=',1)[1].split(','))
sum_path=P/'content/rewrite/frozen/checksums.json'
sums=json.loads(sum_path.read_text(encoding='utf-8')) if sum_path.exists() else {}
chapters={};units={};missing=[]
for m in manifest:
    bid=m['batch']
    if bid in skip:continue
    fpath=P/'content/rewrite/frozen'/f'{bid}.json'
    opath=P/'content/rewrite/out'/f'{bid}.json'
    if use_frozen and fpath.exists():
        data=fpath.read_bytes()
        import hashlib
        if bid in sums and hashlib.sha256(data).hexdigest()!=sums[bid]:
            sys.exit(f'frozen checksum mismatch: {bid}')
        out=json.loads(data)
        source='frozen'
    elif opath.exists():
        errors,warnings,stats=vw.check_batch(bid)
        if errors:
            print(f'REFUSE {bid}: {len(errors)} errors')
            for e in errors[:12]:print(' ',e)
            sys.exit(1)
        out=json.loads(opath.read_text(encoding='utf-8'))
        source='out'
    else:
        missing.append(bid);continue
    for cid,c in out['chapters'].items():
        if cid in chapters:sys.exit(f'duplicate chapter {cid} in {bid}')
        chapters[cid]=c
    for uid,u in out['units'].items():
        if uid in units:sys.exit(f'duplicate unit {uid} in {bid}')
        units[uid]=u
    print(f'{bid} [{source}]: +{len(out["chapters"])} chapters, +{len(out["units"])} units')
if missing and not partial:
    print('MISSING batches:',', '.join(missing));sys.exit(1)
(P/'content/teaching-chapters.json').write_text(json.dumps(chapters,ensure_ascii=False,indent=1),encoding='utf-8')
(P/'content/teaching-units.json').write_text(json.dumps(units,ensure_ascii=False,indent=1),encoding='utf-8')
print(f'Merged {len(chapters)}/94 chapters, {len(units)}/322 units. Missing batches: {len(missing)}')
