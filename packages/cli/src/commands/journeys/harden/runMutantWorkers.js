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

// Runs (mutant, journey) pairs on `workers` concurrent journey runs. Each
// worker takes the next pair whose journey is not running elsewhere, so a
// journey never runs beside itself; a journey that reads mail runs alone, with
// no other pair in flight, since the mail sink cannot tell two journeys'
// emails to the same address apart. When a run reports a build change,
// nothing new starts: the runs in flight finish, and the pairs not yet
// verdicted come back as `pending` for the carry-over to requeue.
async function runMutantWorkers({ pairs, workers, runPair, onVerdict = () => {} }) {
  const queue = [...pairs];
  const inFlight = new Map();
  const runningJourneys = new Set();
  const verdicts = [];
  const pending = [];
  let exclusive = false;
  let buildChanged = false;

  function canStart(pair) {
    if (exclusive || runningJourneys.has(pair.baseline.key)) {
      return false;
    }
    return !pair.baseline.readsMail || inFlight.size === 0;
  }

  function start(pair) {
    runningJourneys.add(pair.baseline.key);
    if (pair.baseline.readsMail) {
      exclusive = true;
    }
    const promise = runPair(pair).then((outcome) => ({ pair, outcome }));
    inFlight.set(promise, pair);
  }

  function fill() {
    while (!buildChanged && inFlight.size < workers) {
      const index = queue.findIndex(canStart);
      if (index === -1) {
        return;
      }
      const [pair] = queue.splice(index, 1);
      start(pair);
    }
  }

  fill();
  while (inFlight.size > 0) {
    const settled = await Promise.race(inFlight.keys());
    const { pair, outcome } = settled;
    for (const [promise, candidate] of inFlight) {
      if (candidate === pair) {
        inFlight.delete(promise);
        break;
      }
    }
    runningJourneys.delete(pair.baseline.key);
    if (pair.baseline.readsMail) {
      exclusive = false;
    }
    if (outcome.buildChanged) {
      buildChanged = true;
      pending.push(pair);
    } else {
      const verdict = { mutantId: pair.mutant.id, journey: pair.baseline.key, ...outcome };
      verdicts.push(verdict);
      onVerdict(verdict);
    }
    fill();
  }
  return { verdicts, pending: [...pending, ...queue], buildChanged };
}

export default runMutantWorkers;
