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

import sampleMutants from './sampleMutants.js';

const mutants = Array.from({ length: 30 }, (_, index) => ({ id: `mutant${index}` }));

function ids(sample) {
  return sample.map(({ id }) => id);
}

test('sampleMutants keeps every mutant under the cap, and every mutant with max 0', () => {
  expect(sampleMutants({ mutants, max: 30, seed: 0 })).toBe(mutants);
  expect(sampleMutants({ mutants, max: 0, seed: 0 })).toBe(mutants);
});

test('sampleMutants draws the same sample for one seed and another for another seed', () => {
  const first = ids(sampleMutants({ mutants, max: 10, seed: 0 }));
  expect(first).toHaveLength(10);
  expect(ids(sampleMutants({ mutants: [...mutants].reverse(), max: 10, seed: 0 }))).toEqual(first);
  expect(ids(sampleMutants({ mutants, max: 10, seed: 1 }))).not.toEqual(first);
});
