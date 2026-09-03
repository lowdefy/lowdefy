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

import fs from 'fs';
import path from 'path';
import { serializer, type } from '@lowdefy/helpers';
import {
  buildPageJit,
  createContext,
  generateClientJsModule,
  hydrateDeferredRecords,
  iconPackages,
  makeId,
} from '@lowdefy/build/dev';

import createLogger from './log/createLogger.js';
import PageCache from './pageCache.mjs';
import readBuildApiArtifacts from './readBuildApiArtifacts.mjs';

const jitLogger = createLogger({ name: 'jit-build' });

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
const pageCache = new PageCache();
let cachedRegistryMtime = null;
let cachedRegistry = null;
let cachedBuildContext = null;
let lastInvalidationMtime = null;

// Frozen snapshot of icon imports from the initial build (what's actually in the client bundle).
// Module-level so it persists across context resets (skeleton rebuilds update iconImports.json
// with newly discovered icons, but those aren't in the bundle until a server restart).
// Only resets when the server process restarts.
let bundledIconImports = null;

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return serializer.deserialize(JSON.parse(content));
  } catch {
    return null;
  }
}

function checkPageInvalidations(buildDirectory) {
  const invalidatePath = path.join(buildDirectory, 'invalidatePages');
  try {
    const stat = fs.statSync(invalidatePath);
    if (lastInvalidationMtime && stat.mtimeMs === lastInvalidationMtime) {
      return;
    }
    lastInvalidationMtime = stat.mtimeMs;
    pageCache.invalidateAll();
    cachedBuildContext = null;
  } catch {
    // File doesn't exist yet — nothing to invalidate
  }
}

function loadPageRegistry(buildDirectory) {
  const registryPath = path.join(buildDirectory, 'pageRegistry.json');
  try {
    const stat = fs.statSync(registryPath);
    // Only reload if file has changed
    if (cachedRegistryMtime && stat.mtimeMs === cachedRegistryMtime) {
      return cachedRegistry;
    }
    cachedRegistryMtime = stat.mtimeMs;
    cachedRegistry = readJsonFile(registryPath);
    // Invalidate all pages when registry changes (skeleton rebuild happened)
    pageCache.invalidateAll();
    cachedBuildContext = null;
    return cachedRegistry;
  } catch {
    return null;
  }
}

function getBuildContext(buildDirectory, configDirectory) {
  if (cachedBuildContext) return cachedBuildContext;

  const refMap = readJsonFile(path.join(buildDirectory, 'refMap.json')) ?? {};
  const keyMap = readJsonFile(path.join(buildDirectory, 'keyMap.json')) ?? {};
  const jsMap = readJsonFile(path.join(buildDirectory, 'jsMap.json')) ?? { client: {}, server: {} };
  const jsModules = readJsonFile(path.join(buildDirectory, 'jsModules.json')) ?? {
    client: {},
    server: {},
  };
  const connectionIds = readJsonFile(path.join(buildDirectory, 'connectionIds.json')) ?? [];
  const websocketIds = readJsonFile(path.join(buildDirectory, 'websocketIds.json')) ?? [];
  const tenantCollections = readJsonFile(path.join(buildDirectory, 'tenantCollections.json')) ?? {
    tenantConnections: {},
    tenantCollectionMap: {},
  };
  const collections = readJsonFile(path.join(buildDirectory, 'collections.json')) ?? {};

  const customTypesMap = readJsonFile(path.join(buildDirectory, 'customTypesMap.json')) ?? {};
  const customMessagesMap = readJsonFile(path.join(buildDirectory, 'customMessagesMap.json')) ?? {};

  cachedBuildContext = createContext({
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

  // Restore refMap, keyMap, jsMap, connectionIds, websocketIds and the tenant
  // indexes from the skeleton build
  Object.assign(cachedBuildContext.refMap, refMap);
  Object.assign(cachedBuildContext.keyMap, keyMap);
  cachedBuildContext.jsMap.client = jsMap.client ?? {};
  cachedBuildContext.jsMap.server = jsMap.server ?? {};
  cachedBuildContext.jsModules.client = jsModules.client ?? {};
  cachedBuildContext.jsModules.server = jsModules.server ?? {};
  for (const id of connectionIds) {
    cachedBuildContext.connectionIds.add(id);
  }
  for (const id of websocketIds) {
    cachedBuildContext.websocketIds.add(id);
  }
  // The skeleton build ran buildConnections; the JIT page build does not, so
  // without this restore the tenant pipeline checks on page requests are
  // silently inert in dev.
  cachedBuildContext.tenantConnections = new Map(
    Object.entries(tenantCollections.tenantConnections ?? {})
  );
  cachedBuildContext.tenantCollectionMap = tenantCollections.tenantCollectionMap ?? {};
  // The collections: declaration is the first source of sharedness for the
  // same check; buildCollections only runs in the skeleton build.
  cachedBuildContext.collections = collections;

  // Load installed packages snapshot from skeleton build for missing-package detection
  const installedPluginPackages =
    readJsonFile(path.join(buildDirectory, 'installedPluginPackages.json')) ?? [];
  cachedBuildContext.installedPluginPackages = new Set(installedPluginPackages);

  // Restore module entries from skeleton build for JIT module page builds
  const modules = readJsonFile(path.join(buildDirectory, 'modules.json'));
  if (modules) {
    Object.assign(cachedBuildContext.modules, modules);
  }

  // Hydrate the deferred-record registry — module component bodies referenced
  // by '~deferred' placeholders in modules.json live here. readJsonFile runs
  // the marker-restoring reviver, so record-body ~r/~l markers survive.
  const deferredRecords = readJsonFile(path.join(buildDirectory, 'deferredRecords.json'));
  if (deferredRecords) {
    hydrateDeferredRecords(cachedBuildContext, deferredRecords);
  }

  // Restore app metadata so JIT page builds resolve _app / _build.app against
  // the same metadata the skeleton build computed.
  cachedBuildContext.appMeta = readJsonFile(path.join(buildDirectory, 'appMeta.json')) ?? null;

  // Restore api endpoint configs so JIT CallAPI validation (validateCallApiRefs in
  // buildPageJit) can resolve endpointIds. Without this the dev context has no
  // components.api and every CallAPI action is flagged as a non-existent endpoint.
  cachedBuildContext.components = { api: readBuildApiArtifacts(buildDirectory) };

  // Use the frozen icon imports from the initial build for JIT detection.
  // This represents what's actually in the client bundle — not what shallowBuild
  // discovers on subsequent rebuilds (those icons aren't bundled yet).
  // bundledIconImports is module-level and only resets on server restart.
  if (!bundledIconImports) {
    bundledIconImports = readJsonFile(path.join(buildDirectory, 'iconImports.json')) ?? [];
  }
  cachedBuildContext.iconImports = bundledIconImports;

  // Accumulator for dynamically extracted icon SVG data written to plugins/iconsDynamic.js.
  // Reset on skeleton rebuild (cachedBuildContext = null) — JIT re-discovers as needed.
  cachedBuildContext.dynamicIconData = {};

  // Advance makeId past all skeleton IDs to prevent collisions with JIT builds
  const idCounter = readJsonFile(path.join(buildDirectory, 'idCounter.json'));
  if (idCounter != null) {
    makeId.setCounter(idCounter);
  }

  return cachedBuildContext;
}

async function buildPageIfNeeded({ pageId, buildDirectory, configDirectory }) {
  checkPageInvalidations(buildDirectory);
  const registry = loadPageRegistry(buildDirectory);
  if (!registry || !registry[pageId]) {
    return false;
  }

  if (pageCache.isCompiled(pageId)) {
    return true;
  }

  const shouldBuild = await pageCache.acquireBuildLock(pageId);
  if (!shouldBuild) {
    // Another request completed the build
    return true;
  }

  jitLogger.info({ spin: 'start' }, `Building page "${pageId}"...`);
  const startTime = Date.now();
  try {
    const context = getBuildContext(buildDirectory, configDirectory);
    const result = await buildPageJit({
      pageId,
      pageRegistry: registry,
      context,
    });
    if (result && result.installing) {
      jitLogger.info(
        `Installing plugin packages for page "${pageId}": ${result.packages.join(', ')}. ` +
          'The page will be available after the server restarts.'
      );
      return result;
    }
    pageCache.markCompiled(pageId);
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
  } finally {
    pageCache.releaseBuildLock(pageId);
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
  for (const regex of Object.values(iconPackages)) {
    for (const match of scanText.matchAll(regex)) {
      const name = match[1];
      if (dynamicIconData[name] && !found[name]) {
        found[name] = dynamicIconData[name];
      }
    }
  }
  return Object.keys(found).length > 0 ? found : undefined;
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

// Vite's filesystem URL is `/@fs/<posix absolute path>` — a Windows path needs
// the separators flipped and the leading slash added, and a path with a space
// or a `#` needs encoding or the browser reads it as a fragment. The mtime
// query is what makes an edit visible: the browser's module registry keys on
// the URL, so without it a re-fetched page config re-imports the module the
// registry already holds — the function the author just changed. Vite's own
// HMR appends the same `?t=` for the same reason.
function fsImportUrl({ absolutePath }) {
  const posix = toPosix(absolutePath);
  // encodeURI leaves ? and # alone, and both would end the path here.
  const url = encodeURI(`/@fs${posix.startsWith('/') ? '' : '/'}${posix}`)
    .replace(/#/g, '%23')
    .replace(/\?/g, '%3F');
  const { mtimeMs } = fs.statSync(absolutePath);
  return `${url}?t=${Math.trunc(mtimeMs)}`;
}

// The client compiles _jsEntries with an AsyncFunction (usePageConfig.js), so a
// static import cannot survive; a module reference becomes a dynamic import of
// Vite's filesystem URL for the file the author edits, awaited in a preamble
// before the map. Inline entries render exactly as in clientJsMap.js.
function generateJitJsEntries({ scopedJsMap, scopedJsModules }) {
  const moduleHashes = Object.keys(scopedJsModules).sort();
  const preamble = moduleHashes
    .map(
      (hash, index) =>
        `const m${index} = await import('${fsImportUrl({
          absolutePath: scopedJsModules[hash].absolutePath,
        })}');`
    )
    .join('\n');
  const inline = generateClientJsModule(scopedJsMap);
  const moduleEntries = moduleHashes
    .map((hash, index) => `  '${hash}': m${index}.${scopedJsModules[hash].exportName},\n`)
    .join('');
  return `${preamble}${inline.replace(/  };$/, `${moduleEntries}  };`)}`;
}

// Scope this page's JIT-discovered enrichment out of the persistent build
// context so jitPageHandler can fold it into the page-config response the client
// already awaits — removing the two secondary fetches that stalled first paint.
// buildContext defaults to the module-private cachedBuildContext (re-read on
// every call, so it tracks invalidation resets); tests pass a stub.
export function getPageJitEnrichment({ pageConfig, buildContext = cachedBuildContext }) {
  // No build context (before the first build, or after an invalidation reset)
  // means nothing JIT-discovered to fold — the page serves what the static
  // client bundle already carries.
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

  const clientJsModules = buildContext.jsModules.client;
  const scopedJsModules = {};
  for (const hash of hashes) {
    if (Object.prototype.hasOwnProperty.call(clientJsModules, hash)) {
      scopedJsModules[hash] = clientJsModules[hash];
    }
  }

  const hasEntries = Object.keys(scopedJsMap).length > 0 || Object.keys(scopedJsModules).length > 0;
  const jsEntries = hasEntries ? generateJitJsEntries({ scopedJsMap, scopedJsModules }) : undefined;

  const dynamicIcons = scopeDynamicIcons({
    pageConfig,
    scopedJsMap,
    dynamicIconData: buildContext.dynamicIconData ?? {},
  });

  return { jsEntries, dynamicIcons };
}

export default buildPageIfNeeded;
