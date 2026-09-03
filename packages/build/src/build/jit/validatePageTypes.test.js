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

import createCounter from '../../utils/createCounter.js';
import validatePageTypes from './validatePageTypes.js';

function createContext({ blocks = {}, actions = {}, clientOps = {}, serverOps = {} } = {}) {
  return {
    handleWarning: jest.fn(),
    typeCounters: {
      blocks: createCounter(),
      actions: createCounter(),
      operators: {
        client: createCounter(),
        server: createCounter(),
      },
    },
    typesMap: {
      blocks,
      actions,
      operators: {
        client: clientOps,
        server: serverOps,
      },
    },
  };
}

test('validatePageTypes does nothing when no types are used', () => {
  const context = createContext({ blocks: { Box: {} } });
  validatePageTypes({ context });
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('validatePageTypes passes when all used block types are defined', () => {
  const context = createContext({ blocks: { Box: {}, Input: {} } });
  context.typeCounters.blocks.increment('Box');
  context.typeCounters.blocks.increment('Input');
  validatePageTypes({ context });
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('validatePageTypes throws when block type is not defined', () => {
  const context = createContext({ blocks: { Box: {} } });
  context.typeCounters.blocks.increment('Buton', 'key1');
  expect(() => validatePageTypes({ context })).toThrow(
    'Block type "Buton" was used but is not defined'
  );
});

test('validatePageTypes suggests similar block type name', () => {
  const context = createContext({ blocks: { Button: {} } });
  context.typeCounters.blocks.increment('Buton', 'key1');
  expect(() => validatePageTypes({ context })).toThrow('Did you mean "Button"');
});

test('validatePageTypes throws when action type is not defined', () => {
  const context = createContext({ actions: { SetState: {} } });
  context.typeCounters.actions.increment('SetStat', 'key1');
  expect(() => validatePageTypes({ context })).toThrow(
    'Action type "SetStat" was used but is not defined'
  );
});

test('validatePageTypes throws when the retired ImpersonateUser action type is used', () => {
  const context = createContext({ actions: { SetState: {} } });
  context.typeCounters.actions.increment('ImpersonateUser', 'key1');
  expect(() => validatePageTypes({ context })).toThrow(
    'Action type "ImpersonateUser" was used but is not defined'
  );
});

// InviteMember names a step, and only a step. The action counter is fed from
// page events alone, so the step of the same name never reaches this check -
// authored as an action it is an undefined action type like any other.
test('validatePageTypes throws when the retired InviteMember action type is used', () => {
  const context = createContext({ actions: { SetState: {} } });
  context.typeCounters.actions.increment('InviteMember', 'key1');
  expect(() => validatePageTypes({ context })).toThrow(
    'Action type "InviteMember" was used but is not defined'
  );
});

test('validatePageTypes throws with checkSlug operator-types for an unknown client operator', () => {
  const context = createContext({ clientOps: { _state: {} } });
  context.typeCounters.operators.client.increment('_stat', 'key1');
  expect(() => validatePageTypes({ context })).toThrow(
    'Operator type "_stat" was used but is not defined. Did you mean "_state"?'
  );
  try {
    validatePageTypes({ context });
  } catch (error) {
    expect(error.checkSlug).toBe('operator-types');
    expect(error.configKey).toBe('key1');
  }
});

test('validatePageTypes throws with checkSlug operator-types for an unknown server operator', () => {
  const context = createContext({ serverOps: { _secret: {} } });
  context.typeCounters.operators.server.increment('_secrt', 'key1');
  expect(() => validatePageTypes({ context })).toThrow(
    'Operator type "_secrt" was used but is not defined. Did you mean "_secret"?'
  );
  try {
    validatePageTypes({ context });
  } catch (error) {
    expect(error.checkSlug).toBe('operator-types');
  }
});

test('validatePageTypes throws with checkSlug block-types for an unknown block type', () => {
  const context = createContext({ blocks: { Box: {} } });
  context.typeCounters.blocks.increment('Buton', 'key1');
  try {
    validatePageTypes({ context });
    throw new Error('validatePageTypes did not throw');
  } catch (error) {
    expect(error.checkSlug).toBe('block-types');
  }
});

test('validatePageTypes throws with checkSlug action-types for an unknown action type', () => {
  const context = createContext({ actions: { SetState: {} } });
  context.typeCounters.actions.increment('SetStat', 'key1');
  try {
    validatePageTypes({ context });
    throw new Error('validatePageTypes did not throw');
  } catch (error) {
    expect(error.checkSlug).toBe('action-types');
  }
});

test('validatePageTypes passes when all types are defined across all categories', () => {
  const context = createContext({
    blocks: { Box: {} },
    actions: { SetState: {} },
    clientOps: { _state: {} },
    serverOps: { _secret: {} },
  });
  context.typeCounters.blocks.increment('Box');
  context.typeCounters.actions.increment('SetState');
  context.typeCounters.operators.client.increment('_state');
  context.typeCounters.operators.server.increment('_secret');
  validatePageTypes({ context });
  expect(context.handleWarning).not.toHaveBeenCalled();
});
