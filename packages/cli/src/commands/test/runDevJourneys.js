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
import { classifyJourney } from '@lowdefy/node-utils';

import headlessDevSuite from './headlessDevSuite.js';
import routeJourney from './routeJourney.js';
import runJourneyPool from './runJourneyPool.js';
import runRepeated from './runRepeated.js';
import runsOnlyInProcess from './runsOnlyInProcess.js';

function indexesOf({ routes, route }) {
  return routes.flatMap((each, index) => (each === route ? [index] : []));
}

// Runs the selected journeys (`entries`, as selectTier gives them) on the dev server at `url`, each
// once, where routeJourney sends it (`runner`: "mixed", "browser" or "headless"): first the
// headless ones, one at a time, then the browser ones, up to readLimit() at once
// (runJourneyPool), the browser run recording into `recording` as runRepeated does. A journey the
// headless run finds needs a browser partway through is browser-only: neither passed nor failed.
// `records` is headless-run.json's journeys (readHeadlessRun) as the caller read them, the same
// read that decided whether the run takes the journey run slots (mayRunInBrowser), so a record
// another run writes meanwhile never sends a journey to a browser the run holds no slot for.
// On a `thorough` mixed run it then runs in the browser from step 1, beside the rest of the
// browser part, unless it has a step only the headless runner takes (runsOnlyInProcess). `configHash` is hashBuild of the dev server's build as the run starts, which
// routeJourney compares with headless-run.json's records. On a mixed run every result carries
// `ranIn` ("headless" or "browser"), where its reported run ran, which its line names.
// `onReported({ entry, result, inBrowserNext })` is called as runJourneyPool reports each run,
// `inBrowserNext` true for a browser-only result the browser part runs next, and
// `onFinished({ result, done, total })` once per journey, as its last run finishes.
// Returns, in selection order, `results` and `browserOnly`, the journeys that ran to a verdict and
// those left browser-only, and `verdicts`, each of `results` with its suite ({ suite, result }), to
// format it; `headless`, the same split of the runs the headless part made, and `remembered`, the
// items a headless-run.json record sent to the browser, for headless-run.json, and `inProcess`,
// how many of `browserOnly` have a step only the headless runner takes, which no run sends to the
// browser (formatBrowserOnlyNote).
async function runDevJourneys({
  context,
  entries,
  url,
  runner,
  thorough,
  readLimit,
  records,
  repeat,
  recording,
  configHash,
  onFinished,
  onReported,
}) {
  const routes = entries.map(({ item }) =>
    routeJourney({
      item,
      runner,
      records,
      configDirectory: context.directories.config,
      configHash,
    })
  );
  const final = new Array(entries.length);
  let done = 0;
  async function finish({ result }) {
    done += 1;
    if (!type.isNone(onFinished)) {
      await onFinished({ result, done, total: entries.length });
    }
  }
  function inBrowserNext({ entry, result }) {
    return (
      thorough && !type.isUndefined(result.browserOnly) && !runsOnlyInProcess({ item: entry.item })
    );
  }

  // Headless runs go one at a time: concurrent headless sessions on one dev server are untested.
  const headlessIndexes = indexesOf({ routes, route: 'headless' });
  const headlessRuns = await runJourneyPool({
    entries: headlessIndexes.map((index) => entries[index]),
    readLimit: () => 1,
    run: async ({ suite, item, usage }) => ({
      ...(await runRepeated({ suite: headlessDevSuite({ suite }), context, item, url, repeat })),
      usage,
      ...(runner === 'mixed' ? { ranIn: 'headless' } : {}),
    }),
    onFinished: async ({ entry, result }) => {
      if (!inBrowserNext({ entry, result })) {
        await finish({ result });
      }
    },
    onReported: async ({ entry, result }) => {
      if (!type.isNone(onReported)) {
        await onReported({ entry, result, inBrowserNext: inBrowserNext({ entry, result }) });
      }
    },
  });
  const browserIndexes = indexesOf({ routes, route: 'browser' });
  headlessIndexes.forEach((index, at) => {
    const result = headlessRuns[at];
    if (inBrowserNext({ entry: entries[index], result })) {
      browserIndexes.push(index);
      return;
    }
    final[index] = result;
  });
  browserIndexes.sort((first, second) => first - second);

  if (browserIndexes.length > 0) {
    const browserRuns = await runJourneyPool({
      entries: browserIndexes.map((index) => entries[index]),
      readLimit,
      // A contended failure's rerun records nothing (runJourneyPool).
      run: async ({ suite, item, usage }, { rerun }) => ({
        ...(await runRepeated({
          suite,
          context,
          item,
          url,
          repeat,
          recording: rerun ? undefined : recording,
        })),
        usage,
        ...(runner === 'mixed' ? { ranIn: 'browser' } : {}),
      }),
      onFinished: finish,
      onReported: async ({ entry, result }) => {
        if (!type.isNone(onReported)) {
          await onReported({ entry, result, inBrowserNext: false });
        }
      },
    });
    browserIndexes.forEach((index, at) => {
      final[index] = browserRuns[at];
    });
  }

  const isBrowserOnly = (result) => !type.isUndefined(result.browserOnly);
  return {
    results: final.filter((result) => !isBrowserOnly(result)),
    browserOnly: final.filter(isBrowserOnly),
    verdicts: final.flatMap((result, index) =>
      isBrowserOnly(result) ? [] : [{ suite: entries[index].suite, result }]
    ),
    headless: {
      results: headlessRuns.filter((result) => !isBrowserOnly(result)),
      browserOnly: headlessRuns.filter(isBrowserOnly),
    },
    inProcess: final.filter(
      (result, index) => isBrowserOnly(result) && runsOnlyInProcess({ item: entries[index].item })
    ).length,
    remembered:
      runner === 'mixed'
        ? indexesOf({ routes, route: 'browser' })
            .map((index) => entries[index].item)
            .filter((item) => classifyJourney({ journey: item.journey }).headless)
        : [],
  };
}

export default runDevJourneys;
