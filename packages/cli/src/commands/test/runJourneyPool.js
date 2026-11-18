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

import { type } from '@lowdefy/helpers';

// Splits the selection into the journeys that may run beside others and those that run alone,
// each as selection indexes in selection order. A journey on a data set has databases of its own
// (openDataSession), so it may overlap. One with no data set runs against whatever database the
// app points at, one marked `serial: true` depends on something outside its data session, and
// one that repeats the file and name of an item before it would share that run's error buffer
// (runErrorBuffers is keyed by the run and `file#name`): those run alone.
function splitSelection({ entries }) {
  const overlapping = [];
  const alone = [];
  const names = new Set();
  entries.forEach(({ item }, index) => {
    const journey = item.journey;
    const name = `${item.filePath}#${journey?.name ?? ''}`;
    const repeated = names.has(name);
    names.add(name);
    if (type.isNone(journey?.data) || journey.serial === true || repeated) {
      alone.push(index);
      return;
    }
    overlapping.push(index);
  });
  return { overlapping, alone };
}

// What a run function that threw stands for: that journey failed, and the rest of the run goes on.
function thrownResult({ entry, error }) {
  const { item, usage } = entry;
  const message = `The journey run failed with an error: ${error?.message ?? String(error)}`;
  return {
    name: item.journey?.name ?? item.filePath,
    filePath: item.filePath,
    journey: item.journey,
    passed: false,
    newestPassed: false,
    class: 'FAIL',
    repeat: 1,
    runs: 1,
    passedRuns: 0,
    failures: [{ run: 1, step: null, message }],
    stepCount: item.journey?.steps?.length ?? 0,
    durationMs: 0,
    message,
    usage,
  };
}

// Runs the selected test items (`entries`, as selectTier gives them) with up to readLimit() in
// flight, and returns their results in selection order, whatever order they finish in. The
// journeys that may overlap run first, then the alone ones one by one with nothing else in flight,
// each group in selection order (splitSelection). readLimit() is read each time the pool would
// start a journey beside one already in flight, so a limit that drops mid-run starts no more.
// `run(entry)` runs one item (one runRepeated call); a run that throws fails that item only.
// `onFinished({ entry, result, done, total })` is called as each item finishes, and
// `onReported({ entry, result })` in run order: once an item and every item before it in run
// order have finished, so an alone journey early in the selection never holds the rest back.
// A callback that throws starts no more journeys: the pool waits for those in flight, so none
// runs on past the caller's cleanup, and then throws the first such error.
async function runJourneyPool({ entries, readLimit, run, onFinished, onReported }) {
  const { overlapping, alone } = splitSelection({ entries });
  const runOrder = [...overlapping, ...alone];
  const results = new Array(entries.length);
  const finished = new Array(entries.length).fill(false);
  let done = 0;
  let reported = 0;
  let callbackError;
  // One report at a time, so an async onReported still sees the run order.
  let reporting = Promise.resolve();

  async function report() {
    while (reported < runOrder.length && finished[runOrder[reported]]) {
      const index = runOrder[reported];
      reported += 1;
      if (!type.isNone(onReported)) {
        await onReported({ entry: entries[index], result: results[index] });
      }
    }
  }

  async function runOne(index) {
    const entry = entries[index];
    let result;
    try {
      result = await run(entry);
    } catch (error) {
      result = thrownResult({ entry, error });
    }
    results[index] = result;
    finished[index] = true;
    done += 1;
    try {
      if (!type.isNone(onFinished)) {
        await onFinished({ entry, result, done, total: entries.length });
      }
    } catch (error) {
      callbackError ??= error;
    }
    reporting = reporting.then(report).catch((error) => {
      callbackError ??= error;
    });
    await reporting;
  }

  const inFlight = new Set();
  function start(index) {
    const running = runOne(index).finally(() => inFlight.delete(running));
    inFlight.add(running);
  }

  for (const index of overlapping) {
    while (type.isUndefined(callbackError) && inFlight.size > 0 && inFlight.size >= readLimit()) {
      await Promise.race(inFlight);
    }
    if (!type.isUndefined(callbackError)) break;
    start(index);
  }
  await Promise.all(inFlight);
  for (const index of alone) {
    if (!type.isUndefined(callbackError)) break;
    await runOne(index);
  }
  if (!type.isUndefined(callbackError)) {
    throw callbackError;
  }
  return results;
}

export default runJourneyPool;
