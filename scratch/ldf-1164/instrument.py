import re,sys
R='/Users/puffin/.puffin/work/51839/lowdefy-ldf1164/packages/'
def edit(path, pairs, imp=None):
    p=R+path; s=open(p).read()
    for a,b,*n in pairs:
        cnt=s.count(a)
        if cnt==0: sys.exit('MISSING in %s: %r'%(path,a[:80]))
        if n and n[0]=='all': s=s.replace(a,b)
        else:
            if cnt>1: sys.exit('AMBIG in %s: %r'%(path,a[:80]))
            s=s.replace(a,b,1)
    if imp:
        i=s.index('\nimport ')+1; s=s[:i]+imp+'\n'+s[i:]
    open(p,'w').write(s); print('ok',path)
JH='utils/journey-headless/src/'
edit(JH+'createBuildHost.js',[
 ("const session = await app.openSession({ data });","const session = await timeAsync('host.openSession', () => app.openSession({ data }));"),
 ("rootConfig = await calls.readRootConfig({ user });","rootConfig = await timeAsync('host.readRootConfig', () => calls.readRootConfig({ user }));"),
 ("const page = await calls.readPage({ path: matchedPath, urlQuery, user: pageUser ?? user });","const page = await timeAsync('host.readPage', () => calls.readPage({ path: matchedPath, urlQuery, user: pageUser ?? user }));"),
 ("  function readArtifact(name) {\n","  function readArtifact(name) {\n    return timeSync(`artifact:${name.includes('/requests/') ? 'request' : name.split('/')[0]}`, () => readArtifactRaw(name));\n  }\n  function readArtifactRaw(name) {\n"),
 ("    call: ({ actionId, blockId, endpointId, kind, pageId, payload, requestId, user: caller }) =>\n      calls.call({","    call: ({ actionId, blockId, endpointId, kind, pageId, payload, requestId, user: caller }) =>\n      timeAsync(`call:${kind}`, () => calls.call({"),
 ("        user: caller ?? user,\n      }),","        user: caller ?? user,\n      })),"),
 ("system: ({ endpointId, payload }) => calls.system({ endpointId, payload }),","system: ({ endpointId, payload }) => timeAsync('call:system', () => calls.system({ endpointId, payload })),"),
 ("    webhook: ({ endpointId, headers, query, rawBody }) =>\n      calls.webhook({ endpointId, headers, query, rawBody }),","    webhook: ({ endpointId, headers, query, rawBody }) =>\n      timeAsync('call:webhook', () => calls.webhook({ endpointId, headers, query, rawBody })),"),
],"import { timeAsync, timeSync } from './prof.js';")
edit(JH+'runHeadlessJourney.js',[
 ("  const windows = createAppErrorWindows({","  const windows = timeSync('j.windows.create', () => createAppErrorWindows({"),
 ("    usesSearchStage: (entry) => usesSearchStage({ entry, host }),\n  });","    usesSearchStage: (entry) => usesSearchStage({ entry, host }),\n  }));"),
 ("    plugins: await host.loadClientPlugins(),","    plugins: await timeAsync('j.loadClientPlugins', () => host.loadClientPlugins()),"),
 ("    await actors.open();\n    await actors.current().settle();","    await timeAsync('j.open', () => actors.open());\n    await timeAsync('j.openSettle', () => actors.current().settle());"),
 ("await windows.take(","await timeAsync('j.windows.take', () => windows.take(",'all'),
 ("      checkStepReferences({ actor: actors.current(), host, journeyPageId: pageId, step });","      timeSync('j.checkStepReferences', () => checkStepReferences({ actor: actors.current(), host, journeyPageId: pageId, step }));"),
 ("    const durationMs = Date.now() - started;\n","    const durationMs = Date.now() - started;\n    add(`step:${key}`, durationMs);\n    rec()?.steps.push([key, durationMs]);\n"),
 ("    await actors.current().settle();\n    const findings","    await timeAsync('j.endSettle', () => actors.current().settle());\n    const findings"),
 ("  const raceFailure = await races.finish();","  const raceFailure = await timeAsync('j.racesFinish', () => races.finish());"),
 ("    failure = await findUnfiredFailGate({ session: host.dataSession, steps });","    failure = await timeAsync('j.failGate', () => findUnfiredFailGate({ session: host.dataSession, steps }));"),
],"import { add, rec, timeAsync, timeSync } from './prof.js';")
# windows.take closing parens: fix by regex after
p=R+JH+'runHeadlessJourney.js'; s=open(p).read()
s=s.replace("windows.take({ pageId, withEmits: false });","windows.take({ pageId, withEmits: false }));")
s=s.replace("windows.take({ pageId: actor.page?.pageId ?? null });","windows.take({ pageId: actor.page?.pageId ?? null }));")
s=s.replace("windows.take({ pageId: actors.current().page?.pageId ?? null });","windows.take({ pageId: actors.current().page?.pageId ?? null }));")
open(p,'w').write(s)
edit(JH+'createHeadlessActor.js',[
 ("    const config = serializer.deserialize({ pageConfig: page.pageConfig, rootConfig });","    const config = timeSync('actor.show.deserialize', () => serializer.deserialize({ pageConfig: page.pageConfig, rootConfig }));"),
 ("    await appContext._internal.runOnInit(progress);","    const onInitStart = performance.now();\n    await appContext._internal.runOnInit(progress);"),
 ("    context._internal.runOnInitAsync(progress);\n    registerBlockStandIns({ actor });","    context._internal.runOnInitAsync(progress);\n    add('actor.show.onInit', performance.now() - onInitStart);\n    registerBlockStandIns({ actor });"),
 ("    await checkMounts(shown);","    await timeAsync('actor.show.checkMounts', () => checkMounts(shown));"),
 ("  async function settle() {\n    await idle();","  async function settle() {\n    await timeAsync('actor.settle.idle', () => idle());"),
 ("    const settled = await waitForSettle({","    const settleStart = performance.now();\n    const settled = await waitForSettle({"),
 ("      timeout: Math.min(stepTimeout, SETTLE_MS),\n    });","      timeout: Math.min(stepTimeout, SETTLE_MS),\n    });\n    add('actor.settle.wait', performance.now() - settleStart);\n    if (!settled) add('actor.settle.timeout', performance.now() - settleStart);"),
 ("    const page = await readPage({ pageId, path, pathParams, urlQuery });\n    loadCount","    const page = await timeAsync('actor.load.readPage', () => readPage({ pageId, path, pathParams, urlQuery }));\n    loadCount"),
],"import { performance } from 'node:perf_hooks';\nimport { add, timeAsync, timeSync } from './prof.js';")
edit(JH+'checkHeadlessRails.js',[("  const refused = rails.refusal({ pageId: actor.page.pageId, blockId, step });","  const refused = timeSync('rails.refusal', () => rails.refusal({ pageId: actor.page.pageId, blockId, step }));")],"import { timeSync } from './prof.js';")
edit(JH+'pollUntil.js',[
 ("  const deadline = Date.now() + timeout;\n  let value = read();\n  while (!check(value) && Date.now() < deadline) {\n    await new Promise((resolve) => setTimeout(resolve, POLL_MS));\n    value = read();\n  }\n  return { held: check(value), value };",
  "  const deadline = Date.now() + timeout;\n  const start = Date.now();\n  let polls = 0;\n  let value = read();\n  while (!check(value) && Date.now() < deadline) {\n    await new Promise((resolve) => setTimeout(resolve, POLL_MS));\n    polls += 1;\n    value = read();\n  }\n  const held = check(value);\n  const ms = Date.now() - start;\n  add('poll.wall', ms);\n  add('poll.iter', polls, 0);\n  if (polls > 0) add('poll.waited', ms);\n  if (!held) add('poll.timeout', ms);\n  return { held, value };")],
 "import { add } from './prof.js';")
