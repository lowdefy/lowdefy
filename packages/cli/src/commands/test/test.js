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

import path from 'path';
import { createTraceId, traceIdDate, type } from '@lowdefy/helpers';

import fetchBuildId from './fetchBuildId.js';
import isFullSuiteRun from './isFullSuiteRun.js';
import lintJourneys from './lint/lintJourneys.js';
import parseRepeat from './parseRepeat.js';
import resolveJourneyPaths from './resolveJourneyPaths.js';
import resolveServer from './resolveServer.js';
import runRepeated from './runRepeated.js';
import selectTests from './selectTests.js';
import summariseResults from './summariseResults.js';
import writeExercised from './writeExercised.js';

function refuse({ context, message }) {
  context.logger.error(message);
  context.sendTelemetry();
  process.exitCode = 1;
}

async function test({ context }) {
  const filter = context.options.filter;
  const { repeat, error: repeatError } = parseRepeat(context.options.repeat);
  if (repeatError) {
    refuse({ context, message: repeatError });
    return;
  }
  const givenPaths = context.options.paths ?? [];
  let paths;
  if (givenPaths.length > 0) {
    const resolved = resolveJourneyPaths({
      paths: givenPaths,
      base: process.cwd(),
      configDirectory: context.directories.config,
    });
    if (resolved.error) {
      refuse({ context, message: resolved.error });
      return;
    }
    paths = resolved.files;
  }
  const selected = selectTests({ context, filter, paths });

  if (selected.length === 0) {
    if (!type.isNone(filter)) {
      refuse({ context, message: `No tests matched --filter "${filter}".` });
      return;
    }
    if (!type.isUndefined(paths)) {
      refuse({ context, message: `No journeys found in ${givenPaths.join(', ')}.` });
      return;
    }
    // A directory named on the command line is a run that expects journeys;
    // finding none there is a mistyped path, not an app without tests yet.
    if (!type.isNone(context.options.journeysDirectory)) {
      refuse({ context, message: `No journeys found in ${context.directories.journeys}.` });
      return;
    }
    context.logger.warn('No tests found. Add journeys to tests/journeys/*.yaml.');
    context.sendTelemetry();
    return;
  }

  if (context.options.lint === true) {
    if (lintJourneys({ context, items: selected.map(({ item }) => item) }).failed) {
      process.exitCode = 1;
    }
    context.sendTelemetry();
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

  // One run id per invocation names this run's trace file; only a full-suite
  // run records (see runRepeated).
  const recording = { run: createTraceId(), paths: givenPaths, filter };
  const recorded = isFullSuiteRun({ paths: givenPaths, filter, repetition: 1 });
  const results = [];
  const seen = new Set();
  try {
    for (const { suite, item } of selected) {
      const result = await runRepeated({
        suite,
        context,
        item,
        url: server.url,
        repeat,
        recording,
      });
      results.push(result);
      const lines = suite.format({ result, seen });
      if (result.passed) {
        lines.forEach((line) => context.logger.info(line));
      } else {
        lines.forEach((line) => context.logger.error(line));
      }
    }
    writeExercised({
      directories: context.directories,
      results,
      buildId: await fetchBuildId({ url: server.url }),
    });
  } finally {
    process.removeListener('SIGINT', onSigint);
    if (!interrupted) {
      await server.stop();
    }
  }

  if (recorded) {
    context.logger.info(
      `Recorded this run to ${path.join(
        context.directories.traces,
        'journey',
        traceIdDate(recording.run),
        `${recording.run}.jsonl`
      )}.`
    );
  }
  const summary = summariseResults({ results });
  if (summary.failed > 0) {
    context.logger.error(summary.text);
    process.exitCode = 1;
  } else {
    context.logger.info(summary.text);
  }
  context.sendTelemetry();
}

export default test;
