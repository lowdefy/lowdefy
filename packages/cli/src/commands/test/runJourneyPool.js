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

// Whether a failed result may come from running beside other journeys. A refusal (the route's 400
// or an invalid file), a mutant listed against another build and a journey a headless run cannot
// take would come back the same alone. A page-open timeout or a browser-slot wait that ran out
// comes back as `{ message }` with no `failure`, and counts.
function mayBeContended(result) {
  return (
    result.passed !== true &&
    result.refused !== true &&
    result.stale !== true &&
    type.isUndefined(result.browserOnly)
  );
}

// A contended failure that passed alone: the alone run's PASS, with the first attempt's failure
// kept. Each result keeps the first attempt's `recorded` (its `passed: false`), since the alone
// run records nothing, so measured coverage leaves the journey out of this run.
function rerunResult({ first, alone }) {
  const { recorded, ...aloneResult } = alone;
  const kept = type.isUndefined(first.recorded) ? {} : { recorded: first.recorded };
  if (alone.passed !== true) {
    return { ...aloneResult, ...kept };
  }
  return {
    ...aloneResult,
    contended: true,
    contendedFailure: {
      ...(type.isUndefined(first.failure) ? {} : { failure: first.failure }),
      message: first.message,
    },
    ...kept,
  };
}

// Runs the selected test items (`entries`, as selectTier gives them) with up to the limit in
// flight, and returns their results in selection order, whatever order they finish in. The
// journeys that may overlap run first, then the alone ones one by one with nothing else in flight,
// each group in selection order (splitSelection). The limit is readLimit() less one for each
// contended journey that passed alone, and at least 1. It is read each time the pool would start
// a journey beside one already in flight, so a limit that drops mid-run starts no more.
// `run(entry, { rerun })` runs one item (one runRepeated call); a run that throws fails that item
// only.
// A journey that fails while another of the run is in flight (a contended failure) is run again
// alone, once, before it is reported, while the limit is above 1: the pool starts no new journey,
// waits for those in flight and calls `run(entry, { rerun: true })`, which records nothing. Two
// contended failures rerun one after the other. Passing alone, the item is PASS with
// `contended: true` and the first attempt's `contendedFailure: { failure?, message }`, and the
// limit drops by one for the rest of the run. Failing alone, it is the alone run's FAIL and the
// limit stays.
// `onFinished({ entry, result, done, total })` is called as each item finishes, its rerun
// included, and `onReported({ entry, result })` in run order: once an item and every item before
// it in run order have finished, so an alone journey early in the selection never holds the rest
// back.
// A callback that throws starts no more journeys and no reruns: the pool waits for those in
// flight, so none runs on past the caller's cleanup, and then throws the first such error.
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
  // Contended journeys that passed alone, each taking one from the limit.
  let narrowedBy = 0;
  // The run calls executing now, by selection index, and the items that ran beside another.
  const running = new Map();
  const contended = new Set();
  // Contended failures waiting for or running their rerun. While any is, no journey starts.
  let reruns = 0;
  // Reruns go one at a time, each after the one before it.
  let rerunTurn = Promise.resolve();

  function readNarrowedLimit() {
    return Math.max(1, readLimit() - narrowedBy);
  }

  async function report() {
    while (reported < runOrder.length && finished[runOrder[reported]]) {
      const index = runOrder[reported];
      reported += 1;
      if (!type.isNone(onReported)) {
        await onReported({ entry: entries[index], result: results[index] });
      }
    }
  }

  async function attempt({ index, rerun }) {
    const entry = entries[index];
    if (running.size > 0) {
      contended.add(index);
      running.forEach((_, other) => contended.add(other));
    }
    const call = (async () => {
      try {
        return await run(entry, { rerun });
      } catch (error) {
        return thrownResult({ entry, error });
      }
    })();
    running.set(index, call);
    try {
      return await call;
    } finally {
      running.delete(index);
    }
  }

  async function rerunAlone({ index, first }) {
    reruns += 1;
    const turn = rerunTurn.then(async () => {
      while (running.size > 0) {
        await Promise.race(running.values());
      }
      if (!type.isUndefined(callbackError)) {
        return first;
      }
      const result = rerunResult({ first, alone: await attempt({ index, rerun: true }) });
      if (result.contended === true) {
        narrowedBy += 1;
      }
      return result;
    });
    rerunTurn = turn;
    try {
      return await turn;
    } finally {
      reruns -= 1;
    }
  }

  async function runOne(index) {
    const entry = entries[index];
    let result = await attempt({ index, rerun: false });
    if (
      contended.has(index) &&
      mayBeContended(result) &&
      readNarrowedLimit() > 1 &&
      type.isUndefined(callbackError)
    ) {
      result = await rerunAlone({ index, first: result });
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
    const item = runOne(index).finally(() => inFlight.delete(item));
    inFlight.add(item);
  }

  for (const index of overlapping) {
    while (
      type.isUndefined(callbackError) &&
      inFlight.size > 0 &&
      (reruns > 0 || inFlight.size >= readNarrowedLimit())
    ) {
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
