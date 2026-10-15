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
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

import collectExceptions from './collectExceptions.js';
import createHandleWarning from './createHandleWarning.js';
import createTestLogger from '../test-utils/createTestLogger.js';
import tryBuildStep from './tryBuildStep.js';

function createContext(ignoreBuildChecks) {
  const { logger, lines } = createTestLogger();
  return {
    context: {
      errors: [],
      logger,
      keyMap: {
        parent: { key: 'pages.0', '~ignoreBuildChecks': ignoreBuildChecks },
        child: { key: 'pages.0.blocks.0', '~k_parent': 'parent' },
      },
      refMap: {},
      directories: { config: '/app' },
      seenSourceLines: new Set(),
      stage: 'dev',
    },
    lines,
  };
}

function ruleError(checkSlug = 'if-test') {
  return new ConfigError('_if has no test key.', {
    configKey: 'child',
    checkSlug,
    checkGroup: 'plugin-checks',
  });
}

function ruleWarning(checkSlug = 'if-test') {
  return new ConfigWarning('_if has no test key.', {
    configKey: 'child',
    checkSlug,
    checkGroup: 'plugin-checks',
  });
}

test('collectExceptions skips a plugin rule error under plugin-checks', () => {
  const { context } = createContext(['plugin-checks']);
  collectExceptions(context, ruleError('any-rule'));
  expect(context.errors).toHaveLength(0);
});

test('collectExceptions skips a plugin rule error under its own slug only', () => {
  const { context } = createContext(['if-test']);
  collectExceptions(context, ruleError('if-test'));
  collectExceptions(context, ruleError('switch-branches'));
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].checkSlug).toBe('switch-branches');
});

test('tryBuildStep ignores a thrown plugin rule error under plugin-checks', () => {
  const { context } = createContext(['plugin-checks']);
  const stepFn = jest.fn(() => {
    throw ruleError();
  });
  tryBuildStep(stepFn, 'testStep', { components: {}, context });
  expect(stepFn).toHaveBeenCalled();
  expect(context.errors).toHaveLength(0);
});

test('tryBuildStep collects a thrown plugin rule error under another slug', () => {
  const { context } = createContext(['state-refs']);
  tryBuildStep(
    () => {
      throw ruleError();
    },
    'testStep',
    { components: {}, context }
  );
  expect(context.errors).toHaveLength(1);
});

test('handleWarning suppresses a plugin rule warning under plugin-checks', () => {
  const { context, lines } = createContext(['plugin-checks']);
  createHandleWarning({ context })(ruleWarning());
  expect(lines).toHaveLength(0);
});

test('handleWarning suppresses a plugin rule warning under its own slug', () => {
  const { context, lines } = createContext(['if-test']);
  createHandleWarning({ context })(ruleWarning());
  expect(lines).toHaveLength(0);
});

test('handleWarning logs a plugin rule warning under another rule slug', () => {
  const { context, lines } = createContext(['if-test']);
  createHandleWarning({ context })(ruleWarning('switch-branches'));
  expect(lines).toHaveLength(1);
});
