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
import formatErrorForAgent from './formatErrorForAgent.js';

function errorWith(props) {
  return Object.assign(new Error('Request failed.'), props);
}

test('formatErrorForAgent returns the bare message when configDirectory is not set', () => {
  const error = errorWith({ source: 'pages/home.yaml:12', hint: 'Check the filter.' });
  expect(formatErrorForAgent({}, error)).toEqual('Request failed.');
});

test('formatErrorForAgent appends the source in dev', () => {
  const error = errorWith({ source: 'pages/home.yaml:12' });
  expect(formatErrorForAgent({ configDirectory: '/app' }, error)).toEqual(
    'Request failed. (at pages/home.yaml:12)'
  );
});

test('formatErrorForAgent appends the hint in dev', () => {
  const error = errorWith({ hint: 'Check the filter.' });
  expect(formatErrorForAgent({ configDirectory: '/app' }, error)).toEqual(
    'Request failed. Hint: Check the filter.'
  );
});

test('formatErrorForAgent appends source then hint in dev', () => {
  const error = errorWith({ source: 'pages/home.yaml:12', hint: 'Check the filter.' });
  expect(formatErrorForAgent({ configDirectory: '/app' }, error)).toEqual(
    'Request failed. (at pages/home.yaml:12) Hint: Check the filter.'
  );
});

test('formatErrorForAgent returns the bare message in dev when the error has no source or hint', () => {
  expect(formatErrorForAgent({ configDirectory: '/app' }, errorWith({ source: null }))).toEqual(
    'Request failed.'
  );
});
