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
import { findPlaceholderStep } from '@lowdefy/node-utils';

import httpFetch from '../../utils/httpFetch.js';
import readResponseBody from '../../utils/readResponseBody.js';
import recordingJourneyName from './recordingJourneyName.js';
import validateJourney from './validateJourney.js';

function describeErrorResponse({ status, data }) {
  const body = type.isString(data) ? data : JSON.stringify(data);
  return `POST /lowdefy-docs/journey responded ${status}: ${body}`;
}

// Runs one discovered journey against the dev server's REST journey route and
// normalises every outcome — schema failure, transport failure, non-2xx, a
// failed step — into the same result shape the reporter prints. `recordRun`
// (a trace id) asks the dev server to record this journey into that test
// run's trace; an older server ignores the field and records nothing. A harden
// run passes the config `mutant` to apply to this run's browsers.
async function runJourney({ context, item, url, recordRun, mutant }) {
  const { filePath, journey } = item;
  const name = journey?.name ?? filePath;
  if (!type.isNone(item.error)) {
    return {
      name,
      filePath,
      passed: false,
      refused: true,
      stepCount: 0,
      durationMs: 0,
      message: item.error,
    };
  }
  // A persona run is named `<name> [<user>]`; the name limit applies to the
  // name as authored, which expandPersonas validated, never to the run name.
  const validation = validateJourney({
    journey: type.isNone(item.personaOf) ? journey : { ...journey, name: item.personaOf.name },
  });
  if (!validation.valid) {
    return {
      name,
      filePath,
      passed: false,
      refused: true,
      stepCount: 0,
      durationMs: 0,
      message: `Invalid journey file: ${validation.message}`,
    };
  }
  const stepCount = journey.steps.length;
  // The dev server refuses a placeholder too; checking here reports it without
  // the round trip.
  const { error: placeholderError } = findPlaceholderStep({ steps: journey.steps });
  if (!type.isUndefined(placeholderError)) {
    return { name, filePath, passed: false, stepCount, durationMs: 0, message: placeholderError };
  }
  const start = Date.now();
  const body = {
    pageId: journey.pageId,
    pathParams: journey.pathParams,
    data: journey.data,
    steps: journey.steps,
    user: journey.user,
    urlQuery: journey.urlQuery,
    timeout: journey.timeout,
    mutant,
  };
  if (!type.isNone(recordRun)) {
    body.recording = {
      run: recordRun,
      journey: recordingJourneyName({
        configDirectory: context.directories.config,
        filePath,
        journey,
      }),
    };
  }
  let response;
  let result;
  try {
    // No timeout: the dev server bounds every step of the journey, and a journey's length grows
    // with its steps, so any fixed limit here would cut off a long journey that is still passing.
    response = await httpFetch({
      url: `${url}/lowdefy-docs/journey`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      timeoutMs: 0,
    });
    result = await readResponseBody(response);
  } catch (error) {
    return {
      name,
      filePath,
      passed: false,
      refused: false,
      stale: false,
      stepCount,
      durationMs: Date.now() - start,
      message: `Could not reach the dev server: ${error.message}`,
    };
  }
  const durationMs = Date.now() - start;
  if (!response.ok) {
    return {
      name,
      filePath,
      passed: false,
      // The route refuses a journey it cannot run (a 400) before any browser
      // opens; every repeat would be refused the same way.
      refused: response.status === 400,
      // The mutant was listed against another build.
      stale: result?.stale === true,
      stepCount,
      durationMs,
      message: describeErrorResponse({ status: response.status, data: result }),
    };
  }
  result = result ?? {};
  if (!type.isNone(result.error)) {
    return { name, filePath, passed: false, stepCount, durationMs, message: result.error };
  }
  // The data set the server loaded and its warnings (colliding connections, size advice).
  const dataSet = { data: result.data, warnings: result.warnings };
  if (result.passed === true) {
    const passed = {
      name,
      filePath,
      passed: true,
      stepCount,
      durationMs,
      ...dataSet,
      exercised: result.exercised,
      mutant: result.mutant,
    };
    // Evidence is read from the file for the PASS line; it is never sent to
    // the dev server.
    if (!type.isNone(journey.evidence)) {
      passed.evidence = journey.evidence;
    }
    return passed;
  }
  return {
    name,
    filePath,
    passed: false,
    stepCount,
    durationMs,
    ...dataSet,
    failure: result.failure,
    message: result.failure?.message,
    exercised: result.exercised,
    mutant: result.mutant,
  };
}

export default runJourney;
