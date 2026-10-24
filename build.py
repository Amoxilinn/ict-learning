# -*- coding: utf-8 -*-
"""生成阅读站数据与离线手册。

源数据分两层：
- 旧稿保留 term/depth/sources/config/commandNotes/fault 等技术资料；
- content/teaching-*.json 提供重写后的教学叙事、层次、目标、检查与案例。
最终只向阅读站输出合并后的教学数据。
"""
import json, pathlib, html, re, hashlib

P = pathlib.Path(__file__).resolve().parent


def read(name):
    return json.loads((P / 'content' / f'{name}.json').read_text(encoding='utf-8'))


def read_optional(name, default):
    path = P / 'content' / f'{name}.json'
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding='utf-8'))


raw = read('knowledge')
raw_lessons = read('lessons')
sources = read('sources')
raw_sub = read('subskills')
curriculum = read('curriculum')
pedagogy = read('pedagogy')
teaching_chapters = read_optional('teaching-chapters', {})
teaching_units = read_optional('teaching-units', {})

rows = [{k: x[k] for k in ['id', 'group', 'category', 'title', 'hcia', 'hcip', 'detail', 'explanation', 'depth', 'prerequisites']} for x in raw]
for x in rows:
    x.update(pedagogy[x['id']])
    if x['id'] in teaching_chapters:
        x.update(teaching_chapters[x['id']])
        x['hasTeaching'] = True
    else:
        x['hasTeaching'] = False
        x.setdefault('objectives', [x['outcome']])
        x.setdefault('why', '')
        x.setdefault('recap', x['explanation'])
        x.setdefault('bridge', '')

lessons = {t: {k: v for k, v in d.items() if k in ['heading', 'deep', 'fault', 'commands', 'version', 'sources']}
           for t, d in raw_lessons.items()}
subskills = [{k: s[k] for k in ['id', 'parent', 'term', 'depth']} for s in raw_sub]
parents = {x['id']: x for x in rows}
units = []
for file in sorted((P / 'content').glob('units-*.json')):
    for u in json.loads(file.read_text(encoding='utf-8')):
        x = parents[u['parent']]
        text = u['explain']
        for suffix in [lessons[x['title']].get('deep'), x['explanation']]:
            if suffix and text.endswith(suffix):
                text = text[:-len(suffix)].strip()
        text = re.sub(r'\s*具体例证：.*$', '', text).strip()
        item = {k: u[k] for k in ['id', 'parent', 'term', 'depth', 'process', 'sources']}
        item['explain'] = text
        if u.get('walkthrough'):
            item['walkthrough'] = u['walkthrough']
        if u.get('commandNotes'):
            item['commandNotes'] = u['commandNotes']
        if u.get('config'):
            item['config'] = {k: u['config'][k] for k in ['code', 'platform', 'notes'] if k in u['config']}
        item['fault'] = u.get('practice', {}).get('fault', {})
        t = teaching_units.get(item['id'])
        if t:
            item.pop('explain', None)
            item.pop('process', None)
            item.pop('walkthrough', None)
            item.update(t)
            item['hasTeaching'] = True
        else:
            item['hasTeaching'] = False
            item['level'] = 'core'
            item['goal'] = '先认识' + item['term'] + '的基本概念与作用。'
            item['lead'] = ''
            item['sections'] = []
            item['example'] = None
            item['takeaway'] = ''
        units.append(item)

units.sort(key=lambda u: u['id'])
assert len(rows) == 94 and len({x['id'] for x in rows}) == 94
assert len(subskills) == 322 and len({s['id'] for s in subskills}) == 322
assert len({u['id'] for u in units}) == len(units)
assert len(units) == 322 and {u['id'] for u in units} == {s['id'] for s in subskills}
order = [id for stage in curriculum for id in stage['chapters']]
assert len(order) == 94 and set(order) == set(parents)
for u in units:
    assert u['parent'] in parents and any(s['id'] == u['id'] and s['parent'] == u['parent'] for s in subskills)
    assert u['sources'], 'reference required: ' + u['id']
    if u['hasTeaching']:
        assert u['level'] in ('core', 'advanced', 'detail'), u['id']
        assert len(u['sections']) >= 2, u['id']
        assert u['example'] and len(u['example']['steps']) >= 3, u['id']
        assert u['takeaway'], u['id']

# 同一章内按教学顺序排列；缺省仍按编号。
for cid in {u['parent'] for u in units}:
    group = [u for u in units if u['parent'] == cid]
    group.sort(key=lambda u: (u.get('order', 999), u['id']))
    for i, u in enumerate(group):
        u['_seq'] = i
units.sort(key=lambda u: (order.index(u['parent']), u['_seq'], u['id']))
for u in units:
    u.pop('_seq', None)

teaching = read_optional('visualizations', {'scenarios': []})
glossary = read_optional('glossary', [])
teaching['glossary'] = glossary
for scene in teaching['scenarios']:
    assert scene['unit'] in {u['id'] for u in units}, 'Unknown visual unit: ' + scene['unit']
    assert scene['steps'] and scene['boundary']
    for step in scene['steps']:
        assert step['text'] and all(len(row) == len(scene['columns']) for row in step['rows'])

(P / 'dist/teaching-data.js').write_text(
    'window.ICT_TEACHING_DATA=' + json.dumps(teaching, ensure_ascii=False, separators=(',', ':')) + ';\n',
    encoding='utf-8')

payload = [rows, lessons, sources, subskills, units, curriculum]
for name, data in zip(['content', 'lessons', 'sources', 'subskills', 'units', 'curriculum'], payload):
    (P / 'dist' / f'{name}.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
(P / 'dist/data.js').write_text(
    'window.ICT_DATA=' + json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';\n',
    encoding='utf-8')

e = html.escape

def display_term(t):
    t = str(t)
    t = re.sub(r'([A-Za-z0-9+.)])([\u4e00-\u9fff])', r'\1 \2', t)
    t = re.sub(r'([\u4e00-\u9fff])([A-Za-z0-9(])', r'\1 \2', t)
    return t
parts = ['''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ICT 考纲教程</title>
<style>
body{max-width:860px;margin:40px auto;padding:0 24px;font:16px/1.95 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;color:#243e2b}
a{color:#166840}h1{font-size:32px}h2{border-top:1px solid #dce7d4;padding-top:24px;margin-top:55px}h3{margin-top:30px}h4{margin-top:20px;color:#315746}
pre{background:#f1f5ee;padding:20px;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.8 monospace}
.meta{font-size:12px;color:#617363}.toc{display:grid;gap:6px}.unit{margin-top:35px}p{margin:12px 0}
.goal{color:#315f4d;font-weight:600}.take{background:#f2f8f3;border-left:3px solid #4f9477;padding:12px 16px;margin:18px 0}
.example{border:1px solid #d7e5dc;padding:16px 20px;border-radius:5px;background:#fcfefd}.check{background:#f7f5ee;padding:12px 16px;border-radius:5px}
.tag{display:inline-block;font-size:11px;border:1px solid #c9dccd;padding:1px 7px;border-radius:4px;margin-left:8px;color:#4f725c}
@media print{body{margin:0;max-width:none;padding:0;font-size:10pt}.toc,.tools,.tag{display:none}h2,h3{break-after:avoid}pre{font-size:8pt}a{color:inherit}.example,.take{break-inside:avoid}}
</style></head><body><p class="tools"><a href="index.html">← 返回教程目录</a> · 浏览器菜单可打印或保存 PDF</p>
<h1>ICT 考纲教程</h1><p>从零开始，按知识依赖顺序理解数通、DCN、安全与 WLAN。离线版保留教学正文与案例，交互演示请回到网站阅读。</p><nav class="toc">''']
ordered = [parents[id] for stage in curriculum for id in stage['chapters']]
for stage in curriculum:
    parts.append(f'<h3>{e(stage["title"])}</h3>')
    for id in stage['chapters']:
        parts.append(f'<a href="#{id}">{e(parents[id]["title"])}</a>')
parts.append('</nav>')

for x in ordered:
    d = lessons[x['title']]
    parts.append(f'<section id="{x["id"]}"><h2>{e(display_term(x["title"]))}</h2><p class="meta">{e(x["group"])} / {e(x["category"])} · {e(x["depth"])}</p>')
    parts.append(f'<h3>从一个问题开始</h3><p>{e(x["intro"])}</p>')
    if x.get('why'):
        parts.append(f'<p><b>为什么现在学：</b>{e(x["why"])}</p>')
    if x.get('objectives'):
        parts.append('<h3>本章学习目标</h3><ul>' + ''.join(f'<li>{e(o)}</li>' for o in x['objectives']) + '</ul>')
    parts.append(f'<p><b>读完本章：</b>{e(x["outcome"])}</p><p><b>考纲要求：</b>{e(x["detail"])}</p>')
    children = [u for u in units if u['parent'] == x['id']]
    for u in children:
        tag = {'core': '基础必学', 'advanced': '进阶理解', 'detail': '技术细节'}[u['level']]
        parts.append(f'<article class="unit" id="{u["id"]}"><h3>{e(display_term(u["term"]))}<span class="tag">{tag}</span></h3>')
        if u['hasTeaching']:
            parts.append(f'<p class="goal">本节要解决：{e(u["goal"])}</p><p>{e(u["lead"])}</p>')
            for s in u['sections']:
                parts.append(f'<h4>{e(s["title"])}</h4>')
                for para in s['text'].split('\n'):
                    if para.strip():
                        parts.append(f'<p>{e(para.strip())}</p>')
                if s.get('steps'):
                    parts.append('<ol>' + ''.join(f'<li>{e(z)}</li>' for z in s['steps']) + '</ol>')
            parts.append(f'<p class="take"><b>一句话记住：</b>{e(u["takeaway"])}</p>')
            if u.get('check'):
                parts.append(f'<div class="check"><b>想一想：</b>{e(u["check"]["question"])}<br><b>参考答案：</b>{e(u["check"]["answer"])}<br>{e(u["check"]["why"])}</div>')
            ex = u['example']
            parts.append(f'<div class="example"><h4>跟着例子走：{e(ex["title"])}</h4><p>{e(ex["setup"])}</p><ol>' + ''.join(f'<li>{e(z)}</li>' for z in ex['steps']) + f'</ol><p><b>由此可见：</b>{e(ex["conclusion"])}</p></div>')
        else:
            parts.append(''.join(f'<p>{e(p)}</p>' for p in u['explain'].split('\n') if p))
            if u['process']:
                parts.append('<h4>工作过程</h4><ol>' + ''.join(f'<li>{e(s)}</li>' for s in u['process']) + '</ol>')
            w = u.get('walkthrough')
            if w:
                parts.append(f'<div class="example"><h4>跟着例子走：{e(w["title"])}</h4><p>{e(w["setup"])}</p><ol>' + ''.join(f'<li>{e(s)}</li>' for s in w['steps']) + f'</ol><p><b>由此可见：</b>{e(w["conclusion"])}</p></div>')
        if u.get('config'):
            parts.append(f'<h4>配置与查询（进阶）</h4><pre>{e(u["config"]["code"])}</pre><p class="meta">{e(u["config"]["platform"])}</p>')
        if u.get('commandNotes'):
            parts.append('<ul>' + ''.join(f'<li>{e(s)}</li>' for s in u['commandNotes']) + '</ul>')
        if u.get('fault'):
            f = u['fault']
            parts.append(f'<h4>常见误区与排查</h4><p>{e(f["symptom"])}：{e(f["cause"])}。{e(f["check"])}；{e(f["fix"])}。</p>')
        if u.get('boundary'):
            parts.append(f'<h4>技术边界</h4><p>{e(u["boundary"])}</p>')
        parts.append('</article>')
    parts.append(f'<h3>把本章串起来</h3><p>{e(x.get("recap") or x["explanation"])}</p>')
    if x.get('bridge'):
        parts.append(f'<p><b>接下来：</b>{e(x["bridge"])}</p>')
    code = d.get('commands', '')
    existing = {line.strip() for u in children for line in (u.get('config') or {}).get('code', '').splitlines() if line.strip()}
    if existing:
        extra = [line for line in code.splitlines() if line.strip() and line.strip() not in existing and line.strip() not in ['system-view', 'quit', 'return']]
        if all(line.strip().startswith('display ') for line in extra):
            code = '\n'.join(extra)
    if code:
        parts.append(f'<h3>章节配置与查询</h3><pre>{e(code)}</pre><p class="meta">{e(d.get("version", ""))}</p>')
    if d.get('fault'):
        parts.append(f'<h3>关键边界与易错点</h3><p>{e(d["fault"])}</p>')
    refs = {s['url']: s for u in children for s in u['sources']}
    refs.update({s['url']: s for s in sources if s['id'] in d.get('sources', [])})
    if refs:
        parts.append('<h3>参考资料</h3><ul>' + ''.join(f'<li><a href="{e(s["url"], quote=True)}">{e(s["title"])}</a> · {e(s.get("version", ""))}</li>' for s in refs.values()) + '</ul>')
    parts.append('</section>')
parts.append('<p class="meta">配置以所注产品版本为参考，尚未在赛事设备上验证。教程中的交互演示请回到网站阅读。</p></body></html>')
(P / 'dist/handbook.html').write_text(''.join(parts), encoding='utf-8')

# 内容与阅读器同时改版时，避免浏览器混用旧脚本、旧样式与新数据。
index_path = P / 'dist/index.html'
index = index_path.read_text(encoding='utf-8')
for asset in ['style.css', 'data.js', 'diagrams.js', 'teaching-data.js', 'teaching.js', 'app.js']:
    digest = hashlib.sha256((P / 'dist' / asset).read_bytes()).hexdigest()[:12]
    index = re.sub(r'(["\'])' + re.escape(asset) + r'(?:\?v=[a-f0-9]+)?(["\'])',
                   lambda m: m[1] + asset + '?v=' + digest + m[2], index)
index_path.write_text(index, encoding='utf-8')
missing = [u['id'] for u in units if not u['hasTeaching']]
missing_ch = [x['id'] for x in rows if not x['hasTeaching']]
print(f'Built: {len(rows)} chapters, {len(subskills)} syllabus subtopics, {len(units)} units. '
      f'Rewritten units {len(units)-len(missing)}/{len(units)}, chapters {len(rows)-len(missing_ch)}/{len(rows)}.')
if missing:
    print('LEGACY units:', ', '.join(missing[:12]) + (' ...' if len(missing) > 12 else ''))
if missing_ch:
    print('LEGACY chapters:', ', '.join(missing_ch[:12]) + (' ...' if len(missing_ch) > 12 else ''))
