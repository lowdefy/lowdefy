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

import scoreMutants from './scoreMutants.js';

const baselines = [
  { key: 'a.yaml#a', file: 'a.yaml', name: 'a' },
  { key: 'b.yaml#b', file: 'b.yaml', name: 'b' },
];

test('scoreMutants scores mutants and journeys, with unique kills and unapplied runs left out of total', () => {
  const mutants = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].map((id) => ({ id }));
  const verdicts = [
    { mutantId: 'm1', journey: 'a.yaml#a', verdict: 'killed' },
    { mutantId: 'm1', journey: 'b.yaml#b', verdict: 'killed' },
    { mutantId: 'm2', journey: 'a.yaml#a', verdict: 'killed' },
    { mutantId: 'm2', journey: 'b.yaml#b', verdict: 'survived' },
    { mutantId: 'm3', journey: 'a.yaml#a', verdict: 'survived' },
    {
      mutantId: 'm4',
      journey: 'b.yaml#b',
      verdict: 'unapplied',
      misses: [{ reason: 'key not found' }],
    },
    { mutantId: 'm5', journey: 'a.yaml#a', verdict: 'error' },
    { mutantId: 'm5', journey: 'b.yaml#b', verdict: 'survived' },
  ];
  const score = scoreMutants({ mutants, verdicts, baselines, changed: ['m6'] });
  expect(score.mutants.map(({ id, status }) => [id, status])).toEqual([
    ['m1', 'killed'],
    ['m2', 'killed'],
    ['m3', 'survived'],
    ['m4', 'unapplied'],
    ['m5', 'errored'],
    ['m6', 'changed'],
  ]);
  expect(score.journeys).toEqual([
    { key: 'a.yaml#a', file: 'a.yaml', name: 'a', killed: 2, total: 3, unique: 1 },
    { key: 'b.yaml#b', file: 'b.yaml', name: 'b', killed: 1, total: 3, unique: 0 },
  ]);
  expect(score.killed).toBe(2);
  expect(score.total).toBe(3);
});

test('scoreMutants marks a mutant the run never reached as not run', () => {
  const score = scoreMutants({ mutants: [{ id: 'm1' }], verdicts: [], baselines });
  expect(score.mutants[0].status).toBe('not run');
});
