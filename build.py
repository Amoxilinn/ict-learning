# -*- coding: utf-8 -*-
"""生成阅读站数据与离线手册；训练资料仅保留在维护源文件中，不向阅读站输出。"""
import json, pathlib, html, re, hashlib
P=pathlib.Path(__file__).resolve().parent
read=lambda name:json.loads((P/'content'/f'{name}.json').read_text(encoding='utf-8'))
raw, raw_lessons, sources, raw_sub=[read(k) for k in ['knowledge','lessons','sources','subskills']]
curriculum, pedagogy = read('curriculum'), read('pedagogy')
rows=[{k:x[k] for k in ['id','group','category','title','hcia','hcip','detail','explanation','depth','prerequisites']} for x in raw]
for x in rows:x.update(pedagogy[x['id']])
lessons={t:{k:v for k,v in d.items() if k in ['heading','deep','fault','commands','version','sources']} for t,d in raw_lessons.items()}
subskills=[{k:s[k] for k in ['id','parent','term','depth']} for s in raw_sub]
parents={x['id']:x for x in rows}; units=[]
for file in sorted((P/'content').glob('units-*.json')):
 for u in json.loads(file.read_text(encoding='utf-8')):
  x=parents[u['parent']]; text=u['explain']
  for suffix in [lessons[x['title']].get('deep'),x['explanation']]:
   if suffix and text.endswith(suffix):text=text[:-len(suffix)].strip()
  text=re.sub(r'\s*具体例证：.*$', '', text).strip()
  item={k:u[k] for k in ['id','parent','term','depth','process','sources']};item['explain']=text
  if u.get('walkthrough'):item['walkthrough']=u['walkthrough']
  if u.get('commandNotes'):item['commandNotes']=u['commandNotes']
  if u.get('config'):item['config']={k:u['config'][k] for k in ['code','platform','notes'] if k in u['config']}
  item['fault']=u.get('practice',{}).get('fault',{});units.append(item)
units.sort(key=lambda u:u['id'])
# 在同一考纲章节内，先读基本概念，再读依赖它的机制与管理操作。
unit_order={'ICT-001':['02','01'],'ICT-002':['01','05','04','09','02','03','06','07','08']}
def unit_key(u):
 order=unit_order.get(u['parent'],[]);suffix=u['id'].split('.')[1]
 return (u['parent'],order.index(suffix) if suffix in order else 100+int(suffix))
units.sort(key=unit_key)
assert len(rows)==94 and len({x['id'] for x in rows})==94
assert len(subskills)==322 and len({s['id'] for s in subskills})==322
assert len({u['id'] for u in units})==len(units)
assert len(units)==322 and {u['id'] for u in units}=={s['id'] for s in subskills}
order=[id for stage in curriculum for id in stage['chapters']]
assert len(order)==94 and set(order)==set(parents)
for u in units:
 assert u['parent'] in parents and any(s['id']==u['id'] and s['parent']==u['parent'] for s in subskills)
 assert u['explain'] and len(u['process'])>=3
 assert u.get('walkthrough',{}).get('setup') and len(u['walkthrough']['steps'])>=3 and u['walkthrough']['conclusion']
teaching=read('visualizations');teaching['glossary']=read('glossary')
for scene in teaching['scenarios']:
 assert scene['unit'] in {u['id'] for u in units}, 'Unknown visual unit: '+scene['unit']
 assert scene['steps'] and scene['boundary']
 for step in scene['steps']:
  assert step['text'] and all(len(row)==len(scene['columns']) for row in step['rows'])
(P/'dist/teaching-data.js').write_text('window.ICT_TEACHING_DATA='+json.dumps(teaching,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
payload=[rows,lessons,sources,subskills,units,curriculum]
for name,data in zip(['content','lessons','sources','subskills','units','curriculum'],payload):
 (P/'dist'/f'{name}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
(P/'dist/data.js').write_text('window.ICT_DATA='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
e=html.escape
pieces=['''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ICT 考纲知识手册</title><style>body{max-width:860px;margin:40px auto;padding:0 24px;font:16px/1.95 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;color:#243e2b}a{color:#166840}h1{font-size:32px}h2{border-top:1px solid #dce7d4;padding-top:24px;margin-top:55px}h3{margin-top:30px}pre{background:#f1f5ee;padding:20px;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.8 monospace}.meta{font-size:12px;color:#617363}.toc{display:grid;gap:6px}.unit{margin-top:35px}p{margin:12px 0}@media print{body{margin:0;max-width:none;padding:0;font-size:10pt}.toc,.tools{display:none}h2,h3{break-after:avoid}pre{font-size:8pt}a{color:inherit}}</style></head><body><p class="tools"><a href="index.html">← 返回知识目录</a> · 浏览器菜单可打印或保存PDF</p><h1>ICT 考纲知识手册</h1><p>按考纲整理数通、DCN、安全、WLAN的概念、原理、工作机制与配置。</p><nav class="toc">''']
ordered=[parents[id] for stage in curriculum for id in stage['chapters']]
for stage in curriculum:
 pieces.append(f'<h3>{e(stage["title"])}</h3>')
 for id in stage['chapters']:pieces.append(f'<a href="#{id}">{e(parents[id]["title"])}</a>')
pieces.append('</nav>')
for x in ordered:
 d=lessons[x['title']];pieces.append(f'<section id="{x["id"]}"><h2>{e(x["title"])}</h2><p class="meta">{e(x["group"])} / {e(x["category"])}</p><h3>从一个问题开始</h3><p>{e(x["intro"])}</p><p><b>读完本章：</b>{e(x["outcome"])}</p><p><b>考纲要求：</b>{e(x["detail"])}</p>')
 if x.get('readingNote'):pieces.append(f'<p>{e(x["readingNote"])}</p>')
 children=[u for u in units if u['parent']==x['id']]
 for u in children:
  pieces.append(f'<article class="unit" id="{u["id"]}"><h3>{e(u["term"])}</h3>'+''.join(f'<p>{e(p)}</p>' for p in u['explain'].split('\n') if p))
  if u['process']!=u.get('walkthrough',{}).get('steps'):pieces.append('<h4>工作过程</h4><ol>'+''.join(f'<li>{e(s)}</li>' for s in u['process'])+'</ol>')
  w=u.get('walkthrough')
  if w:pieces.append(f'<h4>跟着例子走：{e(w["title"])}</h4><p>{e(w["setup"])}</p><ol>'+''.join(f'<li>{e(s)}</li>' for s in w['steps'])+f'</ol><p><b>由此可见：</b>{e(w["conclusion"])}</p>')
  if u.get('config'):pieces.append(f'<h4>配置与查询</h4><pre>{e(u["config"]["code"])}</pre><p class="meta">{e(u["config"]["platform"])}</p>')
  if u.get('config',{}).get('notes'):pieces.append(f'<p class="meta">{e(u["config"]["notes"])}</p>')
  if u.get('commandNotes'):pieces.append('<ul>'+''.join(f'<li>{e(s)}</li>' for s in u['commandNotes'])+'</ul>')
  f=u.get('fault')
  if f:pieces.append(f'<h4>易混淆之处与故障原因</h4><p>{e(f["symptom"])}：{e(f["cause"])}。{e(f["check"])}；{e(f["fix"])}。</p>')
  pieces.append('</article>')
 pieces.append(f'<h3>把本章串起来</h3><p>{e(x["explanation"])}</p><h4>{e(d["heading"])}</h4><p>{e(d["deep"])}</p>')
 code=d.get('commands','');existing={line.strip() for u in children for line in u.get('config',{}).get('code','').splitlines() if line.strip()}
 if existing:
  extra=[line for line in code.splitlines() if line.strip() and line.strip() not in existing and line.strip() not in ['system-view','quit','return']]
  if all(line.strip().startswith('display ') for line in extra):code='\n'.join(extra)
 if code:pieces.append(f'<h3>章节配置与查询</h3><pre>{e(code)}</pre><p class="meta">{e(d.get("version",""))}</p>')
 if d.get('fault'):pieces.append(f'<h3>关键边界与易错点</h3><p>{e(d["fault"])}</p>')
 refs={s['url']:s for u in children for s in u['sources']}
 refs.update({s['url']:s for s in sources if s['id'] in d.get('sources',[])})
 if refs:pieces.append('<h3>参考资料</h3><ul>'+''.join(f'<li><a href="{e(s["url"],quote=True)}">{e(s["title"])}</a> · {e(s.get("version",""))}</li>' for s in refs.values())+'</ul>')
 pieces.append('</section>')
pieces.append('<p class="meta">配置以所注产品版本为参考，尚未在赛事设备上验证。</p></body></html>')
(P/'dist/handbook.html').write_text(''.join(pieces),encoding='utf-8')
# 内容与阅读器同时改版时，避免浏览器混用旧脚本、旧样式与新数据。
index_path=P/'dist/index.html'
index=index_path.read_text(encoding='utf-8')
for asset in ['style.css','data.js','diagrams.js','teaching-data.js','teaching.js','app.js']:
 digest=hashlib.sha256((P/'dist'/asset).read_bytes()).hexdigest()[:12]
 index=re.sub(r'(["\'])'+re.escape(asset)+r'(?:\?v=[a-f0-9]+)?(["\'])',lambda m:m[1]+asset+'?v='+digest+m[2],index)
index_path.write_text(index,encoding='utf-8')
print(f'Built reading site: {len(rows)} chapters, {len(subskills)} syllabus subtopics, {len(units)} detailed sections. No question bank or learning records exported.')
