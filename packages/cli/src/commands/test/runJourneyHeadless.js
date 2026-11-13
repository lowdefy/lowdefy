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
import { classifyJourney } from '@lowdefy/node-utils';

import checkJourneyItem from './checkJourneyItem.js';
import readHeadlessUser from './readHeadlessUser.js';

// The browser runner's default step timeout (the dev server's runJourney).
const DEFAULT_STEP_TIMEOUT = 5000;

// Runs one discovered journey headless on the app's production build, in this process: its pages
// on the client engine in Node and its calls in process, on a fresh session of its data set
// (@lowdefy/journey-headless' build host). Answers in the result shape runJourney gives the
// reporter. A journey that needs a browser (classifyJourney, or an action the runner reaches
// that only a browser can carry out) answers `browserOnly` ({ index, step, reason }) and is
// neither passed nor failed.
async function runJourneyHeadless({ context, item }) {
  const { filePath, journey } = item;
  const refused = checkJourneyItem({ item });
  if (!type.isUndefined(refused)) {
    return refused;
  }
  const name = journey.name;
  const stepCount = journey.steps.length;
  const classification = classifyJourney({ journey });
  if (!classification.headless) {
    const { index, reason, step } = classification;
    return {
      name,
      filePath,
      passed: false,
      stepCount,
      durationMs: 0,
      browserOnly: { index, reason, step },
    };
  }
  // Loaded only for a headless run: it brings the client engine and the test harness.
  const { createBuildHost, runHeadlessJourney } = await import('@lowdefy/journey-headless');
  const start = Date.now();
  const user = readHeadlessUser({ user: journey.user });
  let host;
  try {
    host = await createBuildHost({
      configDirectory: context.directories.config,
      data: journey.data,
      serverDirectory: context.directories.server,
      user,
    });
  } catch (error) {
    // The journey's data set or user could not be opened; every repeat would fail the same way.
    return {
      name,
      filePath,
      passed: false,
      refused: true,
      stepCount,
      durationMs: Date.now() - start,
      message: error.message,
    };
  }
  let result;
  try {
    result = await runHeadlessJourney({
      configDirectory: context.directories.config,
      host,
      journey: { ...journey, user },
      stepTimeout: journey.timeout ?? DEFAULT_STEP_TIMEOUT,
    });
  } finally {
    await host.close();
  }
  const durationMs = Date.now() - start;
  if (!type.isNone(result.error)) {
    return { name, filePath, passed: false, stepCount, durationMs, message: result.error };
  }
  if (!type.isNone(result.browserOnly)) {
    return {
      name,
      filePath,
      passed: false,
      stepCount,
      durationMs,
      browserOnly: result.browserOnly,
    };
  }
  if (result.passed === true) {
    const passed = { name, filePath, passed: true, stepCount, durationMs };
    // Evidence is read from the file for the PASS line.
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
    failure: result.failure,
    message: result.failure?.message,
  };
}

export default runJourneyHeadless;
