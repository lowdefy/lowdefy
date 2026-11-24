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
  ANSWER_STEP_KEYS,
  CALL_STEP_KEYS,
  claimExpectedErrors,
  classifyJourney,
  createDataSetRails,
  findStepNeedingPage,
  getStepKey,
  INTERACTION_STEP_KEYS,
  isClaimedLater,
  isExpectErrorStep,
  normaliseJourneySteps,
  toAppErrorFailure,
  validateJourneySteps,
} from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import createAppErrorWindows from './createAppErrorWindows.js';
import checkStepReferences from './checkStepReferences.js';
import createHeadlessActors from './createHeadlessActors.js';
import createJourneyRaces from './createJourneyRaces.js';
import findUnfiredFailGate from './findUnfiredFailGate.js';
import noteSilentSubscriptions from './noteSilentSubscriptions.js';
import runHeadlessStep from './runHeadlessStep.js';
import toJsonValue from './toJsonValue.js';
import toStepFailure from './toStepFailure.js';
import usesSearchStage from './usesSearchStage.js';

// A call or request names its caller by a data set user's name, "none" or a user object, and a
// call also "system". A name that is not in the data set fails the journey before any call, with
// the data set's users.
function findUnknownCaller({ host, steps }) {
  for (const step of steps) {
    const key = getStepKey(step);
    const as = CALL_STEP_KEYS.includes(key) ? step[key].as : undefined;
    if (type.isString(as) && as !== 'none' && as !== 'system') {
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

function findBrowserOnly({ actors, from }) {
  return actors.all().flatMap((actor) => actor.browserOnly)[from];
}

// The steps that open a new window for wait.request: an interaction, or a step that loads or
// switches to a page, as in the browser runner. Before the first of them the window is the open.
const REQUEST_WINDOW_STEP_KEYS = [...INTERACTION_STEP_KEYS, 'goto', 'as'];

/**
 * Runs a page journey headless: its pages on the client engine in Node (createHeadlessActor), its
 * requests and endpoint calls in process on the host's data, and app errors judged by the
 * invariants the browser runner shares. Answers as the dev server's runJourney does:
 * { pageId, passed, steps, state, failure? }, with steps [{ index, step, status, durationMs }],
 * failure { index, step, expected, actual, message } or an app-error failure (toAppErrorFailure),
 * and state the final page state through JSON. It also carries calls (every request and endpoint
 * call, with the actor that made it) and messages (what displayMessage showed).
 *
 * hold and release race two calls (createJourneyRaces): a call or request that reaches a held
 * request is parked, and a release lets it go and answers with it. A gate no call reached, or a
 * call still parked when the journey ends, fails the journey; the gates are released either way.
 *
 * A fail gate the journey's stubs set (on the host's data session) that no request reached fails
 * the journey at its last step, when nothing failed before.
 *
 * A journey whose steps need a browser (classifyJourney) is not run: it answers
 * { pageId, browserOnly: { index, step, reason }, steps: [] }. One that reaches an action only a
 * browser can carry out stops there and answers browserOnly for that step, or
 * { phase: 'open', reason } when the page's open reached it, with no `passed` and no failure: it
 * is not a failed journey but one this run cannot take.
 *
 * journey: { pageId?, pathParams?, urlQuery?, user?, steps }; user defaults to the host's. A
 * journey with no pageId opens no page, and every step must run without one (call, request, as,
 * hold, release, webhook, wait ms, and expect error, status, calls on an endpoint or a named page,
 * db). A call or request naming a caller the data set does not have is refused before any call; a
 * call `as: system` runs the endpoint as the system (host.system).
 * stepTimeout bounds each step's wait for a block or a check to hold. onTrace, when given, also
 * takes every completed event's trace payload, as a host that records what a journey exercised
 * reads it.
 */
async function runHeadlessJourney({ configDirectory, host, journey, onTrace, stepTimeout = 5000 }) {
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
  const windows = createAppErrorWindows({
    configDirectory,
    errorSink: host.errorSink,
    usesSearchStage: (entry) => usesSearchStage({ entry, host }),
  });
  const actors = createHeadlessActors({
    host,
    onTrace: (payload) => {
      windows.onTrace(payload);
      onTrace?.(payload);
    },
    plugins: await host.loadClientPlugins(),
    start: { pageId, pathParams, urlQuery },
    stepTimeout,
    user,
  });
  const races = createJourneyRaces({ host });
  // A journey on a data set checks each step that acts on a block against the data-set rails, as
  // the browser runner does; one with none acts on anything.
  const rails =
    host.dataSetName === null
      ? null
      : createDataSetRails({ readArtifact: host.readArtifact, connections: host.connections });
  const results = [];
  let failure;
  let browserOnly;
  // The app errors of an interaction or call an expect.error step follows, for that step to claim.
  let held = null;
  // The answer of the last call, request, release or webhook step, which only the expect steps
  // after it read.
  let answer;
  // Each actor's call count when the current wait.request window opened.
  let since = new Map();

  try {
    await actors.open();
    await actors.current().settle();
    // The browser reads no trace events for the open, only the errors it caused.
    const findings = await windows.take({ pageId, withEmits: false });
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
  // An open that reached something only a browser does (an onMount CallMethod on a block with no
  // stand-in, or a browser-only action) leaves the journey to the browser, over any failure the
  // open raised, as a step's browser-only mark wins over its failure: the browser run judges it.
  if (countBrowserOnly(actors) > 0) {
    failure = undefined;
    browserOnly = { phase: 'open', reason: findBrowserOnly({ actors, from: 0 }) };
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
    if (!['expect', ...ANSWER_STEP_KEYS].includes(key)) {
      answer = undefined;
    }
    if (REQUEST_WINDOW_STEP_KEYS.includes(key)) {
      since = new Map(actors.all().map((actor) => [actor, actor.calls.length]));
    }
    let stepFailure;
    actors.all().forEach((each) => {
      each.landedControl = undefined;
    });
    try {
      checkStepReferences({ actor: actors.current(), host, journeyPageId: pageId, step });
      const stepAnswer = await races.run({
        index,
        step,
        start: () => runHeadlessStep({ actors, answer, host, rails, since, step, stepTimeout }),
      });
      if (ANSWER_STEP_KEYS.includes(key)) {
        answer = stepAnswer;
      }
    } catch (error) {
      stepFailure = noteSilentSubscriptions({
        actor: actors.current(),
        failure: toStepFailure({ error, index, step }),
      });
    }
    const durationMs = Date.now() - started;
    if (countBrowserOnly(actors) > triedBefore) {
      browserOnly = { index, step, reason: findBrowserOnly({ actors, from: triedBefore }) };
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
    results.push({
      index,
      step,
      status: stepFailure ? 'failed' : 'ok',
      durationMs,
      ...(type.isNone(actor.landedControl) ? {} : { control: actor.landedControl }),
    });
    const findings = await windows.take({ pageId: actor.page?.pageId ?? null });
    if (isExpectErrorStep(step) && type.isUndefined(stepFailure)) {
      failure = claimExpectedErrors({ step, index, held, findings });
      held = null;
      if (!type.isUndefined(failure)) {
        results[failure.index].status = 'failed';
      }
      continue;
    }
    if (type.isUndefined(stepFailure) && isClaimedLater({ index, steps })) {
      held = { answered: ANSWER_STEP_KEYS.includes(key), findings, index, step };
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
  // Every gate is released whatever happened; one left unreached, or a call left parked, is the
  // journey's failure when nothing failed before it.
  const raceFailure = await races.finish();
  if (
    type.isUndefined(failure) &&
    type.isUndefined(browserOnly) &&
    !type.isUndefined(raceFailure)
  ) {
    results[raceFailure.index].status = 'failed';
    failure = raceFailure;
  }
  // A journey on no data session has no fail gates.
  if (
    type.isUndefined(failure) &&
    type.isUndefined(browserOnly) &&
    steps.length > 0 &&
    !type.isNone(host.dataSession)
  ) {
    failure = await findUnfiredFailGate({ session: host.dataSession, steps });
    if (!type.isUndefined(failure)) {
      results[failure.index].status = 'failed';
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
