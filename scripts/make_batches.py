# -*- coding: utf-8 -*-
"""Create source packets for each rewrite batch from the current source content."""
import json, glob, pathlib, collections
P=pathlib.Path(__file__).resolve().parent.parent
load=lambda p: json.loads(pathlib.Path(p).read_text(encoding='utf-8'))
cur=load(P/'content/curriculum.json'); kn={x['id']:x for x in load(P/'content/knowledge.json')}
ped=load(P/'content/pedagogy.json'); les=load(P/'content/lessons.json')
units=[]
for f in sorted((P/'content').glob('units-*.json')): units+=load(f)
by=collections.defaultdict(list)
for u in units: by[u['parent']].append(u)
vis=load(P/'content/visualizations.json')['scenarios']
vis_by=collections.defaultdict(list)
for s in vis: vis_by[s['unit']].append({'id':s['id'],'title':s['title'],'summary':s['summary'],'boundary':s['boundary']})
seq=[cid for st in cur for cid in st['chapters']]
pos={c:i for i,c in enumerate(seq)}
stage_of={c:st for st in cur for c in st['chapters']}

batches=[]; current=[]; count=0
for st in cur:
    groups=[]; g=[]; n=0
    for cid in st['chapters']:
        cn=len(by[cid])
        if g and (n+cn>16 or len(g)>=4):
            groups.append(g); g=[]; n=0
        g.append(cid); n+=cn
    if g: groups.append(g)
    for g in groups: batches.append((st,g))

outdir=P/'content/rewrite/source'; outdir.mkdir(parents=True,exist_ok=True)
manifest=[]
for i,(st,chs) in enumerate(batches,1):
    bid=f'batch-{i:02d}'
    chapters=[]
    for cid in chs:
        x=kn[cid]; p=ped[cid]
        before=seq[pos[cid]-1] if pos[cid]>0 else None
        after=seq[pos[cid]+1] if pos[cid]+1<len(seq) else None
        chapters.append({
            'id':cid,'group':x['group'],'category':x['category'],'title':x['title'],
            'detail':x['detail'],'depth':x['depth'],'prerequisites':x['prerequisites'],
            'old_intro':p.get('intro',''),'old_outcome':p.get('outcome',''),
            'old_readingNote':p.get('readingNote',''),
            'old_explanation':x.get('explanation',''),
            'old_deep':les.get(x['title'],{}).get('deep',''),
            'previous_chapter':before,'next_chapter':after,
            'stage':{'id':st['id'],'title':st['title'],'description':st['description']},
        })
    us=[]
    for cid in chs:
        for u in by[cid]:
            us.append({
                'id':u['id'],'parent':u['parent'],'term':u['term'],'depth':u['depth'],
                'explain':u.get('explain',''),'process':u.get('process',[]),
                'walkthrough':u.get('walkthrough',{}),'config':u.get('config'),
                'commandNotes':u.get('commandNotes',[]),'fault':u.get('practice',{}).get('fault',{}),
                'sources':u.get('sources',[]),'visuals':vis_by.get(u['id'],[]),
            })
    packet={'batch':bid,'stage':st,'chapters':chapters,'units':us,
            'chapter_sequence':chs,
            'neighbors':{'before':seq[pos[chs[0]]-1] if pos[chs[0]]>0 else None,
                         'after':seq[pos[chs[-1]]+1] if pos[chs[-1]]+1<len(seq) else None}}
    (outdir/f'{bid}.json').write_text(json.dumps(packet,ensure_ascii=False,indent=1),encoding='utf-8')
    manifest.append({'batch':bid,'stage':st['id'],'chapters':chs,'units':len(us)})
(P/'content/rewrite/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=1),encoding='utf-8')
print(f'{len(batches)} batches, {sum(m["units"] for m in manifest)} units')
for m in manifest: print(m['batch'],m['stage'],len(m['chapters']),'chapters',m['units'],'units',','.join(m['chapters']))
