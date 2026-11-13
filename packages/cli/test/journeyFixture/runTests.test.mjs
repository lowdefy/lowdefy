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

import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';

import runAppTests from '../../dist/commands/mcp/runAppTests.js';

// What lowdefy_run_tests answers for the fixture app's own suite, run in a
// real browser: the journey's measured path reaches exercised.json and stays
// out of the answer and of results.json.

const fixtureUrl = process.env.LOWDEFY_JOURNEY_FIXTURE_URL;
const configDirectory = process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY;
const fixtureTest = fixtureUrl === undefined ? test.skip : test;

fixtureTest(
  'lowdefy_run_tests answers with a summary and PASS lines and keeps the measured path on disk',
  async () => {
    const progress = [];

    const answer = await runAppTests({
      configDirectory,
      url: fixtureUrl,
      onProgress: (event) => progress.push(event),
    });

    expect(answer.summary).toMatch(/^\d+ passed, 0 failed of \d+ journeys$/);
    expect(answer.failed).toEqual([]);
    expect(answer.passed.length).toBeGreaterThan(0);
    answer.passed.forEach((line) => expect(line).toMatch(/^PASS {2}/));
    expect(progress).toHaveLength(answer.passed.length);
    expect(progress[progress.length - 1]).toMatchObject({
      done: answer.passed.length,
      total: answer.passed.length,
      class: 'PASS',
    });

    const exercised = JSON.parse(
      fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'exercised.json'), 'utf8')
    );
    const measured = Object.values(exercised.journeys);
    expect(measured.length).toBeGreaterThan(0);
    expect(measured[0].exercised.pages.length).toBeGreaterThan(0);

    const printed = JSON.stringify(answer, null, 2);
    expect(printed).not.toContain('"exercised"');
    expect(answer.resultFile).toEqual(
      path.join(configDirectory, '.lowdefy', 'test', 'results.json')
    );
    const written = fs.readFileSync(answer.resultFile, 'utf8');
    expect(written).not.toContain('"exercised"');
    expect(JSON.parse(written).results).toHaveLength(answer.passed.length);
    // The answer for one journey is a few hundred characters; its measured
    // path alone is larger than that.
    expect(printed.length).toBeLessThan(JSON.stringify(measured[0].exercised, null, 2).length);
  }
);
