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

import selectTests from '../test/selectTests.js';

// Runs the app's tests (tests/journeys/*.yaml) against its running dev server
// - the same selection and runner as `lowdefy test` - and returns the
// results as data: a failing journey is an answer, not a tool error.
async function runAppTests({ configDirectory, url, filter }) {
  const context = { directories: { config: configDirectory } };
  const selected = selectTests({ context, filter });
  if (selected.length === 0) {
    return {
      summary: filter
        ? `No tests matched filter "${filter}".`
        : 'No tests found. Add journeys to tests/journeys/*.yaml.',
      results: [],
    };
  }
  const results = [];
  for (const { suite, item } of selected) {
    const result = await suite.run({ context, item, url });
    results.push({
      ...result,
      filePath: path.relative(configDirectory, result.filePath),
      report: suite.format({ result }).join('\n'),
    });
  }
  const passed = results.filter((result) => result.passed).length;
  return {
    summary: `${passed} passed, ${results.length - passed} failed of ${results.length} journeys`,
    results,
  };
}

export default runAppTests;
