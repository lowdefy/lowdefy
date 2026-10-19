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

import parseNpmrcLine from './parseNpmrcLine.js';

test('parseNpmrcLine returns the trimmed key and value of a line', () => {
  expect(parseNpmrcLine('  store-dir = .pnpm-store ')).toEqual({
    key: 'store-dir',
    value: '.pnpm-store',
  });
});

test('parseNpmrcLine unquotes the key and value', () => {
  expect(parseNpmrcLine(`"//npm.example.com/:certfile"='certs/client.crt'`)).toEqual({
    key: '//npm.example.com/:certfile',
    value: 'certs/client.crt',
  });
});

test('parseNpmrcLine keeps "=" in the value', () => {
  expect(parseNpmrcLine('_auth=dXNlcjpwYXNz==')).toEqual({ key: '_auth', value: 'dXNlcjpwYXNz==' });
});

test('parseNpmrcLine returns null for blank lines, comments and lines without a value', () => {
  expect(parseNpmrcLine('   ')).toBe(null);
  expect(parseNpmrcLine('# store-dir=.pnpm-store')).toBe(null);
  expect(parseNpmrcLine('; store-dir=.pnpm-store')).toBe(null);
  expect(parseNpmrcLine('[section]')).toBe(null);
});
