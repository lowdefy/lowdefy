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
import { AuthorizationError, UserError } from '@lowdefy/errors';

import formatErrorForAgent from './formatErrorForAgent.js';

function errorWith(props) {
  return Object.assign(new Error('Request failed.'), props);
}

const devContext = { mode: 'dev', configDirectory: '/app' };

test('formatErrorForAgent returns the generic message in prod even when configDirectory is set', () => {
  const error = errorWith({ source: 'pages/home.yaml:12', hint: 'Check the filter.' });
  expect(formatErrorForAgent({ mode: 'prod', configDirectory: '/app' }, error)).toEqual(
    'Something went wrong.'
  );
});

test('formatErrorForAgent returns the author message of a UserError in prod', () => {
  const error = new UserError('Order ref is required.');
  expect(formatErrorForAgent({ mode: 'prod' }, error)).toEqual('Order ref is required.');
});

test('formatErrorForAgent returns the message of an auth refusal in prod', () => {
  const error = new AuthorizationError('Not authorized.');
  expect(formatErrorForAgent({ mode: 'prod' }, error)).toEqual('Not authorized.');
});

test('formatErrorForAgent appends the source in dev', () => {
  const error = errorWith({ source: 'pages/home.yaml:12' });
  expect(formatErrorForAgent(devContext, error)).toEqual('Request failed. (at pages/home.yaml:12)');
});

test('formatErrorForAgent appends the hint in dev', () => {
  const error = errorWith({ hint: 'Check the filter.' });
  expect(formatErrorForAgent(devContext, error)).toEqual('Request failed. Hint: Check the filter.');
});

test('formatErrorForAgent appends source then hint in dev', () => {
  const error = errorWith({ source: 'pages/home.yaml:12', hint: 'Check the filter.' });
  expect(formatErrorForAgent(devContext, error)).toEqual(
    'Request failed. (at pages/home.yaml:12) Hint: Check the filter.'
  );
});

test('formatErrorForAgent returns the bare message in dev when the error has no source or hint', () => {
  expect(formatErrorForAgent(devContext, errorWith({ source: null }))).toEqual('Request failed.');
});

test('formatErrorForAgent formats in dev without configDirectory', () => {
  const error = errorWith({ source: 'pages/home.yaml:12' });
  expect(formatErrorForAgent({ mode: 'dev' }, error)).toEqual(
    'Request failed. (at pages/home.yaml:12)'
  );
});
