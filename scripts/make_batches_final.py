# -*- coding: utf-8 -*-
"""Final batch plan: 36 batches, max 12 units, chapters kept within stages."""
import json, pathlib, collections
P=pathlib.Path(__file__).resolve().parent.parent
load=lambda p: json.loads(pathlib.Path(p).read_text(encoding='utf-8'))
cur=load(P/'content/curriculum.json');kn={x['id']:x for x in load(P/'content/knowledge.json')}
ped=load(P/'content/pedagogy.json');les=load(P/'content/lessons.json')
units=[]
for f in sorted((P/'content').glob('units-*.json')):units+=load(f)
by=collections.defaultdict(list)
for u in units:by[u['parent']].append(u)
vis=load(P/'content/visualizations.json')['scenarios']
vis_by=collections.defaultdict(list)
for s in vis:vis_by[s['unit']].append({'id':s['id'],'title':s['title'],'summary':s['summary'],'boundary':s['boundary']})
seq=[cid for st in cur for cid in st['chapters']];pos={c:i for i,c in enumerate(seq)}
groups=[
(['ICT-001','ICT-003'],'batch-00'),(['ICT-002'],'batch-01'),
(['ICT-004','ICT-005','ICT-007','ICT-008','ICT-006'],'batch-02'),
(['ICT-009','ICT-010','ICT-017','ICT-018'],'batch-03'),
(['ICT-011','ICT-012','ICT-013','ICT-014'],'batch-04'),
(['ICT-015','ICT-016'],'batch-05'),
(['ICT-034','ICT-035'],'batch-06'),
(['ICT-036','ICT-037'],'batch-07'),
(['ICT-038','ICT-039','ICT-040','ICT-041'],'batch-08'),
(['ICT-024','ICT-027','ICT-028','ICT-026'],'batch-09'),
(['ICT-025','ICT-029','ICT-019','ICT-030'],'batch-10'),
(['ICT-031','ICT-020','ICT-021','ICT-022'],'batch-11'),
(['ICT-023','ICT-032','ICT-033'],'batch-12'),
(['ICT-056','ICT-057','ICT-061'],'batch-13'),
(['ICT-058','ICT-059'],'batch-14'),
(['ICT-062','ICT-063','ICT-064'],'batch-15'),
(['ICT-065','ICT-068','ICT-069'],'batch-16'),
(['ICT-070','ICT-060'],'batch-17'),
(['ICT-074','ICT-075','ICT-086'],'batch-18'),
(['ICT-078','ICT-077','ICT-080'],'batch-19'),
(['ICT-079','ICT-076','ICT-081'],'batch-20'),
(['ICT-082'],'batch-21'),
(['ICT-083','ICT-084'],'batch-22'),
(['ICT-085','ICT-087'],'batch-23'),
(['ICT-088','ICT-089'],'batch-24'),
(['ICT-090','ICT-091','ICT-092','ICT-093'],'batch-25'),
(['ICT-094'],'batch-26'),
(['ICT-046','ICT-047'],'batch-27'),
(['ICT-045'],'batch-28'),
(['ICT-048','ICT-054'],'batch-29'),
(['ICT-049','ICT-050'],'batch-30'),
(['ICT-051','ICT-052','ICT-055','ICT-053'],'batch-31'),
(['ICT-042','ICT-043'],'batch-32'),
(['ICT-044','ICT-066'],'batch-33'),
(['ICT-067','ICT-071','ICT-072'],'batch-34'),
(['ICT-073'],'batch-35'),
]
stage_of={c:st for st in cur for c in st['chapters']}
outdir=P/'content/rewrite/source';outdir.mkdir(parents=True,exist_ok=True)
manifest=[]
for chs,bid in groups:
    st=stage_of[chs[0]]
    chapters=[]
    for cid in chs:
        x=kn[cid];p=ped[cid]
        chapters.append({
            'id':cid,'group':x['group'],'category':x['category'],'title':x['title'],
            'detail':x['detail'],'depth':x['depth'],'prerequisites':x['prerequisites'],
            'old_intro':p.get('intro',''),'old_outcome':p.get('outcome',''),
            'old_readingNote':p.get('readingNote',''),'old_explanation':x.get('explanation',''),
            'old_deep':les.get(x['title'],{}).get('deep',''),
            'previous_chapter':seq[pos[cid]-1] if pos[cid]>0 else None,
            'next_chapter':seq[pos[cid]+1] if pos[cid]+1<len(seq) else None,
            'previous_title':kn[seq[pos[cid]-1]]['title'] if pos[cid]>0 else None,
            'next_title':kn[seq[pos[cid]+1]]['title'] if pos[cid]+1<len(seq) else None,
            'chapter_title':x['title'],
            'stage':{'id':st['id'],'title':st['title'],'description':st['description']},
        })
    us=[]
    for cid in chs:
        for u in by[cid]:
            us.append({'id':u['id'],'parent':u['parent'],'term':u['term'],'depth':u['depth'],
                'explain':u.get('explain',''),'process':u.get('process',[]),
                'walkthrough':u.get('walkthrough',{}),'config':u.get('config'),
                'commandNotes':u.get('commandNotes',[]),'fault':u.get('practice',{}).get('fault',{}),
                'sources':u.get('sources',[]),'visuals':vis_by.get(u['id'],[]),'chapter_title':kn[cid]['title']})
    packet={'batch':bid,'stage':st,'chapters':chapters,'units':us,'chapter_sequence':chs,
            'neighbors':{'before':seq[pos[chs[0]]-1] if pos[chs[0]]>0 else None,
                         'after':seq[pos[chs[-1]]+1] if pos[chs[-1]]+1<len(seq) else None}}
    (outdir/f'{bid}.json').write_text(json.dumps(packet,ensure_ascii=False,indent=1),encoding='utf-8')
    manifest.append({'batch':bid,'stage':st['id'],'chapters':chs,'units':len(us)})
(P/'content/rewrite/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=1),encoding='utf-8')
print(f'{len(groups)} batches, {sum(m["units"] for m in manifest)} units, max {max(m["units"] for m in manifest)} units')
for m in manifest:print(m['batch'],m['stage'],len(m['chapters']),'ch',m['units'],'u',','.join(m['chapters']))
