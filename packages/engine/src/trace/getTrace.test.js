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

import getTrace from './getTrace.js';

test('getTrace creates the registry on first use and keeps it on lowdefy', () => {
  const lowdefy = {};
  const trace = getTrace(lowdefy);
  expect(lowdefy._trace).toBe(trace);
  expect(getTrace(lowdefy)).toBe(trace);
});

test('getTrace returns the same registry after lowdefy._internal is replaced', () => {
  const lowdefy = { _internal: { initialised: true } };
  const trace = getTrace(lowdefy);
  lowdefy._internal = { initialised: true };
  expect(getTrace(lowdefy)).toBe(trace);
});

test('getTrace accepts subscribers before lowdefy is initialised', () => {
  const lowdefy = {};
  const listener = jest.fn();
  getTrace(lowdefy).subscribe(listener);
  lowdefy._internal = { initialised: true };
  getTrace(lowdefy).emit({ blockId: 'button' });
  expect(listener).toHaveBeenCalledWith({ blockId: 'button', stateBefore: undefined });
});

test('trace emit calls listeners in subscription order', () => {
  const trace = getTrace({});
  const calls = [];
  trace.subscribe(() => calls.push('first'));
  trace.subscribe(() => calls.push('second'));
  trace.emit({});
  expect(calls).toEqual(['first', 'second']);
});

test('trace unsubscribe stops a listener', () => {
  const trace = getTrace({});
  const listener = jest.fn();
  const unsubscribe = trace.subscribe(listener);
  unsubscribe();
  trace.emit({});
  expect(listener).not.toHaveBeenCalled();
});

test('trace wantsPayload is true for any event only while a listener is subscribed', () => {
  const trace = getTrace({});
  trace.subscribe(() => {}, { replay: true });
  const unsubscribe = trace.subscribe(() => {});
  expect(trace.wantsPayload({ success: true })).toBe(true);
  expect(trace.wantsPayload({ success: false })).toBe(true);
  unsubscribe();
  expect(trace.wantsPayload({ success: true })).toBe(true);
});

test('trace wantsPayload with no subscribers is false for a success and true for a failure while holding', () => {
  const trace = getTrace({});
  expect(trace.wantsPayload({ success: true })).toBe(false);
  expect(trace.wantsPayload({ success: false })).toBe(true);
});

test('trace wantsPayload is false for a failure once the held failures are full', () => {
  const trace = getTrace({});
  for (let i = 0; i < 20; i += 1) {
    trace.emit({ index: i, success: false });
  }
  expect(trace.wantsPayload({ success: false })).toBe(false);
});

test('trace wantsPayload is false for a failure with no subscribers after the replay subscriber left', () => {
  const trace = getTrace({});
  const unsubscribe = trace.subscribe(() => {}, { replay: true });
  unsubscribe();
  expect(trace.wantsPayload({ success: false })).toBe(false);
});

test('trace replay subscriber receives held failures in emit order before subscribe returns', () => {
  const trace = getTrace({});
  trace.emit({ blockId: 'a', success: false, stateBefore: { a: 1 } });
  trace.emit({ blockId: 'b', success: true });
  trace.emit({ blockId: 'c', success: false });
  const received = [];
  const unsubscribe = trace.subscribe((payload) => received.push(payload), { replay: true });
  expect(received).toEqual([
    { blockId: 'a', success: false, stateBefore: undefined },
    { blockId: 'c', success: false, stateBefore: undefined },
  ]);
  expect(typeof unsubscribe).toBe('function');
});

test('trace second replay subscriber receives no held failures and later failures go live', () => {
  const trace = getTrace({});
  trace.emit({ blockId: 'a', success: false });
  const first = [];
  const second = [];
  trace.subscribe((payload) => first.push(payload.blockId), { replay: true });
  trace.subscribe((payload) => second.push(payload.blockId), { replay: true });
  expect(second).toEqual([]);
  trace.emit({ blockId: 'b', success: false });
  expect(first).toEqual(['a', 'b']);
  expect(second).toEqual(['b']);
  const late = [];
  trace.subscribe((payload) => late.push(payload.blockId), { replay: true });
  expect(late).toEqual([]);
});

test('trace non-replay subscriber neither receives held failures nor ends the holding', () => {
  const trace = getTrace({});
  trace.emit({ blockId: 'a', success: false });
  const recorder = [];
  trace.subscribe((payload) => recorder.push(payload.blockId), { state: true });
  expect(recorder).toEqual([]);
  trace.emit({ blockId: 'b', success: false });
  expect(recorder).toEqual(['b']);
  const replayed = [];
  trace.subscribe((payload) => replayed.push(payload.blockId), { replay: true });
  expect(replayed).toEqual(['a', 'b']);
});

test('trace holds at most 20 failures and drops the 21st', () => {
  const trace = getTrace({});
  for (let i = 0; i < 21; i += 1) {
    trace.emit({ index: i, success: false });
  }
  const received = [];
  trace.subscribe((payload) => received.push(payload.index), { replay: true });
  expect(received).toEqual([...Array(20).keys()]);
});

test('trace throwing replay listener is warned once and does not stop subscribe', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const trace = getTrace({});
    trace.emit({ success: false });
    trace.emit({ success: false });
    const listener = jest.fn(() => {
      throw new Error('listener failed');
    });
    const unsubscribe = trace.subscribe(listener, { replay: true });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(typeof unsubscribe).toBe('function');
    trace.emit({ success: false });
    expect(listener).toHaveBeenCalledTimes(3);
    expect(warn).toHaveBeenCalledTimes(1);
  } finally {
    warn.mockRestore();
  }
});

test('trace wantsState is true only while a state subscriber is subscribed', () => {
  const trace = getTrace({});
  expect(trace.wantsState()).toBe(false);
  trace.subscribe(() => {});
  expect(trace.wantsState()).toBe(false);
  const unsubscribe = trace.subscribe(() => {}, { state: true });
  expect(trace.wantsState()).toBe(true);
  unsubscribe();
  expect(trace.wantsState()).toBe(false);
});

test('trace emit delivers stateBefore only to state subscribers', () => {
  const trace = getTrace({});
  const stateful = jest.fn();
  const stateless = jest.fn();
  trace.subscribe(stateful, { state: true });
  trace.subscribe(stateless);
  trace.emit({ blockId: 'button', stateBefore: { a: 1 } });
  expect(stateful).toHaveBeenCalledWith({ blockId: 'button', stateBefore: { a: 1 } });
  expect(stateless).toHaveBeenCalledWith({ blockId: 'button', stateBefore: undefined });
});

test('trace emit warns once for a throwing listener and runs the others', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const trace = getTrace({});
    const after = jest.fn();
    trace.subscribe(() => {
      throw new Error('listener failed');
    });
    trace.subscribe(after);
    trace.emit({});
    trace.emit({});
    expect(after).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(1);
  } finally {
    warn.mockRestore();
  }
});

test('trace actionView has subscribe and the describe functions and no engine-only members', () => {
  const trace = getTrace({});
  expect(Object.keys(trace.actionView).sort()).toEqual([
    'describeChain',
    'describeElement',
    'pageIdOf',
    'pathEntryOf',
    'subscribe',
  ]);
  expect(trace.actionView.subscribe).toBe(trace.subscribe);
  expect(trace.actionView.describeElement).toBe(trace.describeElement);
  expect(trace.actionView.describeChain).toBe(trace.describeChain);
  expect(trace.actionView.pageIdOf).toBe(trace.pageIdOf);
  expect(trace.actionView.pathEntryOf).toBe(trace.pathEntryOf);
  expect(trace.actionView.emit).toBeUndefined();
  expect(trace.actionView.wantsState).toBeUndefined();
  expect(trace.actionView.wantsPayload).toBeUndefined();
  expect(trace.actionView.hasSubscribers).toBeUndefined();
  expect(trace.actionView).toBe(trace.actionView);
});
