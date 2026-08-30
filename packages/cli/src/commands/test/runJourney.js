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

import axios from 'axios';
import { type } from '@lowdefy/helpers';

import validateJourney from './validateJourney.js';

function describeHttpError(error) {
  if (type.isNone(error.response)) {
    return `Could not reach the dev server: ${error.message}`;
  }
  const body = type.isString(error.response.data)
    ? error.response.data
    : JSON.stringify(error.response.data);
  return `POST /lowdefy-docs/journey responded ${error.response.status}: ${body}`;
}

// Runs one discovered journey against the dev server's REST journey route and
// normalises every outcome — schema failure, transport failure, non-2xx, a
// failed step — into the same result shape the reporter prints.
async function runJourney({ item, url }) {
  const { filePath, journey } = item;
  const name = journey?.name ?? filePath;
  if (!type.isNone(item.error)) {
    return { name, filePath, passed: false, stepCount: 0, durationMs: 0, message: item.error };
  }
  const validation = validateJourney({ journey });
  if (!validation.valid) {
    return {
      name,
      filePath,
      passed: false,
      stepCount: 0,
      durationMs: 0,
      message: `Invalid journey file: ${validation.message}`,
    };
  }
  const stepCount = journey.steps.length;
  const start = Date.now();
  let response;
  try {
    response = await axios.post(`${url}/lowdefy-docs/journey`, {
      pageId: journey.pageId,
      steps: journey.steps,
      user: journey.user,
      urlQuery: journey.urlQuery,
    });
  } catch (error) {
    return {
      name,
      filePath,
      passed: false,
      stepCount,
      durationMs: Date.now() - start,
      message: describeHttpError(error),
    };
  }
  const durationMs = Date.now() - start;
  const result = response.data ?? {};
  if (!type.isNone(result.error)) {
    return { name, filePath, passed: false, stepCount, durationMs, message: result.error };
  }
  if (result.passed === true) {
    return { name, filePath, passed: true, stepCount, durationMs };
  }
  return {
    name,
    filePath,
    passed: false,
    stepCount,
    durationMs,
    failure: result.failure,
    message: result.failure?.message,
  };
}

export default runJourney;
