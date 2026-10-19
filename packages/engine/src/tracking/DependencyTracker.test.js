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

import DependencyTracker from './DependencyTracker.js';

// These tests are about the tracker itself, so they hold when the suite runs with test:full.
let trackerEnabled;
beforeAll(() => {
  trackerEnabled = DependencyTracker.enabled;
  DependencyTracker.enabled = true;
});
afterAll(() => {
  DependencyTracker.enabled = trackerEnabled;
});

function createTracker(lowdefy = {}) {
  const context = { _internal: { lowdefy: { _internal: {}, ...lowdefy } } };
  const tracker = new DependencyTracker(context);
  return { context, tracker };
}

test('DependencyTracker leaves readRecorder null outside a recording', () => {
  const { context, tracker } = createTracker();
  expect(context._internal.readRecorder).toBe(null);
  tracker.beginUpdate();
  expect(context._internal.readRecorder).toBe(null);
});

test('DependencyTracker stacks recorders so a nested recording never leaks into the outer one', () => {
  const { context, tracker } = createTracker();
  tracker.beginUpdate();
  const outer = tracker.startRecording();
  expect(context._internal.readRecorder).toBe(outer);
  outer.read('state:a');

  const inner = tracker.startRecording();
  expect(context._internal.readRecorder).toBe(inner);
  context._internal.readRecorder.read('state:b');
  tracker.stopRecording(inner);

  expect(context._internal.readRecorder).toBe(outer);
  context._internal.readRecorder.read('state:c');
  tracker.stopRecording(outer);

  expect(context._internal.readRecorder).toBe(null);
  expect([...outer.reads]).toEqual(['state:a', 'state:c']);
  expect([...inner.reads]).toEqual(['state:b']);
});

test('DependencyTracker records nothing when tracking is switched off', () => {
  const { context, tracker } = createTracker({ _internal: { dependencyTracking: false } });
  tracker.beginUpdate({ changes: ['state:a'] });
  expect(tracker.startRecording()).toBe(null);
  expect(context._internal.readRecorder).toBe(null);
});

test('DependencyTracker recorder counts parser calls but not engine reads', () => {
  const { tracker } = createTracker();
  tracker.beginUpdate();
  const recorder = tracker.startRecording();
  recorder.engineRead('state:input');
  expect(recorder.parserCalls).toBe(0);
  recorder.read('state:a\\.b');
  recorder.volatile('_random');
  recorder.untracked('_plugin has no tracking declaration');
  recorder.pure();
  expect(recorder.parserCalls).toBe(4);
  expect([...recorder.reads]).toEqual(['state:input', 'state:a.b']);
  expect(recorder.volatileReasons).toEqual(['_random']);
  expect(recorder.untrackedReasons).toEqual(['_plugin has no tracking declaration']);
  tracker.stopRecording(recorder);
});

test('DependencyTracker recorder treats a non-string read key as untracked', () => {
  const { tracker } = createTracker();
  tracker.beginUpdate();
  const recorder = tracker.startRecording();
  recorder.read({ path: 'a' });
  expect(recorder.untrackedReasons.length).toBe(1);
  tracker.stopRecording(recorder);
});

test('DependencyTracker runs a bare update as a full pass', () => {
  const { tracker } = createTracker();
  tracker.reportChange('state:a');
  expect(tracker.beginUpdate()).toEqual({ full: true, changes: ['state:a'] });
});

test('DependencyTracker runs an update with changes as a tracked pass over every reported change', () => {
  const { tracker } = createTracker();
  tracker.reportChange('state:a');
  expect(tracker.beginUpdate({ changes: ['request:r1'] })).toEqual({
    full: false,
    changes: ['state:a', 'request:r1'],
  });
  expect(tracker.beginUpdate({ changes: [] })).toEqual({ full: false, changes: [] });
});

test('DependencyTracker turns the next update into a full pass after requireFullUpdate', () => {
  const { tracker } = createTracker();
  tracker.requireFullUpdate();
  expect(tracker.beginUpdate({ changes: ['state:a'] }).full).toBe(true);
  expect(tracker.beginUpdate({ changes: ['state:a'] }).full).toBe(false);
});

test('DependencyTracker runs full passes when the app switches tracking off', () => {
  const { tracker } = createTracker({ lowdefyApp: { dependencyTracking: false } });
  expect(tracker.beginUpdate({ changes: ['state:a'] }).full).toBe(true);
});

test('DependencyTracker runs full passes when the session switch is set', () => {
  const window = { __lowdefyFullEvaluation: true };
  const { tracker } = createTracker({ _internal: { globals: { window } } });
  expect(tracker.beginUpdate({ changes: ['state:a'] }).full).toBe(true);
  window.__lowdefyFullEvaluation = false;
  expect(tracker.beginUpdate({ changes: ['state:a'] }).full).toBe(false);
});

test('DependencyTracker runs full passes when the static test switch is off', () => {
  const { tracker } = createTracker();
  const enabled = DependencyTracker.enabled;
  DependencyTracker.enabled = false;
  try {
    expect(tracker.beginUpdate({ changes: ['state:a'] }).full).toBe(true);
  } finally {
    DependencyTracker.enabled = enabled;
  }
});

test('DependencyTracker hands changes reported after a take to the next take', () => {
  const { tracker } = createTracker();
  tracker.beginUpdate({ changes: ['state:a'] });
  tracker.reportChange('state:b');
  expect(tracker.takeChanges()).toEqual(['state:b']);
  expect(tracker.takeChanges()).toEqual([]);
});
