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

import authorizeAgent from './authorizeAgent.js';
import testContext from '../../test/testContext.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('authorizeAgent allows a public agent without a session', () => {
  const context = testContext({ logger });
  const agentConfig = { agentId: 'my-agent', auth: { public: true } };
  expect(() => authorizeAgent(context, { agentConfig })).not.toThrow();
});

test('authorizeAgent rejects a protected agent without a session', () => {
  const context = testContext({ logger });
  const agentConfig = { agentId: 'my-agent', auth: { public: false } };
  expect(() => authorizeAgent(context, { agentConfig })).toThrow(
    'Agent "my-agent" does not exist.'
  );
});

test('authorizeAgent allows a protected agent with a session', () => {
  const context = testContext({ logger, session: { user: { id: 'user_1' } } });
  const agentConfig = { agentId: 'my-agent', auth: { public: false } };
  expect(() => authorizeAgent(context, { agentConfig })).not.toThrow();
});

test('authorizeAgent rejects a role-protected agent when the user lacks the role', () => {
  const context = testContext({
    logger,
    session: { user: { id: 'user_1', roles: ['user'] } },
  });
  const agentConfig = { agentId: 'my-agent', auth: { public: false, roles: ['admin'] } };
  expect(() => authorizeAgent(context, { agentConfig })).toThrow(
    'Agent "my-agent" does not exist.'
  );
});

test('authorizeAgent allows a role-protected agent when the user has the role', () => {
  const context = testContext({
    logger,
    session: { user: { id: 'user_1', roles: ['admin'] } },
  });
  const agentConfig = { agentId: 'my-agent', auth: { public: false, roles: ['admin'] } };
  expect(() => authorizeAgent(context, { agentConfig })).not.toThrow();
});
