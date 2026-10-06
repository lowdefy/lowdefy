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
import { createTraceId, type } from '@lowdefy/helpers';

import buildConfigTrees from './buildConfigTrees.js';
import createScope from './createScope.js';
import describeEmptyScope from './describeEmptyScope.js';
import diffBuilds from './diffBuilds.js';
import formatPageRoleLines from './formatPageRoleLines.js';
import formatScopeLines from './formatScopeLines.js';
import materialiseTree from './materialiseTree.js';
import pruneScopeDirectory from './pruneScopeDirectory.js';
import readBuildArtifacts from './readBuildArtifacts.js';
import readCoverage from '../readCoverage.js';
import readDataSetUsers from './readDataSetUsers.js';
import readPluginSets from './readPluginSets.js';
import resolveRevisions from './resolveRevisions.js';
import selectHeadPages from './selectHeadPages.js';
import selectTargets from './selectTargets.js';
import touchDirectory from './touchDirectory.js';

const NO_PLUGIN_CHANGES = { missingFromHead: [], versionChanged: [] };

// The base config tree and the plugin sets it is built with. A head-only
// scope (no --base) has no base to materialise or compare plugins with.
async function prepareBase({ context, revisions, scopeDirectory }) {
  if (type.isNone(revisions.base)) {
    return { baseConfigDirectory: null, pluginSets: NO_PLUGIN_CHANGES };
  }
  const tree = await materialiseTree({
    root: revisions.root,
    sha: revisions.base,
    configDirectory: context.directories.config,
    scopeDirectory,
  });
  await touchDirectory(tree.treeDirectory);
  const pluginSets = await readPluginSets({
    baseConfigDirectory: tree.configDirectory,
    headConfigDirectory: context.directories.config,
  });
  return { baseConfigDirectory: tree.configDirectory, pluginSets };
}

function selectScopePages({ context, revisions, builds, headBuild }) {
  if (type.isNone(revisions.base)) {
    return selectHeadPages({ headBuild });
  }
  const baseBuild =
    builds.baseBuild === null ? null : readBuildArtifacts({ buildDirectory: builds.baseBuild });
  return selectTargets({
    diff: baseBuild === null ? null : diffBuilds({ baseBuild, headBuild }),
    baseBuild,
    headBuild,
    coverage: readCoverage({ directories: context.directories }),
    baseError: builds.baseError,
  });
}

function printScope({ context, scope, warnings, builds }) {
  const { logger } = context;
  if (context.options.json === true) {
    // The scope is the command's output with --json, for agents and skills.
    process.stdout.write(`${JSON.stringify(scope, null, 2)}\n`);
    return;
  }
  warnings.forEach((warning) => logger.warn(warning));
  formatScopeLines({ scope, buildMs: builds.buildMs, cached: builds.cached }).forEach((line) =>
    logger.info(line)
  );
  if (scope.pages.length === 0) {
    logger.info(describeEmptyScope({ scope }));
    return;
  }
  logger.info('Roles');
  formatPageRoleLines({ scope }).forEach((line) => logger.info(line));
}

// `lowdefy journeys scope [--base <ref>] [--json]`: what a change touched,
// for the coding agent's PR skill. Builds the merge base with <ref> and the
// working tree (uncommitted changes included) with the installed dev
// server's builder, diffs the builds and prints each changed page with why
// (blocks, requests, endpoints, connections; changes that travel through
// _ref show on every page that refs them) and who can open it, with the data
// set users under tests/data it admits. Without --base it lists every head
// page. Needs no running dev server; base trees and clean builds are cached
// under .lowdefy/scope/.
async function journeysScope({ context }) {
  const scopeDirectory = path.join(context.directories.config, '.lowdefy', 'scope');
  // A dirty head is built for this run alone, so its build is removed after.
  const runDirectory = path.join(scopeDirectory, createTraceId());
  try {
    await pruneScopeDirectory({ scopeDirectory });
    const revisions = await resolveRevisions({
      against: context.options.base,
      cwd: context.directories.config,
    });
    const { baseConfigDirectory, pluginSets } = await prepareBase({
      context,
      revisions,
      scopeDirectory,
    });
    const builds = await buildConfigTrees({
      context,
      revisions,
      baseConfigDirectory,
      runDirectory,
      pluginSets,
    });
    if (!revisions.dirty) await touchDirectory(path.dirname(builds.headBuild));
    if (builds.baseBuild !== null) await touchDirectory(path.dirname(builds.baseBuild));
    const headBuild = readBuildArtifacts({ buildDirectory: builds.headBuild });
    const targets = selectScopePages({ context, revisions, builds, headBuild });
    const scope = createScope({
      revisions,
      targets,
      plugins: pluginSets,
      headBuild,
      users: await readDataSetUsers({ configDirectory: context.directories.config }),
    });
    printScope({ context, scope, warnings: targets.warnings, builds });
    await context.sendTelemetry();
    return scope;
  } finally {
    await fs.promises.rm(runDirectory, { recursive: true, force: true });
  }
}

export default journeysScope;
