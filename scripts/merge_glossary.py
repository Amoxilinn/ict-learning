# -*- coding: utf-8 -*-
"""Merge the expanded glossary with the existing 35 terms."""
import json,pathlib,sys
P=pathlib.Path(__file__).resolve().parent.parent
old=json.loads((P/'content/glossary.json').read_text(encoding='utf-8'))
new=json.loads((P/'content/rewrite/out/glossary.json').read_text(encoding='utf-8'))
old_ids={g['id'] for g in old};new_ids={g['id'] for g in new}
assert not (old_ids&new_ids), old_ids&new_ids
aliases={t:g['id'] for g in old for t in g['terms']}
for g in new:
    for t in g['terms']:
        assert t not in aliases, f'duplicate alias {t}'
        aliases[t]=g['id']
merged=old+new
# library order: fundamentals first (old), then new by area order as authored
(P/'content/glossary.json').write_text(json.dumps(merged,ensure_ascii=False,indent=1),encoding='utf-8')
print(f'glossary: {len(old)} old + {len(new)} new = {len(merged)} entries, {len(aliases)} aliases')
