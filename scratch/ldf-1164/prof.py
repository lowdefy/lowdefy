import json,sys,re,collections
p=json.load(open(sys.argv[1]))
nodes={n['id']:n for n in p['nodes']}
parent={}
for n in p['nodes']:
    for c in n.get('children',[]): parent[c]=n['id']
dt=collections.Counter()
times=p['timeDeltas'];samples=p['samples']
for s,d in zip(samples,times): dt[s]+=d
total=sum(times)/1000
def pkg(url):
    if not url: return '(native)'
    u=url.replace('file://','')
    m=re.search(r'node_modules/(?:\.pnpm/[^/]+/node_modules/)?((?:@[^/]+/)?[^/]+)',u)
    if 'lowdefy-ldf1164/packages/' in u and 'node_modules' not in u:
        m2=re.search(r'lowdefy-ldf1164/packages/(.*?)/(src|dist)/',u); return 'LD:'+(m2.group(1) if m2 else u)
    if '_server/prod-pelican' in u and 'node_modules' in u and m: return m.group(1)
    if m: return m.group(1)
    if u.startswith('node:'): return 'node:'
    return u[-60:]
self_fn=collections.Counter();self_pkg=collections.Counter()
for nid,t in dt.items():
    cf=nodes[nid]['callFrame']
    self_fn[(cf['functionName'] or '(anon)',pkg(cf['url']),cf['url'].split('/')[-1],cf['lineNumber'])]+=t
    self_pkg[pkg(cf['url'])]+=t
print('total ms',total)
print('--- self by package')
for k,v in self_pkg.most_common(int(sys.argv[2]) if len(sys.argv)>2 else 30): print('%8.0f %5.1f%% %s'%(v/1000,100*v/1000/total,k))
print('--- self by function')
for k,v in self_fn.most_common(40): print('%8.0f %s'%(v/1000,k))
# inclusive by function name across stack (count once per sample)
incl=collections.Counter()
for nid,t in dt.items():
    seen=set();x=nid
    while x is not None:
        cf=nodes[x]['callFrame'];key=(cf['functionName'],cf['url'].split('/')[-1])
        if key not in seen: seen.add(key); incl[key]+=t
        x=parent.get(x)
print('--- inclusive')
for k,v in incl.most_common(int(sys.argv[3]) if len(sys.argv)>3 else 80): print('%8.0f %5.1f%% %s'%(v/1000,100*v/1000/total,k))
