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

import path from 'node:path';
import { type } from '@lowdefy/helpers';
import { getStepKey, INTERACTION_STEP_KEYS } from '@lowdefy/node-utils';

import claimExpectedErrors from './claimExpectedErrors.js';

import evaluateInvariants from './evaluateInvariants.js';
import installStepObserver from './installStepObserver.js';
import readStepObserver from './readStepObserver.js';
import resolveConfigKeySource from './resolveConfigKeySource.js';
import takeJourneyEvents from './takeJourneyEvents.js';
import { takeRunErrors } from '../runErrorBuffers.js';
import toAppErrorFailure from './toAppErrorFailure.js';
import TRANSIENT_SELECTOR from './TRANSIENT_SELECTOR.js';
import usesSearchStage from './usesSearchStage.js';
import waitForClientErrorReports from './waitForClientErrorReports.js';
import watchJourneyContext from './watchJourneyContext.js';
import withAppErrors from './withAppErrors.js';

function isExpectError(step) {
  return getStepKey(step ?? {}) === 'expect' && getStepKey(step.expect) === 'error';
}

// Steps that cannot cause an error a page reports later, so their window
// closes without waiting for client error reports in flight. An expect.error
// waits, so a late report of the interaction before it can be claimed.
function isQuietStep(step) {
  return ['expect', 'wait', 'screenshot'].includes(getStepKey(step)) && !isExpectError(step);
}

// What fails a journey: an app error. A dead click is only a warning; a
// journey asserts it with expect.effect.
function isAppError(finding) {
  return finding.severity === 'error' || finding.kind === 'environment';
}

// Watches a journey run for app errors and judges each step's window with the
// app error invariants (evaluateInvariants), each error keyed by findingKey. Every
// actor's context is watched from before its first request (onContext). The
// windows are contiguous, from the page open to the final drain after the
// last step, so an error that lands between two steps is never lost. Each
// window takes what the run's actors buffered (page errors, app API
// responses) and the error entries the run's own error buffer claimed (see
// runErrorBuffers), and nothing a developer's own tab or another run caused.
function createJourneyAppErrors({ origin, basePath, recording, configDirectory }) {
  const buildDirectory = path.join(process.cwd(), 'build');
  const run = { run: recording.run.id, journey: recording.run.journey };
  const events = { pageErrors: [], requests: [], responses: [], pendingClientErrors: new Set() };
  let since = 0;
  let current = null;
  // The window the last step closed, which an expect.effect step reads for
  // the interaction just before it.
  let closed = null;

  function onContext({ context }) {
    watchJourneyContext({ context, events, origin, basePath });
  }

  function takeWindow({ page, observed, urlBefore }) {
    const until = Date.now();
    const window = {
      since,
      until,
      urlBefore,
      urlAfter: page.isClosed() ? null : page.url(),
      emits: observed?.emits ?? [],
      mutationCount: observed?.mutationCount ?? null,
      ...takeJourneyEvents({ events, since, until }),
      errors: takeRunErrors({ ...run, since, until }),
    };
    since = until;
    return window;
  }

  async function findAppErrors({ step, result, window, pageId }) {
    const findings = await evaluateInvariants({
      step,
      result,
      window,
      pageId,
      basePath,
      configDirectory,
      usesSearchStage: (entry) => usesSearchStage({ buildDirectory, entry }),
      resolveSource: (configKey) =>
        resolveConfigKeySource({ buildDirectory, configDirectory, configKey }),
    });
    return findings.filter(isAppError);
  }

  // A page mid-navigation, or one that has crashed, has nothing to report.
  async function readPageId(page) {
    return page.evaluate(() => window.lowdefy?.pageId ?? null).catch(() => null);
  }

  // Judges what opening the journey's first page caused (its onInit and
  // onMount requests included). Returns a failure with phase 'open', or
  // undefined.
  async function judgeOpen({ page }) {
    await waitForClientErrorReports({ events });
    const pageId = await readPageId(page);
    const window = takeWindow({ page, observed: null, urlBefore: page.url() });
    const findings = await findAppErrors({ step: {}, result: { status: 'ok' }, window, pageId });
    if (findings.length === 0) {
      return undefined;
    }
    return toAppErrorFailure({ findings, phase: 'open' });
  }

  // Opens a step's window on the page the step starts on. The observer is
  // installed in each new document; a page mid-navigation cannot take it, and
  // its window then has no trace emits (its error reports still count).
  async function openWindow({ page }) {
    await page.evaluate(installStepObserver).catch(() => null);
    current = { page, urlBefore: page.url(), pageId: await readPageId(page) };
  }

  // Closes the step's window and returns the app errors it held, as findings
  // ({ kind, severity, message, pageId, source, configKey, key }).
  async function closeWindow({ journey, step, result }) {
    if (!isQuietStep(step)) {
      await waitForClientErrorReports({ events });
    }
    const { page, urlBefore, pageId } = current;
    current = null;
    const observed = page.isClosed()
      ? null
      : await page
          .evaluate(readStepObserver, { transientSelector: TRANSIENT_SELECTOR })
          .catch(() => null);
    const window = takeWindow({ page: journey.actors.current().page, observed, urlBefore });
    closed = window;
    return findAppErrors({ step, result, window, pageId });
  }

  // The window of the step before the one running now: an expect step opens
  // its own window, so the last one closed is the interaction's before it.
  function previousWindow() {
    return closed;
  }

  // After the last step: what its effects reported late (a client error
  // report still in flight when its window closed) is judged against it.
  async function drain({ journey, step, result }) {
    await waitForClientErrorReports({ events });
    const page = journey.actors.current().page;
    const pageId = await readPageId(page);
    const window = takeWindow({ page, observed: null, urlBefore: page.url() });
    return findAppErrors({ step, result, window, pageId });
  }

  // The app errors of an interaction an expect.error step follows, held for
  // that step to claim instead of failing the interaction at once.
  let held = null;

  // Closes the step's window and returns the journey's failure once its app
  // errors are counted (see withAppErrors), or undefined while it passes.
  // `failure` is the step's own failure, if any. An interaction followed by
  // an expect.error step holds its app errors for that step to claim (see
  // claimExpectedErrors); it fails on them only if they are not claimed.
  async function judgeStep({ journey, steps, index, results, failure, leftOrigin }) {
    const step = steps[index];
    const result = results[index];
    const findings = await closeWindow({ journey, step, result });
    if (isExpectError(step) && type.isUndefined(failure)) {
      const claim = claimExpectedErrors({ step, index, held, findings });
      held = null;
      if (!type.isUndefined(claim)) {
        results[claim.index].status = 'failed';
      }
      return claim;
    }
    if (
      type.isUndefined(failure) &&
      INTERACTION_STEP_KEYS.includes(getStepKey(step)) &&
      isExpectError(steps[index + 1])
    ) {
      held = { index, step, findings };
      return undefined;
    }
    if (findings.length === 0) {
      return failure;
    }
    result.status = 'failed';
    return withAppErrors({ failure, leftOrigin, findings, index, step });
  }

  // After the last step passed, what its effects reported late (a client
  // error report still in flight when its window closed) is judged against
  // it.
  async function judgeDrain({ journey, steps, results }) {
    const index = steps.length - 1;
    const step = steps[index];
    const result = results[index];
    const findings = await drain({ journey, step, result });
    if (findings.length === 0) {
      return undefined;
    }
    result.status = 'failed';
    return withAppErrors({ findings, index, step });
  }

  return {
    onContext,
    judgeOpen,
    openWindow,
    judgeStep,
    judgeDrain,
    closeWindow,
    drain,
    previousWindow,
  };
}

export default createJourneyAppErrors;
