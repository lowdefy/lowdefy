#!/bin/zsh
# usage: tbuild.sh <label>  -- times node lowdefy/build.mjs in _server/prod-pelican
label=$1
cd /Users/puffin/.puffin/work/31792/pelican/apps/pelican/.lowdefy/server
export LOWDEFY_DIRECTORY_CONFIG=/Users/puffin/.puffin/work/31792/pelican/apps/pelican LOWDEFY_LOG_LEVEL=info
export LDF_BUILD_PROF=/tmp/ldf1164b/bprof-$label.jsonl; rm -f $LDF_BUILD_PROF
l0=$(sysctl -n vm.loadavg | awk '{print $2}')
infisical run --projectId dde10071-c3c2-4016-b6d2-b7218fa71511 --env=local --path=/apps/pelican --silent -- /usr/bin/time -l node ${=NODE_EXTRA} lowdefy/build.mjs > /tmp/ldf1164b/b-$label.log 2>&1
echo "$label exit $? load0 $l0 $(grep -E 'real|user|sys' /tmp/ldf1164b/b-$label.log | grep -E '^\s+[0-9.]+ real' ) maxrss $(grep 'maximum resident' /tmp/ldf1164b/b-$label.log | awk '{print int($1/1048576)"MB"}')"
