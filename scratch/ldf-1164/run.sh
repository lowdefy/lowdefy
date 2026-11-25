#!/bin/zsh
# usage: run.sh <label> <journey paths...>
label=$1; shift
cd /Users/puffin/.puffin/work/51839/pelican-ldf1164/apps/pelican
export LOWDEFY_ENVIRONMENT=local LOWDEFY_TEST_SECRET_SUPPORT_WEBHOOK_ROOT=00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff
L=/Users/puffin/.puffin/work/51839/lowdefy-ldf1164
export LDF_PROF_FILE=/tmp/ldf1164/$label.jsonl
rm -f $LDF_PROF_FILE
s=$(date +%s.%N 2>/dev/null || python3 -c 'import time;print(time.time())')
node ${=NODE_EXTRA} $L/packages/cli/dist/index.js test --headless --build --config-directory . --server-directory $L/_server/prod-pelican "$@" > /tmp/ldf1164/$label.log 2>&1
echo "exit $? wall $(python3 -c "import time;print(round(time.time()-$s,1))")"
tail -1 /tmp/ldf1164/$label.log
