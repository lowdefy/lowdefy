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
    'subscribe',
  ]);
  expect(trace.actionView.subscribe).toBe(trace.subscribe);
  expect(trace.actionView.describeElement).toBe(trace.describeElement);
  expect(trace.actionView.describeChain).toBe(trace.describeChain);
  expect(trace.actionView.pageIdOf).toBe(trace.pageIdOf);
  expect(trace.actionView.emit).toBeUndefined();
  expect(trace.actionView.wantsState).toBeUndefined();
  expect(trace.actionView).toBe(trace.actionView);
});
