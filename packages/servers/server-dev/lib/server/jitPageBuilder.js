/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { serializer, type } from '@lowdefy/helpers';
import {
  buildPageJit,
  collectIconNames,
  createContext,
  createJitMaps,
  createReadConfigFile,
  generateClientJsModule,
  hydrateDeferredRecords,
  prepareJitContext,
  restoreTenantTargets,
} from '@lowdefy/build/dev';

import checkPageRecord from './checkPageRecord.js';
import contextMapBudget from './contextMapBudget.js';
import continueJitKeys from './continueJitKeys.js';
import createLogger from './log/createLogger.js';
import pageBuildRecords from './pageBuildRecords.js';
import PageCache from './pageCache.mjs';
import pruneJitMaps from './pruneJitMaps.js';
import readBuildApiArtifacts from './readBuildApiArtifacts.mjs';
import skipStaleMapWrites from './skipStaleMapWrites.js';

const jitLogger = createLogger({ name: 'jit-build' });

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

const pageCache = new PageCache();
let keptContext = null;
let registry = null;
let registryIdentity = null;
let lastChangeSignal = null;
// Counts the change events (page file edits) this process has seen. A compiled
// page whose checkedAt is behind it has its inputs checked before it is served.
let eventCounter = 0;
let budgetExceeded = false;

// Names this process's JIT keys and jitMaps files. A restarted child continues
// the same config build as the one before it, so its keys need their own
// prefix, or both would hand out the same keys for different nodes.
const childId = crypto.randomBytes(3).toString('hex');
// The generation of the current build context, or of the next one when none is
// made yet. A page built on an earlier generation is rebuilt, and a context's
// jitMaps files carry it.
let contextGeneration = 1;
let previousContextGeneration = 0;

// Frozen snapshot of the icon names in the dev client bundle, from the initial
// build. Module-level so it persists across context resets: skeleton rebuilds
// rewrite iconImports.json with newly used names, but those are not in the
// bundle until the server restarts. JIT delivers the rest as data.
let bundledIcons = null;

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return serializer.deserialize(JSON.parse(content));
  } catch {
    return null;
  }
}

// The value the manager writes to build/invalidatePages after every batch of
// watched changes, or null before the first.
function readChangeSignal(buildDirectory) {
  try {
    return fs.readFileSync(path.join(buildDirectory, 'invalidatePages'), 'utf8');
  } catch {
    return null;
  }
}

// Every config build publish renames a new pageRegistry.json into place, so
// its inode and mtime identify the published build, even two publishes in one
// clock tick.
function readRegistryIdentity(buildDirectory) {
  try {
    const stat = fs.statSync(path.join(buildDirectory, 'pageRegistry.json'), { bigint: true });
    return `${stat.ino}:${stat.mtimeNs}`;
  } catch {
    return null;
  }
}

function createBuildContext(buildDirectory, configDirectory) {
  const refMap = readJsonFile(path.join(buildDirectory, 'refMap.json')) ?? {};
  const keyMap = readJsonFile(path.join(buildDirectory, 'keyMap.json')) ?? {};
  const jsMap = readJsonFile(path.join(buildDirectory, 'jsMap.json')) ?? { client: {}, server: {} };
  const connectionIds = readJsonFile(path.join(buildDirectory, 'connectionIds.json')) ?? [];
  const websocketIds = readJsonFile(path.join(buildDirectory, 'websocketIds.json')) ?? [];

  const customTypesMap = readJsonFile(path.join(buildDirectory, 'customTypesMap.json')) ?? {};
  const customMessagesMap = readJsonFile(path.join(buildDirectory, 'customMessagesMap.json')) ?? {};

  const context = createContext({
    customMessagesMap,
    customTypesMap,
    directories: {
      build: buildDirectory,
      config: configDirectory,
      server: path.resolve(buildDirectory, '..'),
    },
    logger: jitLogger,
    stage: 'dev',
  });
  pageBuildRecords.trackFileReads({ context, configDirectory });

  // Restore refMap, keyMap, jsMap, connectionIds, and websocketIds from skeleton build
  Object.assign(context.refMap, refMap);
  Object.assign(context.keyMap, keyMap);
  context.jsMap.client = jsMap.client ?? {};
  context.jsMap.server = jsMap.server ?? {};
  for (const id of connectionIds) {
    context.connectionIds.add(id);
  }
  for (const id of websocketIds) {
    context.websocketIds.add(id);
  }
  // The scoped connections, walled collections and shared connections, so a
  // page's requests get the same tenant pipeline checks as in a full build.
  const tenantTargets = readJsonFile(path.join(buildDirectory, 'tenantTargets.json'));
  if (tenantTargets) {
    restoreTenantTargets({ context, tenantTargets });
  }
  // Pages that host a policy-bound Dynamic block count the policy's types
  // and validate its pages and endpoints.
  Object.assign(
    context.dynamicPolicies,
    readJsonFile(path.join(buildDirectory, 'dynamicPolicies.json')) ?? {}
  );

  // Load installed packages snapshot from skeleton build for missing-package detection
  const installedPluginPackages =
    readJsonFile(path.join(buildDirectory, 'installedPluginPackages.json')) ?? [];
  context.installedPluginPackages = new Set(installedPluginPackages);

  // Restore module entries from skeleton build for JIT module page builds
  const modules = readJsonFile(path.join(buildDirectory, 'modules.json'));
  if (modules) {
    Object.assign(context.modules, modules);
  }

  // Hydrate the deferred-record registry — module component bodies referenced
  // by '~deferred' placeholders in modules.json live here. readJsonFile runs
  // the marker-restoring reviver, so record-body ~r/~l markers survive.
  const deferredRecords = readJsonFile(path.join(buildDirectory, 'deferredRecords.json'));
  if (deferredRecords) {
    hydrateDeferredRecords(context, deferredRecords);
  }

  // Restore app metadata so JIT page builds resolve _app / _build.app against
  // the same metadata the skeleton build computed.
  context.appMeta = readJsonFile(path.join(buildDirectory, 'appMeta.json')) ?? null;

  // Restore api endpoint configs so JIT CallAPI validation (validateCallApiRefs in
  // buildPageJit) can resolve endpointIds. Without this the dev context has no
  // components.api and every CallAPI action is flagged as a non-existent endpoint.
  context.components = { api: readBuildApiArtifacts(buildDirectory) };

  if (!bundledIcons) {
    bundledIcons = new Set(readJsonFile(path.join(buildDirectory, 'iconImports.json')) ?? []);
  }
  context.bundledIcons = bundledIcons;
  // IconData delivered to pages as _dynamicIcons. Starts empty with each
  // context, since theme.icons or icon set plugins may have changed; JIT
  // re-resolves as pages are requested.
  context.dynamicIconData = {};

  const idCounter = readJsonFile(path.join(buildDirectory, 'idCounter.json'));
  continueJitKeys({ idCounter, childId });

  // The context's page builds write the entries they add to jitMaps/. Only the
  // previous context's files are kept besides its own: they resolve errors that
  // pages built just before the recreation still report.
  context.jitMaps = createJitMaps({
    keyMap: context.keyMap,
    refMap: context.refMap,
    name: `${childId}-${contextGeneration}`,
  });
  pruneJitMaps({ buildDirectory, keep: `${childId}-${previousContextGeneration}-` });
  previousContextGeneration = contextGeneration;
  skipStaleMapWrites({
    buildDirectory,
    context,
    keyPrefix: idCounter.prefix,
  });
  prepareJitContext(context);

  return context;
}

// The next page build makes a new context, of a new generation. Pages built on
// this one are rebuilt.
function discardBuildContext() {
  keptContext = null;
  contextGeneration += 1;
  budgetExceeded = false;
}

// The build context JIT page builds share. It outlives page edits and is
// recreated (a new generation) only when a config build is published or its
// maps pass contextMapBudget.
export function getBuildContext(buildDirectory, configDirectory) {
  keptContext ??= createBuildContext(buildDirectory, configDirectory);
  return keptContext;
}

// A change event: the files pages read may have changed. Reads from here on go
// through a fresh read cache, so a check or build sees what is on disk now;
// builds already running keep the cache they started with, and what they read
// is checked on the page's next request. Warnings are logged again.
function startChangeEvent(configDirectory) {
  eventCounter += 1;
  if (!keptContext) return;
  keptContext.readConfigFile = pageBuildRecords.trackReadConfigFile({
    readConfigFile: createReadConfigFile({ directories: keptContext.directories }),
    configDirectory,
  });
  keptContext.seenSourceLines.clear();
}

// Reads what the manager and the config build changed since the last call, and
// acts on it: a new build/invalidatePages value is a change event; a newly
// published page registry, or a context past its budget, discards the build
// context, so the next page build makes a new one. Both a page request and the
// build status review call it first, so each sees an edit the other has not.
export function syncBuildSignals({ buildDirectory, configDirectory }) {
  const changeSignal = readChangeSignal(buildDirectory);
  if (changeSignal !== lastChangeSignal) {
    lastChangeSignal = changeSignal;
    startChangeEvent(configDirectory);
  }
  const identity = readRegistryIdentity(buildDirectory);
  if (identity === null) {
    return { registry: null, eventCounter, generation: contextGeneration };
  }
  if (identity !== registryIdentity) {
    registryIdentity = identity;
    registry = readJsonFile(path.join(buildDirectory, 'pageRegistry.json'));
    discardBuildContext();
  } else if (budgetExceeded) {
    discardBuildContext();
  }
  return { registry, eventCounter, generation: contextGeneration };
}

function countAddedMapEntries(context) {
  return context.jitMaps.keys.added.length + context.jitMaps.refs.added.length;
}

// Whether a page's last build still describes it: 'current' or 'edited'. A
// page built on an earlier context is edited: its content, _js and icons
// belong to a context that is gone. A page checked up to the current change
// event is current. Otherwise its last build's inputs are checked
// (checkPageRecord), and a match moves its checkedAt to the event the check
// started at, so the next request or review does not check it again. A page
// request and the build status review both decide with this, so a build
// status wait builds exactly the pages the next requests would.
export async function reviewBuiltPage({ pageId, eventCounter: counter, generation }) {
  const record = pageBuildRecords.get(pageId);
  if (!record || record.generation !== generation) return 'edited';
  const compiled = pageCache.get(pageId);
  if (record.checkedAt === counter || compiled?.checkedAt === counter) return 'current';
  const check = await checkPageRecord({ record, readConfigFile: keptContext.readConfigFile });
  const latest = pageBuildRecords.get(pageId);
  if (latest !== record) {
    // The page was built again while this check read its previous build's
    // inputs, so the check says nothing about the new build: it is current
    // only when it started at or after this check's event.
    return latest?.generation === generation && latest.checkedAt >= counter ? 'current' : 'edited';
  }
  if (check !== 'current') return 'edited';
  record.checkedAt = Math.max(record.checkedAt, counter);
  pageCache.markChecked(pageId, { generation, checkedAt: counter });
  return 'current';
}

// Whether a compiled page can be served as it is.
async function isPageCurrent({ pageId, eventCounter: counter, generation }) {
  const compiled = pageCache.get(pageId);
  if (!compiled || compiled.generation !== generation) return false;
  if ((await reviewBuiltPage({ pageId, eventCounter: counter, generation })) !== 'current') {
    return false;
  }
  // A rebuild that failed while the page was checked leaves nothing to serve.
  return pageCache.isCompiled(pageId);
}

async function buildPage({ pageId, buildDirectory, configDirectory }) {
  // Read together, before the build starts: a change event or recreation
  // during the build leaves the page behind, so its next request checks or
  // rebuilds it.
  const context = getBuildContext(buildDirectory, configDirectory);
  const generation = contextGeneration;
  const checkedAt = eventCounter;
  const pageRegistry = registry;
  pageCache.remove(pageId);

  jitLogger.info({ spin: 'start' }, `Building page "${pageId}"...`);
  const startTime = Date.now();
  let result;
  try {
    result = await pageBuildRecords.record({
      pageId,
      context,
      configDirectory,
      generation,
      checkedAt,
      build: () => buildPageJit({ pageId, pageRegistry, context }),
    });
  } finally {
    // A failed build adds map entries too, and a page being fixed fails
    // build after build.
    if (context === keptContext && countAddedMapEntries(context) > contextMapBudget) {
      budgetExceeded = true;
    }
  }
  if (result && result.installing) {
    jitLogger.info(
      `Installing plugin packages for page "${pageId}": ${result.packages.join(', ')}. ` +
        'The page will be available after the server restarts.'
    );
    return result;
  }
  pageCache.markCompiled(pageId, { generation, checkedAt });
  // Touch the candidates file so Vite's CSS pipeline re-runs Tailwind for
  // classes the JIT build discovered — globals.css imports it. This import
  // is the ONLY recompile trigger: the tailwind .html scan inputs are
  // excluded from Vite's watcher (their .html change events would force
  // full browser reloads). Only touched when the build actually changed
  // tailwind content, so unchanged rebuilds cause no CSS recompile.
  if (result?._tailwindChanged) {
    fs.writeFileSync(
      path.join(buildDirectory, 'tailwind-candidates.css'),
      `/* Generated by Lowdefy build — rewritten on page changes to trigger CSS recompilation */\n/* ${Date.now()} */\n`
    );
  }
  jitLogger.info(
    { spin: 'succeed', color: 'white' },
    `Built page "${pageId}" in ${formatDuration(Date.now() - startTime)}.`
  );
  return { built: true, warnings: result?._warnings };
}

// Serves a page from its last JIT build while that build is current, else
// builds it. Returns false for a page not in the registry, true for a page
// already current, or the build's result.
async function buildPageIfNeeded({ pageId, buildDirectory, configDirectory }) {
  for (;;) {
    const signals = syncBuildSignals({ buildDirectory, configDirectory });
    if (!signals.registry || !signals.registry[pageId]) {
      return false;
    }
    if (await isPageCurrent({ pageId, ...signals })) {
      return true;
    }
    const shouldBuild = await pageCache.acquireBuildLock(pageId);
    if (shouldBuild) {
      try {
        return await buildPage({ pageId, buildDirectory, configDirectory });
      } finally {
        pageCache.releaseBuildLock(pageId);
      }
    }
    // Another request built the page meanwhile. Its build may have started
    // before an event this request saw, or failed, so the page is looked at
    // again rather than taken as current.
  }
}

// Collect every client _js hash the page references. jsMapParser reduces a _js
// operator to either { _js: "<hash>" } or { _js: { fn: "<hash>", args } }, and
// keeps args verbatim — so a _js nested inside another's args survives as its
// own node and must be descended into, or its hash is dropped and the client
// throws "_js function not found".
function collectJsHashes(node, hashes) {
  if (type.isArray(node)) {
    for (const item of node) collectJsHashes(item, hashes);
    return;
  }
  if (!type.isObject(node)) return;
  if (Object.prototype.hasOwnProperty.call(node, '_js')) {
    const inner = node._js;
    if (type.isString(inner)) {
      hashes.add(inner);
      return;
    }
    if (type.isObject(inner) && type.isString(inner.fn)) {
      hashes.add(inner.fn);
      collectJsHashes(inner.args, hashes);
      return;
    }
    return;
  }
  for (const value of Object.values(node)) collectJsHashes(value, hashes);
}

// Icons are discovered by detectMissingIcons on the pre-parse page, so a name
// appearing only inside a _js body is real but is a hash in the served config.
// Reproduce that surface: scan the served config plus the page's own client _js
// source strings, and keep only names present in dynamicIconData (which holds
// only JIT-discovered icons — static ones are already in the client bundle).
function scopeDynamicIcons({ pageConfig, scopedJsMap, dynamicIconData }) {
  if (Object.keys(dynamicIconData).length === 0) return undefined;
  const scanText = [JSON.stringify(pageConfig), ...Object.values(scopedJsMap)].join('\n');
  const found = {};
  for (const name of collectIconNames({ text: scanText })) {
    if (Object.hasOwn(dynamicIconData, name)) {
      found[name] = dynamicIconData[name];
    }
  }
  return Object.keys(found).length > 0 ? found : undefined;
}

// Scope this page's JIT-discovered enrichment out of the persistent build
// context so jitPageHandler can fold it into the page-config response the client
// already awaits — removing the two secondary fetches that stalled first paint.
// buildContext defaults to the module-private keptContext (re-read on every
// call, so it tracks recreations); tests pass a stub.
export function getPageJitEnrichment({ pageConfig, buildContext = keptContext }) {
  // No build context (before the first build) means nothing JIT-discovered to
  // fold — the page serves what the static client bundle already carries.
  if (!buildContext) return {};

  const clientJsMap = buildContext.jsMap.client ?? {};
  const hashes = new Set();
  collectJsHashes(pageConfig, hashes);

  const scopedJsMap = {};
  for (const hash of hashes) {
    if (Object.prototype.hasOwnProperty.call(clientJsMap, hash)) {
      scopedJsMap[hash] = clientJsMap[hash];
    }
  }

  const jsEntries =
    Object.keys(scopedJsMap).length > 0 ? generateClientJsModule(scopedJsMap) : undefined;

  const dynamicIcons = scopeDynamicIcons({
    pageConfig,
    scopedJsMap,
    dynamicIconData: buildContext.dynamicIconData ?? {},
  });

  return { jsEntries, dynamicIcons };
}

export default buildPageIfNeeded;
