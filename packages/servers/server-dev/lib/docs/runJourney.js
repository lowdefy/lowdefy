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
import { getState } from '@lowdefy/e2e-utils/runtime';

import { getBrowser, buildPageUrl } from './getBrowser.js';
import openJourney from './openJourney.js';
import runJourneySteps from './runJourneySteps.js';
import selectFinalState from './selectFinalState.js';
import unsettledPageNote from './unsettledPageNote.js';
import validateJourneyMail from './validateJourneyMail.js';
import validateJourneySteps from './validateJourneySteps.js';
import validateJourneyTimeout from './validateJourneyTimeout.js';
import validateStateSelection from './validateStateSelection.js';

// The final state is read even after a failure — it is what an agent needs to
// write the next assertion. A page that has navigated away or crashed may not
// expose one; that is reported rather than thrown.
async function readFinalState({ page }) {
  try {
    return await getState(page);
  } catch (error) {
    return { error: `Could not read final state: ${error.message}` };
  }
}

// runJourney drives a page of the running dev server through a declarative
// list of steps — click, fill, select, press, back, goto, email, as, wait,
// screenshot, expect — so an agent can verify behaviour (a form submits, a
// modal opens, state changes, a sign-up email arrives) and not only layout.
// `stepTimeout` (the journey's `timeout`) bounds each step's wait for
// something to happen, matching Playwright's per-action timeout; `timeout`
// bounds each page open, raised to `stepTimeout` when that is longer, so one
// journey setting raises every such wait. The settle after an interaction is
// the exception: it stays capped (see settlePage), since it never fails a
// step. `state` picks what the result carries of the final page state (see
// selectFinalState). `user: 'none'` injects no caller, so the app's own auth
// decides who each actor is.
async function runJourney({
  origin,
  pageId,
  steps,
  user,
  urlQuery,
  state: stateSelection,
  width = 1280,
  height = 800,
  timeout = 15000,
  stepTimeout = 5000,
}) {
  if (type.isNone(origin) || !type.isString(origin)) {
    return {
      error: `runJourney requires an "origin" string. Received ${JSON.stringify(origin)}.`,
    };
  }
  if (type.isNone(pageId) || !type.isString(pageId)) {
    return {
      error: `runJourney requires a "pageId" string. Received ${JSON.stringify(pageId)}.`,
    };
  }
  if (!type.isNone(urlQuery) && !type.isObject(urlQuery)) {
    return {
      error: `runJourney requires "urlQuery" to be an object. Received ${JSON.stringify(
        urlQuery
      )}.`,
    };
  }
  const { error: stepsError } = validateJourneySteps({ steps });
  if (!type.isUndefined(stepsError)) {
    return { error: stepsError };
  }
  const stateSelectionError = validateStateSelection({ state: stateSelection });
  if (!type.isUndefined(stateSelectionError)) {
    return { error: stateSelectionError };
  }
  const timeoutError = validateJourneyTimeout({ timeout: stepTimeout });
  if (!type.isUndefined(timeoutError)) {
    return { error: timeoutError };
  }
  const mailError = validateJourneyMail({ steps });
  if (!type.isUndefined(mailError)) {
    return { error: mailError };
  }

  let browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    return {
      error: `No Chromium available. Run: npx playwright install chromium (${error.message})`,
    };
  }

  const url = buildPageUrl({ origin, pageId, urlQuery });
  let journey;
  try {
    const opened = await openJourney({
      browser,
      origin,
      pageId,
      user,
      urlQuery,
      width,
      height,
      timeout,
      stepTimeout,
    });
    journey = opened.journey;
    const { results, screenshots, failure } = await runJourneySteps({ journey, steps });
    const state = await readFinalState({ page: journey.actors.current().page });
    const result = {
      pageId,
      passed: type.isUndefined(failure),
      steps: results,
      screenshots,
      ...selectFinalState({ state, selection: stateSelection }),
    };
    if (!type.isUndefined(failure)) {
      result.failure = failure;
    }
    // openPage already waited for the page's async lifecycle; an unsettled page
    // still runs its steps and reports `ready: false` alongside the result.
    if (!opened.main.ready) {
      return {
        ...result,
        ready: false,
        note: unsettledPageNote({ timeout: journey.openTimeout }),
      };
    }
    return result;
  } catch (error) {
    return { error: `Failed to run journey at "${url}": ${error.message}` };
  } finally {
    if (!type.isUndefined(journey)) {
      await journey.actors.closeAll();
    }
  }
}

export default runJourney;
