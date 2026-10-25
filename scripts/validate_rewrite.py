# -*- coding: utf-8 -*-
"""Validate one rewritten batch against the teaching standard and source material."""
import json, re, sys, pathlib, collections

P = pathlib.Path(__file__).resolve().parent.parent
CH_MIN = {'intro':60,'why':40,'outcome':20,'recap':60,'bridge':20}
CH_MAX = {'intro':260,'why':240,'outcome':110,'recap':300,'bridge':150}
UNIT_MIN = {'goal':8,'lead':40,'takeaway':10}
UNIT_MAX = {'goal':55,'lead':260,'takeaway':100}
LEVELS = {'core','advanced','detail'}
FORBIDDEN = ['本节将','本章将','综上所述','值得注意的是','众所周知','不难发现','本文将','如上所述',
             '赋能','使能','全方位','极致','TODO','待补充','待补写','（略）','此处省略']
VERB_START = '解释 说明 判断 区分 描述 分析 比较 计算 配置 验证 排查 设计 画出 列出 说出 理解 掌握 认识 选择 识别 还原 预测 定位 规划 评估 归纳 推导'.split()

def load(p):
    return json.loads(pathlib.Path(p).read_text(encoding='utf-8'))

def sentences(text):
    return [x.strip() for x in re.split(r'[。！？!?\n]', text) if len(x.strip())>=18]

def check_batch(name):
    batch = name if name.startswith('batch-') else 'batch-'+name
    src_path = P/'content/rewrite/source'/f'{batch}.json'
    out_path = P/'content/rewrite/out'/f'{batch}.json'
    errors, warnings = [], []
    if not src_path.exists():
        return [f'missing source {src_path}'], [], {}
    if not out_path.exists():
        return [f'missing output {out_path}'], [], {}
    src, out = load(src_path), load(out_path)
    expected_ch = [c['id'] for c in src['chapters']]
    expected_un = [u['id'] for u in src['units']]
    if out.get('batch') != batch: errors.append(f"batch field {out.get('batch')!r} != {batch!r}")
    got_ch, got_un = list(out.get('chapters',{})), list(out.get('units',{}))
    for x in expected_ch:
        if x not in got_ch: errors.append(f'missing chapter {x}')
    for x in got_ch:
        if x not in expected_ch: errors.append(f'unknown chapter {x}')
    for x in expected_un:
        if x not in got_un: errors.append(f'missing unit {x}')
    for x in got_un:
        if x not in expected_un: errors.append(f'unknown unit {x}')

    all_sent = collections.defaultdict(list)
    total_chars = 0
    levels = collections.Counter()
    for cid in expected_ch:
        c = out.get('chapters',{}).get(cid)
        if not isinstance(c, dict): continue
        for k,lo in CH_MIN.items():
            if k not in c: errors.append(f'{cid}: chapter missing {k}'); continue
            if not isinstance(c[k], str): errors.append(f'{cid}: chapter {k} not string'); continue
            if len(c[k]) < lo: errors.append(f'{cid}: chapter {k} too short ({len(c[k])}<{lo})')
            if len(c[k]) > CH_MAX[k]: warnings.append(f'{cid}: chapter {k} longer than {CH_MAX[k]} ({len(c[k])})')
        objs = c.get('objectives')
        if not isinstance(objs,list) or not (2 <= len(objs) <= 4):
            errors.append(f'{cid}: objectives must have 2-4 items')
        else:
            for o in objs:
                if not (8 <= len(o) <= 60): errors.append(f'{cid}: objective length {len(o)}')
                if not any(o.startswith(v) for v in VERB_START): warnings.append(f'{cid}: objective not verb-first: {o[:16]}')
        joined = ' '.join(str(c.get(k,'')) for k in ['intro','why','outcome','recap','bridge']) + ' ' + ' '.join(objs or [])
        for bad in FORBIDDEN:
            if bad in joined: errors.append(f'{cid}: forbidden phrase {bad}')
        if all(x in joined for x in ['首先','其次','最后']): errors.append(f'{cid}: mechanical 首先/其次/最后')
        for s in sentences(joined): all_sent[s].append(cid)

    for uid in expected_un:
        u = out.get('units',{}).get(uid)
        if not isinstance(u, dict): continue
        for k in ['level','order','goal','lead','sections','example','takeaway']:
            if k not in u: errors.append(f'{uid}: missing {k}')
        if u.get('level') not in LEVELS: errors.append(f'{uid}: bad level {u.get("level")!r}')
        levels[u.get('level')] += 1
        if not isinstance(u.get('order'),int) or not (1 <= u['order'] <= 99): errors.append(f'{uid}: bad order')
        for k in ['goal','lead','takeaway']:
            v=u.get(k)
            if not isinstance(v,str): errors.append(f'{uid}: {k} not string'); continue
            if len(v)<UNIT_MIN[k]: errors.append(f'{uid}: {k} too short ({len(v)}<{UNIT_MIN[k]})')
            if len(v)>UNIT_MAX[k]: warnings.append(f'{uid}: {k} longer than {UNIT_MAX[k]} ({len(v)})')
        secs=u.get('sections')
        if not isinstance(secs,list) or not (2<=len(secs)<=5): errors.append(f'{uid}: sections must be 2-5')
        else:
            for i,s in enumerate(secs):
                if not isinstance(s,dict): errors.append(f'{uid}.s{i}: not object'); continue
                for k in ['title','text']:
                    if not isinstance(s.get(k),str): errors.append(f'{uid}.s{i}: missing {k}'); continue
                if not (4<=len(s.get('title',''))<=36): errors.append(f'{uid}.s{i}: title length {len(s.get("title",""))}')
                if not (40<=len(s.get('text',''))<=760): errors.append(f'{uid}.s{i}: text length {len(s.get("text",""))}')
                if 'steps' in s:
                    st=s['steps']
                    if not isinstance(st,list) or not (2<=len(st)<=7): errors.append(f'{uid}.s{i}: steps 2-7')
                    else:
                        for x in st:
                            if not (8<=len(x)<=170): errors.append(f'{uid}.s{i}: step length {len(x)}')
        ex=u.get('example')
        if not isinstance(ex,dict): errors.append(f'{uid}: example missing')
        else:
            for k,lo,hi in [('title',4,48),('setup',15,200),('conclusion',15,200)]:
                if not isinstance(ex.get(k),str) or not (lo<=len(ex.get(k))<=hi):
                    errors.append(f'{uid}: example {k} bad length')
            st=ex.get('steps')
            if not isinstance(st,list) or not (3<=len(st)<=6): errors.append(f'{uid}: example steps 3-6')
            else:
                for x in st:
                    if not (12<=len(x)<=200): errors.append(f'{uid}: example step length {len(x)}')
        if u.get('level')=='core' and not isinstance(u.get('check'),dict):
            errors.append(f'{uid}: core unit needs check')
        chk=u.get('check')
        if chk:
            for k,lo,hi in [('question',8,160),('answer',10,240),('why',10,240)]:
                if not isinstance(chk.get(k),str) or not (lo<=len(chk.get(k))<=hi):
                    errors.append(f'{uid}: check {k} bad length')
        if 'boundary' in u and not (20<=len(u['boundary'])<=340): errors.append(f'{uid}: boundary length')
        if 'visualCue' in u and not (10<=len(u['visualCue'])<=180): errors.append(f'{uid}: visualCue length')
        src_unit=next((x for x in src['units'] if x['id']==uid),{})
        if src_unit.get('visuals') and not u.get('visualCue'): warnings.append(f'{uid}: has a visual but no visualCue')
        if not src_unit.get('visuals') and u.get('visualCue'): warnings.append(f'{uid}: visualCue without a source visual')
        text = ' '.join([u.get('lead',''), u.get('takeaway',''), u.get('boundary',''), u.get('visualCue','')]
                        + [s.get('title','')+' '+s.get('text','')+' '+' '.join(s.get('steps',[])) for s in (secs or []) if isinstance(s,dict)]
                        + [ex.get('title','')+' '+ex.get('setup','')+' '+' '.join(ex.get('steps',[]))+' '+ex.get('conclusion','') if isinstance(ex,dict) else ''])
        total_chars += len(text)
        if not (380 <= len(text) <= 2400): warnings.append(f'{uid}: total text {len(text)} outside 380-2400')
        for bad in FORBIDDEN:
            if bad in text: errors.append(f'{uid}: forbidden phrase {bad}')
        if all(x in text for x in ['首先','其次','最后']): errors.append(f'{uid}: mechanical 首先/其次/最后')
        for s in sentences(text): all_sent[s].append(uid)
        # example must not simply repeat body sentences
        if isinstance(ex,dict):
            body_sent=set(sentences(' '.join(s.get('text','') for s in (secs or []) if isinstance(s,dict))))
            for s in sentences(' '.join(ex.get('steps',[]))):
                if s in body_sent: errors.append(f'{uid}: example repeats body sentence: {s[:28]}')
        # preserve source acronyms (warn, not fail)
        old=' '.join(str(x) for x in [src.get('units_by_id',{}).get(uid,{}).get('explain','')])
        su=next((x for x in src['units'] if x['id']==uid),{})
        old=' '.join([su.get('explain',''),' '.join(su.get('process',[])),' '.join(su.get('walkthrough',{}).get('steps',[])),su.get('config',{}).get('code','') if su.get('config') else ''])
        toks=set(re.findall(r'\b[A-Z][A-Za-z0-9+./-]{1,}\b',old))
        toks={t for t in toks if t not in {'IP','MAC','VLAN','TCP','UDP','AP','AC','CE','PE'}}
        if toks:
            missing=sorted(t for t in toks if t not in text)
            if len(missing) > max(2, len(toks)//3): warnings.append(f'{uid}: source acronyms missing: {",".join(missing[:8])}')

    # per-chapter order uniqueness
    for cid in expected_ch:
        orders=[u.get('order') for uid,u in out.get('units',{}).items() if uid.startswith(cid+'.')]
        if len(orders)!=len(set(orders)): errors.append(f'{cid}: duplicate unit order')
    # repeated sentences across different units/chapters
    for s,owners in all_sent.items():
        uniq=set(owners)
        if len(uniq)>1:
            errors.append(f'repeated sentence across {len(uniq)} items: {s[:40]}')
    if levels:
        core_ratio=levels['core']/sum(levels.values())
        if core_ratio<0.4: warnings.append(f'core ratio low: {core_ratio:.0%}')
        if levels['detail']/sum(levels.values())>0.45: warnings.append('detail ratio high')
    return errors, warnings, {'units':len(got_un),'chars':total_chars,'levels':dict(levels)}

def main():
    names=sys.argv[1:] or [p.stem for p in (P/'content/rewrite/out').glob('batch-*.json')]
    bad=0
    for name in names:
        errors,warnings,stats=check_batch(name)
        print(f'== {name} ==')
        for w in warnings: print('WARN',w)
        for e in errors: print('FAIL',e)
        if errors:
            bad+=1
            print(f'FAILED {name}: {len(errors)} errors, {len(warnings)} warnings')
        else:
            print(f'PASS {name}: {stats["units"]} units, {stats["chars"]} chars, levels={stats["levels"]}, {len(warnings)} warnings')
    sys.exit(1 if bad else 0)

if __name__=='__main__': main()
