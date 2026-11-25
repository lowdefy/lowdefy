#!/bin/zsh
# usage: suite.sh <prefix> [cpu-prof]
prefix=$1
for b in /tmp/ldf1164/batch_*; do
  n=${b##*_}
  if [[ "$2" == "prof" ]]; then
    rm -rf /tmp/ldf1164/prof_$prefix$n; NODE_EXTRA="--cpu-prof --cpu-prof-dir=/tmp/ldf1164/prof_$prefix$n --cpu-prof-interval 1000" /tmp/ldf1164/scripts/run.sh $prefix$n ${(f)"$(cat $b)"}
  else
    /tmp/ldf1164/scripts/run.sh $prefix$n ${(f)"$(cat $b)"}
  fi
  echo "batch $n done $(date +%T)"
done
echo ALLDONE
