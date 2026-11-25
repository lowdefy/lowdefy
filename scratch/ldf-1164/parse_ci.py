import re,sys
from datetime import datetime
lines=open(sys.argv[1]).read().splitlines()
start=None;rows=[]
for l in lines:
    m=re.match(r'.*?\t.*?\t(\S+Z) (.*)$',l)
    if not m: continue
    ts,msg=m.groups()
    if 'xargs pnpm exec lowdefy test --headless' in msg and '##[group]' in msg: start=True
    if not start: continue
    t=datetime.fromisoformat(ts[:26]+'+00:00')
    rows.append((t,msg))
prev=None;stats={};gaps=[]
for t,msg in rows:
    if prev is None: prev=t; continue
    d=(t-prev).total_seconds(); prev=t
    kind=msg.split()[0] if msg.split() else ''
    m=re.search(r'\((\d+) steps?, (\d+)ms\)',msg)
    dur=int(m.group(2))/1000 if m else 0
    k=kind if kind in('PASS','FAIL','BROWSER-ONLY','SKIP') else 'other'
    s=stats.setdefault(k,[0,0,0.0,0.0]); s[0]+=1; s[1]+=0; s[2]+=d; s[3]+=dur
    if d-dur>3: gaps.append((d-dur,d,dur,msg[:140]))
print('total wall',(rows[-1][0]-rows[0][0]).total_seconds())
for k,s in stats.items(): print(k,'n=%d delta=%.1f printed=%.1f'%(s[0],s[2],s[3]))
print('gaps>3s',len(gaps),'sum unexplained %.1f'%sum(g[0] for g in gaps))
from collections import Counter
print(Counter(g[3].split()[0] for g in gaps))
for g in sorted(gaps,reverse=True)[:15]: print('%.1f %.1f %.1f %s'%g)
