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

import { UserError } from '@lowdefy/errors';
import { expect, test } from 'vitest';

import runTest from './test/runTest.js';

function step(stepId, type, properties) {
  return {
    id: `request:test_endpoint:${stepId}`,
    type,
    stepId,
    connectionId: 'test',
    properties,
  };
}

function timeoutReason() {
  return new DOMException('The request timeout of 30ms was exceeded.', 'TimeoutError');
}

// A routine whose request times out while its first step runs: the second step stands in for a
// write that must not happen once nobody waits for the routine.
test('a routine whose request times out between steps runs no further step', async () => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(timeoutReason()), 10);
  const routine = [
    step('slow_read', 'TestRequestWait', { ms: 50 }),
    step('write', 'TestRequest', { response: 'written' }),
  ];
  const { res, context, routineContext } = await runTest({
    routine,
    signal: controller.signal,
  });
  expect(res.status).toBe('error');
  expect(res.error).toBeInstanceOf(UserError);
  expect(res.error.message).toBe('The request timeout of 30ms was exceeded.');
  expect(routineContext.steps).toEqual({ slow_read: undefined });
  expect(Object.keys(routineContext.steps)).toEqual(['slow_read']);
  // Logged once, as a cancellation at debug: never a warning, an error or an error report.
  const cancelled = context.logger.debug.mock.calls.filter(
    ([fields]) => fields.event === 'debug_request_cancelled'
  );
  expect(cancelled).toHaveLength(1);
  expect(context.logger.warn).not.toHaveBeenCalled();
  expect(context.logger.error).not.toHaveBeenCalled();
});

test('a routine whose request closed before it started runs no step', async () => {
  const controller = new AbortController();
  controller.abort(
    new DOMException('The client closed the connection before the response was sent.', 'AbortError')
  );
  const { res, routineContext } = await runTest({
    routine: [step('write', 'TestRequest', { response: 'written' })],
    signal: controller.signal,
  });
  expect(res.status).toBe('error');
  expect(res.error.message).toBe('The client closed the connection before the response was sent.');
  expect(routineContext.steps).toEqual({});
});

test('a :catch and :finally do not run their steps once the request timed out', async () => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(timeoutReason()), 10);
  const routine = [
    {
      ':try': [
        step('slow_read', 'TestRequestWait', { ms: 50 }),
        step('write', 'TestRequest', { response: 'written' }),
      ],
      ':catch': [step('catch_write', 'TestRequest', { response: 'caught' })],
      ':finally': [step('finally_write', 'TestRequest', { response: 'finally' })],
    },
    step('after_write', 'TestRequest', { response: 'after' }),
  ];
  const { res, context, routineContext } = await runTest({ routine, signal: controller.signal });
  expect(res.status).toBe('error');
  expect(Object.keys(routineContext.steps)).toEqual(['slow_read']);
  // One cancellation, logged once, however many controls it stops.
  const cancelled = context.logger.debug.mock.calls.filter(
    ([fields]) => fields.event === 'debug_request_cancelled'
  );
  expect(cancelled).toHaveLength(1);
});

test('a routine with a signal that never aborts runs every step', async () => {
  const controller = new AbortController();
  const routine = [
    step('read', 'TestRequest', { response: 'read' }),
    step('write', 'TestRequest', { response: 'written' }),
  ];
  const { res, routineContext } = await runTest({ routine, signal: controller.signal });
  expect(res.status).toBe('continue');
  expect(routineContext.steps).toEqual({ read: 'read', write: 'written' });
});
