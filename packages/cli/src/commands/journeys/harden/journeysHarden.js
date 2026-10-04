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

import { type } from '@lowdefy/helpers';

import buildMutationReport from './buildMutationReport.js';
import formatHardenReport from './formatHardenReport.js';
import formatMutantList from './formatMutantList.js';
import parseHardenOptions from './parseHardenOptions.js';
import requestMutants from './requestMutants.js';
import resolveJourneyPaths from '../../test/resolveJourneyPaths.js';
import resolveServer from '../../test/resolveServer.js';
import runBaseline from './runBaseline.js';
import runWithCarryOver from './runWithCarryOver.js';
import sampleMutants from './sampleMutants.js';
import scopeMutants from './scopeMutants.js';
import scoreMutants from './scoreMutants.js';
import selectTests from '../../test/selectTests.js';
import writeMutationReport from './writeMutationReport.js';

function refuse({ context, message }) {
  context.logger.error(message);
  context.sendTelemetry();
  process.exitCode = 1;
}

function selectJourneys({ context }) {
  const givenPaths = context.options.paths ?? [];
  let paths;
  if (givenPaths.length > 0) {
    const resolved = resolveJourneyPaths({
      paths: givenPaths,
      base: process.cwd(),
      configDirectory: context.directories.config,
    });
    if (resolved.error) {
      return { error: resolved.error };
    }
    paths = resolved.files;
  }
  const items = selectTests({ context, filter: context.options.filter, paths }).map(
    ({ item }) => item
  );
  if (items.length === 0) {
    return { error: 'No journeys to harden. Add journeys to tests/journeys/.' };
  }
  return { items };
}

function listedOperators({ options, listing }) {
  if (!type.isNone(options.operators)) {
    return options.operators;
  }
  return [...new Set(listing.mutants.map(({ operator }) => operator))].sort();
}

// The run once the server is up: baseline, list, scope, sample, then either
// print the list or run every sampled mutant against the journeys on its path
// and report. Returns the exit code.
async function hardenOnServer({ context, options, items, url }) {
  const started = Date.now();
  const { baselines, failed } = await runBaseline({
    items,
    url,
    configDirectory: context.directories.config,
  });
  failed.forEach(({ file, name, message }) =>
    context.logger.warn(
      `Left out "${name}": its baseline run failed (${message}). Replay it first: lowdefy test --repeat 3 ${file}`
    )
  );
  if (baselines.length === 0) {
    context.logger.error('No journey passed its baseline run, so there is nothing to harden.');
    return 1;
  }
  const listing = await requestMutants({ url, baselines, operators: options.operators });
  const scoped = scopeMutants({
    mutants: listing.mutants,
    baselines,
    pages: options.pages,
    operators: options.operators,
  });
  let mutants;
  if (type.isNone(options.mutant)) {
    mutants = sampleMutants({ mutants: scoped.onPath, max: options.max, seed: options.seed });
  } else {
    mutants = scoped.onPath.filter(({ id }) => id === options.mutant);
    if (mutants.length === 0) {
      context.logger.error(
        `Mutant "${options.mutant}" is not on any selected journey's path in the current build.`
      );
      return 1;
    }
  }
  const sampled = { max: options.max, of: scoped.onPath.length, seed: options.seed };
  if (options.list) {
    formatMutantList({
      mutants,
      baselines,
      workers: options.workers,
      sampled,
      notExercised: scoped.notExercised,
    }).forEach((line) => context.logger.info(line));
    return 0;
  }
  const run = await runWithCarryOver({ context, options, items, url, baselines, listing, mutants });
  const exitCode = run.stopped ? 1 : 0;
  const score = scoreMutants({
    mutants: run.mutants,
    verdicts: run.verdicts,
    baselines: run.baselines,
    changed: run.changed,
  });
  const report = buildMutationReport({
    score,
    baselines: run.baselines,
    buildId: run.buildId,
    rebuilds: run.rebuilds,
    sampled,
    operators: listedOperators({ options, listing }),
    now: new Date(),
  });
  // A --mutant run confirms one kill; it must not replace the full report.
  if (type.isNone(options.mutant)) {
    writeMutationReport({ directories: context.directories, report });
  }
  if (options.json) {
    // Plain stdout, so the report can be piped to a JSON reader.
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return exitCode;
  }
  formatHardenReport({
    score,
    baselines: run.baselines,
    sampled,
    notExercised: scoped.notExercised,
    rebuilds: run.rebuilds,
    durationMs: Date.now() - started,
  }).forEach((line) => context.logger.info(line));
  return exitCode;
}

// lowdefy journeys harden: breaks the app's config on purpose, one small change
// at a time and only in the test's own browsers, and reports each change no
// journey noticed, with its source line, and each journey's score. Survivors
// are findings, so the exit code is 0 with survivors; 1 only when the run
// could not finish. It never writes or deletes a journey file.
async function journeysHarden({ context }) {
  const options = parseHardenOptions(context.options);
  if (options.error) {
    refuse({ context, message: options.error });
    return;
  }
  const selected = selectJourneys({ context });
  if (selected.error) {
    refuse({ context, message: selected.error });
    return;
  }
  const server = await resolveServer({ context });
  let interrupted = false;
  async function onSigint() {
    interrupted = true;
    context.logger.warn('Interrupted. Stopping development server.');
    await server.stop();
    process.exit(130);
  }
  process.once('SIGINT', onSigint);
  try {
    const exitCode = await hardenOnServer({
      context,
      options,
      items: selected.items,
      url: server.url,
    });
    if (exitCode !== 0) {
      process.exitCode = exitCode;
    }
  } finally {
    process.removeListener('SIGINT', onSigint);
    if (!interrupted) {
      await server.stop();
    }
  }
  context.sendTelemetry();
}

export default journeysHarden;
