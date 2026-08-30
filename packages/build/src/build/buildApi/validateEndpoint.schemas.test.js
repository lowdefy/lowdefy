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

import { ConfigError } from '@lowdefy/errors';

import validateEndpoint from './validateEndpoint.js';

const checkDuplicateEndpointId = () => {};

test('validateEndpoint accepts valid payloadSchema and responseSchema declarations', () => {
  expect(() =>
    validateEndpoint({
      endpoint: {
        id: 'ep',
        type: 'Api',
        payloadSchema: { type: 'object', properties: { q: { type: 'string' } } },
        responseSchema: { type: 'object', properties: { total: { type: 'integer' } } },
      },
      index: 0,
      checkDuplicateEndpointId,
    })
  ).not.toThrow();
});

test('validateEndpoint rejects a responseSchema that is not a valid JSON schema', () => {
  let thrown;
  try {
    validateEndpoint({
      endpoint: {
        id: 'ep',
        type: 'Api',
        responseSchema: { type: 'not-a-type' },
        '~k': 'k_ep',
      },
      index: 0,
      checkDuplicateEndpointId,
    });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ConfigError);
  expect(thrown.message).toMatch(/^Api endpoint "ep" responseSchema is not a valid JSON schema: /);
  expect(thrown.checkSlug).toBe('response-schema');
  expect(thrown.configKey).toBe('k_ep');
});

test('validateEndpoint rejects a payloadSchema that is not a valid JSON schema', () => {
  expect(() =>
    validateEndpoint({
      endpoint: { id: 'ep', type: 'Api', payloadSchema: { type: 'object', required: 'q' } },
      index: 0,
      checkDuplicateEndpointId,
    })
  ).toThrow(/^Api endpoint "ep" payloadSchema is not a valid JSON schema: /);
});
