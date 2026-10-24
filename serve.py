#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""只监听127.0.0.1；用Ctrl+C关闭，不暴露到局域网。"""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import webbrowser
root=Path(__file__).resolve().parent/'dist'
handler=partial(SimpleHTTPRequestHandler,directory=str(root))
try:server=ThreadingHTTPServer(('127.0.0.1',8765),handler)
except OSError:server=ThreadingHTTPServer(('127.0.0.1',0),handler)
url=f'http://127.0.0.1:{server.server_port}'
print(f'网络探索站已启动：{url}\n仅本机可访问。按 Ctrl+C 关闭。',flush=True)
webbrowser.open(url)
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
