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
import { ConfigError } from '@lowdefy/errors';

const mockExistsSync = jest.fn();

jest.unstable_mockModule('fs', () => ({
  default: { existsSync: mockExistsSync },
  existsSync: mockExistsSync,
}));

let validateDeprecatedStyles;

beforeAll(async () => {
  validateDeprecatedStyles = (await import('./validateDeprecatedStyles.js')).default;
});

beforeEach(() => {
  mockExistsSync.mockReset();
});

function testContext() {
  return { directories: { config: '/app' }, errors: [], keyMap: {} };
}

test('validateDeprecatedStyles collects a ConfigError when public/styles.less exists', () => {
  mockExistsSync.mockImplementation((filePath) => filePath.endsWith('styles.less'));
  const context = testContext();
  validateDeprecatedStyles({ context });
  expect(context.errors.length).toBe(1);
  expect(context.errors[0]).toBeInstanceOf(ConfigError);
  expect(context.errors[0].message).toContain('public/styles.less is deprecated.');
});

test('validateDeprecatedStyles collects nothing when public/styles.less does not exist', () => {
  mockExistsSync.mockReturnValue(false);
  const context = testContext();
  validateDeprecatedStyles({ context });
  expect(context.errors).toEqual([]);
});
