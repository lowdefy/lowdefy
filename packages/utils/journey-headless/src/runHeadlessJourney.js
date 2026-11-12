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

import {
  CALL_STEP_KEYS,
  claimExpectedErrors,
  classifyJourney,
  findStepNeedingPage,
  getStepKey,
  INTERACTION_STEP_KEYS,
  normaliseJourneySteps,
  toAppErrorFailure,
  validateJourneySteps,
} from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import createAppErrorWindows from './createAppErrorWindows.js';
import createHeadlessActors from './createHeadlessActors.js';
import runHeadlessStep from './runHeadlessStep.js';
import toJsonValue from './toJsonValue.js';
import toStepFailure from './toStepFailure.js';

function isExpectError(step) {
  return getStepKey(step ?? {}) === 'expect' && getStepKey(step.expect) === 'error';
}

// Whether the step at `index` has app errors an expect.error after it claims, as the browser
// runner decides it: an interaction directly followed by one, or a call or request followed by
// one among the expect steps that read its answer.
function isClaimedLater({ index, steps }) {
  const key = getStepKey(steps[index]);
  if (INTERACTION_STEP_KEYS.includes(key)) {
    return isExpectError(steps[index + 1]);
  }
  if (!CALL_STEP_KEYS.includes(key)) {
    return false;
  }
  for (let next = index + 1; next < steps.length; next += 1) {
    if (getStepKey(steps[next]) !== 'expect') return false;
    if (isExpectError(steps[next])) return true;
  }
  return false;
}

// A call or request names its caller by a data set user's name, "none" or a user object. A name
// that is not in the data set fails the journey before any call, with the data set's users.
function findUnknownCaller({ host, steps }) {
  for (const step of steps) {
    const key = getStepKey(step);
    const as = CALL_STEP_KEYS.includes(key) ? step[key].as : undefined;
    if (type.isString(as) && as !== 'none') {
      try {
        host.resolveUser(as);
      } catch (error) {
        return error.message;
      }
    }
  }
  return undefined;
}

function countBrowserOnly(actors) {
  return actors.all().reduce((count, actor) => count + actor.browserOnly.length, 0);
}

function findBrowserOnly(actors) {
  return actors.all().flatMap((actor) => actor.browserOnly)[0];
}

/**
 * Runs a page journey headless: its pages on the client engine in Node (createHeadlessActor), its
 * requests and endpoint calls in process on the host's data, and app errors judged by the
 * invariants the browser runner shares. Answers as the dev server's runJourney does:
 * { pageId, passed, steps, state, failure? }, with steps [{ index, step, status, durationMs }],
 * failure { index, step, expected, actual, message } or an app-error failure (toAppErrorFailure),
 * and state the final page state through JSON. It also carries calls (every request and endpoint
 * call, with the actor that made it) and messages (what displayMessage showed).
 *
 * A journey whose steps need a browser (classifyJourney) is not run: it answers
 * { pageId, browserOnly: { index, step, reason }, steps: [] }. One that reaches an action only a
 * browser can carry out stops there and answers browserOnly for that step, with no `passed` and
 * no failure: it is not a failed journey but one this run cannot take.
 *
 * journey: { pageId?, pathParams?, urlQuery?, user?, steps }; user defaults to the host's. A
 * journey with no pageId opens no page, and every step must run without one (call, request, as,
 * wait ms, and expect error, status, calls on an endpoint or a named page, db). A call or request
 * naming a caller the data set does not have is refused before any call.
 * stepTimeout bounds each step's wait for a block or a check to hold.
 */
async function runHeadlessJourney({ configDirectory, host, journey, stepTimeout = 5000 }) {
  const { pageId, pathParams, urlQuery, user } = journey;
  const { error: stepsError } = validateJourneySteps({ steps: journey.steps ?? [] });
  if (!type.isUndefined(stepsError)) {
    return { error: stepsError };
  }
  const classification = classifyJourney({ journey });
  if (!classification.headless) {
    const { index, reason, step } = classification;
    return { pageId, browserOnly: { index, reason, step }, steps: [] };
  }
  const steps = normaliseJourneySteps({ steps: journey.steps });
  if (type.isNone(pageId)) {
    const needing = findStepNeedingPage({ steps: journey.steps });
    if (!type.isUndefined(needing)) {
      return {
        error: `Step ${needing.index} (${getStepKey(
          needing.step
        )}) needs a page, and the journey has no "pageId".`,
        refused: true,
      };
    }
  }
  const unknownCaller = findUnknownCaller({ host, steps });
  if (!type.isUndefined(unknownCaller)) {
    return { error: unknownCaller, refused: true };
  }
  const windows = createAppErrorWindows({ configDirectory, errorSink: host.errorSink });
  const actors = createHeadlessActors({
    host,
    onTrace: windows.onTrace,
    plugins: await host.loadClientPlugins(),
    start: { pageId, pathParams, urlQuery },
    stepTimeout,
    user,
  });
  const results = [];
  let failure;
  let browserOnly;
  // The app errors of an interaction or call an expect.error step follows, for that step to claim.
  let held = null;
  // The answer of the last call or request step, which only the expect steps after it read.
  let answer;

  try {
    await actors.open();
    await actors.current().settle();
    const findings = await windows.take({ pageId });
    if (findings.length > 0) {
      failure = toAppErrorFailure({ findings, phase: 'open' });
    }
  } catch (error) {
    failure = {
      phase: 'open',
      expected: `page "${pageId}" to open`,
      actual: error.message,
      message: error.message,
    };
  }

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    if (!type.isUndefined(failure) || !type.isUndefined(browserOnly)) {
      results.push({ index, step, status: 'skipped', durationMs: 0 });
      continue;
    }
    const started = Date.now();
    const triedBefore = countBrowserOnly(actors);
    const key = getStepKey(step);
    if (!['expect', ...CALL_STEP_KEYS].includes(key)) {
      answer = undefined;
    }
    let stepFailure;
    try {
      const stepAnswer = await runHeadlessStep({ actors, answer, host, step, stepTimeout });
      if (CALL_STEP_KEYS.includes(key)) {
        answer = stepAnswer;
      }
    } catch (error) {
      stepFailure = toStepFailure({ error, index, step });
    }
    const durationMs = Date.now() - started;
    if (countBrowserOnly(actors) > triedBefore) {
      browserOnly = { index, step, reason: `${findBrowserOnly(actors)} needs the browser.` };
      results.push({ index, step, status: 'browser-only', durationMs });
      continue;
    }
    const actor = actors.current();
    if (type.isUndefined(stepFailure) && !type.isNone(actor.leftApp)) {
      stepFailure = toStepFailure({
        error: new Error(`The page left the app for ${actor.leftApp}.`),
        index,
        step,
      });
    }
    results.push({ index, step, status: stepFailure ? 'failed' : 'ok', durationMs });
    const findings = await windows.take({ pageId: actor.page?.pageId ?? null });
    if (isExpectError(step) && type.isUndefined(stepFailure)) {
      failure = claimExpectedErrors({ step, index, held, findings });
      held = null;
      if (!type.isUndefined(failure)) {
        results[failure.index].status = 'failed';
      }
      continue;
    }
    if (type.isUndefined(stepFailure) && isClaimedLater({ index, steps })) {
      held = { answered: CALL_STEP_KEYS.includes(key), findings, index, step };
      continue;
    }
    if (findings.length === 0) {
      failure = stepFailure;
      continue;
    }
    results[index].status = 'failed';
    failure = toAppErrorFailure({ findings, index, step, stepFailure });
  }

  // What the last step's effects raised once it had passed is judged against it.
  if (type.isUndefined(failure) && type.isUndefined(browserOnly) && steps.length > 0) {
    const index = steps.length - 1;
    await actors.current().settle();
    const findings = await windows.take({ pageId: actors.current().page?.pageId ?? null });
    if (findings.length > 0) {
      results[index].status = 'failed';
      failure = toAppErrorFailure({ findings, index, step: steps[index] });
    }
  }

  const result = {
    pageId,
    steps: results,
    state: toJsonValue(actors.current()?.page?.context.state ?? null),
    calls: actors
      .all()
      .flatMap((actor) => actor.calls.map((call) => ({ actor: actor.name, ...call }))),
    messages: actors.all().flatMap((actor) => actor.messages),
  };
  if (!type.isUndefined(browserOnly)) {
    return { ...result, browserOnly };
  }
  result.passed = type.isUndefined(failure);
  if (!type.isUndefined(failure)) {
    result.failure = failure;
  }
  return result;
}

export default runHeadlessJourney;
