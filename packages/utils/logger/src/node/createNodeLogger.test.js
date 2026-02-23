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

import pino from 'pino';
import createNodeLogger from './createNodeLogger.js';

function createSink() {
  const lines = [];
  const destination = pino.destination({ dest: 1, sync: true });
  // Override write to capture JSON lines instead of writing to stdout
  destination.write = (data) => {
    lines.push(JSON.parse(data));
    return true;
  };
  return { lines, destination };
}

test('createNodeLogger outputs JSON with msg and merge fields', () => {
  const { lines, destination } = createSink();
  const logger = createNodeLogger({ destination });
  logger.info({ color: 'blue' }, 'hello world');
  expect(lines).toHaveLength(1);
  expect(lines[0].msg).toBe('hello world');
  expect(lines[0].color).toBe('blue');
});

test('createNodeLogger serializes error with serializer', () => {
  const { lines, destination } = createSink();
  const logger = createNodeLogger({ destination });
  const err = new Error('test error');
  err.configKey = 'pages.0.blocks.1';
  logger.error({ err }, 'something failed');
  expect(lines).toHaveLength(1);
  expect(lines[0].err.message).toBe('test error');
  expect(lines[0].err.name).toBe('Error');
  expect(lines[0].err.stack).toBeDefined();
  expect(lines[0].err.configKey).toBe('pages.0.blocks.1');
});

test('createNodeLogger serializes error with cause as nested object', () => {
  const { lines, destination } = createSink();
  const logger = createNodeLogger({ destination });
  const cause = new Error('root cause');
  cause.code = 'ROOT';
  const err = new Error('wrapper', { cause });
  logger.error({ err }, 'something failed');
  expect(lines).toHaveLength(1);
  expect(lines[0].err.cause).toBeDefined();
  expect(lines[0].err.cause.message).toBe('root cause');
  expect(lines[0].err.cause.code).toBe('ROOT');
});

test('createNodeLogger does not crash on error with class instance property', () => {
  const { lines, destination } = createSink();
  const logger = createNodeLogger({ destination });
  class FakeAgent {
    constructor() {
      this.sockets = { self: this }; // circular reference
    }
  }
  const err = new Error('connection failed');
  err.agent = new FakeAgent();
  err.code = 'ECONNREFUSED';
  logger.error({ err }, 'HTTP error');
  expect(lines).toHaveLength(1);
  expect(lines[0].err.message).toBe('connection failed');
  expect(lines[0].err.code).toBe('ECONNREFUSED');
  expect(lines[0].err.agent).toBeUndefined();
});

test('createNodeLogger falls back to raw value when err is not an Error instance', () => {
  const { lines, destination } = createSink();
  const logger = createNodeLogger({ destination });
  const notAnError = { message: 'plain object', code: 'NOT_ERROR' };
  logger.error({ err: notAnError }, 'non-error passed');
  expect(lines).toHaveLength(1);
  expect(lines[0].err.message).toBe('plain object');
  expect(lines[0].err.code).toBe('NOT_ERROR');
});

test('createNodeLogger child includes child bindings', () => {
  const { lines, destination } = createSink();
  const logger = createNodeLogger({ destination });
  const child = logger.child({ requestId: 'req-123' });
  child.info('from child');
  expect(lines).toHaveLength(1);
  expect(lines[0].msg).toBe('from child');
  expect(lines[0].requestId).toBe('req-123');
});
