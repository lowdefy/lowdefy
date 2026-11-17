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
import runRepeated from './runRepeated.js';
import summariseResults from './summariseResults.js';
import writeHeadlessRun from './writeHeadlessRun.js';

// `lowdefy test --headless --build`: runs the selected journeys that need no browser on the app's
// production build, in this process, with no dev server and no browser, so it takes no browser
// or journey run slot. Each journey gets a fresh session of its data set on the run's one data
// store. Journeys that need a browser are listed as browser-only, with the first step that does,
// and are neither passed nor failed. The run's access step (runAccessStep) has checked the build
// once before this runs. `secrets` are the test values the command was given for the app's
// secrets, by name; every other secret reads its stand-in. Returns { failed } once the run is
// reported.
async function runHeadlessTests({ context, selected, skipped, repeat, secrets }) {
  const headlessSuite = {
    name: 'journeys',
    run: ({ context: runContext, item }) =>
      runJourneyHeadless({ context: runContext, item, secrets }),
    format: formatJourneyResult,
  };
  const results = [];
  const browserOnly = [];
  const seen = new Set();
  for (const { item, usage } of selected) {
    const result = {
      ...(await runRepeated({ suite: headlessSuite, context, item, repeat })),
      usage,
    };
    if (!type.isUndefined(result.browserOnly)) {
      browserOnly.push(result);
      context.logger.info(formatBrowserOnly({ result }));
      continue;
    }
    results.push(result);
    const lines = headlessSuite.format({ result, seen });
    if (result.passed) {
      lines.forEach((line) => context.logger.info(line));
    } else {
      lines.forEach((line) => context.logger.error(line));
    }
  }
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
