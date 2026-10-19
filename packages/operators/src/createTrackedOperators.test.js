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

import { jest } from '@jest/globals';

import createTrackedOperators from './createTrackedOperators.js';

// Pure calls are counted apart from the events: they only prove the parser recorded the call.
function createRecorder() {
  const events = [];
  const recorder = {
    events,
    pureCalls: 0,
    pure: () => {
      recorder.pureCalls += 1;
    },
    read: (key) => events.push(['read', key]),
    untracked: (reason) => events.push(['untracked', reason]),
    volatile: (reason) => events.push(['volatile', reason]),
  };
  return recorder;
}

function createSetup() {
  const holder = { recorder: null };
  const _state = jest.fn(({ params }) => `state ${params}`);
  _state.tracking = { kind: 'read', keys: ({ params }) => [`state:${params}`] };
  const operators = { _state };
  const tracked = createTrackedOperators({ getRecorder: () => holder.recorder, operators });
  return { holder, operators, tracked };
}

test('tracked operators call through to the registry when no recorder is active', () => {
  const { operators, tracked } = createSetup();
  expect(tracked._state({ params: 'a' })).toBe('state a');
  expect(operators._state).toHaveBeenCalledWith({ params: 'a' });
});

test('tracked operators record reads into the active recorder', () => {
  const { holder, tracked } = createSetup();
  holder.recorder = createRecorder();
  expect(tracked._state({ params: 'a.b' })).toBe('state a.b');
  expect(holder.recorder.events).toEqual([['read', 'state:a.b']]);
});

test('tracked operators return the same wrapper on every access', () => {
  const { tracked } = createSetup();
  expect(tracked._state).toBe(tracked._state);
});

test('tracked operators see operators merged into the registry later', () => {
  const { holder, operators, tracked } = createSetup();
  expect(tracked._later).toBeUndefined();
  expect('_later' in tracked).toBe(false);
  const _later = () => 'later';
  _later.tracking = { kind: 'volatile' };
  operators._later = _later;
  holder.recorder = createRecorder();
  expect('_later' in tracked).toBe(true);
  expect(Object.prototype.hasOwnProperty.call(tracked, '_later')).toBe(true);
  expect(Object.keys(tracked)).toEqual(['_state', '_later']);
  expect(tracked._later({})).toBe('later');
  expect(holder.recorder.events).toEqual([['volatile', '_later']]);
});

test('tracked operators rewrap an operator replaced in the registry', () => {
  const { holder, operators, tracked } = createSetup();
  const first = tracked._state;
  const replacement = () => 'replaced';
  operators._state = replacement;
  holder.recorder = createRecorder();
  expect(tracked._state).not.toBe(first);
  expect(tracked._state({ params: 'a' })).toBe('replaced');
  expect(holder.recorder.events).toEqual([['untracked', '_state has no tracking declaration']]);
});

test('tracked operators pass non-function registry values through', () => {
  const { operators, tracked } = createSetup();
  operators.notAnOperator = { a: 1 };
  expect(tracked.notAnOperator).toBe(operators.notAnOperator);
});

test('a tracked operator marks the recorder untracked when it returns a function', () => {
  const holder = { recorder: createRecorder() };
  const _fn = () => () => 1;
  _fn.tracking = { kind: 'pure' };
  const tracked = createTrackedOperators({
    getRecorder: () => holder.recorder,
    operators: { _fn },
  });
  tracked._fn({});
  expect(holder.recorder.events).toEqual([['untracked', '_fn returned a function']]);
});

test('a tracked operator scans nested results only when the declaration asks', () => {
  const holder = { recorder: createRecorder() };
  const nested = () => [{ valueFormatter: () => 1 }];
  const _scanned = () => nested();
  _scanned.tracking = { kind: 'pure', resultMayContainFunctions: true };
  const _unscanned = () => nested();
  _unscanned.tracking = { kind: 'pure' };
  const tracked = createTrackedOperators({
    getRecorder: () => holder.recorder,
    operators: { _scanned, _unscanned },
  });
  tracked._unscanned({});
  expect(holder.recorder.events).toEqual([]);
  tracked._scanned({});
  expect(holder.recorder.events).toEqual([['untracked', '_scanned returned a function']]);
});

test('a tracked operator records its reads even when it throws', () => {
  const holder = { recorder: createRecorder() };
  const _throws = () => {
    throw new Error('Boom.');
  };
  _throws.tracking = { kind: 'read', keys: () => ['state:a'] };
  const tracked = createTrackedOperators({
    getRecorder: () => holder.recorder,
    operators: { _throws },
  });
  expect(() => tracked._throws({})).toThrow('Boom.');
  expect(holder.recorder.events).toEqual([['read', 'state:a']]);
});

test('a tracked operator signals pure for a pure call and for a read of no keys', () => {
  const holder = { recorder: createRecorder() };
  const _pure = () => 1;
  _pure.tracking = { kind: 'pure' };
  const _readsNothing = () => 2;
  _readsNothing.tracking = { kind: 'read', keys: () => [] };
  const tracked = createTrackedOperators({
    getRecorder: () => holder.recorder,
    operators: { _pure, _readsNothing },
  });
  tracked._pure({});
  tracked._readsNothing({});
  expect(holder.recorder.events).toEqual([]);
  expect(holder.recorder.pureCalls).toBe(2);
});

test('a tracked operator does not signal pure for a call that records a read', () => {
  const { holder, tracked } = createSetup();
  holder.recorder = createRecorder();
  tracked._state({ params: 'a' });
  expect(holder.recorder.pureCalls).toBe(0);
});
