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

import { ConfigError, ConfigWarning } from '@lowdefy/errors';

import collectAppIds, { ID_KINDS } from './collectAppIds.js';
import serializeBuildException from '../utils/serializeBuildException.js';

const CHECK_SLUG = 'branch-merge';

const KIND_LABELS = {
  page: 'Page',
  request: 'Request',
  endpoint: 'Endpoint',
  connection: 'Connection',
  component: 'Component',
  collection: 'Collection',
  migration: 'Migration',
};

const SIDE_LABELS = {
  against: 'the target ref',
  base: 'the merge base',
  current: 'this branch',
};

function branchError(message, source) {
  const error = new ConfigError(message, { checkSlug: CHECK_SLUG });
  error.source = source ?? null;
  return error;
}

// A side that cannot be read is reported rather than thrown: the target
// branch's own validity is not this branch's check to fail on, but a
// comparison that did not happen must not read as "no collisions".
async function collectSide({ buildOptions, configDirectory, side, warnings }) {
  try {
    return await collectAppIds({
      ...buildOptions,
      directories: { ...buildOptions.directories, config: configDirectory },
    });
  } catch (error) {
    warnings.push(
      new ConfigWarning(
        `Could not read the app config at ${SIDE_LABELS[side]} (${configDirectory}): ${error.message}`,
        { checkSlug: CHECK_SLUG }
      )
    );
    return null;
  }
}

// An id is a collision when both branches introduced it since they diverged.
// An id that already exists at the merge base is the same id on both sides.
function collectCollisions({ against, base, current, ref }) {
  const errors = [];
  ID_KINDS.forEach((kind) => {
    Object.keys(current[kind])
      .filter((id) => !Object.hasOwn(base[kind], id) && Object.hasOwn(against[kind], id))
      .sort()
      .forEach((id) => {
        errors.push(
          branchError(
            `${KIND_LABELS[kind]} id "${id}" is added on this branch and on "${ref}". Merging them would declare it twice.`,
            current[kind][id]
          )
        );
      });
  });
  return errors;
}

// Migrations run in lexical order on the id, so a migration added here that
// sorts before one the target branch added is a migration that would be
// inserted behind a migration already applied on that branch's deployments.
function collectMigrationOrderErrors({ against, base, current, ref }) {
  const theirNew = Object.keys(against.migration)
    .filter((id) => !Object.hasOwn(base.migration, id))
    .sort();
  if (theirNew.length === 0) return [];
  // The last of theirs is the widest test: ours is out of order as soon as it
  // sorts before any migration the target branch has already run.
  const latestTheirs = theirNew[theirNew.length - 1];
  return Object.keys(current.migration)
    .filter((id) => !Object.hasOwn(base.migration, id) && id < latestTheirs)
    .sort()
    .map((id) =>
      branchError(
        `Migration "${id}" sorts before migration "${latestTheirs}", added on "${ref}". Lexical order is execution order, so after merging "${id}" would be inserted before a migration that has already run.`,
        current.migration[id]
      )
    );
}

// What merging this app config into `ref` would collide on: ids introduced
// independently on both sides since the merge base, and migrations this branch
// would insert behind migrations the target branch already runs.
async function checkAgainst({ againstDirectory, baseDirectory, buildOptions, ref }) {
  const warnings = [];
  const current = await collectSide({
    buildOptions,
    configDirectory: buildOptions.directories.config,
    side: 'current',
    warnings,
  });
  const against = await collectSide({
    buildOptions,
    configDirectory: againstDirectory,
    side: 'against',
    warnings,
  });
  const base = await collectSide({
    buildOptions,
    configDirectory: baseDirectory,
    side: 'base',
    warnings,
  });

  if (current === null || against === null || base === null) {
    return { ref, errors: [], warnings: warnings.map(serializeBuildException) };
  }

  const errors = [
    ...collectCollisions({ against, base, current, ref }),
    ...collectMigrationOrderErrors({ against, base, current, ref }),
  ];

  return {
    ref,
    errors: errors.map(serializeBuildException),
    warnings: warnings.map(serializeBuildException),
  };
}

export default checkAgainst;
