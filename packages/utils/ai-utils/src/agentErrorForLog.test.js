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

import { expect, test } from 'vitest';
import { APICallError, InvalidToolInputError, RetryError, TypeValidationError } from 'ai';

import agentErrorForLog, { agentLogIds, stackFramesForLog } from './agentErrorForLog.js';

const chatText = 'My ID number is 8001015009087 and I live at 12 Oak Street';

function createValidationError() {
  return new TypeValidationError({
    value: [
      { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: chatText }] },
      { id: 'msg-2', role: 'assistant', parts: [] },
    ],
    cause: new Error('Message must contain at least one part'),
  });
}

test('a validation error that carries the conversation logs no message text', () => {
  const error = createValidationError();
  expect(error.message).toContain(chatText);

  const logged = agentErrorForLog(error);

  expect(JSON.stringify(logged)).not.toContain('8001015009087');
  expect(JSON.stringify(logged)).not.toContain('Oak Street');
  expect(logged).toEqual({
    name: 'AI_TypeValidationError',
    cause: { name: 'Error', message: 'Message must contain at least one part' },
  });
});

test('a tool input error, which repeats its cause, logs no tool input', () => {
  const error = new InvalidToolInputError({
    toolName: 'lookup-customer',
    toolInput: JSON.stringify({ idNumber: '8001015009087' }),
    cause: new TypeValidationError({
      value: { idNumber: '8001015009087' },
      cause: new Error('Expected number'),
    }),
  });
  expect(error.message).toContain('8001015009087');

  const logged = agentErrorForLog(error);

  expect(JSON.stringify(logged)).not.toContain('8001015009087');
  expect(logged).toEqual({
    name: 'AI_InvalidToolInputError',
    cause: {
      name: 'AI_TypeValidationError',
      cause: { name: 'Error', message: 'Expected number' },
    },
  });
});

test('a provider call error keeps the provider message and status but not the request', () => {
  const error = new APICallError({
    message: 'Overloaded',
    url: 'https://api.example.com/v1/messages',
    requestBodyValues: { messages: [{ role: 'user', content: chatText }] },
    statusCode: 529,
  });

  const logged = agentErrorForLog(error);

  expect(logged).toEqual({ name: 'AI_APICallError', message: 'Overloaded', statusCode: 529 });
});

test('a retry error is followed to the attempt that failed last', () => {
  const error = new RetryError({
    message: 'Failed after 3 attempts. Last error: Overloaded',
    reason: 'maxRetriesExceeded',
    errors: [
      new APICallError({ message: 'Overloaded', url: 'u', requestBodyValues: {}, statusCode: 529 }),
    ],
  });

  expect(agentErrorForLog(error)).toEqual({
    name: 'AI_RetryError',
    cause: { name: 'AI_APICallError', message: 'Overloaded', statusCode: 529 },
  });
});

test('any other error keeps its code and its message cut to 500 characters', () => {
  const error = new Error('x'.repeat(600));
  error.code = 'ECONNRESET';

  const logged = agentErrorForLog(error);

  expect(logged.name).toBe('Error');
  expect(logged.code).toBe('ECONNRESET');
  expect(logged.message).toBe(`${'x'.repeat(499)}…`);
  expect(logged.message).toHaveLength(500);
});

test('a value thrown that is not an error is named by its type', () => {
  expect(agentErrorForLog(chatText)).toEqual({ name: 'string' });
  expect(agentErrorForLog(null)).toEqual({ name: 'object' });
});

test('causes are followed three deep', () => {
  let error = new Error('level 4');
  for (let level = 3; level >= 0; level -= 1) {
    error = new Error(`level ${level}`, { cause: error });
  }
  expect(agentErrorForLog(error)).toEqual({
    name: 'Error',
    message: 'level 0',
    cause: {
      name: 'Error',
      message: 'level 1',
      cause: { name: 'Error', message: 'level 2', cause: { name: 'Error', message: 'level 3' } },
    },
  });
});

test('stack frames leave out the opening lines that repeat the message', () => {
  const error = createValidationError();

  const frames = stackFramesForLog(error);

  expect(frames.length).toBeGreaterThan(0);
  expect(frames.every((frame) => frame.startsWith('at '))).toBe(true);
  expect(JSON.stringify(frames)).not.toContain('8001015009087');
});

test('a message line that looks like a stack frame is left out', () => {
  const error = new Error('JSON parsing failed: Text: {\n    at 8001015009087\n}.');

  const frames = stackFramesForLog(error);

  expect(frames.length).toBeGreaterThan(0);
  expect(JSON.stringify(frames)).not.toContain('8001015009087');
});

test('log ids are the agent id and the conversation id', () => {
  expect(
    agentLogIds({
      agent: { agentId: 'support', properties: { instructions: 'Be kind.' } },
      context: { agentContext: { conversationId: 'conv-1', sharedState: { name: 'Ann' } } },
    })
  ).toEqual({ agentId: 'support', conversationId: 'conv-1' });
  expect(agentLogIds({ agent: { agentId: 'support' }, context: {} })).toEqual({
    agentId: 'support',
    conversationId: null,
  });
});
