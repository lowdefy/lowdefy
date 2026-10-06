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
import { getState } from '@lowdefy/e2e-utils/runtime';
import { findPlaceholderStep, validateJourneySteps } from '@lowdefy/node-utils';

import collectExercised from './collectExercised.js';
import createJourneyAppErrors from './observe/createJourneyAppErrors.js';
import describeDataSetResult from './dataSets/describeDataSetResult.js';
import getDataStore from './dataSets/getDataStore.js';
import journeyRunRecording from './journeyRunRecording.js';
import { getBrowser, buildPageUrl } from './getBrowser.js';
import noBrowserError from './noBrowserError.js';
import openDataSession from './dataSets/openDataSession.js';
import openJourney from './openJourney.js';
import readBuildArtifact from './readBuildArtifact.js';
import readDevAuthMode from './readDevAuthMode.js';
import readPagePath from './readPagePath.js';
import { registerRunBuffer, releaseRunBuffer } from './runErrorBuffers.js';
import resolveJourneyDataSet from './dataSets/resolveJourneyDataSet.js';
import runJourneySteps from './runJourneySteps.js';
import selectFinalState from './selectFinalState.js';
import unsettledPageNote from './unsettledPageNote.js';
import validateJourneyMail from './validateJourneyMail.js';
import validateJourneyTimeout from './validateJourneyTimeout.js';
import validateStateSelection from './validateStateSelection.js';
import withBrowserSlot from './withBrowserSlot.js';

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

// The built artifacts a journey's exercised path is read from. The pages it
// visited were built by the visit, so their request artifacts are on disk.
function defaultReadConfigFile(name) {
  return readBuildArtifact({ name, deserialize: true });
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
// decides who each actor is. `data` names a data set: the journey runs on a
// fresh database of its own, loaded with it, and a string `user` (or an `as`
// name) names one of its users. Its problems come back as { error, refused }
// before any browser opens. `pathParams` fill the placeholders of the page's
// path; one left without a value is an error before any browser opens.
async function runJourney({
  origin,
  pageId,
  pathParams,
  steps,
  user,
  urlQuery,
  state: stateSelection,
  width = 1280,
  height = 800,
  timeout = 15000,
  stepTimeout = 5000,
  basePath = '',
  readConfigFile = defaultReadConfigFile,
  mutantCookie,
  data,
  recording,
  by,
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
  if (
    !type.isNone(pathParams) &&
    (!type.isObject(pathParams) || !Object.values(pathParams).every(type.isString))
  ) {
    return {
      error: `runJourney requires "pathParams" to be an object of strings, one per path placeholder. Received ${JSON.stringify(
        pathParams
      )}.`,
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
  // A placeholder step or a mail step with no sink is the caller's to fix, like
  // a data set problem: refused, so the route answers 400 and lowdefy test does
  // not repeat it.
  const { error: placeholderError } = findPlaceholderStep({ steps });
  if (!type.isUndefined(placeholderError)) {
    return { error: placeholderError, refused: true };
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
    return { error: mailError, refused: true };
  }
  const pagePath = readPagePath({ pageId });
  let url;
  try {
    url = buildPageUrl({ origin, pageId, path: pagePath, pathParams, urlQuery });
  } catch (error) {
    return { error: error.message, refused: true };
  }
  const resolved = await resolveJourneyDataSet({
    data,
    user,
    configDirectory: process.env.LOWDEFY_DIRECTORY_CONFIG ?? process.cwd(),
    buildDirectory: path.join(process.cwd(), 'build'),
    ...readDevAuthMode(),
  });
  if (!type.isUndefined(resolved.error)) {
    return { error: resolved.error, refused: true };
  }
  const { dataSet } = resolved;

  return withBrowserSlot({
    task: () =>
      runJourneyInBrowser({
        origin,
        basePath,
        pageId,
        pagePath,
        pathParams,
        url,
        user: resolved.user,
        dataSet,
        urlQuery,
        width,
        height,
        timeout,
        stepTimeout,
        mutantCookie,
        recording,
        by,
        steps,
        stateSelection,
        readConfigFile,
      }),
  });
}

// The part of runJourney that runs in the browser, inside a browser slot.
async function runJourneyInBrowser({
  origin,
  basePath,
  pageId,
  pagePath,
  pathParams,
  url,
  user,
  dataSet,
  urlQuery,
  width,
  height,
  timeout,
  stepTimeout,
  mutantCookie,
  recording,
  by,
  steps,
  stateSelection,
  readConfigFile,
}) {
  // The data session opens before the browser is fetched: a data set that fails
  // to load is refused without launching a browser for nothing.
  let session = null;
  let loadMs;
  if (!type.isUndefined(dataSet)) {
    try {
      await getDataStore();
    } catch (error) {
      return { error: `Could not start the journey data store: ${error.message}` };
    }
    const loadStart = Date.now();
    try {
      session = await openDataSession({ dataSet });
    } catch (error) {
      return { error: error.message, refused: true };
    }
    loadMs = Date.now() - loadStart;
  }

  let browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    if (session !== null) {
      await session.close();
    }
    return { error: noBrowserError(error) };
  }

  // Every run carries an identity, recorded or not, so the errors it causes
  // collect in its own buffer from its first request (see runErrorBuffers).
  const runRecording = journeyRunRecording({ recording, by });
  const runBuffer = { run: runRecording.run.id, journey: runRecording.run.journey };
  registerRunBuffer(runBuffer);
  const appErrors = createJourneyAppErrors({
    origin,
    basePath,
    recording: runRecording,
    configDirectory: process.env.LOWDEFY_DIRECTORY_CONFIG ?? process.cwd(),
  });
  let journey;
  try {
    const opened = await openJourney({
      browser,
      origin,
      basePath,
      pageId,
      path: pagePath,
      pathParams,
      user,
      urlQuery,
      width,
      height,
      timeout,
      stepTimeout,
      dataCookie: session?.cookie,
      mutantCookie,
      users: dataSet?.users,
      recording: runRecording,
      onContext: appErrors.onContext,
    });
    journey = opened.journey;
    journey.recording = runRecording;
    journey.appErrors = appErrors;
    const { results, screenshots, failure } = await runJourneySteps({ journey, steps });
    const state = await readFinalState({ page: journey.actors.current().page });
    const exercised = await collectExercised({
      snapshots: journey.actors.networkSnapshots(),
      observed: journey.actors.observed(),
      readConfigFile,
      requestSchemas: await readConfigFile('plugins/requestSchemas.json'),
    });
    const result = {
      pageId,
      passed: type.isUndefined(failure),
      steps: results,
      screenshots,
      ...selectFinalState({ state, selection: stateSelection }),
      exercised,
    };
    if (!type.isUndefined(failure)) {
      result.failure = failure;
    }
    if (!type.isUndefined(dataSet)) {
      result.data = describeDataSetResult({ dataSet, loadMs });
      result.warnings = dataSet.warnings;
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
      if (runRecording.record !== false) {
        await journey.actors.flushRecordings();
      }
      await journey.actors.closeAll();
    }
    releaseRunBuffer(runBuffer);
    // After the actors: no browser request still carries the data cookie. close() then waits for
    // the session's background work before it drops the database. openJourney closed its own
    // actors when the first page failed to open.
    if (session !== null) {
      await session.close();
    }
  }
}

export default runJourney;
