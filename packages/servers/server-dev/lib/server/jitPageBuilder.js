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
import { serializer } from '@lowdefy/helpers';
import { buildPageJit, createContext } from '@lowdefy/build/dev';

import createLogger from './log/createLogger.js';
import PageCache from './pageCache.mjs';

const jitLogger = createLogger({ component: 'jit-build' });

const pageCache = new PageCache();
let cachedRegistryMtime = null;
let cachedRegistry = null;
let cachedBuildContext = null;
let lastInvalidationMtime = null;

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return serializer.deserialize(JSON.parse(content));
  } catch {
    return null;
  }
}

function checkPageInvalidations(buildDirectory) {
  const invalidationPath = path.join(buildDirectory, 'invalidatePages.json');
  try {
    const stat = fs.statSync(invalidationPath);
    if (lastInvalidationMtime && stat.mtimeMs === lastInvalidationMtime) {
      return;
    }
    lastInvalidationMtime = stat.mtimeMs;
    const content = fs.readFileSync(invalidationPath, 'utf8');
    const pageIds = JSON.parse(content);
    if (Array.isArray(pageIds) && pageIds.length > 0) {
      pageCache.invalidatePages(pageIds);
      cachedBuildContext = null;
    }
  } catch {
    // File doesn't exist yet or read error — nothing to invalidate
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
  const connectionIds = readJsonFile(path.join(buildDirectory, 'connectionIds.json')) ?? [];

  const customTypesMap = readJsonFile(path.join(buildDirectory, 'customTypesMap.json')) ?? {};

  cachedBuildContext = createContext({
    customTypesMap,
    directories: {
      build: buildDirectory,
      config: configDirectory,
      server: path.resolve(buildDirectory, '..'),
    },
    logger: jitLogger,
    stage: 'dev',
  });

  // Restore refMap, keyMap, jsMap, and connectionIds from skeleton build
  Object.assign(cachedBuildContext.refMap, refMap);
  Object.assign(cachedBuildContext.keyMap, keyMap);
  cachedBuildContext.jsMap.client = jsMap.client ?? {};
  cachedBuildContext.jsMap.server = jsMap.server ?? {};
  for (const id of connectionIds) {
    cachedBuildContext.connectionIds.add(id);
  }

  // Load installed packages snapshot from skeleton build for missing-package detection
  const installedPluginPackages =
    readJsonFile(path.join(buildDirectory, 'installedPluginPackages.json')) ?? [];
  cachedBuildContext.installedPluginPackages = new Set(installedPluginPackages);

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

  try {
    const context = getBuildContext(buildDirectory, configDirectory);
    const startTime = Date.now();
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
    jitLogger.info(`Built page "${pageId}" in ${Date.now() - startTime}ms.`);
    return true;
  } finally {
    pageCache.releaseBuildLock(pageId);
  }
}

export default buildPageIfNeeded;
export { pageCache };
