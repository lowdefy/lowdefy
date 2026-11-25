import re,sys
p=sys.argv[1]
src=open(p).read().split('\n')
out=[];inside=False;start=None;label=None
for i,l in enumerate(src):
    if l.startswith('async function build(options) {'): inside=True
    if inside and l.startswith('  } catch (err) {'): inside=False
    out.append(l)
    if not inside: continue
    if re.match(r'^    \S',l) and start is None and not l.strip().startswith('//'):
        start=i; label=None
        for pat in [r"tryBuildStep\((\w+)", r"await (\w+)\(", r"^\s+(?:components = |const \{[^}]*\} = await )?(\w+)\(", r"^\s+(\w+(?:\.\w+)?)"]:
            m=re.search(pat,l)
            if m: label=m.group(1); break
        if 'components = await buildRefs' in l: label='buildRefs'
    if start is not None and re.match(r'^    \S.*;$|^    \}\)?;?$',l):
        if re.match(r'^    (let|const) ',src[start]) and not src[start].strip().startswith('const {'): pass
        out.append(f"    globalThis.__ldfMark?.({label!r});")
        start=None
s='\n'.join(out)
s=s.replace("async function build(options) {\n  makeId.reset();", """async function build(options) {
  makeId.reset();
  if (process.env.LDF_BUILD_PROF) {
    let last = performance.now();
    const t0 = last;
    const marks = [];
    globalThis.__ldfMark = (name) => {
      const now = performance.now();
      marks.push([name, Math.round(now - last)]);
      last = now;
    };
    globalThis.__ldfMarksFlush = () => {
      (globalThis.__ldfFs ?? null);
      import('node:fs').then((fs) => fs.appendFileSync(process.env.LDF_BUILD_PROF, JSON.stringify({ total: Math.round(performance.now() - t0), marks }) + '\\n'));
    };
  }""",1)
open(p,'w').write(s)
