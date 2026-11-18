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
  matchesRequestKey,
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
 *   passes and answers { parkedAt, release }, release being the step that lets it go, which the
 *   expect steps after it read nothing from but name in their message. Any other
 *   step whose request reaches a gate fails: a page's double submit is the doubleSubmit variant's
 *   job. A release lets the call parked at the request it names go (matched as a hold matches,
 *   so endpoint and pageId pick between two holds on one request id), waits for it to answer, and answers
 *   with that answer; the call is recorded on its actor then, as runHeadlessCall records it.
 * - finish() releases every gate (releasePauseGates), waits for every held call to settle, and
 *   answers the journey's failure when a gate no call reached, or a call still parked, was left:
 *   { index, step, expected, actual, message }, or undefined.
 */
// A release names the hold it lets go as `release: <requestId>`, or as
// `release: { requestId, endpoint?, pageId? }` when two holds share the request id.
function readReleaseKey(release) {
  return type.isString(release) ? { requestId: release } : release;
}

function describeRequestKey({ endpoint, pageId, requestId }) {
  const narrowed = [
    type.isNone(endpoint) ? undefined : `endpoint "${endpoint}"`,
    type.isNone(pageId) ? undefined : `page "${pageId}"`,
  ].filter((part) => !type.isUndefined(part));
  const base = `request "${requestId}"`;
  return narrowed.length === 0 ? base : `${base} on ${narrowed.join(' and ')}`;
}

// Whether a release could name this gate: the same request id, and no endpoint or pageId on the
// two that differ. A gate no call reached has no request to match against yet.
function matchesHold({ gate, key }) {
  return ['requestId', 'endpoint', 'pageId'].every(
    (field) => type.isNone(gate[field]) || type.isNone(key[field]) || gate[field] === key[field]
  );
}

// The release step that lets the call parked at a gate go, written as the gate's hold was.
function writeRelease(gate) {
  const { endpoint, pageId, requestId } = gate;
  if (type.isNone(endpoint) && type.isNone(pageId)) {
    return `release: ${requestId}`;
  }
  const fields = [`requestId: ${requestId}`];
  if (!type.isNone(endpoint)) fields.push(`endpoint: ${endpoint}`);
  if (!type.isNone(pageId)) fields.push(`pageId: ${pageId}`);
  return `release: { ${fields.join(', ')} }`;
}

// The release step that lets a parked call go. A hold narrowed by endpoint or pageId is named as
// it was written. A bare hold whose request id another hold shares is named by the routine the
// parked call reached it in (gate.reachedBy), since `release: <requestId>` lets the first call
// parked at that id go, which may be the other routine's.
function writeParkedRelease({ gate, holds }) {
  const shared =
    holds.filter((entry) => entry.gate.requestId === gate.requestId).length > 1 &&
    type.isNone(gate.endpoint) &&
    type.isNone(gate.pageId) &&
    !type.isNone(gate.reachedBy);
  if (!shared) {
    return writeRelease(gate);
  }
  const { endpointId, pageId } = gate.reachedBy;
  return writeRelease({
    requestId: gate.requestId,
    endpoint: endpointId,
    pageId: type.isNone(endpointId) ? pageId : undefined,
  });
}

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
    const session = readSession();
    addPauseGate({ endpoint, pageId, requestId, session });
    holds.push({ gate: session.pauseGates.at(-1), index, step });
  }

  async function release({ step }) {
    const key = readReleaseKey(step.release);
    const named = describeRequestKey(key);
    const session = readSession();
    // A parked call is matched on the request it reached, as a hold matches a routine's request,
    // so endpoint and pageId pick between two holds on one request id.
    const at = parked.findIndex((entry) =>
      matchesRequestKey({ entry: key, request: entry.gate.reachedBy })
    );
    if (at === -1) {
      const unreached = listUnreachedPauseGates({ session }).some((gate) =>
        matchesHold({ gate, key })
      );
      throw new HeadlessStepError(
        unreached
          ? `No call reached the gate on ${named}, so no call is parked to release. A call or request step after the hold must reach it.`
          : `No call is parked at the gate on ${named} to release.`,
        { actual: 'no parked call', expected: `a call parked at ${named}` }
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
      `The call released from ${named} reached the gate on request "${outcome.gate.requestId}" before it answered: release that gate after this one.`,
      {
        actual: `parked at request "${outcome.gate.requestId}"`,
        expected: `the call released from ${named} to answer`,
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
      return { parkedAt: gate.requestId, release: writeParkedRelease({ gate, holds }) };
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
    const { index, step } = holds.find((entry) => entry.gate === gate);
    return {
      index,
      step,
      expected: `a call or request step to reach the gate on request "${gate.requestId}"`,
      actual: 'no call reached it',
      message: `No call reached the gate the hold on request "${gate.requestId}" set, so the race it sets up never ran.`,
    };
  }

  function describeParked({ gate, index, step }) {
    const releaseStep = writeParkedRelease({ gate, holds });
    return {
      index,
      step,
      expected: `a "${releaseStep}" step to let the parked call go`,
      actual: 'still parked when the journey ended',
      message: `The call parked at the gate on request "${gate.requestId}" was still parked when the journey ended: release it with "${releaseStep}".`,
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
