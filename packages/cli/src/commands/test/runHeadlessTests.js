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

import createHeadlessWorkers from './createHeadlessWorkers.js';
import formatBrowserOnly from './formatBrowserOnly.js';
import formatBrowserOnlyNote from './formatBrowserOnlyNote.js';
import rememberedBrowserOnly from './rememberedBrowserOnly.js';
import runHeadlessRepeated, { headlessSuite } from './runHeadlessRepeated.js';
import runJourneyPool from './runJourneyPool.js';
import runsOnlyInProcess from './runsOnlyInProcess.js';
import summariseResults from './summariseResults.js';
import writeHeadlessRun from './writeHeadlessRun.js';

// `lowdefy test --build`: runs the selected journeys that need no browser on the app's production
// build, with no dev server and no browser, so it takes no browser or journey run slot. `app` is
// the run's one test app in this thread (openBuildApp), which checked the build and served the
// access step. Up to `concurrency.readLimit()` journeys run at once (runJourneyPool), and at most
// `concurrency.size`: one in this thread on `app`, the rest in worker threads, each of which opens
// the build once with the run's test `secrets` and runs one journey at a time
// (createHeadlessWorkers). Each journey, and each repeat of one, runs on a fresh session of its
// data set, with databases of its own on the run's one data store, and its own page state, so no
// journey sees another's writes. Journeys with no data set, or marked serial, run alone after the
// rest (runJourneyPool). Whatever order they finish in, they are reported in run order (those that
// ran side by side, then those that ran alone, each in selection order) and recorded in selection
// order, and headless-run.json is written once, here. Journeys that need a browser are
// listed as browser-only, with the first step that does, and are neither passed nor failed. One an
// earlier run found needs a browser on this build (its buildId) is listed without running it up to
// that step again (rememberedBrowserOnly); `records` is headless-run.json's journeys
// (readHeadlessRun). The summary names each browser-only journey and the command that runs them in
// the browser (formatBrowserOnlyNote). Returns { failed } once the run is reported; the worker
// threads are closed by then, also when the run throws.
async function runHeadlessTests({
  app,
  concurrency,
  context,
  selected,
  skipped,
  records,
  repeat,
  secrets,
}) {
  const workers = createHeadlessWorkers({
    size: concurrency.size - 1,
    workerData: {
      directories: { config: context.directories.config, server: context.directories.server },
      secrets,
    },
  });
  // This thread runs a journey whenever it has none in flight, so a run of one journey at a time
  // starts no worker thread. Journeys sent here wait their turn, one at a time.
  const ownQueue = [];
  let ownBusy = false;
  async function drainOwn() {
    ownBusy = true;
    while (ownQueue.length > 0) {
      const { item, resolve, reject } = ownQueue.shift();
      try {
        resolve(await runHeadlessRepeated({ app, context, item, repeat }));
      } catch (error) {
        reject(error);
      }
    }
    ownBusy = false;
  }
  function runOwn(item) {
    return new Promise((resolve, reject) => {
      ownQueue.push({ item, resolve, reject });
      if (!ownBusy) drainOwn();
    });
  }
  // A worker thread that cannot open the build (it was rewritten since this run opened it) sends the
  // rest of the run to this thread, which opened it first.
  let workersRefused = false;
  async function runItem({ item }) {
    if (!ownBusy || workersRefused) {
      return runOwn(item);
    }
    try {
      return await workers.run({ item, repeat });
    } catch (error) {
      if (error.refused !== true) {
        throw error;
      }
      if (!workersRefused) {
        workersRefused = true;
        context.logger.warn(
          `A worker thread could not open the build, so the rest of the run goes one journey at a time: ${error.message}`
        );
      }
      return runOwn(item);
    }
  }
  const seen = new Set();
  let pooled;
  try {
    pooled = await runJourneyPool({
      entries: selected,
      readLimit: concurrency.readLimit,
      run: async ({ item, usage }) => {
        const remembered = rememberedBrowserOnly({
          item,
          records,
          configDirectory: context.directories.config,
          configHash: app.buildId,
        });
        if (!type.isUndefined(remembered)) {
          return { ...remembered, usage };
        }
        return { ...(await runItem({ item })), usage };
      },
      onReported: ({ result }) => {
        if (!type.isUndefined(result.browserOnly)) {
          context.logger.info(formatBrowserOnly({ result }));
          return;
        }
        const lines = headlessSuite.format({ result, seen });
        if (result.passed) {
          lines.forEach((line) => context.logger.info(line));
        } else {
          lines.forEach((line) => context.logger.error(line));
        }
      },
    });
  } finally {
    await workers.close();
  }
  const isBrowserOnly = (result) => !type.isUndefined(result.browserOnly);
  const results = pooled.filter((result) => !isBrowserOnly(result));
  const browserOnly = pooled.filter(isBrowserOnly);
  const inProcess = pooled.filter(
    (result, index) => isBrowserOnly(result) && runsOnlyInProcess({ item: selected[index].item })
  );
  writeHeadlessRun({
    directories: context.directories,
    results,
    browserOnly,
    mode: 'build',
    configHashes: [app.buildId],
  });
  const summary = summariseResults({ results, skipped, browserOnly: browserOnly.length });
  if (summary.failed > 0) {
    context.logger.error(summary.text);
  } else {
    context.logger.info(summary.text);
  }
  const note = formatBrowserOnlyNote({
    browserOnly,
    inProcess,
    base: process.cwd(),
    configDirectory: context.directories.config,
  });
  if (!type.isUndefined(note)) {
    context.logger.info(note);
  }
  return { failed: summary.failed };
}

export default runHeadlessTests;
