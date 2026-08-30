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
import formatCheckReport from './formatCheckReport.js';

function entry(overrides) {
  return {
    message: 'Something is wrong.',
    name: 'ConfigError',
    source: null,
    config: null,
    configKey: null,
    checkSlug: null,
    prodError: false,
    ...overrides,
  };
}

test('formatCheckReport prints No problems found for an empty report', () => {
  expect(formatCheckReport({ errors: [], warnings: [] })).toBe('No problems found.');
});

test('formatCheckReport groups entries by source file, sorted, one line per entry', () => {
  const output = formatCheckReport({
    errors: [
      entry({ message: 'Block type "Buton" not found.', source: 'pages/zeta.yaml:12' }),
      entry({
        message: 'Page "nope" not found.',
        name: 'ConfigWarning',
        source: 'lowdefy.yaml:4',
        checkSlug: 'link-refs',
      }),
      entry({ message: 'Bad _js body.', source: 'pages/zeta.yaml:3', checkSlug: 'js-lint' }),
    ],
    warnings: [
      entry({ message: 'Unused variable.', name: 'ConfigWarning', source: 'pages/alpha.yaml:8' }),
    ],
  });
  expect(output).toBe(
    [
      'lowdefy.yaml',
      '     4  ConfigWarning: Page "nope" not found. (link-refs)',
      '',
      'pages/alpha.yaml',
      '     8  ConfigWarning: Unused variable.',
      '',
      'pages/zeta.yaml',
      '     3  ConfigError: Bad _js body. (js-lint)',
      '    12  ConfigError: Block type "Buton" not found.',
      '',
      '3 errors, 1 warning',
    ].join('\n')
  );
});

test('formatCheckReport puts entries without a source under (unlocated) last', () => {
  const output = formatCheckReport({
    errors: [
      entry({ message: 'Internal failure.', name: 'LowdefyInternalError' }),
      entry({ message: 'Located.', source: 'zzz.yaml:1' }),
    ],
    warnings: [],
  });
  expect(output).toBe(
    [
      'zzz.yaml',
      '     1  ConfigError: Located.',
      '',
      '(unlocated)',
      '        LowdefyInternalError: Internal failure.',
      '',
      '2 errors, 0 warnings',
    ].join('\n')
  );
});

test('formatCheckReport keeps a source with no line number as its own file group', () => {
  const output = formatCheckReport({
    errors: [entry({ message: 'No line.', source: 'pages/home.yaml' })],
    warnings: [],
  });
  expect(output).toBe(
    ['pages/home.yaml', '        ConfigError: No line.', '', '1 error, 0 warnings'].join('\n')
  );
});

test('formatCheckReport prints sources inside the config directory relative to it', () => {
  const output = formatCheckReport({
    errors: [
      entry({ message: 'Inside.', source: '/app/pages/home.yaml:3' }),
      entry({ message: 'Outside.', source: '/elsewhere/shared.yaml:9' }),
    ],
    warnings: [],
    configDirectory: '/app',
  });
  expect(output).toBe(
    [
      '/elsewhere/shared.yaml',
      '     9  ConfigError: Outside.',
      '',
      'pages/home.yaml',
      '     3  ConfigError: Inside.',
      '',
      '2 errors, 0 warnings',
    ].join('\n')
  );
});
