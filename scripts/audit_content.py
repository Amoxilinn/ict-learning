# -*- coding: utf-8 -*-
"""Global pedagogical audit after all rewrite batches are merged."""
import json,re,pathlib,collections,sys
P=pathlib.Path(__file__).resolve().parent.parent
ch=json.loads((P/'content/teaching-chapters.json').read_text(encoding='utf-8'))
un=json.loads((P/'content/teaching-units.json').read_text(encoding='utf-8'))
kn={x['id']:x for x in json.loads((P/'content/knowledge.json').read_text(encoding='utf-8'))}
sub=json.loads((P/'content/subskills.json').read_text(encoding='utf-8'))
FORBIDDEN=['本节将','本章将','综上所述','值得注意的是','众所周知','不难发现','本文将','如上所述','赋能','使能','全方位','极致','TODO','待补充','待补写','（略）','此处省略']
errors=[];warnings=[]
missing_ch=[cid for cid in kn if cid not in ch];missing_un=[s['id'] for s in sub if s['id'] not in un]
if missing_ch:errors.append(f'missing chapters {len(missing_ch)}: {missing_ch[:8]}')
if missing_un:errors.append(f'missing units {len(missing_un)}: {missing_un[:8]}')
def sents(t):return [x.strip() for x in re.split(r'[。！？!?\n]',t) if len(x.strip())>=18]
sent_owner=collections.defaultdict(list)
by_ch=collections.defaultdict(list)
for uid,u in un.items():
    cid=uid.split('.')[0];by_ch[cid].append(u)
    txt=' '.join([u.get('lead',''),u.get('takeaway',''),u.get('boundary',''),u.get('goal','')]+[s['title']+' '+s['text']+' '+' '.join(s.get('steps',[])) for s in u.get('sections',[])]+[u['example']['title']+' '+u['example']['setup']+' '+' '.join(u['example']['steps'])+' '+u['example']['conclusion']])
    for b in FORBIDDEN:
        if b in txt:errors.append(f'{uid}: forbidden {b}')
    if all(x in txt for x in ['首先','其次','最后']):errors.append(f'{uid}: mechanical 首先/其次/最后')
    if not u.get('check') and u.get('level')=='core':errors.append(f'{uid}: core without check')
    if len(txt)<380:errors.append(f'{uid}: too short {len(txt)}')
    if len(txt)>2600:warnings.append(f'{uid}: long {len(txt)}')
    for s in sents(txt):sent_owner[s].append(uid)
    # example vs body exact sentence
    body=set(sents(' '.join(s['text']+' '+' '.join(s.get('steps',[])) for s in u.get('sections',[]))))
    for s in sents(' '.join(u['example']['steps'])):
        if s in body:errors.append(f'{uid}: example repeats body sentence: {s[:26]}')
for cid,c in ch.items():
    if cid not in kn:continue
    if len(c.get('objectives',[]))<2:errors.append(f'{cid}: objectives <2')
    if c.get('intro','').startswith('本章'):warnings.append(f'{cid}: intro starts with 本章')
    if not c.get('why'):errors.append(f'{cid}: no why')
    if not c.get('recap'):errors.append(f'{cid}: no recap')
for s,owners in sent_owner.items():
    if len(set(owners))>1:
        errors.append(f'repeated sentence in {len(set(owners))} units: {s[:48]}')
# readability and template checks
generic_titles={'为什么需要','直观理解','技术原理','工作过程','实践应用','基本概念','概述','原理','配置步骤','小结'}
goal_owner=collections.defaultdict(list);take_owner=collections.defaultdict(list);title_owner=collections.defaultdict(list)
for uid,u in un.items():
    goal_owner[u.get('goal','')].append(uid);take_owner[u.get('takeaway','')].append(uid)
    long_s=0;long_p=0
    for s in u.get('sections',[]):
        title_owner[s['title']].append(uid)
        if s['title'] in generic_titles:warnings.append(f'{uid}: generic section title {s["title"]}')
        for para in s['text'].split('\n'):
            if len(para)>300:long_p+=1
            for sent in re.split(r'[。！？!?；]',para):
                if len(sent)>110:long_s+=1
    if long_s>=3:warnings.append(f'{uid}: {long_s} long sentences')
    if long_p>=2:warnings.append(f'{uid}: {long_p} long paragraphs')
# unit term coverage (warn only; some Chinese umbrella terms are intentionally paraphrased)
STOP=['原理与配置','原理','配置','概述','应用','基础','技术','实践','概念','系统','架构','协议','相关技术','方案','内容','关键组件','业务部署','流程','案例','与配置','介绍','总览','基础业务']
for uid,u in un.items():
    term=next((x['term'] for x in sub if x['id']==uid),'')
    core=term
    for suf in STOP:
        if core.endswith(suf) and len(core)>len(suf)+1:core=core[:-len(suf)]
    if not core:continue
    txt=unit_text=(' '.join([u.get('lead',''),u.get('goal',''),u.get('takeaway','')]+[s['title']+' '+s['text'] for s in u.get('sections',[])])+u['example']['title']+' '+u['example']['setup']+' '+' '.join(u['example']['steps'])).lower()
    if core.isascii():
        if core.lower() not in txt:warnings.append(f'{uid}: term {core!r} not found in text')
    elif len(core)>=3 and core.lower() not in txt:
        # accept any 3-char slice of longer terms
        if not any(core[i:i+3].lower() in txt for i in range(len(core)-2)):
            warnings.append(f'{uid}: term {core!r} not clearly covered')
for g,owners in goal_owner.items():
    if len(owners)>1:warnings.append(f'duplicate goal in {owners}')
for g,owners in take_owner.items():
    if g and len(owners)>1:warnings.append(f'duplicate takeaway in {owners}')
for t,owners in title_owner.items():
    if len(owners)>=4:warnings.append(f'reused section title x{len(owners)}: {t}')
# near-duplicate paragraphs across units
def grams(t,n=16):
    t=re.sub(r'\s+','',t)
    return {t[i:i+n] for i in range(max(0,len(t)-n+1))}
unit_grams={}
for uid,u in un.items():
    t=u.get('lead','')+' '+' '.join(s['text'] for s in u.get('sections',[]))+' '+u['example']['setup']+' '+' '.join(u['example']['steps'])+' '+u['example']['conclusion']
    unit_grams[uid]=grams(t)
ids=list(un)
for i,a in enumerate(ids):
    for b in ids[i+1:]:
        A,B=unit_grams[a],unit_grams[b]
        if not A or not B:continue
        j=len(A&B)/len(A|B)
        if j>0.22:warnings.append(f'near-duplicate {a} / {b}: {j:.2f}')
# order per chapter
for cid,us in by_ch.items():
    orders=[u.get('order') for u in us]
    if len(orders)!=len(set(orders)):errors.append(f'{cid}: duplicate order')
    if len(us)>=3 and sum(1 for u in us if u['level']=='core')/len(us)<0.4:warnings.append(f'{cid}: low core ratio')
print(f'chapters {len(ch)}/94, units {len(un)}/322')
print('levels',dict(collections.Counter(u['level'] for u in un.values())))
print('avg chars',round(sum(len((u.get('lead','')+' '.join(s['text'] for s in u.get('sections',[]))+u['example']['conclusion'])) for u in un.values())/len(un)))
for w in warnings[:60]:print('WARN',w)
for e in errors[:100]:print('FAIL',e)
print(('PASS' if not errors else 'FAILED')+f': {len(errors)} errors, {len(warnings)} warnings')
sys.exit(1 if errors else 0)
