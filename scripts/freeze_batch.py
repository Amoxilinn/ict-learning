# -*- coding: utf-8 -*-
"""Validate batch outputs, copy them to frozen/, and record SHA-256."""
import json, pathlib, hashlib, sys, importlib.util
P=pathlib.Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('vw',P/'scripts/validate_rewrite.py')
vw=importlib.util.module_from_spec(spec);spec.loader.exec_module(vw)
ids=[a for a in sys.argv[1:] if not a.startswith('--')]
if not ids:sys.exit('usage: freeze_batch.py batch-18 [batch-20 ...]')
frozen=P/'content/rewrite/frozen';frozen.mkdir(parents=True,exist_ok=True)
sum_path=frozen/'checksums.json'
sums=json.loads(sum_path.read_text(encoding='utf-8')) if sum_path.exists() else {}
for b in ids:
    b=b if b.startswith('batch-') else 'batch-'+b
    errors,warnings,stats=vw.check_batch(b)
    if errors:
        print(f'REFUSE {b}: {len(errors)} errors');[print(' ',e) for e in errors[:10]];sys.exit(1)
    src=P/'content/rewrite/out'/f'{b}.json'
    data=src.read_bytes()
    (frozen/f'{b}.json').write_bytes(data)
    sums[b]=hashlib.sha256(data).hexdigest()
    print(f'FROZEN {b}: {stats["units"]} units, {len(data)} bytes, sha256={sums[b][:16]}…')
sum_path.write_text(json.dumps(sums,ensure_ascii=False,indent=1),encoding='utf-8')
print(f'checksums: {sum_path}')
