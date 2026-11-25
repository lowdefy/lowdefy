import json,sys,glob,collections
target=sys.argv[2]; tfile=sys.argv[3]
agg=collections.Counter(); tot=0
for f in glob.glob(sys.argv[1]):
    p=json.load(open(f)); nodes={n['id']:n for n in p['nodes']};parent={}
    for n in p['nodes']:
        for c in n.get('children',[]): parent[c]=n['id']
    dt=collections.Counter()
    for s,d in zip(p['samples'],p['timeDeltas']): dt[s]+=d
    for nid,t in dt.items():
        x=nid;stack=[]
        while x is not None:
            cf=nodes[x]['callFrame'];stack.append((cf['functionName'] or '(anon)')+'@'+(cf['url'].split('/')[-1] if cf['url'] else '')); x=parent.get(x)
        stack=stack[::-1]
        idx=[i for i,s in enumerate(stack) if s==target+'@'+tfile]
        if not idx: continue
        i=idx[0]; tot+=t
        nxt=stack[i+1] if i+1<len(stack) else '(self)'
        nxt2=stack[i+2] if i+2<len(stack) else ''
        agg[nxt+' > '+nxt2]+=t
print('total %.1f s'%(tot/1e6))
for k,v in agg.most_common(15): print('%7.1f %s'%(v/1e6,k))
