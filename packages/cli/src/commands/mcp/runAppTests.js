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
import { createTraceId } from '@lowdefy/helpers';

import getDirectories from '../../utils/getDirectories.js';
import parseRepeat from '../test/parseRepeat.js';
import resolveJourneyPaths from '../test/resolveJourneyPaths.js';
import runRepeated from '../test/runRepeated.js';
import selectTests from '../test/selectTests.js';
import summariseResults from '../test/summariseResults.js';
import writeExercised from '../test/writeExercised.js';
import writeTestRun from '../test/writeTestRun.js';
import fetchBuildId from '../test/fetchBuildId.js';

function noTestsSummary({ filter, paths }) {
  if (filter) {
    return `No tests matched filter "${filter}".`;
  }
  if (paths) {
    return `No journeys found in ${paths.join(', ')}.`;
  }
  return 'No tests found. Add journeys to tests/journeys/*.yaml.';
}

// Runs the app's tests (tests/journeys/*.yaml, or the journey files `paths`
// names relative to the app directory) against its running dev server - the
// same selection, replay and runner as `lowdefy test` - and returns the
// results as data: a failing journey is an answer, not a tool error. Always
// the default directory: journeys an app keeps elsewhere (--journeys-directory)
// may need a server set up for them, which the running dev server is not.
async function runAppTests({ configDirectory, url, filter, paths, repeat: repeatValue }) {
  const context = { directories: getDirectories({ configDirectory, options: {} }) };
  const { repeat, error: repeatError } = parseRepeat(repeatValue);
  if (repeatError) {
    return { summary: repeatError, results: [] };
  }
  let files;
  if (Array.isArray(paths) && paths.length > 0) {
    const resolved = resolveJourneyPaths({ paths, base: configDirectory, configDirectory });
    if (resolved.error) {
      return { summary: resolved.error, results: [] };
    }
    files = resolved.files;
  }
  const selected = selectTests({ context, filter, paths: files });
  if (selected.length === 0) {
    return { summary: noTestsSummary({ filter, paths: files && paths }), results: [] };
  }
  // One run id per tool call; only a full-suite run records (see runRepeated).
  const recording = { run: createTraceId(), paths: files, filter };
  const runs = [];
  for (const { suite, item } of selected) {
    const result = await runRepeated({ suite, context, item, url, repeat, recording });
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
    summary: summariseResults({ results }).text,
    results: runs.map(({ suite, result }) => {
      const { journey, newestPassed, recorded, ...rest } = result;
      return {
        ...rest,
        filePath: path.relative(configDirectory, result.filePath),
        report: suite.format({ result, seen }).join('\n'),
      };
    }),
  };
}

export default runAppTests;
