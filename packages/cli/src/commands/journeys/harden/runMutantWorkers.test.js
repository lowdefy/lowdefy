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

import runMutantWorkers from './runMutantWorkers.js';

function baseline(key, readsMail = false) {
  return { key, readsMail };
}

function pairsFor({ journeys, mutants }) {
  return mutants.flatMap((id) =>
    journeys.map((journey) => ({ mutant: { id }, baseline: journey }))
  );
}

// A runPair that records what ran at once and resolves on the next tick.
function createRunner({ outcome = () => ({ verdict: 'killed' }) } = {}) {
  const running = new Set();
  const overlaps = [];
  let maxInFlight = 0;
  async function runPair(pair) {
    if ([...running].some((other) => other.baseline.key === pair.baseline.key)) {
      overlaps.push(`${pair.baseline.key} beside itself`);
    }
    if (pair.baseline.readsMail && running.size > 0) {
      overlaps.push(`${pair.baseline.key} started beside others`);
    }
    if ([...running].some((other) => other.baseline.readsMail)) {
      overlaps.push(`${pair.baseline.key} started beside a mail journey`);
    }
    running.add(pair);
    maxInFlight = Math.max(maxInFlight, running.size);
    await new Promise((resolve) => setTimeout(resolve, 5));
    running.delete(pair);
    return outcome(pair);
  }
  return { runPair, overlaps, maxInFlight: () => maxInFlight };
}

test('runMutantWorkers never runs a journey beside itself and fills the workers', async () => {
  const journeys = [baseline('a'), baseline('b'), baseline('c')];
  const runner = createRunner();
  const { verdicts, pending, buildChanged } = await runMutantWorkers({
    pairs: pairsFor({ journeys, mutants: ['m1', 'm2', 'm3', 'm4'] }),
    workers: 4,
    runPair: runner.runPair,
  });
  expect(runner.overlaps).toEqual([]);
  expect(runner.maxInFlight()).toBe(3);
  expect(verdicts).toHaveLength(12);
  expect(verdicts[0]).toEqual({
    mutantId: expect.any(String),
    journey: expect.any(String),
    verdict: 'killed',
  });
  expect(pending).toEqual([]);
  expect(buildChanged).toBe(false);
});

test('runMutantWorkers runs a journey that reads mail with no other pair in flight', async () => {
  const journeys = [baseline('a'), baseline('mail', true), baseline('b')];
  const runner = createRunner();
  const { verdicts } = await runMutantWorkers({
    pairs: pairsFor({ journeys, mutants: ['m1', 'm2', 'm3'] }),
    workers: 4,
    runPair: runner.runPair,
  });
  expect(runner.overlaps).toEqual([]);
  expect(verdicts).toHaveLength(9);
});

test('runMutantWorkers stops starting pairs after a build change and returns the rest as pending', async () => {
  const journeys = [baseline('a'), baseline('b')];
  const runner = createRunner({
    outcome: (pair) =>
      pair.mutant.id === 'm1' && pair.baseline.key === 'a'
        ? { buildChanged: true }
        : { verdict: 'survived' },
  });
  const pairs = pairsFor({ journeys, mutants: ['m1', 'm2', 'm3'] });
  const { verdicts, pending, buildChanged } = await runMutantWorkers({
    pairs,
    workers: 2,
    runPair: runner.runPair,
  });
  expect(buildChanged).toBe(true);
  // m1 on a and b ran together; a's verdict is discarded, b's is kept.
  expect(verdicts).toEqual([{ mutantId: 'm1', journey: 'b', verdict: 'survived' }]);
  expect(pending).toHaveLength(5);
  expect(pending[0]).toBe(pairs[0]);
});
