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

import { afterAll, beforeAll, expect, test } from 'vitest';
import YAML from 'yaml';

import { validateJourneySteps } from '@lowdefy/node-utils';
import { openTestApp } from '@lowdefy/test-utils';

import createBuildHost from '../../src/createBuildHost.js';
import runHeadlessJourney from '../../src/runHeadlessJourney.js';
import journeyFixture, { repositoryRoot } from './journeyFixture.mjs';

// The YAML samples of the config tests page's "Page-less journeys" section are real. The page
// keeps to these rules:
// - A sample whose first line is a comment naming a file (`# tests/...yaml`) matches that file of
//   apps/journey-fixture, comments and blank lines aside. The fixture keeps its headless journeys
//   in tests/journeys/_headless, so the browser suites leave them out; a sample naming
//   tests/journeys/<file> matches tests/journeys/_headless/<file>. These are the samples that need
//   `lowdefy test` to read them (`cases`, `_ref`), which the CLI's fixture suite runs.
// - Any other sample that is a journey runs headless on the journey-fixture build, on its data
//   set, user and stubs, and passes.
// - A sample that is a list of steps passes the step grammar.

const pagePath = path.join(repositoryRoot, 'packages', 'docs', 'testing', 'config-tests.md');
const heading = '## Page-less journeys';

function readSection() {
  const page = fs.readFileSync(pagePath, 'utf8');
  const start = page.indexOf(`\n${heading}\n`);
  const end = page.indexOf('\n## ', start + heading.length + 2);
  return page.slice(start, end);
}

function readYamlSamples(section) {
  return [...section.matchAll(/```yaml\n([\s\S]*?)```/g)].map((match) => match[1]);
}

// Config lines, without comments and blank lines.
function readLines(text) {
  return text.split('\n').filter((line) => line.trim() !== '' && !line.trim().startsWith('#'));
}

function readFixturePath(filePath) {
  const journeyFile = filePath.match(/^tests\/journeys\/([^/]+)$/);
  if (journeyFile) {
    return path.join('tests', 'journeys', '_headless', journeyFile[1]);
  }
  return filePath;
}

const samples = readYamlSamples(readSection());
const fileSamples = samples
  .map((code) => ({ code, filePath: code.match(/^# (tests\/\S+\.ya?ml)\n/)?.[1] }))
  .filter(({ filePath }) => filePath !== undefined);
const inlineSamples = samples
  .filter((code) => !/^# tests\//.test(code))
  .map((code) => YAML.parse(code));
const journeys = inlineSamples.filter((sample) => !Array.isArray(sample));
const stepLists = inlineSamples.filter((sample) => Array.isArray(sample));

let app;

beforeAll(async () => {
  app = await openTestApp(journeyFixture);
});

afterAll(async () => {
  await app?.close();
});

test('the page-less journeys section shows its journeys, case table files and step lists', () => {
  expect(journeys.map((journey) => journey.name)).toEqual([
    'a member is refused the auditor endpoint',
    'a member saves an item with the name they typed',
    "a run is priced at the rate service's rate, after a failed write stores nothing",
    'two approvals race and only one claims the run',
    'only a system call closes the runs',
    'a call bound to an organization runs as its stand-in caller',
    'a signed webhook writes its event and a wrong signature is refused',
  ]);
  expect(fileSamples.map(({ filePath }) => filePath)).toEqual([
    'tests/journeys/cases.yaml',
    'tests/shared/activity-sources.yaml',
    'tests/shared/log-activity-steps.yaml',
  ]);
  expect(stepLists).toHaveLength(1);
});

test.each(fileSamples.map((sample) => [sample.filePath, sample]))(
  'the docs sample "%s" matches its file of apps/journey-fixture',
  (filePath, { code }) => {
    const fixtureFile = fs.readFileSync(
      path.join(journeyFixture.configDirectory, readFixturePath(filePath)),
      'utf8'
    );
    expect(readLines(code)).toEqual(readLines(fixtureFile));
  }
);

test.each(stepLists.map((steps, index) => [index, steps]))(
  'the docs step list %s passes the step grammar',
  (index, steps) => {
    expect(validateJourneySteps({ steps })).toEqual({});
  }
);

test.each(journeys.map((journey) => [journey.name, journey]))(
  'the docs sample "%s" passes headless on the fixture build',
  async (name, journey) => {
    const host = await createBuildHost({
      app,
      data: journey.data,
      stubs: journey.stubs,
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
