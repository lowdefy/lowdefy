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
  Build an app with a baseline Lowdefy and with this checkout, and say whether
  the build output is identical.

  Usage:
    pnpm bench:build <app-dir>                        # baseline: merge-base with origin/develop
    pnpm bench:build <app-dir> --baseline <ref>       # another baseline commit
    pnpm bench:build <app-dir> --skip-build           # this checkout is already built
    pnpm bench:build <app-dir> --server e2e           # @lowdefy/server-e2e instead of the server
    pnpm bench:build <app-dir> --self-check           # build the baseline twice and compare
    pnpm bench:build <app-dir> --expect-added keyMap.json.gz   # repeatable

  Exit codes: 0 identical, 1 any difference, 2 a build (or the harness) failed.

  How it works:
    1. Builds this checkout (pnpm build:turbo) unless --skip-build or --self-check
    2. Keeps a baseline worktree at ../lowdefy-bench-<sha7>, installed and built
    3. Prepares each side's server under _server/bench/<app-slug>/<side-name>/
       with this checkout's scripts/lib, linked to that side's packages
    4. Runs each side's own CLI: lowdefy build --no-client-build
    5. Compares build/, package.json and the build's warnings and errors
*/

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import buildSide from './lib/bench/buildSide.mjs';
import compareBuilds from './lib/bench/compareBuilds.mjs';
import createSideDirectories from './lib/bench/createSideDirectories.mjs';
import ensureBaselineWorktree from './lib/bench/ensureBaselineWorktree.mjs';
import formatComparison from './lib/bench/formatComparison.mjs';
import getAppSlug from './lib/bench/getAppSlug.mjs';
import prepareServer from './lib/bench/prepareServer.mjs';
import parse, { REPO_ROOT } from './lib/parseArgs.mjs';

const EXIT_IDENTICAL = 0;
const EXIT_DIFFERENT = 1;
const EXIT_FAILED = 2;

// One entry per option; later options are added here.
const benchOptions = {
  baseline: { type: 'string' },
  'expect-added': { type: 'string', multiple: true, default: [] },
  'self-check': { type: 'boolean', default: false },
  server: { type: 'string', default: 'prod' },
};

const logger = {
  info: (message) => console.log(message),
  warn: (message) => console.warn(message),
};

function readArgs() {
  const { positionals, skipBuild, values } = parse(benchOptions);
  if (positionals.length !== 1) {
    throw new Error('Usage: pnpm bench:build <app-dir> [options]');
  }
  // pnpm runs the script from the repository root; INIT_CWD is where it was called.
  const configDirectory = path.resolve(process.env.INIT_CWD ?? process.cwd(), positionals[0]);
  if (
    !fs.existsSync(path.join(configDirectory, 'lowdefy.yaml')) &&
    !fs.existsSync(path.join(configDirectory, 'lowdefy.yml'))
  ) {
    throw new Error(`No lowdefy.yaml in ${configDirectory}.`);
  }
  if (!['prod', 'e2e'].includes(values.server)) {
    throw new Error(`--server must be "prod" or "e2e". Received "${values.server}".`);
  }
  return {
    baselineRef: values.baseline,
    configDirectory,
    expectAdded: values['expect-added'],
    selfCheck: values['self-check'],
    server: values.server,
    skipBuild,
  };
}

function getSides({ baseline, selfCheck }) {
  const baselineSide = { label: `baseline (${baseline.sha.slice(0, 7)})`, name: 'baseline' };
  if (selfCheck) {
    return [
      { ...baselineSide, repoRoot: baseline.directory },
      {
        ...baselineSide,
        label: `baseline repeat (${baseline.sha.slice(0, 7)})`,
        name: 'baseline-check',
        repoRoot: baseline.directory,
      },
    ];
  }
  return [
    { ...baselineSide, repoRoot: baseline.directory },
    { label: 'current (this checkout)', name: 'current', repoRoot: REPO_ROOT },
  ];
}

async function prepareAndBuild({ args, side, slug }) {
  const { checkoutLink, logFile, serverDirectory } = createSideDirectories({
    benchDirectory: path.join(REPO_ROOT, '_server', 'bench', slug),
    name: side.name,
    repoRoot: side.repoRoot,
  });
  logger.info(`\nPreparing the ${side.label} server at ${serverDirectory}.`);
  prepareServer({
    configDirectory: args.configDirectory,
    logger,
    repoRoot: checkoutLink,
    server: args.server,
    serverDirectory,
  });
  logger.info(`Building with the ${side.label} CLI.`);
  const result = await buildSide({
    configDirectory: args.configDirectory,
    logFile,
    repoRoot: checkoutLink,
    server: args.server,
    serverDirectory,
  });
  logger.info(
    `Build ${result.ok ? 'finished' : 'FAILED'} in ${(result.wallMs / 1000).toFixed(1)}s.`
  );
  return { ...result, serverDirectory };
}

function reportFailedBuild({ result, side }) {
  console.error(`\nThe ${side.label} build failed (exit code ${result.exitCode}).`);
  console.error(`Log: ${result.logFile}\n`);
  console.error(result.output.trimEnd().split('\n').slice(-60).join('\n'));
}

async function main() {
  const args = readArgs();
  if (!args.skipBuild && !args.selfCheck) {
    logger.info('Building this checkout...');
    execSync('pnpm build:turbo', { cwd: REPO_ROOT, stdio: 'inherit' });
  }
  const baseline = await ensureBaselineWorktree({
    logger,
    ref: args.baselineRef,
    repoRoot: REPO_ROOT,
  });
  const slug = getAppSlug({ configDirectory: args.configDirectory, repoRoot: REPO_ROOT });
  const [baselineSide, currentSide] = getSides({ baseline, selfCheck: args.selfCheck });

  const results = [];
  for (const side of [baselineSide, currentSide]) {
    const result = await prepareAndBuild({ args, side, slug });
    if (!result.ok) {
      reportFailedBuild({ result, side });
      return EXIT_FAILED;
    }
    results.push(result);
  }

  const comparison = await compareBuilds({
    baseline: results[0],
    current: results[1],
    expectAdded: args.expectAdded,
  });
  console.log('');
  formatComparison({
    comparison,
    labels: { baseline: baselineSide.label, current: currentSide.label },
  }).forEach((line) => console.log(line));
  return comparison.identical ? EXIT_IDENTICAL : EXIT_DIFFERENT;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(error);
  process.exitCode = EXIT_FAILED;
}
