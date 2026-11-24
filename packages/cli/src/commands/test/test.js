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

import collapseRuns from './collapseRuns.js';
import formatDevServerAccessNote from './access/formatDevServerAccessNote.js';
import fetchBuildId from './fetchBuildId.js';
import formatBrowserOnly from './formatBrowserOnly.js';
import formatNoTestsMatched from './formatNoTestsMatched.js';
import formatSkippedJourney from './formatSkippedJourney.js';
import formatBrowserOnlyNote from './formatBrowserOnlyNote.js';
import hashBuild from './hashBuild.js';
import isFullSuiteRun from './isFullSuiteRun.js';
import lintJourneys from './lint/lintJourneys.js';
import mayRunInBrowser from './mayRunInBrowser.js';
import openBuildApp from './openBuildApp.js';
import parseRepeat from './parseRepeat.js';
import parseTestSelection from './parseTestSelection.js';
import parseTier from '../journeys/usage/parseTier.js';
import parseUsageWindow from '../journeys/usage/parseUsageWindow.js';
import readAccessMode from './readAccessMode.js';
import readHeadlessRun from './readHeadlessRun.js';
import readJourneyConcurrency from './readJourneyConcurrency.js';
import readTestMode from './readTestMode.js';
import readTestSecrets from './readTestSecrets.js';
import resolveJourneyPaths from './resolveJourneyPaths.js';
import resolveServer from './resolveServer.js';
import runAccessStep from './access/runAccessStep.js';
import runDevJourneys from './runDevJourneys.js';
import runHeadlessTests from './runHeadlessTests.js';
import selectTests from './selectTests.js';
import selectTier from './selectTier.js';
import summariseResults from './summariseResults.js';
import takeJourneyRunSlots from './takeJourneyRunSlots.js';
import writeExercised from './writeExercised.js';
import writeHeadlessRun from './writeHeadlessRun.js';
import writeTestRun from './writeTestRun.js';

const SIGNAL_EXIT_CODES = { SIGINT: 130, SIGTERM: 143, SIGHUP: 129 };

// A run that starts no browser takes no journey run slot (LDF-768's slots bound browsers).
const NO_SLOTS = { release: () => {} };

function refuse({ context, message }) {
  context.logger.error(message);
  context.sendTelemetry();
  process.exitCode = 1;
}

// `lowdefy test --access` and `--update-access`: the access step alone, on the production build.
async function testAccessAlone({ context, updateAccess }) {
  const opened = await openBuildApp({ context });
  if (!type.isUndefined(opened.refused)) {
    refuse({ context, message: opened.refused });
    return;
  }
  let step;
  try {
    step = await runAccessStep({
      app: opened.app,
      context,
      mode: updateAccess ? 'update' : 'access',
    });
  } finally {
    await opened.app.close();
  }
  if (step.failed) {
    process.exitCode = 1;
  }
  context.sendTelemetry();
}

async function test({ context }) {
  const { access, updateAccess, error: accessError } = readAccessMode({ options: context.options });
  if (accessError) {
    refuse({ context, message: accessError });
    return;
  }
  if (access || updateAccess) {
    await testAccessAlone({ context, updateAccess });
    return;
  }
  const { repeat, error: repeatError } = parseRepeat(context.options.repeat);
  if (repeatError) {
    refuse({ context, message: repeatError });
    return;
  }
  const { runner, thorough, build, error: modeError } = readTestMode({ options: context.options });
  if (modeError) {
    refuse({ context, message: modeError });
    return;
  }
  const headless = runner === 'headless';
  // Only browser runs go side by side; headless runs go one at a time.
  const { readLimit, error: concurrencyError } = headless
    ? { readLimit: () => 1 }
    : readJourneyConcurrency({
        concurrency: context.options.concurrency,
        name: '--concurrency',
        repeat,
      });
  if (concurrencyError) {
    refuse({ context, message: concurrencyError });
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

  const lint = context.options.lint === true;
  const options = {
    build,
    filters,
    givenPaths,
    lint,
    paths,
    readLimit,
    repeat,
    runner,
    tags,
    thorough,
    tier,
    usageWindow,
  };
  // --build is taken only with --headless (readTestMode).
  if (!build || lint) {
    await testJourneys({ context, ...options });
    return;
  }
  // A run on the production build opens it once: the access step and every headless journey use
  // the one app, which is closed once, after the last journey, also when one throws.
  const secrets = readTestSecrets({ env: process.env });
  const opened = await openBuildApp({ context, secrets });
  if (!type.isUndefined(opened.refused)) {
    refuse({ context, message: opened.refused });
    return;
  }
  try {
    await testJourneys({ app: opened.app, context, ...options });
  } finally {
    await opened.app.close();
  }
}

// Selects the run's journeys and runs them: headless on the production build's app (`app`, given
// for --headless --build), or on a dev server, each where `runner` sends it (runDevJourneys).
async function testJourneys({
  app,
  build,
  context,
  filters,
  givenPaths,
  lint,
  paths,
  readLimit,
  repeat,
  runner,
  tags,
  thorough,
  tier,
  usageWindow,
}) {
  // The access step runs on every run that reads the production build, before journeys are
  // selected, so an app with no journeys is checked too, and it checks the whole table whatever
  // the run selects. A difference fails the run, and the journeys still run.
  if (!type.isUndefined(app)) {
    const step = await runAccessStep({ app, context, mode: 'check' });
    if (step.failed) {
      process.exitCode = 1;
    }
  }
  if (!build && !lint) {
    const note = formatDevServerAccessNote({ configDirectory: context.directories.config });
    if (!type.isUndefined(note)) {
      context.logger.info(note);
    }
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

  if (lint) {
    // Lints read a journey, not a run of it: a journey with a list of users
    // or a case table is linted once.
    const linted = await lintJourneys({
      context,
      items: collapseRuns({ items: selected.map(({ item }) => item) }),
    });
    if (linted.failed) {
      process.exitCode = 1;
    }
    context.sendTelemetry();
    return;
  }

  const tiered = await selectTier({
    context,
    selected,
    tier,
    usageWindow,
    fullTierOption: '--tier full',
  });
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

  if (build) {
    const ran = await runHeadlessTests({
      app,
      context,
      selected: tiered.selected,
      skipped: tiered.skipped.length,
      repeat,
    });
    if (ran.failed > 0) {
      process.exitCode = 1;
    }
    context.sendTelemetry();
    return;
  }

  // The slots are held until the server stops, so a waiting run has nothing
  // in memory yet.
  const slots = mayRunInBrowser({
    entries: tiered.selected,
    runner,
    thorough,
    records: readHeadlessRun({ directories: context.directories }),
    configDirectory: context.directories.config,
  })
    ? await takeJourneyRunSlots({ context, command: 'lowdefy test' })
    : NO_SLOTS;
  if (slots === null) {
    return;
  }
  let server;
  try {
    server = await resolveServer({ context });
  } catch (error) {
    slots.release();
    throw error;
  }
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
      try {
        await server.stop();
      } finally {
        slots.release();
      }
      process.exit(exitCode);
    }
    process.once(signal, onSignal);
    return [signal, onSignal];
  });

  // One run id per invocation names this run's trace file; only a full-suite
  // run records (see runRepeated). Only the browser part of a run records traces: the headless
  // part leaves the browser run's trace and run.json alone.
  const recording =
    runner === 'headless'
      ? undefined
      : { run: createTraceId(), paths: givenPaths, filter: filters, tags, tier };
  // In selection order, whatever order the journeys finished in.
  const results = [];
  const browserOnly = [];
  const seen = new Set();
  try {
    // The build as the server serves it before any journey opens a page, which the records of
    // headless-run.json are taken against (routeJourney).
    const configHash = hashBuild({ context });
    const ran = await runDevJourneys({
      context,
      entries: tiered.selected,
      url: server.url,
      runner,
      thorough,
      readLimit,
      repeat,
      recording,
      configHash,
      onReported: ({ entry, result, inBrowserNext }) => {
        if (!type.isUndefined(result.browserOnly)) {
          context.logger.info(formatBrowserOnly({ result, inBrowserNext }));
          return;
        }
        const lines = entry.suite.format({ result, seen });
        if (result.passed) {
          lines.forEach((line) => context.logger.info(line));
        } else {
          lines.forEach((line) => context.logger.error(line));
        }
      },
    });
    results.push(...ran.results);
    browserOnly.push(...ran.browserOnly);
    // The build once the run's pages were built.
    const endConfigHash = hashBuild({ context });
    writeExercised({
      directories: context.directories,
      results,
      buildId: await fetchBuildId({ url: server.url }),
      configHash: endConfigHash,
    });
    writeTestRun({ directories: context.directories, results });
    if (ran.headless.results.length + ran.headless.browserOnly.length > 0) {
      writeHeadlessRun({
        directories: context.directories,
        results: ran.headless.results,
        browserOnly: ran.headless.browserOnly,
        mode: 'dev',
        configHashes: [configHash, endConfigHash],
      });
    }
  } finally {
    signalHandlers.forEach(([signal, onSignal]) => process.removeListener(signal, onSignal));
    if (!interrupted) {
      try {
        await server.stop();
      } finally {
        slots.release();
      }
    }
  }

  const recorded =
    results.some((result) => !type.isUndefined(result.recorded)) &&
    isFullSuiteRun({
      paths: givenPaths,
      filter: filters,
      tags,
      tier,
      repetition: 1,
    });
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
  const summary = summariseResults({
    results,
    skipped: tiered.skipped.length,
    browserOnly: browserOnly.length,
  });
  if (summary.failed > 0) {
    context.logger.error(summary.text);
    process.exitCode = 1;
  } else {
    context.logger.info(summary.text);
  }
  const note = formatBrowserOnlyNote({ runner, browserOnly: browserOnly.length });
  if (!type.isUndefined(note)) {
    context.logger.info(note);
  }
  context.sendTelemetry();
}

export default test;
