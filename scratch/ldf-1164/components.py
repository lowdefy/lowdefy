import json,sys,glob,collections
# components: (label, function name, file) matched anywhere in stack; time counted once per sample per component
T=[('rails (checkHeadlessRails)','checkHeadlessRails','checkHeadlessRails.js'),
('  rails endpointConnections','endpointConnections','findExternalBlocks.js'),
('checkStepReferences','checkStepReferences','checkStepReferences.js'),
('  checkStepReferences builtBlockIds','builtBlockIds','checkStepReferences.js'),
('  checkStepReferences checkEndpointId','checkEndpointId','checkStepReferences.js'),
('readArtifact (all)','readArtifact','createBuildHost.js'),
('usesSearchStage','usesSearchStage','usesSearchStage.js'),
('engine Slots constructor','Slots','Slots.js'),
('engine serializer.copy','copy','serializer.js'),
('engine getContext','getContext','getContext.js'),
('engine _internal.update','_internal.update','createContext.js'),
('actor show','show','createHeadlessActor.js'),
('actor checkMounts','checkMounts','createHeadlessActor.js'),
('registerBlockStandIns','registerBlockStandIns','registerBlockStandIns.js'),
('registerHeadlessMethods','registerHeadlessMethods','registerHeadlessMethods.js'),
('text: readBlockText','readBlockText','readBlockText.js'),
('text: readTextModel','readTextModel','readTextModel.js'),
('text: markdownToHtml','markdownToHtml','markdownToHtml.js'),
('text: readHtmlPieces','readHtmlPieces','readHtmlPieces.js'),
('text: expectBlockText','expectBlockText','expectBlockText.js'),
('text: runTextTarget clickText','clickText','runTextTarget.js'),
('text: findTextWritingLabel','findTextWritingLabel','findTextWritingLabel.js'),
('openSession (node side)','openSession','openSession.js'),
('readDataSetFile (yaml)','readDataSetFile','readDataSetFile.js'),
('readConnectionArtifacts','readConnectionArtifacts','readConnectionArtifacts.js'),
('loadDataSetCollection','loadDataSetCollection','loadDataSetCollection.js'),
('server: callEndpoint/handleRequest','handleRequest','handleRequest.js'),
('server: callAPIHandler','callAPIHandler','callAPIHandler.js'),
('server: runRoutine','runRoutine','runRoutine.js'),
('server: evaluateOperators (server)','evaluateOperators','createEvaluateOperators.js'),
('server: readPageAs','readPageAs','readPageAs.js'),
('mongodb driver sendCommand','sendCommand','connection.js'),
('writeHeadlessRun','writeHeadlessRun','writeHeadlessRun.js'),
('readBuildSecretNames','readBuildSecretNames','readBuildSecretNames.js'),
('accessMatrix (access step)','accessMatrix','accessMatrix.js'),
('module loading (import)','import','loader'),
('runHeadlessJourney','runHeadlessJourney','runHeadlessJourney.js'),
('runJourneyHeadless (cli)','runJourneyHeadless','runJourneyHeadless.js'),
('garbage collector','(garbage collector)',''),
('(idle)','(idle)',''),
]
tot=collections.Counter(); grand=0
for f in sorted(glob.glob(sys.argv[1])):
    p=json.load(open(f))
    nodes={n['id']:n for n in p['nodes']};parent={}
    for n in p['nodes']:
        for c in n.get('children',[]): parent[c]=n['id']
    dt=collections.Counter()
    for s,d in zip(p['samples'],p['timeDeltas']): dt[s]+=d
    keycache={}
    for nid,t in dt.items():
        grand+=t
        x=nid;keys=set()
        while x is not None:
            cf=nodes[x]['callFrame'];keys.add((cf['functionName'],cf['url'].split('/')[-1] if cf['url'] else '')); x=parent.get(x)
        for lab,fn,fl in T:
            if (fn,fl) in keys: tot[lab]+=t
print('profile total %.1f s, idle %.1f s, busy %.1f s'%(grand/1e6,tot['(idle)']/1e6,(grand-tot['(idle)'])/1e6))
busy=grand-tot['(idle)']
for lab,_,_ in T: print('%-42s %8.1f s %5.1f%% of busy'%(lab,tot[lab]/1e6,100*tot[lab]/busy))
