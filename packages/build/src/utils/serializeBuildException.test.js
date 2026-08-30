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

import { ConfigError, ConfigWarning, LowdefyInternalError } from '@lowdefy/errors';

import serializeBuildException from './serializeBuildException.js';

test('serializeBuildException extracts message, name and location fields', () => {
  const error = new ConfigError('Bad config', { configKey: 'abc123', checkSlug: 'my-check' });
  error.source = '/app/pages/home.yaml:5';
  error.config = 'root.pages[0:home]';

  expect(serializeBuildException(error)).toEqual({
    message: 'Bad config',
    name: 'ConfigError',
    source: '/app/pages/home.yaml:5',
    config: 'root.pages[0:home]',
    configKey: 'abc123',
    checkSlug: 'my-check',
    prodError: false,
  });
});

test('serializeBuildException defaults unresolved location fields to null', () => {
  const error = new LowdefyInternalError('Something broke');

  expect(serializeBuildException(error)).toEqual({
    message: 'Something broke',
    name: 'LowdefyInternalError',
    source: null,
    config: null,
    configKey: null,
    checkSlug: null,
    prodError: false,
  });
});

test('serializeBuildException produces JSON-serializable output for a ConfigWarning', () => {
  const warning = new ConfigWarning('Deprecated feature used', { configKey: 'xyz789' });
  warning.source = '/app/pages/home.yaml:12';
  warning.config = 'root.pages[0:home].blocks[0:header]';

  const serialized = serializeBuildException(warning);
  expect(JSON.parse(JSON.stringify(serialized))).toEqual(serialized);
  expect(serialized.message).toBe('Deprecated feature used');
  expect(serialized.name).toBe('ConfigWarning');
});

test('serializeBuildException does not include received, stack or cause', () => {
  const cause = new Error('root cause');
  const error = new ConfigError('Bad config', { cause, received: { huge: 'object' } });

  const serialized = serializeBuildException(error);
  expect(serialized.received).toBeUndefined();
  expect(serialized.stack).toBeUndefined();
  expect(serialized.cause).toBeUndefined();
});

test('serializeBuildException carries prodError true for a prod-gated warning', () => {
  const warning = new ConfigWarning('_state is not available in request properties.', {
    configKey: 'abc123',
    prodError: true,
    checkSlug: 'state-refs',
  });

  expect(serializeBuildException(warning).prodError).toBe(true);
});

test('serializeBuildException carries prodError false for a plain warning', () => {
  const warning = new ConfigWarning('Duplicate shortcut key.', { configKey: 'abc123' });

  expect(serializeBuildException(warning).prodError).toBe(false);
});
