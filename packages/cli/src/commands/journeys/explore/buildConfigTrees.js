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

import spawnConfigTreeBuild from './spawnConfigTreeBuild.js';

const MAX_LISTED_ERRORS = 10;

function readBuilderVersion({ devDirectory }) {
  return JSON.parse(fs.readFileSync(path.join(devDirectory, 'package.json'), 'utf8')).version;
}

function isCachedBuild({ outDirectory }) {
  const resultPath = path.join(outDirectory, 'result.json');
  if (!fs.existsSync(resultPath)) return false;
  return JSON.parse(fs.readFileSync(resultPath, 'utf8')).status === 'ok';
}

function describeErrors(errors) {
  return errors
    .slice(0, MAX_LISTED_ERRORS)
    .map((error) => `  ${error.source ? `${error.source}: ` : ''}${error.message}`)
    .join('\n');
}

async function buildOne({ context, script, configDirectory, outDirectory, cacheable }) {
  if (cacheable && isCachedBuild({ outDirectory })) {
    return { status: 'ok', errors: [], warnings: [], ms: 0, cached: true };
  }
  await fs.promises.mkdir(outDirectory, { recursive: true });
  const result = await spawnConfigTreeBuild({ context, script, configDirectory, outDirectory });
  return { ...result, cached: false };
}

// Full config builds of the base tree and the head working tree, both by the
// head's installed builder, so a Lowdefy version bump does not show as a
// config change. Builds are cached under .lowdefy/explore/builds/
// <sha>-<builderVersion>/: the base always, the head when it is clean; a
// dirty head builds into the run directory. A head that does not build stops
// the run. A base that does not build returns baseError naming the cause, and
// the scope then targets every head page.
async function buildConfigTrees({
  context,
  revisions,
  baseConfigDirectory,
  runDirectory,
  pluginSets,
}) {
  const devDirectory = context.directories.dev;
  const script = path.join(devDirectory, 'lib', 'docs', 'explore', 'buildConfigTree.mjs');
  if (!fs.existsSync(script)) {
    throw new Error(
      `The dev server installed in ${devDirectory} has no explore builder. Stop the running dev server and start it again to update it.`
    );
  }
  const buildsDirectory = path.join(context.directories.config, '.lowdefy', 'explore', 'builds');
  const version = readBuilderVersion({ devDirectory });
  const baseOut = path.join(buildsDirectory, `${revisions.base}-${version}`);
  const headOut = revisions.dirty
    ? path.join(runDirectory, 'head-build')
    : path.join(buildsDirectory, `${revisions.head}-${version}`);

  const [base, head] = await Promise.all([
    buildOne({
      context,
      script,
      configDirectory: baseConfigDirectory,
      outDirectory: baseOut,
      cacheable: true,
    }),
    buildOne({
      context,
      script,
      configDirectory: context.directories.config,
      outDirectory: headOut,
      cacheable: !revisions.dirty,
    }),
  ]);

  if (head.status !== 'ok') {
    const error = new Error(
      `The config at the head does not build, so there is nothing to walk:\n${describeErrors(
        head.errors
      )}`
    );
    error.errors = head.errors;
    throw error;
  }

  const result = {
    baseBuild: path.join(baseOut, 'build'),
    headBuild: path.join(headOut, 'build'),
    buildMs: { base: base.ms, head: head.ms },
    cached: { base: base.cached, head: head.cached },
  };
  if (base.status !== 'ok') {
    const missing = pluginSets?.missingFromHead ?? [];
    result.baseBuild = null;
    result.baseError =
      missing.length > 0
        ? `The base lists plugins the head does not install (${missing.join(
            ', '
          )}), so the base could not be built. Every page is a target.`
        : `The config at the base does not build, so every page is a target:\n${describeErrors(
            base.errors
          )}`;
  }
  return result;
}

export default buildConfigTrees;
