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
import YAML from 'yaml';

import createBuildHost from '../../src/createBuildHost.js';
import runHeadlessJourney from '../../src/runHeadlessJourney.js';
import journeyFixture, { repositoryRoot } from './journeyFixture.mjs';

// The journeys the config tests page shows for calls, requests and the database are real: each
// runs headless on the journey-fixture build, on its data set and user, and passes.

const pagePath = path.join(repositoryRoot, 'packages', 'docs', 'testing', 'config-tests.md');

function readSection({ heading }) {
  const page = fs.readFileSync(pagePath, 'utf8');
  const start = page.indexOf(`\n${heading}\n`);
  const end = page.indexOf('\n#', start + heading.length + 2);
  return page.slice(start, end);
}

function readYamlSamples(section) {
  return [...section.matchAll(/```yaml\n([\s\S]*?)```/g)].map((match) => YAML.parse(match[1]));
}

const samples = readYamlSamples(readSection({ heading: '### Calls, requests and the database' }));

test('the calls, requests and database section shows two journeys', () => {
  expect(samples.map((sample) => sample.name)).toEqual([
    'a member is refused the auditor endpoint',
    'a member saves an item with the name they typed',
  ]);
});

test.each(samples.map((sample) => [sample.name, sample]))(
  'the docs sample "%s" passes headless on the fixture build',
  async (name, journey) => {
    const host = await createBuildHost({
      ...journeyFixture,
      data: journey.data,
      user: journey.user,
    });
    try {
      const result = await runHeadlessJourney({ host, journey });
      expect(result.failure).toBeUndefined();
      expect(result.passed).toBe(true);
    } finally {
      await host.close();
    }
  }
);
