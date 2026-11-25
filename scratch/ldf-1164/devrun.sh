#!/bin/zsh
label=$1; shift
cd /Users/puffin/.puffin/work/51839/pelican-ldf1164/apps/pelican
export LOWDEFY_ENVIRONMENT=local LOWDEFY_TEST_SECRET_SUPPORT_WEBHOOK_ROOT=00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff
L=/Users/puffin/.puffin/work/51839/lowdefy-ldf1164
s=$(python3 -c 'import time;print(time.time())')
node $L/packages/cli/dist/index.js test --config-directory . "$@" > /tmp/ldf1164/$label.log 2>&1
echo "exit $? wall $(python3 -c "import time;print(round(time.time()-$s,1))")"
