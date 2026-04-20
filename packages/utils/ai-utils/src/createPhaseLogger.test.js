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

import createPhaseLogger from './createPhaseLogger.js';

function makeLogger() {
  const debug = jest.fn();
  return { debug };
}

test('returns a noop logger when no logger is supplied', async () => {
  const p = createPhaseLogger();
  expect(() => p.phase('x')).not.toThrow();
  const result = await p.time('task', async () => 42);
  expect(result).toBe(42);
  const child = p.child({ foo: 'bar' });
  expect(() => child.phase('y')).not.toThrow();
});

test('phase emits event agent_phase with ids, dt, t', () => {
  const logger = makeLogger();
  const p = createPhaseLogger({
    logger,
    agentId: 'a1',
    pageId: 'p1',
    conversationId: 'c1',
    turnId: 't1',
    turnStart: Date.now(),
  });
  p.phase('ingress.received', { bodySize: 128 });
  expect(logger.debug).toHaveBeenCalledTimes(1);
  const arg = logger.debug.mock.calls[0][0];
  expect(arg.event).toBe('agent_phase');
  expect(arg.phase).toBe('ingress.received');
  expect(arg.agentId).toBe('a1');
  expect(arg.pageId).toBe('p1');
  expect(arg.conversationId).toBe('c1');
  expect(arg.turnId).toBe('t1');
  expect(typeof arg.dt).toBe('number');
  expect(arg.dt).toBeGreaterThanOrEqual(0);
  expect(typeof arg.t).toBe('string');
  expect(arg.bodySize).toBe(128);
});

test('dt is monotonic across successive phases', async () => {
  const logger = makeLogger();
  const p = createPhaseLogger({ logger, turnStart: Date.now() });
  p.phase('a');
  await new Promise((r) => setTimeout(r, 5));
  p.phase('b');
  const [a, b] = logger.debug.mock.calls.map((c) => c[0].dt);
  expect(b).toBeGreaterThanOrEqual(a);
});

test('time emits start and done with duration on success', async () => {
  const logger = makeLogger();
  const p = createPhaseLogger({ logger });
  const result = await p.time('work', async () => {
    await new Promise((r) => setTimeout(r, 5));
    return 'ok';
  });
  expect(result).toBe('ok');
  const phases = logger.debug.mock.calls.map((c) => c[0].phase);
  expect(phases).toEqual(['work.start', 'work.done']);
  expect(logger.debug.mock.calls[1][0].duration).toBeGreaterThanOrEqual(0);
});

test('time emits start and error with duration on failure', async () => {
  const logger = makeLogger();
  const p = createPhaseLogger({ logger });
  await expect(
    p.time('work', async () => {
      throw new Error('boom');
    })
  ).rejects.toThrow('boom');
  const phases = logger.debug.mock.calls.map((c) => c[0].phase);
  expect(phases).toEqual(['work.start', 'work.error']);
  const errArg = logger.debug.mock.calls[1][0];
  expect(errArg.err.message).toBe('boom');
  expect(typeof errArg.duration).toBe('number');
});

test('child merges extra fields into every emitted phase', () => {
  const logger = makeLogger();
  const p = createPhaseLogger({ logger, agentId: 'a', turnStart: Date.now() });
  const c = p.child({ endpointId: 'ep1' });
  c.phase('tool.endpoint.exec.start');
  const arg = logger.debug.mock.calls[0][0];
  expect(arg.agentId).toBe('a');
  expect(arg.endpointId).toBe('ep1');
});
