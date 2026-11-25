import json,sys,glob,collections,statistics
rows=[]
for f in sorted(glob.glob(sys.argv[1])):
    rows+= [json.loads(l) for l in open(f)]
def S(rs,k): return sum(r['t'].get(k,0) for r in rs)/1000
passed=[r for r in rows if r['passed']]; bo=[r for r in rows if r['browserOnly']]; failed=[r for r in rows if not r['passed'] and not r['browserOnly']]
print('journeys',len(rows),'passed',len(passed),'browserOnly',len(bo),'failed/refused',len(failed))
W=sum(r['wall'] for r in rows)/1000
print('sum wall %.1f s; cpu %.1f s; idle %.1f s'%(W,sum(r['cpuMs'] for r in rows)/1000,sum(r['idleMs'] for r in rows)/1000))
d=[r['wall'] for r in passed]; print('passed median %.0f mean %.0f p99 %.0f ms'%(statistics.median(d),statistics.mean(d),sorted(d)[int(len(d)*.99)]))
slow=[r for r in rows if r['wall']>2000 and not r['browserOnly']]
print('slow >2s (not browser-only): n=%d wall %.1f s'%(len(slow),sum(r['wall'] for r in slow)/1000))
print('browser-only partial runs: wall %.1f s; classified statically (wall<5ms): %d'%(sum(r['wall'] for r in bo)/1000, sum(1 for r in bo if r['wall']<5)))
keys=sorted({k for r in rows for k in r['t']})
groups=[('all',rows),('slow',slow),('browserOnly',bo),('fast<=2s',[r for r in rows if r['wall']<=2000 and not r['browserOnly']])]
print('%-34s'%'phase'+''.join('%12s'%g for g,_ in groups)+'%10s'%'count')
for k in sorted(keys,key=lambda k:-S(rows,k)):
    print('%-34s'%k+''.join('%12.1f'%S(rs,k) for _,rs in groups)+'%10d'%sum(r['c'].get(k,0) for r in rows))
