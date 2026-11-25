import json,sys
for f in sys.argv[1:]:
  for line in open(f):
    d=json.loads(line); print(f, 'total',d['total'])
    agg={}
    for n,t in d['marks']: agg[n]=agg.get(n,0)+t
    for n,t in sorted(agg.items(),key=lambda x:-x[1])[:22]: print(f'{t:7d} {n}')
