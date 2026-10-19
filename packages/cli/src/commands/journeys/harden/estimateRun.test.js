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

import estimateRun from './estimateRun.js';

test('estimateRun spreads pairs over the workers, bounded by the busiest journey, plus mail journeys alone', () => {
  const baselines = [
    { key: 'a', durationMs: 1000, readsMail: false },
    { key: 'b', durationMs: 1000, readsMail: false },
    { key: 'mail', durationMs: 3000, readsMail: true },
  ];
  // a has 4 pairs (4s back to back), b has 1: Σ 5s over 4 workers is 1.25s,
  // but a alone takes 4s; the mail pair adds 3s.
  const mutants = [
    { journeys: ['a', 'b'] },
    { journeys: ['a'] },
    { journeys: ['a'] },
    { journeys: ['a', 'mail'] },
  ];
  expect(estimateRun({ mutants, baselines, workers: 4 })).toEqual({ pairs: 6, durationMs: 7000 });
  expect(estimateRun({ mutants: [{ journeys: ['a', 'b'] }], baselines, workers: 1 })).toEqual({
    pairs: 2,
    durationMs: 2000,
  });
});
