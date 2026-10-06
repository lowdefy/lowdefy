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
import { createTraceId, type } from '@lowdefy/helpers';

import getDirectories from '../../utils/getDirectories.js';
import formatNoTestsMatched from '../test/formatNoTestsMatched.js';
import formatSkippedJourney from '../test/formatSkippedJourney.js';
import parseRepeat from '../test/parseRepeat.js';
import parseTestSelection from '../test/parseTestSelection.js';
import parseTier from '../journeys/usage/parseTier.js';
import parseUsageWindow from '../journeys/usage/parseUsageWindow.js';
import resolveJourneyPaths from '../test/resolveJourneyPaths.js';
import runRepeated from '../test/runRepeated.js';
import selectTests from '../test/selectTests.js';
import selectTier from '../test/selectTier.js';
import summariseResults from '../test/summariseResults.js';
import writeExercised from '../test/writeExercised.js';
import writeTestRun from '../test/writeTestRun.js';
import fetchBuildId from '../test/fetchBuildId.js';

// Runs the app's tests (every journey under tests/journeys outside "_"
// folders, or the journey files and globs `paths` names relative to the app
// directory, narrowed by `filter` and `tags`, then to a popularity `tier` of
// that selection over `usageWindow`) against its running dev server - the
// same selection, replay and runner as `lowdefy test` - and returns the
// results as data: a failing journey is an answer, not a tool error, and a
// skipped `deprecated: true` journey is a result marked skipped. Always the
// default directory: journeys an app keeps elsewhere (--journeys-directory)
// may need a server set up for them, which the running dev server is not.
async function runAppTests({
  configDirectory,
  url,
  filter,
  tags,
  paths,
  repeat: repeatValue,
  tier: tierValue,
  usageWindow: usageWindowValue,
}) {
  const context = { directories: getDirectories({ configDirectory, options: {} }) };
  const { repeat, error: repeatError } = parseRepeat(repeatValue);
  if (repeatError) {
    return { summary: repeatError, results: [] };
  }
  const tier = parseTier(tierValue);
  const usageWindow = `${parseUsageWindow(usageWindowValue)}m`;
  const selection = parseTestSelection({ filter, tags });
  if (selection.error) {
    return { summary: selection.error, results: [] };
  }
  let files;
  if (Array.isArray(paths) && paths.length > 0) {
    const resolved = resolveJourneyPaths({ paths, base: configDirectory, configDirectory });
    if (resolved.error) {
      return { summary: resolved.error, results: [] };
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
    return {
      summary: noMatch ?? 'No tests found. Add journeys to tests/journeys/.',
      results: [],
    };
  }
  const tiered = await selectTier({
    context,
    selected,
    tier,
    usageWindow,
    fullTierOption: 'tier "full"',
  });
  if (!type.isUndefined(tiered.refused)) {
    return { summary: tiered.refused, results: [] };
  }
  // One run id per tool call; only a full-suite run records (see runRepeated).
  const recording = {
    run: createTraceId(),
    paths: files,
    filter: selection.filters,
    tags: selection.tags,
    tier,
  };
  const runs = [];
  for (const { suite, item, usage } of tiered.selected) {
    const result = {
      ...(await runRepeated({ suite, context, item, url, repeat, recording })),
      usage,
    };
    runs.push({ suite, result });
  }
  const results = runs.map(({ result }) => result);
  writeExercised({
    directories: context.directories,
    results,
    buildId: await fetchBuildId({ url }),
  });
  writeTestRun({ directories: context.directories, results });
  const seen = new Set();
  return {
    summary: summariseResults({ results, skipped: tiered.skipped.length }).text,
    results: [
      ...runs.map(({ suite, result }) => {
        const { journey, newestPassed, recorded, ...rest } = result;
        return {
          ...rest,
          filePath: path.relative(configDirectory, result.filePath),
          report: suite.format({ result, seen }).join('\n'),
        };
      }),
      ...tiered.skipped.map((skipped) => ({
        name: skipped.name,
        filePath: path.relative(configDirectory, skipped.filePath),
        skipped: 'deprecated',
        report: formatSkippedJourney({ skipped }),
      })),
    ],
  };
}

export default runAppTests;
