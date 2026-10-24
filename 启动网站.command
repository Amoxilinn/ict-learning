#!/bin/zsh
task_site_dir="$(cd -- "$(dirname -- "$0")" && pwd)"
exec python3 "$task_site_dir/serve.py"
