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

import ConfigError from './ConfigError.js';
import ConfigWarning from './ConfigWarning.js';
import errorToDisplayString from './errorToDisplayString.js';
import { expect, test } from 'vitest';

test('errorToDisplayString shows the checkSlug after the error name', () => {
  const error = new ConfigError('_if has no test key.', { checkSlug: 'if-test' });
  expect(errorToDisplayString(error)).toBe('[ConfigError · if-test] _if has no test key.');
});

test('errorToDisplayString shows the checkSlug after the fails in prod tag', () => {
  const warning = new ConfigWarning('_state.foo is not set.', {
    checkSlug: 'state-refs',
    prodError: true,
  });
  expect(errorToDisplayString(warning)).toBe(
    '[ConfigWarning · fails in prod · state-refs] _state.foo is not set.'
  );
});

test('errorToDisplayString shows the checkSlug on a warning', () => {
  const warning = new ConfigWarning('Unknown icon.', { checkSlug: 'icons' });
  expect(errorToDisplayString(warning)).toBe('[ConfigWarning · icons] Unknown icon.');
});

test('errorToDisplayString output is unchanged without a checkSlug', () => {
  const error = new ConfigError('Bad config');
  expect(errorToDisplayString(error)).toBe('[ConfigError] Bad config');
});

test('errorToDisplayString shows the checkSlug, not the checkGroup', () => {
  const error = new ConfigError('Broken.', { checkSlug: 'if-test', checkGroup: 'plugin-checks' });
  expect(errorToDisplayString(error)).toBe('[ConfigError · if-test] Broken.');
});
