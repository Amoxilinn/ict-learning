# -*- coding: utf-8 -*-
import json,pathlib,sys
P=pathlib.Path(__file__).resolve().parent.parent
src=json.loads((P/'content/rewrite/glossary-source.json').read_text(encoding='utf-8'))
out=json.loads((P/'content/rewrite/out/glossary.json').read_text(encoding='utf-8'))
old=json.loads((P/'content/glossary.json').read_text(encoding='utf-8'))
errors=[];warnings=[]
by={x['id']:x for x in out}
for s in src:
    if s['id'] not in by: errors.append('missing '+s['id'])
for x in out:
    if x['id'] not in {s['id'] for s in src}: errors.append('unknown '+x['id'])
    for k,lo,hi in [('hint',2,18),('beginner',8,90),('definition',20,180),('plain',8,90),('detail',20,180)]:
        if not isinstance(x.get(k),str):errors.append(f'{x["id"]}: missing {k}')
        elif not (lo<=len(x[k])<=hi):errors.append(f'{x["id"]}: {k} length {len(x[k])}')
    terms=x.get('terms')
    if not isinstance(terms,list) or not terms or any(not isinstance(t,str) or len(t)<2 for t in terms):errors.append(f'{x["id"]}: bad terms')
    if not isinstance(x.get('annotate'),bool):errors.append(f'{x["id"]}: annotate must be bool')
ids=[x['id'] for x in out];aliases=[t for x in out for t in x['terms']]
for a in set(aliases):
    if aliases.count(a)>1:errors.append('duplicate alias in new glossary: '+a)
old_alias={t:g['id'] for g in old for t in g['terms']}
for a in aliases:
    if a in old_alias:errors.append(f'alias collides with existing glossary: {a} ({old_alias[a]})')
n=sum(1 for x in out if x.get('annotate'))
if n<40:warnings.append(f'only {n} annotate=true')
for x in out:
    for bad in ['赋能','使能','全方位','极致','众所周知']:
        if bad in x['beginner']+x['definition']:errors.append(f'{x["id"]}: forbidden {bad}')
print(f'{len(out)} entries, {sum(len(x["terms"]) for x in out)} aliases, {n} annotated')
for w in warnings:print('WARN',w)
for e in errors:print('FAIL',e)
print(('PASS' if not errors else 'FAILED')+f' glossary: {len(errors)} errors, {len(warnings)} warnings')
sys.exit(1 if errors else 0)
