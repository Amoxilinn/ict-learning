# -*- coding: utf-8 -*-
"""Merge authored additions by ID; repeated runs produce identical output."""
import json
import pathlib
import sys
from validate_glossary import validate

P = pathlib.Path(__file__).resolve().parent.parent
read = lambda path: json.loads(path.read_text(encoding='utf-8'))
current = read(P / 'content/glossary.json')
additions = read(P / 'content/rewrite/out/glossary.json')
sources = read(P / 'content/rewrite/glossary-source.json')
added_ids = {x['id'] for x in additions}
baseline = [x for x in current if x['id'] not in added_ids]
merged = baseline + additions
errors, warnings = validate(merged, additions, sources, baseline)
if errors:
    for error in errors:
        print('FAIL', error)
    sys.exit('Refusing to merge invalid glossary')
(P / 'content/glossary.json').write_text(json.dumps(merged, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'glossary: {len(baseline)} retained + {len(additions)} authored = {len(merged)} entries')
