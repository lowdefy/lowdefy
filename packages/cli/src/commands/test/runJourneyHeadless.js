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

import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
async function timeAsync(name, fn) {
  const s = performance.now();
  try {
    return await fn();
  } finally {
    const r = globalThis.__ldfProf;
    if (r) {
      r.t[name] = (r.t[name] ?? 0) + performance.now() - s;
      r.c[name] = (r.c[name] ?? 0) + 1;
    }
  }
}
import { type } from '@lowdefy/helpers';
import { classifyJourney } from '@lowdefy/node-utils';

import checkJourneyItem from './checkJourneyItem.js';
import readHeadlessUser from './readHeadlessUser.js';

// The browser runner's default step timeout (the dev server's runJourney).
const DEFAULT_STEP_TIMEOUT = 5000;

// Runs one discovered journey headless on the app's production build, in this process: its pages
// on the client engine in Node and its calls in process, on a fresh session of its data set on
// the run's one test app, `app` (@lowdefy/journey-headless' build host), with the journey's stubs
// set on that session. An unknown data set or
// user refuses this journey alone. Answers in the result shape runJourney gives the reporter. A
// journey that needs a browser (classifyJourney, or an action the runner reaches that only a
// browser can carry out) answers `browserOnly` ({ index, step, reason }, or { phase: 'open',
// reason } when opening the page reached it) and is neither passed nor failed.
async function runJourneyHeadless(args) {
  const prof = { t: {}, c: {}, steps: [] };
  globalThis.__ldfProf = prof;
  const cpu0 = process.cpuUsage();
  const elu0 = performance.eventLoopUtilization();
  const w0 = performance.now();
  const result = await runJourneyHeadlessInner(args);
  const elu = performance.eventLoopUtilization(elu0);
  const cpu = process.cpuUsage(cpu0);
  globalThis.__ldfProf = null;
  if (process.env.LDF_PROF_FILE) {
    fs.appendFileSync(process.env.LDF_PROF_FILE, JSON.stringify({ file: args.item.filePath, name: result.name, passed: result.passed, browserOnly: result.browserOnly ?? null, refused: result.refused ?? false, durationMs: result.durationMs, wall: performance.now() - w0, cpuMs: (cpu.user + cpu.system) / 1000, idleMs: elu.idle, activeMs: elu.active, data: args.item.journey?.data ?? null, stepCount: result.stepCount, ...prof }) + '\n');
  }
  return result;
}

async function runJourneyHeadlessInner({ app, context, item }) {
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
  const { createBuildHost, runHeadlessJourney } = await timeAsync('import.journeyHeadless', () => import('@lowdefy/journey-headless'));
  const start = Date.now();
  const user = readHeadlessUser({ user: journey.user });
  let host;
  try {
    host = await timeAsync('host.create', () => createBuildHost({ app, data: journey.data, stubs: journey.stubs, user }));
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
    result = await timeAsync('j.run', () => runHeadlessJourney({
      configDirectory: context.directories.config,
      host,
      journey: { ...journey, user },
      stepTimeout: journey.timeout ?? DEFAULT_STEP_TIMEOUT,
    }));
  } finally {
    await timeAsync('host.close', () => host.close());
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
