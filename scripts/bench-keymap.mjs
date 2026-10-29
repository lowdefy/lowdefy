#!/usr/bin/env node
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

/*
  Check that two key maps say the same: the same key ids, each resolving to
  the same source file, line and config path. Each map is read with its own
  Lowdefy's resolveConfigLocation, so a map in a new format is checked
  against the old one by meaning, not by bytes.

  Usage:
    pnpm bench:keymap <old> <new> [--old-errors <dir>] [--new-errors <dir>]

  <old> and <new> are each a build folder holding keyMap.json and refMap.json,
  or a build fixture's snapshot.json.
  --old-errors   a built @lowdefy/errors dist folder to read <old> with;
                 default: the baseline worktree's packages/utils/errors/dist
                 (../lowdefy-bench-<sha7>, created by the harness if missing)
  --new-errors   the same for <new>; default: this checkout's

  Exit codes: 0 the maps say the same, 1 they differ, 2 the check failed.
*/

import path from 'node:path';

import compareKeyMaps from './lib/bench/compareKeyMaps.mjs';
import ensureBaselineWorktree from './lib/bench/ensureBaselineWorktree.mjs';
import formatKeyMapComparison from './lib/bench/formatKeyMapComparison.mjs';
import loadResolveConfigLocation from './lib/bench/loadResolveConfigLocation.mjs';
import readKeyMaps from './lib/bench/readKeyMaps.mjs';
import parse, { REPO_ROOT } from './lib/parseArgs.mjs';

const EXIT_SAME = 0;
const EXIT_DIFFERENT = 1;
const EXIT_FAILED = 2;

const ERRORS_DIST = path.join('packages', 'utils', 'errors', 'dist');

const keyMapOptions = {
  'new-errors': { type: 'string' },
  'old-errors': { type: 'string' },
};

const logger = {
  info: (message) => console.log(message),
  warn: (message) => console.warn(message),
};

function readArgs() {
  const { positionals, values } = parse(keyMapOptions);
  if (positionals.length !== 2) {
    throw new Error(
      'Usage: pnpm bench:keymap <old> <new> [--old-errors <dir>] [--new-errors <dir>]'
    );
  }
  // pnpm runs the script from the repository root; INIT_CWD is where it was called.
  const cwd = process.env.INIT_CWD ?? process.cwd();
  const resolveArg = (value) => (value === undefined ? undefined : path.resolve(cwd, value));
  return {
    newErrors: resolveArg(values['new-errors']),
    newLocation: resolveArg(positionals[1]),
    oldErrors: resolveArg(values['old-errors']),
    oldLocation: resolveArg(positionals[0]),
  };
}

async function getOldErrorsDirectory({ oldErrors }) {
  if (oldErrors !== undefined) {
    return oldErrors;
  }
  const baseline = await ensureBaselineWorktree({ logger, repoRoot: REPO_ROOT });
  return path.join(baseline.directory, ERRORS_DIST);
}

async function main() {
  const args = readArgs();
  const oldErrors = await getOldErrorsDirectory(args);
  const newErrors = args.newErrors ?? path.join(REPO_ROOT, ERRORS_DIST);
  logger.info(`Old: ${args.oldLocation}, read with ${oldErrors}`);
  logger.info(`New: ${args.newLocation}, read with ${newErrors}`);

  const startedAt = performance.now();
  const comparison = compareKeyMaps({
    old: {
      ...readKeyMaps({ location: args.oldLocation }),
      resolve: await loadResolveConfigLocation({ errorsDirectory: oldErrors }),
    },
    new: {
      ...readKeyMaps({ location: args.newLocation }),
      resolve: await loadResolveConfigLocation({ errorsDirectory: newErrors }),
    },
  });
  formatKeyMapComparison({ comparison }).forEach((line) => console.log(line));
  logger.info(`Took ${((performance.now() - startedAt) / 1000).toFixed(1)}s.`);
  return comparison.identical ? EXIT_SAME : EXIT_DIFFERENT;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(error);
  process.exitCode = EXIT_FAILED;
}
