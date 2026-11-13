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
import { runHeadlessJourney } from '@lowdefy/journey-headless';
import {
  classifyJourney,
  findPlaceholderStep,
  normaliseJourneySteps,
  validateJourneySteps,
} from '@lowdefy/node-utils';
import { getDataStore, openDataSession } from '@lowdefy/test-utils/dataSets';

import collectExercised from './collectExercised.js';
import createDevServerHost from './createDevServerHost.js';
import createJourneyObservations from './createJourneyObservations.js';
import createNetworkCounter from './createNetworkCounter.js';
import describeDataSetResult from './dataSets/describeDataSetResult.js';
import describePageNeed from './describePageNeed.js';
import journeyRunRecording from './journeyRunRecording.js';
import readBuildArtifact from './readBuildArtifact.js';
import readDevAuthMode from './readDevAuthMode.js';
import resolveJourneyDataSet from './dataSets/resolveJourneyDataSet.js';
import selectFinalState from './selectFinalState.js';
import validateJourneyTimeout from './validateJourneyTimeout.js';
import validateStateSelection from './validateStateSelection.js';
import createLogger from '../server/log/createLogger.js';

const logger = createLogger();

function defaultReadConfigFile(name) {
  return readBuildArtifact({ name, deserialize: true });
}

// The events a headless journey completed, as a browser journey's observer reports them.
function toObservedEvent(payload) {
  return {
    kind: 'event',
    scope: payload.scope,
    pageId: payload.pageId,
    blockId: payload.blockId,
    eventName: payload.eventName,
    actionIds: (payload.actions ?? []).map((action) => action?.id),
  };
}

// runJourney's headless twin: runs a journey on the dev server with no browser, through
// @lowdefy/journey-headless on createDevServerHost, so it takes no browser slot. Its pages and
// calls run in this process on the journey's data session, with the run's mutant applied, and it
// answers in runJourney's shape ({ pageId, passed, steps, state, failure?, exercised, data? }).
// A journey whose steps need a browser answers { pageId, browserOnly: { index, step, reason },
// steps: [] }, before any data is loaded; one that reaches an action only a browser can carry out
// answers browserOnly for that step. Refusals ({ error, refused }) are runJourney's.
async function runJourneyHeadless({
  origin,
  pageId,
  pathParams,
  steps: inputSteps,
  user,
  urlQuery,
  state: stateSelection,
  stepTimeout = 5000,
  mutantCookie,
  data,
  recording,
  by,
  readConfigFile = defaultReadConfigFile,
}) {
  const { error: stepsError } = validateJourneySteps({ steps: inputSteps });
  if (!type.isUndefined(stepsError)) {
    return { error: stepsError };
  }
  if (type.isUndefined(pageId)) {
    const pageError = describePageNeed({ steps: inputSteps });
    if (!type.isUndefined(pageError)) {
      return { error: `runJourney ${pageError}`, refused: true };
    }
  }
  const steps = normaliseJourneySteps({ steps: inputSteps });
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
  const journey = { pageId, pathParams, urlQuery, steps };
  const classification = classifyJourney({ journey });
  if (!classification.headless) {
    const { index, reason, step } = classification;
    return { pageId: pageId ?? null, browserOnly: { index, reason, step }, steps: [] };
  }
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG ?? process.cwd();
  const resolved = await resolveJourneyDataSet({
    data,
    user,
    configDirectory,
    buildDirectory: path.join(process.cwd(), 'build'),
    ...readDevAuthMode(),
  });
  if (!type.isUndefined(resolved.error)) {
    return { error: resolved.error, refused: true };
  }
  const { dataSet } = resolved;
  let session;
  let store;
  let loadMs;
  if (!type.isUndefined(dataSet)) {
    try {
      store = await getDataStore({ logger });
    } catch (error) {
      return { error: `Could not start the journey data store: ${error.message}` };
    }
    const loadStart = Date.now();
    try {
      session = await openDataSession({ dataSet, logger });
    } catch (error) {
      return { error: error.message, refused: true };
    }
    loadMs = Date.now() - loadStart;
  }
  const counter = createNetworkCounter({ origin, basePath: '' });
  const observations = createJourneyObservations();
  try {
    const host = await createDevServerHost({
      counter,
      dataSet,
      mutantCookie,
      origin,
      recording: journeyRunRecording({ recording, by }),
      session,
      store,
      user: resolved.user,
    });
    const ran = await runHeadlessJourney({
      configDirectory,
      host,
      journey,
      onTrace: (payload) => observations.receive(toObservedEvent(payload)),
      stepTimeout,
    });
    if (!type.isUndefined(ran.error)) {
      return { error: ran.error };
    }
    if (!type.isUndefined(ran.browserOnly)) {
      return { pageId: ran.pageId ?? null, browserOnly: ran.browserOnly, steps: ran.steps };
    }
    const result = {
      pageId: ran.pageId ?? null,
      passed: ran.passed,
      steps: ran.steps,
      screenshots: [],
      ...(type.isUndefined(pageId)
        ? {}
        : selectFinalState({ state: ran.state, selection: stateSelection })),
      exercised: await collectExercised({
        snapshots: [counter.snapshot()],
        observed: observations.snapshot(),
        readConfigFile,
        requestSchemas: await readConfigFile('plugins/requestSchemas.json'),
      }),
      headless: true,
    };
    if (!type.isUndefined(ran.failure)) {
      result.failure = ran.failure;
    }
    if (!type.isUndefined(dataSet)) {
      result.data = describeDataSetResult({ dataSet, loadMs });
      result.warnings = dataSet.warnings;
    }
    if ((session?.sunk?.length ?? 0) > 0) {
      result.sunk = session.sunk;
    }
    return result;
  } finally {
    if (!type.isUndefined(session)) {
      await session.close();
    }
  }
}

export default runJourneyHeadless;
