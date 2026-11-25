import json,glob,re,collections
ci={}
for l in open('/tmp/ldf1164/ci.log'):
    m=re.search(r'Z PASS  (.*)  \((\d+) steps?, (\d+)ms\)',l)
    if m: ci.setdefault(m.group(1),[]).append(int(m.group(3)))
loc={}
for f in glob.glob('/tmp/ldf1164/A*.jsonl'):
    for l in open(f):
        r=json.loads(l)
        if r['passed']: loc.setdefault(r['name'],[]).append(r)
pairs=[(ci[n][0],loc[n][0]) for n in ci if n in loc and len(ci[n])==1 and len(loc[n])==1]
print('matched',len(pairs))
def s(f): return sum(f(c,r) for c,r in pairs)/1000
sess=lambda r: r['t'].get('host.create',0)+r['t'].get('host.close',0)
print('CI dur %.0f | local wall %.0f cpu %.0f idle %.0f session(open+close) %.0f'%(s(lambda c,r:c),s(lambda c,r:r['wall']),s(lambda c,r:r['cpuMs']),s(lambda c,r:r['idleMs']),s(lambda c,r:sess(r))))
print('local wall minus session %.0f'%s(lambda c,r:r['wall']-sess(r)))
# least squares CI = a*(wall-sess) + b*sess
import itertools
X=[(r['wall']-sess(r), sess(r)) for c,r in pairs]; Y=[c for c,r in pairs]
sxx=sum(x[0]*x[0] for x in X); syy=sum(x[1]*x[1] for x in X); sxy=sum(x[0]*x[1] for x in X)
sx_y=sum(x[0]*y for x,y in zip(X,Y)); sy_y=sum(x[1]*y for x,y in zip(X,Y))
det=sxx*syy-sxy*sxy; a=(sx_y*syy-sy_y*sxy)/det; b=(sy_y*sxx-sx_y*sxy)/det
print('fit CI = %.2f*(local non-session) + %.2f*(local session)'%(a,b))
# call-only journeys (no page)
co=[(c,r) for c,r in pairs if all(k in('call','expect.db','expect.calls','expect.status','expect.error','as','webhook','request','hold','release','expect.sunk','wait','expect.state') for k,_ in r['steps'])]
print('call-only journeys',len(co),'CI median',sorted(c for c,_ in co)[len(co)//2],'local session median %.0f'%sorted(sess(r) for _,r in co)[len(co)//2], 'local wall median %.0f'%sorted(r['wall'] for _,r in co)[len(co)//2])
