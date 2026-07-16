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
import { AuthenticationError, ConfigError } from '@lowdefy/errors';

import authorizeAgent from './authorizeAgent.js';
import createAuthorize from '../../context/createAuthorize.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

function createContext({ user = null, system } = {}) {
  return {
    authorize: createAuthorize({ user, system }),
    i18n: undefined,
    logger,
    user,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('authorizeAgent passes a public agent for an anonymous caller', () => {
  const context = createContext();
  const agentConfig = { agentId: 'my-agent', auth: { public: true } };
  expect(() => authorizeAgent(context, { agentConfig })).not.toThrow();
});

test('authorizeAgent throws AuthenticationError on a protected agent without a user', () => {
  const context = createContext();
  const agentConfig = { agentId: 'my-agent', auth: { public: false } };
  expect(() => authorizeAgent(context, { agentConfig })).toThrow(AuthenticationError);
  expect(() => authorizeAgent(context, { agentConfig })).toThrow(
    'Authentication required for agent "my-agent".'
  );
});

test('authorizeAgent passes a protected agent for an authenticated caller', () => {
  const context = createContext({ user: { id: 'user_1' } });
  const agentConfig = { agentId: 'my-agent', auth: { public: false } };
  expect(() => authorizeAgent(context, { agentConfig })).not.toThrow();
});

test('authorizeAgent throws an opaque not-found error when the caller lacks the role', () => {
  const context = createContext({ user: { id: 'user_1', roles: ['viewer'] } });
  const agentConfig = { agentId: 'my-agent', auth: { public: false, roles: ['admin'] } };
  expect(() => authorizeAgent(context, { agentConfig })).toThrow(ConfigError);
  expect(() => authorizeAgent(context, { agentConfig })).toThrow(
    'Agent "my-agent" does not exist.'
  );
});

test('authorizeAgent passes a role-protected agent when the caller holds the role', () => {
  const context = createContext({ user: { id: 'user_1', roles: ['admin'] } });
  const agentConfig = { agentId: 'my-agent', auth: { public: false, roles: ['admin'] } };
  expect(() => authorizeAgent(context, { agentConfig })).not.toThrow();
});

test('authorizeAgent passes any agent in a system context', () => {
  const context = createContext({ system: true });
  const agentConfig = { agentId: 'my-agent', auth: { public: false, roles: ['admin'] } };
  expect(() => authorizeAgent(context, { agentConfig })).not.toThrow();
});
