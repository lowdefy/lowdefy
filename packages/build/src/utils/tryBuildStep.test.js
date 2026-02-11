/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { ConfigError } from '@lowdefy/errors/build';
import tryBuildStep from './tryBuildStep.js';

const mockLogger = {
  error: jest.fn(),
};

beforeEach(() => {
  mockLogger.error.mockClear();
});

test('tryBuildStep executes function successfully', () => {
  const stepFn = jest.fn(({ components }) => {
    components.modified = true;
    return components;
  });

  const components = { test: true };
  const context = { errors: [], logger: mockLogger };

  const result = tryBuildStep(stepFn, 'testStep', { components, context });

  expect(stepFn).toHaveBeenCalledWith({ components, context });
  expect(result.modified).toBe(true);
  expect(context.errors).toHaveLength(0);
  expect(mockLogger.error).not.toHaveBeenCalled();
});

test('tryBuildStep collects error when function throws', () => {
  const stepFn = jest.fn(() => {
    throw new Error('Build step failed');
  });

  const components = {};
  const context = { errors: [], logger: mockLogger };

  tryBuildStep(stepFn, 'testStep', { components, context });

  expect(stepFn).toHaveBeenCalledWith({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0]).toBeInstanceOf(Error);
  expect(context.errors[0].message).toBe('Build step failed');
  // Note: Logging happens at checkpoints in index.js, not in tryBuildStep
});

test('tryBuildStep collects multiple errors from different steps', () => {
  const firstStep = jest.fn(() => {
    throw new Error('First error');
  });

  const secondStep = jest.fn(() => {
    throw new Error('Second error');
  });

  const components = {};
  const context = { errors: [], logger: mockLogger };

  tryBuildStep(firstStep, 'step1', { components, context });
  tryBuildStep(secondStep, 'step2', { components, context });

  expect(context.errors).toHaveLength(2);
  expect(context.errors[0].message).toBe('First error');
  expect(context.errors[1].message).toBe('Second error');
  // Note: Logging happens at checkpoints in index.js, not in tryBuildStep
});

test('tryBuildStep returns result from successful function', () => {
  const stepFn = jest.fn(() => ({ result: 'success' }));

  const components = {};
  const context = { errors: [], logger: mockLogger };

  const result = tryBuildStep(stepFn, 'testStep', { components, context });

  expect(result).toEqual({ result: 'success' });
  expect(context.errors).toHaveLength(0);
});

test('tryBuildStep returns undefined when function throws', () => {
  const stepFn = jest.fn(() => {
    throw new Error('Build failed');
  });

  const components = {};
  const context = { errors: [], logger: mockLogger };

  const result = tryBuildStep(stepFn, 'testStep', { components, context });

  expect(result).toBeUndefined();
  expect(context.errors).toHaveLength(1);
});

test('tryBuildStep works with synchronous function', () => {
  const stepFn = jest.fn(({ components }) => {
    components.processed = true;
    return components;
  });

  const components = { input: 'test' };
  const context = { errors: [], logger: mockLogger };

  const result = tryBuildStep(stepFn, 'syncStep', { components, context });

  expect(result.processed).toBe(true);
  expect(context.errors).toHaveLength(0);
});

test('tryBuildStep passes components and context to function', () => {
  const stepFn = jest.fn();

  const components = { test: 'data' };
  const context = { errors: [], logger: mockLogger, stage: 'test' };

  tryBuildStep(stepFn, 'testStep', { components, context });

  expect(stepFn).toHaveBeenCalledWith({ components, context });
});

test('tryBuildStep catches errors with detailed messages', () => {
  const stepFn = jest.fn(() => {
    throw new Error('Invalid configuration at pages.0.blocks.0');
  });

  const components = {};
  const context = { errors: [], logger: mockLogger };

  tryBuildStep(stepFn, 'validateStep', { components, context });

  expect(context.errors[0].message).toBe('Invalid configuration at pages.0.blocks.0');
  // Note: Logging happens at checkpoints in index.js, not in tryBuildStep
});

test('tryBuildStep continues after error', () => {
  const failingStep = jest.fn(() => {
    throw new Error('Step 1 failed');
  });

  const successfulStep = jest.fn(({ components }) => {
    components.completed = true;
    return components;
  });

  const components = {};
  const context = { errors: [], logger: mockLogger };

  tryBuildStep(failingStep, 'failStep', { components, context });
  const result = tryBuildStep(successfulStep, 'successStep', { components, context });

  expect(context.errors).toHaveLength(1);
  expect(result.completed).toBe(true);
});

test('tryBuildStep uses stepName parameter', () => {
  const stepFn = jest.fn();

  const components = {};
  const context = { errors: [], logger: mockLogger };

  tryBuildStep(stepFn, 'buildPages', { components, context });

  // stepName is currently only used for debugging, function should still work
  expect(stepFn).toHaveBeenCalled();
});

test('tryBuildStep ignores suppressed ConfigError', () => {
  const mockContext = {
    errors: [],
    logger: mockLogger,
    keyMap: {
      suppressedKey: {
        '~r': 'ref1',
        '~l': 10,
        '~ignoreBuildChecks': true,
      },
    },
    refMap: {
      ref1: { path: 'test.yaml' },
    },
    directories: { config: '/app' },
  };

  const stepFn = jest.fn(() => {
    throw new ConfigError({
      message: 'This error should be suppressed.',
      configKey: 'suppressedKey',
      context: mockContext,
    });
  });

  const components = {};

  tryBuildStep(stepFn, 'testStep', { components, context: mockContext });

  expect(stepFn).toHaveBeenCalled();
  expect(mockContext.errors).toHaveLength(0);
  expect(mockLogger.error).not.toHaveBeenCalled();
});

test('tryBuildStep collects non-suppressed ConfigError', () => {
  const mockContext = {
    errors: [],
    logger: mockLogger,
    keyMap: {
      normalKey: {
        '~r': 'ref1',
        '~l': 10,
      },
    },
    refMap: {
      ref1: { path: 'test.yaml' },
    },
    directories: { config: '/app' },
  };

  const stepFn = jest.fn(() => {
    throw new ConfigError({
      message: 'This error should be collected.',
      configKey: 'normalKey',
      context: mockContext,
    });
  });

  const components = {};

  tryBuildStep(stepFn, 'testStep', { components, context: mockContext });

  expect(stepFn).toHaveBeenCalled();
  expect(mockContext.errors).toHaveLength(1);
  expect(mockContext.errors[0]).toBeInstanceOf(ConfigError);
  expect(mockContext.errors[0].message).toBe('This error should be collected.');
  // Note: Logging happens at checkpoints in index.js, not in tryBuildStep
});
