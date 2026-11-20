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

import formatBrowserOnly from './formatBrowserOnly.js';
import formatJourneyResult from './formatJourneyResult.js';
import runJourneyHeadless from './runJourneyHeadless.js';
import runJourneyPool from './runJourneyPool.js';
import runRepeated from './runRepeated.js';
import summariseResults from './summariseResults.js';
import writeHeadlessRun from './writeHeadlessRun.js';

// `lowdefy test --headless --build`: runs the selected journeys that need no browser on the app's
// production build, in this process, with no dev server and no browser, so it takes no browser
// or journey run slot. `app` is the run's one test app (openBuildApp), which checked the build
// and served the access step; every journey, and every repeat of one, runs on it, each on a
// fresh session of its data set, and the caller closes it. Journeys that need a browser are
// listed as browser-only, with the first step that does, and are neither passed nor failed.
// Returns { failed } once the run is reported.
async function runHeadlessTests({ app, context, selected, skipped, repeat }) {
  const headlessSuite = {
    name: 'journeys',
    run: ({ item }) => runJourneyHeadless({ app, context, item }),
    format: formatJourneyResult,
  };
  const seen = new Set();
  // One at a time: concurrent sessions on one test app are untested.
  const pooled = await runJourneyPool({
    entries: selected,
    readLimit: () => 1,
    run: async ({ item, usage }) => ({
      ...(await runRepeated({ suite: headlessSuite, context, item, repeat })),
      usage,
    }),
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
  const results = pooled.filter((result) => type.isUndefined(result.browserOnly));
  const browserOnly = pooled.filter((result) => !type.isUndefined(result.browserOnly));
  writeHeadlessRun({ directories: context.directories, results, browserOnly, mode: 'build' });
  const summary = summariseResults({ results, skipped, browserOnly: browserOnly.length });
  if (summary.failed > 0) {
    context.logger.error(summary.text);
  } else {
    context.logger.info(summary.text);
  }
  return { failed: summary.failed };
}

export default runHeadlessTests;
