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

import buildMutationReport from './buildMutationReport.js';
import scoreMutants from './scoreMutants.js';

test('buildMutationReport writes the suite score, each mutant with who ran it, and each journey', () => {
  const baselines = [{ key: 'tests/journeys/a.yaml#a', file: 'tests/journeys/a.yaml', name: 'a' }];
  const mutant = {
    id: 'abc123def456',
    operator: 'drop-block',
    artifact: 'pages/home.json',
    key: 'k1',
    arg: null,
    anchor: { type: 'block', pageId: 'home', blockId: 'alert' },
    source: 'pages/home.yaml:12',
    config: 'root.pages[0:home].blocks[1:alert:Alert]',
    describe: 'drop-block Alert "alert" from home',
    copies: [],
  };
  const score = scoreMutants({
    mutants: [mutant],
    verdicts: [{ mutantId: mutant.id, journey: 'tests/journeys/a.yaml#a', verdict: 'survived' }],
    baselines,
  });
  const report = buildMutationReport({
    score,
    baselines,
    buildId: 'build-1',
    rebuilds: 1,
    sampled: { max: 200, of: 1, seed: 0 },
    operators: ['drop-block'],
    now: new Date('2026-10-03T10:00:00.000Z'),
  });
  expect(report).toEqual({
    version: 1,
    generated: '2026-10-03T10:00:00.000Z',
    buildId: 'build-1',
    rebuilds: 1,
    killed: 0,
    total: 1,
    sampled: { max: 200, of: 1, seed: 0 },
    operators: ['drop-block'],
    mutants: [
      {
        id: 'abc123def456',
        operator: 'drop-block',
        artifact: 'pages/home.json',
        source: 'pages/home.yaml:12',
        config: 'root.pages[0:home].blocks[1:alert:Alert]',
        describe: 'drop-block Alert "alert" from home',
        copies: [],
        status: 'survived',
        ranBy: [
          {
            file: 'tests/journeys/a.yaml',
            name: 'a',
            verdict: 'survived',
            failure: null,
            misses: [],
          },
        ],
      },
    ],
    journeys: [{ file: 'tests/journeys/a.yaml', name: 'a', killed: 0, total: 1, unique: 0 }],
  });
});
