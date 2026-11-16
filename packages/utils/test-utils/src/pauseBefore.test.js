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

import { beforeEach, expect, test, vi } from 'vitest';

import holdAtStep from './holdAtStep.js';
import pauseBefore from './pauseBefore.js';
import releasePauseGates from './releasePauseGates.js';

let testSession;
let resolver;
let held;

async function isSettled(promise) {
  const pending = Symbol('pending');
  const winner = await Promise.race([
    promise,
    new Promise((resolve) => setImmediate(resolve, pending)),
  ]);
  return winner !== pending;
}

beforeEach(() => {
  testSession = { closed: false, gates: new Map(), held: new Set() };
  resolver = vi.fn(async (args) => `ran ${args.requestId}`);
  resolver.meta = { checkWrite: true };
  held = holdAtStep({ resolver, testSession });
});

test('pauseBefore holds the first routine to reach the step until it is released, before its request runs', async () => {
  const gate = pauseBefore({ stepId: 'insert_run', testSession });
  expect(await isSettled(gate.reached)).toBe(false);
  const first = held({ requestId: 'insert_run' });
  await gate.reached;
  expect(resolver).not.toHaveBeenCalled();
  expect(await isSettled(first)).toBe(false);
  gate.release();
  expect(await first).toEqual('ran insert_run');
  expect(resolver).toHaveBeenCalledTimes(1);
});

test('pauseBefore holds one routine: a second one reaching the step runs straight through', async () => {
  const gate = pauseBefore({ stepId: 'insert_run', testSession });
  const first = held({ requestId: 'insert_run' });
  await gate.reached;
  expect(await held({ requestId: 'insert_run' })).toEqual('ran insert_run');
  expect(await isSettled(first)).toBe(false);
  gate.release();
  await first;
  expect(resolver).toHaveBeenCalledTimes(2);
});

test('pauseBefore leaves other steps alone', async () => {
  pauseBefore({ stepId: 'insert_run', testSession });
  expect(await held({ requestId: 'load_run' })).toEqual('ran load_run');
});

test('pauseBefore gates on one step hold one routine each, in the order they were set', async () => {
  const one = pauseBefore({ stepId: 'insert_run', testSession });
  const two = pauseBefore({ stepId: 'insert_run', testSession });
  const first = held({ requestId: 'insert_run' });
  const second = held({ requestId: 'insert_run' });
  await Promise.all([one.reached, two.reached]);
  two.release();
  expect(await second).toEqual('ran insert_run');
  expect(await isSettled(first)).toBe(false);
  one.release();
  await first;
});

test('pauseBefore released before any routine arrives holds nothing', async () => {
  const gate = pauseBefore({ stepId: 'insert_run', testSession });
  gate.release();
  expect(await held({ requestId: 'insert_run' })).toEqual('ran insert_run');
});

test('pauseBefore refuses a step id that is not a string and a closed session', () => {
  expect(() => pauseBefore({ stepId: undefined, testSession })).toThrow(
    'pauseBefore takes a step id. Received undefined.'
  );
  testSession.closed = true;
  expect(() => pauseBefore({ stepId: 'insert_run', testSession })).toThrow('The session is closed');
});

test('holdAtStep keeps the schema and meta of the resolver it wraps', () => {
  expect(held.meta).toBe(resolver.meta);
});

test('releasePauseGates lets go of a held routine and removes the gates no routine reached', async () => {
  const reachedGate = pauseBefore({ stepId: 'insert_run', testSession });
  pauseBefore({ stepId: 'never_reached', testSession });
  const first = held({ requestId: 'insert_run' });
  await reachedGate.reached;
  releasePauseGates({ testSession });
  expect(await first).toEqual('ran insert_run');
  expect(await held({ requestId: 'never_reached' })).toEqual('ran never_reached');
  expect(testSession.gates.size).toEqual(0);
  expect(testSession.held.size).toEqual(0);
});
