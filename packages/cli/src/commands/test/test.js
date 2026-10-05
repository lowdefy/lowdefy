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

import collapsePersonas from './collapsePersonas.js';
import fetchBuildId from './fetchBuildId.js';
import formatNoTestsMatched from './formatNoTestsMatched.js';
import formatSkippedJourney from './formatSkippedJourney.js';
import isFullSuiteRun from './isFullSuiteRun.js';
import lintJourneys from './lint/lintJourneys.js';
import parseRepeat from './parseRepeat.js';
import parseTestSelection from './parseTestSelection.js';
import parseTier from '../journeys/usage/parseTier.js';
import parseUsageWindow from '../journeys/usage/parseUsageWindow.js';
import resolveJourneyPaths from './resolveJourneyPaths.js';
import resolveServer from './resolveServer.js';
import runRepeated from './runRepeated.js';
import selectTests from './selectTests.js';
import selectTier from './selectTier.js';
import summariseResults from './summariseResults.js';
import writeExercised from './writeExercised.js';
import writeTestRun from './writeTestRun.js';

const SIGNAL_EXIT_CODES = { SIGINT: 130, SIGTERM: 143, SIGHUP: 129 };

function refuse({ context, message }) {
  context.logger.error(message);
  context.sendTelemetry();
  process.exitCode = 1;
}

async function test({ context }) {
  const { repeat, error: repeatError } = parseRepeat(context.options.repeat);
  if (repeatError) {
    refuse({ context, message: repeatError });
    return;
  }
  const tier = parseTier(context.options.tier);
  const usageWindow = `${parseUsageWindow(context.options.usageWindow)}m`;
  const {
    filters,
    tags,
    error: selectionError,
  } = parseTestSelection({ filter: context.options.filter, tags: context.options.tag });
  if (selectionError) {
    refuse({ context, message: selectionError });
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
  const selected = selectTests({ context, filter: filters, tags, paths });

  if (selected.length === 0) {
    const noMatch = formatNoTestsMatched({ paths: givenPaths, filters, tags, flagPrefix: '--' });
    if (!type.isUndefined(noMatch)) {
      refuse({ context, message: noMatch });
      return;
    }
    // A directory named on the command line is a run that expects journeys;
    // finding none there is a mistyped path, not an app without tests yet.
    if (!type.isNone(context.options.journeysDirectory)) {
      refuse({ context, message: `No journeys found in ${context.directories.journeys}.` });
      return;
    }
    context.logger.warn('No tests found. Add journeys to tests/journeys/.');
    context.sendTelemetry();
    return;
  }

  if (context.options.lint === true) {
    // Lints read a journey, not a run of it: a journey with a list of users
    // is linted once.
    const linted = await lintJourneys({
      context,
      items: collapsePersonas({ items: selected.map(({ item }) => item) }),
    });
    if (linted.failed) {
      process.exitCode = 1;
    }
    context.sendTelemetry();
    return;
  }

  const tiered = await selectTier({ context, selected, tier, usageWindow });
  if (!type.isUndefined(tiered.refused)) {
    refuse({ context, message: tiered.refused });
    return;
  }
  tiered.skipped.forEach((skipped) => context.logger.info(formatSkippedJourney({ skipped })));
  if (tiered.selected.length === 0) {
    context.logger.info(summariseResults({ results: [], skipped: tiered.skipped.length }).text);
    context.sendTelemetry();
    return;
  }

  const server = await resolveServer({ context });
  let interrupted = false;
  // The dev server runs in its own process group, out of reach of a signal to
  // this CLI's group, so every signal that ends the CLI stops it first.
  const signalHandlers = Object.entries(SIGNAL_EXIT_CODES).map(([signal, exitCode]) => {
    async function onSignal() {
      if (interrupted) {
        return;
      }
      interrupted = true;
      context.logger.warn('Interrupted. Stopping development server.');
      await server.stop();
      process.exit(exitCode);
    }
    process.once(signal, onSignal);
    return [signal, onSignal];
  });

  // One run id per invocation names this run's trace file; only a full-suite
  // run records (see runRepeated).
  const recording = { run: createTraceId(), paths: givenPaths, filter: filters, tags, tier };
  const recorded = isFullSuiteRun({
    paths: givenPaths,
    filter: filters,
    tags,
    tier,
    repetition: 1,
  });
  const results = [];
  const seen = new Set();
  try {
    for (const { suite, item, usage } of tiered.selected) {
      const result = {
        ...(await runRepeated({
          suite,
          context,
          item,
          url: server.url,
          repeat,
          recording,
        })),
        usage,
      };
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
    writeTestRun({ directories: context.directories, results });
  } finally {
    signalHandlers.forEach(([signal, onSignal]) => process.removeListener(signal, onSignal));
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
  const summary = summariseResults({ results, skipped: tiered.skipped.length });
  if (summary.failed > 0) {
    context.logger.error(summary.text);
    process.exitCode = 1;
  } else {
    context.logger.info(summary.text);
  }
  context.sendTelemetry();
}

export default test;
