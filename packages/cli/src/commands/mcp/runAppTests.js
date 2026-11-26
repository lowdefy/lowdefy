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

import { createTraceId, type } from '@lowdefy/helpers';
import { relativePosixPath } from '@lowdefy/node-utils';

import compactTestResults from './compactTestResults.js';
import getDirectories from '../../utils/getDirectories.js';
import formatBrowserOnly from '../test/formatBrowserOnly.js';
import formatNoTestsMatched from '../test/formatNoTestsMatched.js';
import formatSkippedJourney from '../test/formatSkippedJourney.js';
import parseRepeat from '../test/parseRepeat.js';
import parseTestSelection from '../test/parseTestSelection.js';
import parseTier from '../journeys/usage/parseTier.js';
import parseUsageWindow from '../journeys/usage/parseUsageWindow.js';
import readJourneyConcurrency from '../test/readJourneyConcurrency.js';
import resolveJourneyPaths from '../test/resolveJourneyPaths.js';
import readTestMode from '../test/readTestMode.js';
import runDevJourneys from '../test/runDevJourneys.js';
import selectTests from '../test/selectTests.js';
import selectTier from '../test/selectTier.js';
import summariseResults from '../test/summariseResults.js';
import writeExercised from '../test/writeExercised.js';
import writeTestResults from '../test/writeTestResults.js';
import writeTestRun from '../test/writeTestRun.js';
import fetchBuildId from '../test/fetchBuildId.js';
import formatBrowserOnlyNote from '../test/formatBrowserOnlyNote.js';
import devBuildHash from '../test/devBuildHash.js';
import hashBuild from '../test/hashBuild.js';
import hashConfigSources from '../test/hashConfigSources.js';
import readHeadlessRun from '../test/readHeadlessRun.js';
import writeHeadlessRun from '../test/writeHeadlessRun.js';

// Runs the app's tests (every journey under tests/journeys outside "_"
// folders, or the journey files and globs `paths` names relative to the app
// directory, narrowed by `filter` and `tags`, then to a popularity `tier` of
// that selection over `usageWindow`) against its running dev server - the
// same selection, replay and runner as `lowdefy test` - and returns the
// results as data: a failing journey is an answer, not a tool error, and a
// skipped `deprecated: true` journey is a line under skipped. Always the
// default directory: journeys an app keeps elsewhere (--journeys-directory)
// may need a server set up for them, which the running dev server is not.
// By default only the journeys that need no browser run, headless (runDevJourneys); the rest are
// lines under browserOnly, neither passed nor failed, with the step that needs a browser, and the
// summary names the call that runs them there. One an earlier run found needs a browser, on the
// same journey and build, is listed without running it again. `thorough` runs each journey
// headless when it can and in the browser when it can't, and also runs in the browser, from step
// 1, each one found to need a browser partway through; `browser` runs every journey in the
// browser; `headless` is the default (readTestMode). `concurrency` keeps up to that many browser
// journeys in flight (readJourneyConcurrency); a headless run goes one at a time and refuses it.
//
// The answer is cut to what an agent can read (compactTestResults); every
// journey's result is in the file `resultFile` names. A journey's measured
// path (`exercised`) is in neither: it runs to thousands of entries a journey,
// and writeExercised keeps it in .lowdefy/test/exercised.json for the tools
// that read it. `onProgress` is called as each journey finishes, in the order they finish.
async function runAppTests({
  configDirectory,
  url,
  filter,
  tags,
  paths,
  repeat: repeatValue,
  tier: tierValue,
  usageWindow: usageWindowValue,
  headless = false,
  browser = false,
  thorough = false,
  concurrency,
  onProgress,
}) {
  const context = { directories: getDirectories({ configDirectory, options: {} }) };
  const { repeat, error: repeatError } = parseRepeat(repeatValue);
  if (repeatError) {
    return { summary: repeatError };
  }
  const mode = readTestMode({
    options: {
      headless,
      browser,
      thorough,
      typedOptions: type.isNone(concurrency) ? [] : ['concurrency'],
    },
    flagPrefix: '',
  });
  if (!type.isUndefined(mode.error)) {
    return { summary: mode.error };
  }
  const { runner } = mode;
  // Only browser runs go side by side; headless runs go one at a time.
  const { readLimit, error: concurrencyError } =
    runner === 'headless'
      ? { readLimit: () => 1 }
      : readJourneyConcurrency({ concurrency, name: 'concurrency', repeat });
  if (concurrencyError) {
    return { summary: concurrencyError };
  }
  const tier = parseTier(tierValue);
  const usageWindow = `${parseUsageWindow(usageWindowValue)}m`;
  const selection = parseTestSelection({ filter, tags });
  if (selection.error) {
    return { summary: selection.error };
  }
  let files;
  if (Array.isArray(paths) && paths.length > 0) {
    const resolved = resolveJourneyPaths({ paths, base: configDirectory, configDirectory });
    if (resolved.error) {
      return { summary: resolved.error };
    }
    files = resolved.files;
  }
  const selected = selectTests({
    context,
    filter: selection.filters,
    tags: selection.tags,
    paths: files,
  });
  if (selected.length === 0) {
    const noMatch = formatNoTestsMatched({
      paths: files === undefined ? [] : paths,
      filters: selection.filters,
      tags: selection.tags,
      flagPrefix: '',
    });
    return { summary: noMatch ?? 'No tests found. Add journeys to tests/journeys/.' };
  }
  const tiered = await selectTier({
    context,
    selected,
    tier,
    usageWindow,
    fullTierOption: 'tier "full"',
  });
  if (!type.isUndefined(tiered.refused)) {
    return { summary: tiered.refused };
  }
  // One run id per tool call; only a full-suite run records (see runRepeated).
  // Only the browser part of a run records traces.
  const recording =
    runner === 'headless'
      ? undefined
      : {
          run: createTraceId(),
          paths: files,
          filter: selection.filters,
          tags: selection.tags,
          tier,
        };
  // The build as the server serves it before any journey opens a page, and the config source as
  // the run starts, which headless-run.json's records are taken against (devBuildHash).
  const sourceHash = hashConfigSources({ configDirectory });
  const configHash = devBuildHash({ buildHash: hashBuild({ context }), sourceHash });
  const ran = await runDevJourneys({
    context,
    entries: tiered.selected,
    url,
    runner,
    readLimit,
    records: runner === 'browser' ? {} : readHeadlessRun({ directories: context.directories }),
    repeat,
    recording,
    configHash,
    onFinished: async ({ result, done, total }) => {
      if (!type.isNone(onProgress)) {
        await onProgress({
          done,
          total,
          name: result.name,
          class: type.isUndefined(result.browserOnly) ? result.class : 'BROWSER-ONLY',
        });
      }
    },
  });
  const { results, browserOnly } = ran;
  writeExercised({
    directories: context.directories,
    results,
    buildId: await fetchBuildId({ url }),
  });
  writeTestRun({ directories: context.directories, results });
  if (ran.headless.results.length + ran.headless.browserOnly.length + ran.remembered.length > 0) {
    writeHeadlessRun({
      directories: context.directories,
      results: ran.headless.results,
      browserOnly: ran.headless.browserOnly,
      remembered: ran.remembered,
      mode: 'dev',
      configHashes: [configHash, devBuildHash({ buildHash: hashBuild({ context }), sourceHash })],
    });
  }
  const seen = new Set();
  const journeyResults = ran.verdicts.map(({ suite, result }) => {
    const { journey, newestPassed, recorded, exercised, ...rest } = result;
    return {
      ...rest,
      filePath: relativePosixPath({ from: configDirectory, to: result.filePath }),
      report: suite.format({ result, seen }).join('\n'),
    };
  });
  const skipped = tiered.skipped.map((skippedJourney) => ({
    name: skippedJourney.name,
    filePath: relativePosixPath({ from: configDirectory, to: skippedJourney.filePath }),
    skipped: 'deprecated',
    report: formatSkippedJourney({ skipped: skippedJourney }),
  }));
  const browserOnlyResults = browserOnly.map((result) => ({
    name: result.name,
    filePath: relativePosixPath({ from: configDirectory, to: result.filePath }),
    browserOnly: result.browserOnly,
    ...(result.remembered === true ? { remembered: true } : {}),
    report: formatBrowserOnly({ result }),
  }));
  const summary = [
    summariseResults({
      results,
      skipped: tiered.skipped.length,
      browserOnly: browserOnly.length,
    }).text,
    formatBrowserOnlyNote({
      browserOnly,
      inProcess: ran.inProcess,
      base: configDirectory,
      tool: true,
    }),
  ]
    .filter((line) => !type.isUndefined(line))
    .join('\n');
  const resultFile = writeTestResults({
    directories: context.directories,
    summary,
    results: journeyResults,
    browserOnly: browserOnlyResults,
    skipped,
  });
  // A thrown run's stack stays in results.json; in the answer, the first report that holds it
  // prints it once, and a stack on every entry would spend the detail budget on one bug.
  const answerResults = journeyResults.map(({ stack, ...result }) => result);
  return {
    summary,
    ...compactTestResults({ results: answerResults, browserOnly: browserOnlyResults, skipped }),
    resultFile,
  };
}

export default runAppTests;
