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

import { CALL_STEP_KEYS, getStepKey } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';
import {
  addPauseGate,
  listUnreachedPauseGates,
  raceToPauseGate,
  releasePauseGates,
} from '@lowdefy/test-utils/dataSets';

import HeadlessStepError from './HeadlessStepError.js';

/**
 * The races of one headless journey, on the pause gates of the host's data session
 * (@lowdefy/test-utils/dataSets), so a gate holds a routine the same way on every host.
 *
 * - run({ index, step, start }) runs one step: start() runs it (runHeadlessStep). A hold sets a
 *   pause gate. Once a gate is set, every other step races start() against the open gates
 *   (raceToPauseGate). A call or request whose routine reaches a gate first is parked: the step
 *   passes and answers { parkedAt }, which the expect steps after it read nothing from. Any other
 *   step whose request reaches a gate fails: a page's double submit is the doubleSubmit variant's
 *   job. A release lets the call parked at its request go, waits for it to answer, and answers
 *   with that answer; the call is recorded on its actor then, as runHeadlessCall records it.
 * - finish() releases every gate (releasePauseGates), waits for every held call to settle, and
 *   answers the journey's failure when a gate no call reached, or a call still parked, was left:
 *   { index, step, expected, actual, message }, or undefined.
 */
function createJourneyRaces({ host }) {
  const holds = [];
  const parked = [];
  // The work of a step that reached a gate and failed, left to settle once the gates are released.
  const stranded = [];

  function readSession() {
    if (type.isNone(host.dataSession)) {
      throw new Error(
        'A "hold" step sets its gate on the journey\'s data session, and this journey has none: give it a data set ("data").'
      );
    }
    return host.dataSession;
  }

  function hold({ index, step }) {
    const { endpoint, pageId, requestId } = step.hold;
    addPauseGate({ endpoint, pageId, requestId, session: readSession() });
    holds.push({ index, step });
  }

  async function release({ step }) {
    const requestId = step.release;
    const session = readSession();
    const at = parked.findIndex((entry) => entry.gate.requestId === requestId);
    if (at === -1) {
      const unreached = listUnreachedPauseGates({ session }).some(
        (gate) => gate.requestId === requestId
      );
      throw new HeadlessStepError(
        unreached
          ? `No call reached the gate on request "${requestId}", so no call is parked to release. A call or request step after the hold must reach it.`
          : `No call is parked at the gate on request "${requestId}" to release.`,
        { actual: 'no parked call', expected: `a call parked at request "${requestId}"` }
      );
    }
    const [entry] = parked.splice(at, 1);
    const outcome = await raceToPauseGate({
      session,
      start: () => {
        entry.gate.release();
        return entry.work;
      },
    });
    if (Object.hasOwn(outcome, 'value')) {
      return outcome.value;
    }
    parked.push({ ...entry, gate: outcome.gate });
    throw new HeadlessStepError(
      `The call released from request "${requestId}" reached the gate on request "${outcome.gate.requestId}" before it answered: release that gate after this one.`,
      {
        actual: `parked at request "${outcome.gate.requestId}"`,
        expected: `the call released from request "${requestId}" to answer`,
      }
    );
  }

  async function race({ index, start, step }) {
    const outcome = await raceToPauseGate({ session: host.dataSession, start });
    if (Object.hasOwn(outcome, 'value')) {
      return outcome.value;
    }
    const key = getStepKey(step);
    const { gate, work } = outcome;
    if (CALL_STEP_KEYS.includes(key)) {
      parked.push({ gate, index, step, work });
      return { parkedAt: gate.requestId };
    }
    stranded.push(work);
    throw new HeadlessStepError(
      `Request "${gate.requestId}" reached the gate a "hold" step set while a "${key}" step ran. Only a call or request step can be parked; a page that sends a request twice is tested by the doubleSubmit variant (lowdefy journeys variants).`,
      {
        actual: `a "${key}" step reached request "${gate.requestId}"`,
        expected: 'only a call or request step to reach a held request',
      }
    );
  }

  function run({ index, start, step }) {
    const key = getStepKey(step);
    if (key === 'hold') {
      return hold({ index, step });
    }
    if (key === 'release') {
      return release({ step });
    }
    if (holds.length === 0) {
      return start();
    }
    return race({ index, start, step });
  }

  function describeUnreached(gate) {
    const { index, step } = holds.find((entry) => entry.step.hold.requestId === gate.requestId);
    return {
      index,
      step,
      expected: `a call or request step to reach the gate on request "${gate.requestId}"`,
      actual: 'no call reached it',
      message: `No call reached the gate the hold on request "${gate.requestId}" set, so the race it sets up never ran.`,
    };
  }

  function describeParked({ gate, index, step }) {
    return {
      index,
      step,
      expected: `a "release: ${gate.requestId}" step to let the parked call go`,
      actual: 'still parked when the journey ended',
      message: `The call parked at the gate on request "${gate.requestId}" was still parked when the journey ended: release it with "release: ${gate.requestId}".`,
    };
  }

  async function finish() {
    if (holds.length === 0) {
      return undefined;
    }
    const session = host.dataSession;
    const unreached = listUnreachedPauseGates({ session });
    const left = [...parked];
    releasePauseGates({ session });
    await Promise.allSettled([...left.map((entry) => entry.work), ...stranded]);
    parked.length = 0;
    stranded.length = 0;
    if (unreached.length > 0) {
      return describeUnreached(unreached[0]);
    }
    if (left.length > 0) {
      return describeParked(left[0]);
    }
    return undefined;
  }

  return { finish, run };
}

export default createJourneyRaces;
