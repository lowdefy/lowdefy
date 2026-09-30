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
import logCollectedErrors from './logCollectedErrors.js';
import { BuildError, ConfigError, ConfigWarning, OperatorError } from '@lowdefy/errors';

test('logCollectedErrors does nothing when no errors', () => {
  const context = { errors: [], handleError: jest.fn() };
  logCollectedErrors(context);
  expect(context.handleError).not.toHaveBeenCalled();
});

test('logCollectedErrors logs ConfigError instances and throws summary', () => {
  const configErr = new ConfigError('Bad config');
  const context = { errors: [configErr], handleError: jest.fn() };
  expect(() => logCollectedErrors(context)).toThrow(
    'Build failed with 1 error(s). See above for details.'
  );
  expect(context.handleError).toHaveBeenCalledWith(configErr);
});

test('logCollectedErrors wraps plain errors as LowdefyInternalError', () => {
  const plainErr = new Error('Something broke');
  const context = { errors: [plainErr], handleError: jest.fn() };
  expect(() => logCollectedErrors(context)).toThrow(
    'Build failed with 1 error(s). See above for details.'
  );
  const loggedErr = context.handleError.mock.calls[0][0];
  expect(loggedErr.name).toBe('LowdefyInternalError');
  expect(loggedErr.message).toBe('Something broke');
});

test('logCollectedErrors wraps errors without print method as LowdefyInternalError', () => {
  const plainErr = new Error('Printable');
  const context = { errors: [plainErr], handleError: jest.fn() };
  expect(() => logCollectedErrors(context)).toThrow();
  const loggedErr = context.handleError.mock.calls[0][0];
  expect(loggedErr.name).toBe('LowdefyInternalError');
  expect(loggedErr.message).toBe('Printable');
});

test('logCollectedErrors passes OperatorError directly without wrapping', () => {
  const operatorErr = new OperatorError('op failed', {
    cause: new Error('op failed'),
    typeName: '_get',
  });
  const context = { errors: [operatorErr], handleError: jest.fn() };
  expect(() => logCollectedErrors(context)).toThrow(BuildError);
  expect(context.handleError).toHaveBeenCalledWith(operatorErr);
});

test('logCollectedErrors throws BuildError', () => {
  const context = { errors: [new Error('a'), new Error('b')], handleError: jest.fn() };
  try {
    logCollectedErrors(context);
  } catch (err) {
    expect(err).toBeInstanceOf(BuildError);
    expect(err.message).toBe('Build failed with 2 error(s). See above for details.');
  }
});

test('logCollectedErrors attaches serialized errors array to the thrown BuildError', () => {
  const configErr = new ConfigError('Bad config', { configKey: 'abc123' });
  const context = {
    errors: [configErr],
    handleError: jest.fn((err) => {
      err.source = '/app/pages/home.yaml:5';
      err.config = 'root.pages[0:home]';
    }),
  };

  try {
    logCollectedErrors(context);
    throw new Error('logCollectedErrors should have thrown');
  } catch (err) {
    expect(err.errors).toEqual([
      {
        message: 'Bad config',
        name: 'ConfigError',
        source: '/app/pages/home.yaml:5',
        config: 'root.pages[0:home]',
        configKey: 'abc123',
        checkSlug: null,
        prodError: false,
      },
    ]);
  }
});

test('logCollectedErrors attaches serialized warnings array to the thrown BuildError', () => {
  const configErr = new ConfigError('Bad config');
  const warning = new ConfigWarning('Deprecated feature used');
  warning.source = '/app/pages/home.yaml:12';
  const context = { errors: [configErr], warnings: [warning], handleError: jest.fn() };

  try {
    logCollectedErrors(context);
    throw new Error('logCollectedErrors should have thrown');
  } catch (err) {
    expect(err.warnings).toEqual([
      {
        message: 'Deprecated feature used',
        name: 'ConfigWarning',
        source: '/app/pages/home.yaml:12',
        config: null,
        configKey: null,
        checkSlug: null,
        prodError: false,
      },
    ]);
  }
});

// buildEntityAuth reaches page, endpoint and websocket ids before validateId does, and both gates
// give the same message for the same config line.
test('logCollectedErrors logs one error when two build steps report the same message on one line', () => {
  const message = 'Page id "__proto__" is a reserved name and cannot be used as an id.';
  const context = {
    errors: [
      new ConfigError(message, { configKey: 'abc123' }),
      new ConfigError(message, { configKey: 'abc123' }),
    ],
    keyMap: { abc123: { key: 'pages.0', '~r': 'ref1', '~l': 15 } },
    refMap: { ref1: { path: 'lowdefy.yaml' } },
    directories: { config: '/app' },
    handleError: jest.fn(),
  };

  expect(() => logCollectedErrors(context)).toThrow(
    'Build failed with 1 error(s). See above for details.'
  );
  expect(context.handleError).toHaveBeenCalledTimes(1);
});

test('logCollectedErrors logs both errors when the same source line has different messages', () => {
  const context = {
    errors: [
      new ConfigError('Page id "__proto__" is a reserved name.', { configKey: 'abc123' }),
      new ConfigError('Duplicate pageId "__proto__".', { configKey: 'abc123' }),
    ],
    keyMap: { abc123: { key: 'pages.0', '~r': 'ref1', '~l': 15 } },
    refMap: { ref1: { path: 'lowdefy.yaml' } },
    directories: { config: '/app' },
    handleError: jest.fn(),
  };

  expect(() => logCollectedErrors(context)).toThrow(
    'Build failed with 2 error(s). See above for details.'
  );
  expect(context.handleError).toHaveBeenCalledTimes(2);
});

test('logCollectedErrors logs both errors when the same message comes from different source lines', () => {
  const context = {
    errors: [
      new ConfigError('Page id "__proto__" is a reserved name.', { configKey: 'abc123' }),
      new ConfigError('Page id "__proto__" is a reserved name.', { configKey: 'def456' }),
    ],
    keyMap: {
      abc123: { key: 'pages.0', '~r': 'ref1', '~l': 15 },
      def456: { key: 'pages.1', '~r': 'ref1', '~l': 22 },
    },
    refMap: { ref1: { path: 'lowdefy.yaml' } },
    directories: { config: '/app' },
    handleError: jest.fn(),
  };

  expect(() => logCollectedErrors(context)).toThrow(
    'Build failed with 2 error(s). See above for details.'
  );
  expect(context.handleError).toHaveBeenCalledTimes(2);
});

test('logCollectedErrors logs both unlocated errors when they share a message', () => {
  const context = {
    errors: [new Error('Something broke'), new Error('Something broke')],
    handleError: jest.fn(),
  };

  expect(() => logCollectedErrors(context)).toThrow(
    'Build failed with 2 error(s). See above for details.'
  );
  expect(context.handleError).toHaveBeenCalledTimes(2);
});

test('logCollectedErrors logs every error when resolveErrorLocation throws', () => {
  const context = {
    errors: [
      new ConfigError('Page id "__proto__" is a reserved name.', { configKey: 'abc123' }),
      new ConfigError('Page id "__proto__" is a reserved name.', { configKey: 'abc123' }),
      new Error('Something broke'),
    ],
    refMap: { ref1: { path: 'lowdefy.yaml' } },
    directories: { config: '/app' },
    handleError: jest.fn(),
  };
  Object.defineProperty(context, 'keyMap', {
    get() {
      throw new Error('keyMap exploded');
    },
  });

  expect(() => logCollectedErrors(context)).toThrow(
    'Build failed with 3 error(s). See above for details.'
  );
  expect(context.handleError).toHaveBeenCalledTimes(3);
});

test('logCollectedErrors serializes only the errors it logged', () => {
  const configErr = new ConfigError('Bad config', { configKey: 'abc123' });
  const duplicateErr = new ConfigError('Bad config', { configKey: 'abc123' });
  const context = {
    errors: [configErr, duplicateErr],
    keyMap: { abc123: { key: 'pages.0', '~r': 'ref1', '~l': 15 } },
    refMap: { ref1: { path: 'lowdefy.yaml' } },
    directories: { config: '/app' },
    handleError: jest.fn(),
  };

  try {
    logCollectedErrors(context);
    throw new Error('logCollectedErrors should have thrown');
  } catch (err) {
    expect(err.errors).toHaveLength(1);
  }
});

test('logCollectedErrors attaches an empty warnings array when context has no warnings', () => {
  const context = { errors: [new ConfigError('Bad config')], handleError: jest.fn() };

  try {
    logCollectedErrors(context);
    throw new Error('logCollectedErrors should have thrown');
  } catch (err) {
    expect(err.warnings).toEqual([]);
  }
});
