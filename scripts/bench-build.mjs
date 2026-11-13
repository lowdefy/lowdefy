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
    pnpm bench:build <app-dir> --keymap               # keyMap.json by meaning, not bytes
    pnpm bench:build <app-dir> --runs 3               # timed runs per side (default 5)
    pnpm bench:build <app-dir> --no-compare           # skip the output comparison
    pnpm bench:build <app-dir> --no-time              # skip the timed runs
    pnpm bench:build <app-dir> --no-profile           # skip the CPU profile runs

  Exit codes: 0 identical (or not compared), 1 any difference, 2 a build (or the
  harness) failed.

  How it works:
    1. Builds this checkout (pnpm build:turbo) unless --skip-build or --self-check
    2. Keeps a baseline worktree at ../lowdefy-bench-<sha7>, installed and built
    3. Prepares each side's server under _server/bench/<app-slug>/<side-name>/
       with this checkout's scripts/lib, linked to that side's packages
    4. Runs each side's own CLI: lowdefy build --no-client-build
    5. Compares build/, package.json and the build's warnings and errors
    6. Times both sides (a warm-up each, then --runs alternating) and profiles
       one more build per side, with a probe in every Node process
    7. Prints a markdown report and writes it, report.json and the profiles
       to _server/bench/<app-slug>/<timestamp>/
*/

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import buildSide from './lib/bench/buildSide.mjs';
import compareBuilds from './lib/bench/compareBuilds.mjs';
import createKeyMapComparer from './lib/bench/createKeyMapComparer.mjs';
import createSideDirectories from './lib/bench/createSideDirectories.mjs';
import ensureBaselineWorktree from './lib/bench/ensureBaselineWorktree.mjs';
import formatComparison from './lib/bench/formatComparison.mjs';
import formatReport from './lib/bench/formatReport.mjs';
import getAppSlug from './lib/bench/getAppSlug.mjs';
import loadResolveConfigLocation from './lib/bench/loadResolveConfigLocation.mjs';
import measureSizes from './lib/bench/measureSizes.mjs';
import prepareServer from './lib/bench/prepareServer.mjs';
import profileSides from './lib/bench/profileSides.mjs';
import timeSides from './lib/bench/timeSides.mjs';
import parse, { REPO_ROOT } from './lib/parseArgs.mjs';

const EXIT_IDENTICAL = 0;
const EXIT_DIFFERENT = 1;
const EXIT_FAILED = 2;

// One entry per option; later options are added here.
const benchOptions = {
  baseline: { type: 'string' },
  'expect-added': { type: 'string', multiple: true, default: [] },
  keymap: { type: 'boolean', default: false },
  'no-compare': { type: 'boolean', default: false },
  'no-profile': { type: 'boolean', default: false },
  'no-time': { type: 'boolean', default: false },
  runs: { type: 'string', default: '5' },
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
  const runs = Number(values.runs);
  if (!Number.isInteger(runs) || runs < 1) {
    throw new Error(`--runs must be a whole number of 1 or more. Received "${values.runs}".`);
  }
  return {
    baselineRef: values.baseline,
    compare: !values['no-compare'],
    configDirectory,
    expectAdded: values['expect-added'],
    keymap: values.keymap,
    profile: !values['no-profile'],
    runs,
    selfCheck: values['self-check'],
    server: values.server,
    skipBuild,
    time: !values['no-time'],
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

function prepareSide({ args, side, slug }) {
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
  return { ...side, checkoutLink, logFile, serverDirectory };
}

// Builds one side once; a failed build stops the harness (exit code 2).
function createBuild({ args }) {
  return async function build({ side, cpuProfileDirectory, logFile, probeFile }) {
    const result = await buildSide({
      configDirectory: args.configDirectory,
      cpuProfileDirectory,
      logFile,
      probeFile,
      repoRoot: side.checkoutLink,
      server: args.server,
      serverDirectory: side.serverDirectory,
    });
    if (!result.ok) {
      throw Object.assign(new Error(`The ${side.label} build failed.`), { result, side });
    }
    return { ...result, serverDirectory: side.serverDirectory };
  };
}

// --keymap: keyMap.json is compared by meaning, each side's map read with
// that side's own resolveConfigLocation (from the checkout the side builds with).
async function createComparers({ args, sides }) {
  if (!args.keymap) {
    return {};
  }
  const errorsDirectory = (side) =>
    path.join(side.checkoutLink, 'packages', 'utils', 'errors', 'dist');
  const resolve = {
    baseline: await loadResolveConfigLocation({ errorsDirectory: errorsDirectory(sides[0]) }),
    current: await loadResolveConfigLocation({ errorsDirectory: errorsDirectory(sides[1]) }),
  };
  return { 'build/keyMap.json': createKeyMapComparer({ logger, resolve }) };
}

function reportFailedBuild({ result, side }) {
  console.error(`\nThe ${side.label} build failed (exit code ${result.exitCode}).`);
  console.error(`Log: ${result.logFile}\n`);
  console.error(result.output.trimEnd().split('\n').slice(-60).join('\n'));
}

function describeMachine() {
  const cpus = os.cpus();
  return {
    arch: process.arch,
    cpuModel: cpus[0]?.model ?? 'unknown CPU',
    cpus: cpus.length,
    loadAverage: os.loadavg(),
    node: process.version,
    platform: process.platform,
  };
}

function writeReport({ markdown, report, runDirectory }) {
  fs.mkdirSync(runDirectory, { recursive: true });
  fs.writeFileSync(path.join(runDirectory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(runDirectory, 'report.md'), markdown);
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
  const runDirectory = path.join(
    REPO_ROOT,
    '_server',
    'bench',
    slug,
    new Date().toISOString().replace(/[:.]/g, '-')
  );
  const machine = describeMachine();
  const [baselineSide, currentSide] = getSides({ baseline, selfCheck: args.selfCheck }).map(
    (side) => prepareSide({ args, side, slug })
  );
  const sides = [baselineSide, currentSide];
  const build = createBuild({ args });

  let comparison = null;
  if (args.compare) {
    const results = [];
    for (const side of sides) {
      logger.info(`Building with the ${side.label} CLI.`);
      const result = await build({ side, logFile: side.logFile });
      logger.info(`Build finished in ${(result.wallMs / 1000).toFixed(1)}s.`);
      results.push(result);
    }
    const comparers = await createComparers({ args, sides });
    const compared = await compareBuilds({
      baseline: results[0],
      comparers,
      current: results[1],
      expectAdded: args.expectAdded,
    });
    const lines = formatComparison({
      comparison: compared,
      labels: { baseline: baselineSide.label, current: currentSide.label },
    });
    console.log('');
    lines.forEach((line) => console.log(line));
    comparison = { identical: compared.identical, lines };
  }

  const timing = args.time
    ? await timeSides({ build, logger, runDirectory, runs: args.runs, sides })
    : null;
  const profile = args.profile ? await profileSides({ build, logger, runDirectory, sides }) : null;

  const report = {
    app: slug,
    createdAt: new Date().toISOString(),
    machine,
    sides: sides.map(({ label, name }) => ({ label, name })),
    comparison,
    sizes: Object.fromEntries(sides.map((side) => [side.name, measureSizes(side)])),
    timing,
    profile,
  };
  const markdown = formatReport({ report });
  writeReport({ markdown, report, runDirectory });
  console.log(`\n${markdown}`);
  logger.info(`Report, probe lines and profiles: ${runDirectory}`);
  if (comparison === null || comparison.identical) {
    return EXIT_IDENTICAL;
  }
  return EXIT_DIFFERENT;
}

try {
  process.exitCode = await main();
} catch (error) {
  if (error.result !== undefined) {
    reportFailedBuild(error);
    process.exitCode = EXIT_FAILED;
  } else {
    console.error(error);
    process.exitCode = EXIT_FAILED;
  }
}
