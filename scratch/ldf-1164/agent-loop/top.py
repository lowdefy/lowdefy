import json,sys,glob,collections
# usage: top.py '<glob>' [n] [filter-substring-in-stack]
pat=sys.argv[1]; N=int(sys.argv[2]) if len(sys.argv)>2 else 30; flt=sys.argv[3] if len(sys.argv)>3 else None
self_=collections.Counter(); incl=collections.Counter(); grand=0
for f in sorted(glob.glob(pat)):
    p=json.load(open(f)); nodes={n['id']:n for n in p['nodes']}; parent={}
    for n in p['nodes']:
        for c in n.get('children',[]): parent[c]=n['id']
    dt=collections.Counter()
    for s,d in zip(p['samples'],p['timeDeltas']): dt[s]+=d
    for nid,t in dt.items():
        x=nid; keys=[]
        while x is not None:
            cf=nodes[x]['callFrame']; keys.append('%s %s:%d'%(cf['functionName'] or '(anon)','/'.join(cf['url'].split('/')[-2:]),cf['lineNumber']+1)); x=parent.get(x)
        if flt and not any(flt in k for k in keys): continue
        grand+=t
        self_[keys[0]]+=t
        for k in set(keys): incl[k]+=t
print('total %.1f s'%(grand/1e6))
print('-- self'); [print('%7.2f %s'%(t/1e6,k)) for k,t in self_.most_common(N)]
print('-- inclusive'); [print('%7.2f %s'%(t/1e6,k)) for k,t in incl.most_common(N)]
