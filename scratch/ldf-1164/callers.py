import json,sys,collections
p=json.load(open(sys.argv[1])); target=sys.argv[2]; depth=int(sys.argv[3]) if len(sys.argv)>3 else 3
skip=set(sys.argv[4].split(',')) if len(sys.argv)>4 else set()
nodes={n['id']:n for n in p['nodes']};parent={}
for n in p['nodes']:
    for c in n.get('children',[]): parent[c]=n['id']
dt=collections.Counter()
for s,d in zip(p['samples'],p['timeDeltas']): dt[s]+=d
agg=collections.Counter()
for nid,t in dt.items():
    x=nid;stack=[]
    while x is not None:
        cf=nodes[x]['callFrame'];stack.append((cf['functionName'] or '(anon)')+'@'+cf['url'].split('/')[-1]); x=parent.get(x)
    idx=[i for i,f in enumerate(stack) if f.split('@')[0]==target]
    if not idx: continue
    i=idx[-1]  # outermost
    above=[f for f in stack[i+1:] if f.split('@')[1] not in skip][:depth]
    agg[' <- '.join(above)]+=t
tot=sum(agg.values())/1000
print('total',tot)
for k,v in agg.most_common(25): print('%7.0f %s'%(v/1000,k))
