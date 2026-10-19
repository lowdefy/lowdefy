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

import { parseDataSet } from '@lowdefy/node-utils';

import { fixtureTest, postJourney } from './fixtureClient.mjs';

// A journey on a data set with a `generate` block, over the fixture app's
// generated page: the session database holds the fixture and the generated
// invoices, and the counts the page reads are the ones the generator makes
// from the committed seed.

const configDirectory = process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY;

async function expectedCounts() {
  const dataSet = await parseDataSet({ configDirectory, name: 'generated' });
  const counts = {};
  [...dataSet.fixtures.fixture_db, ...dataSet.generated.fixture_db].forEach(({ status }) => {
    counts[status] = (counts[status] ?? 0) + 1;
  });
  return Object.keys(counts)
    .sort()
    .map((status) => ({ _id: status, count: counts[status] }));
}

fixtureTest(
  'a journey on a generated data set reads the fixture and every generated row',
  async () => {
    const counts = await expectedCounts();
    expect(counts.reduce((total, { count }) => total + count, 0)).toBe(41);
    const result = await postJourney({
      pageId: 'generated',
      data: 'generated',
      user: 'member',
      steps: [
        { wait: { request: 'count_invoices' } },
        { expect: { state: { path: 'fixture_customer', equals: 'Fixture customer' } } },
        { expect: { state: { path: 'counts', equals: counts } } },
      ],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
    expect(result.data).toEqual({ name: 'generated', loadMs: expect.any(Number), documents: 41 });
    expect(result.warnings).toEqual([]);
  }
);
