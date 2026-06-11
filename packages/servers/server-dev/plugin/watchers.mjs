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
import { type } from '@lowdefy/helpers';
import { readFile } from '@lowdefy/node-utils';

import getLowdefyVersion from './utils/getLowdefyVersion.mjs';
import loadSkeletonSourceFiles from './utils/loadSkeletonSourceFiles.mjs';
import RESTART_EXIT_CODE from './restartExitCode.mjs';
import setupWatcher from './utils/setupWatcher.mjs';
import updatePageTailwindCss from './utils/updatePageTailwindCss.mjs';

function restartProcess({ logger, reason }) {
  logger.warn(`${reason} Restarting dev server...`);
  process.exit(RESTART_EXIT_CODE);
}

// The restart bucket: state the running process cannot refresh in place.
// Auth flows initialize once in SSR-externalized packages (@lowdefy/api
// caches the parsed auth config at module scope, @hono/auth-js initializes
// once), config.json feeds the Vite base and module-scope server wiring, and
// app.json is embedded in the HTML shell at module scope. Connections,
// server operators, and agents barrels are NOT tracked — they are project
// files reloaded through Vite's SSR module graph and passed per request.
const RESTART_BUCKET_FILES = [
  'build/app.json',
  'build/auth.json',
  'build/config.json',
  'build/plugins/auth/adapters.js',
  'build/plugins/auth/callbacks.js',
  'build/plugins/auth/events.js',
  'build/plugins/auth/providers.js',
];

// Shallow rebuilds regenerate ~k keys, so JSON artifacts are hashed with keys
// stripped — identical config must hash identically. (Removable once build
// keys are deterministic per build unit.)
async function sha1(filePath) {
  let content = await readFile(filePath);
  if (content === null) {
    return null;
  }
  if (filePath.endsWith('.json')) {
    content = JSON.stringify(
      JSON.parse(content, (_, value) => {
        if (!type.isObject(value)) return value;
        delete value['~k'];
        return value;
      })
    );
  }
  return crypto.createHash('sha1').update(content).digest('base64');
}

async function snapshotRestartBucket({ directories }) {
  const snapshot = {};
  await Promise.all(
    RESTART_BUCKET_FILES.map(async (filePath) => {
      snapshot[filePath] = await sha1(path.join(directories.server, filePath));
    })
  );
  return snapshot;
}

async function rebuild(context) {
  const { logger, state } = context;
  const before = await snapshotRestartBucket(context);
  const result = await context.lowdefyBuild();
  state.setBuild(result);
  const after = await snapshotRestartBucket(context);
  const changed = RESTART_BUCKET_FILES.filter((filePath) => before[filePath] !== after[filePath]);
  if (changed.length > 0) {
    restartProcess({ logger, reason: `Server configuration changed (${changed.join(', ')}).` });
  }
  // Module-scope state in the SSR app (lib/build wrappers) re-reads the fresh
  // in-memory artifacts on the next request.
  const ssrGraph =
    context.viteServer?.environments?.ssr?.moduleGraph ?? context.viteServer?.moduleGraph;
  ssrGraph?.invalidateAll();
}

function readPackageJsonDependencies({ directories }) {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(directories.server, 'package.json'), 'utf8')
    );
    return packageJson.dependencies ?? {};
  } catch {
    return {};
  }
}

// Watches the user's config directory plus any --watch paths. Skeleton-file
// changes trigger a shallow rebuild (restart-bucket checked); page-only
// changes invalidate the in-memory page cache.
function configWatcher(context) {
  const { directories, logger, options, state } = context;
  const fixRelativePathConfigDir = (item) =>
    path.isAbsolute(item) ? item : path.resolve(directories.config, item);

  const callback = async (filePaths) => {
    const changedFiles = filePaths
      .flat()
      .map((filePath) => path.relative(directories.config, filePath));

    const lowdefyYamlModified = changedFiles.some(
      (filePath) => filePath === 'lowdefy.yaml' || filePath === 'lowdefy.yml'
    );
    if (lowdefyYamlModified) {
      const lowdefyVersion = await getLowdefyVersion(context);
      if (lowdefyVersion !== context.version && lowdefyVersion !== 'local') {
        logger.warn('Lowdefy version changed. You should restart your development server.');
        process.exit(0);
      }
    }

    try {
      const skeletonSourceFiles = loadSkeletonSourceFiles(directories.build);
      const isSkeletonChange =
        lowdefyYamlModified || changedFiles.some((f) => skeletonSourceFiles.has(f));

      if (isSkeletonChange) {
        await rebuild(context);
      } else {
        state.invalidatePages();
        await updatePageTailwindCss({ changedFiles, context });
        logger.info('Page files changed, invalidated all pages.');
      }
    } catch (error) {
      logger.error(error);
    } finally {
      state.reloadClients();
    }
  };

  return setupWatcher({
    callback,
    context,
    ignorePaths: ['**/node_modules/**', ...options.watchIgnore.map(fixRelativePathConfigDir)],
    watchPaths: [directories.config, ...options.watch.map(fixRelativePathConfigDir)],
  });
}

// Watches local module roots (outside the config directory). Module skeleton
// changes rebuild; module page files invalidate.
function moduleWatcher(context) {
  const { directories, logger, state } = context;
  const localModuleRoots = [];
  for (const moduleEntry of Object.values(state.buildContext?.modules ?? {})) {
    if (moduleEntry.isLocal) {
      localModuleRoots.push(moduleEntry.moduleRoot);
    }
  }
  if (localModuleRoots.length === 0) {
    return Promise.resolve();
  }

  const callback = async (filePaths) => {
    const changedFiles = filePaths.flat();
    const moduleYamlChanged = changedFiles.some(
      (filePath) => path.basename(filePath) === 'module.lowdefy.yaml'
    );
    try {
      const skeletonSourceFiles = loadSkeletonSourceFiles(directories.build);
      const hasSkeletonChanges = changedFiles.some((f) => skeletonSourceFiles.has(f));
      if (moduleYamlChanged || hasSkeletonChanges) {
        logger.info(
          moduleYamlChanged
            ? 'module.lowdefy.yaml changed, running full shallow rebuild.'
            : 'Module skeleton files changed, running shallow rebuild.'
        );
        await rebuild(context);
      } else {
        state.invalidatePages();
        logger.info('Module files changed, invalidated all pages.');
      }
    } catch (error) {
      logger.error(error);
    } finally {
      state.reloadClients();
    }
  };

  return setupWatcher({
    callback,
    context,
    ignorePaths: ['**/node_modules/**'],
    watchPaths: localModuleRoots,
  });
}

// .env changes need a fresh process — secrets are snapshotted at import in
// SSR-externalized modules. The respawned process re-reads .env and rebuilds.
function envWatcher(context) {
  const callback = async () => {
    restartProcess({ logger: context.logger, reason: '.env file changed.' });
  };
  return setupWatcher({
    callback,
    context,
    watchDotfiles: true,
    watchPaths: [path.join(context.directories.config, '.env')],
  });
}

// Watches the server package.json — written by the build (skeleton or JIT)
// when config uses plugin types from packages that are not installed.
// Additive dependency changes install and rebuild in place: newly installed
// packages have no stale ESM cache, and the rebuilt plugin barrels reload
// through Vite's SSR graph. Version changes or removals need a fresh process.
function packageJsonWatcher(context) {
  const { directories, logger, state } = context;
  let knownDependencies = readPackageJsonDependencies(context);

  const callback = async () => {
    const dependencies = readPackageJsonDependencies(context);
    const names = new Set([...Object.keys(knownDependencies), ...Object.keys(dependencies)]);
    const added = [];
    let changedOrRemoved = false;
    for (const name of names) {
      if (knownDependencies[name] === dependencies[name]) continue;
      if (knownDependencies[name] === undefined) {
        added.push(name);
      } else {
        changedOrRemoved = true;
      }
    }
    knownDependencies = dependencies;
    if (added.length === 0 && !changedOrRemoved) {
      return;
    }

    logger.warn('Plugin dependencies have changed and will be installed.');
    await context.installPlugins();

    if (changedOrRemoved) {
      restartProcess({ logger, reason: 'Plugin dependency versions changed.' });
    }

    // Additive only — rebuild so addInstalledTypes includes the new packages
    // in the plugin barrels, then let clients refetch.
    logger.info(`Installed new plugin packages: ${added.join(', ')}.`);
    await rebuild(context);
    state.reloadClients();
  };

  return setupWatcher({
    callback,
    context,
    watchDotfiles: true,
    watchPaths: [path.join(directories.server, 'package.json')],
  });
}

function startWatchers(context) {
  // Not awaited to ready — chokidar's ready event is unreliable, and the
  // watchers only need to exist, not to be settled, before requests arrive.
  configWatcher(context);
  moduleWatcher(context);
  envWatcher(context);
  packageJsonWatcher(context);
}

export default startWatchers;
