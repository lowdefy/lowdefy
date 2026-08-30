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

import validateEndpointResponse from './validateEndpointResponse.js';

const responseSchema = {
  type: 'object',
  properties: { total: { type: 'integer' } },
  required: ['total'],
};

test('validateEndpointResponse records nothing for a conforming response', () => {
  const handleDevNotice = jest.fn();
  validateEndpointResponse(
    { handleDevNotice },
    { endpointConfig: { endpointId: 'ep', responseSchema }, response: { total: 3 } }
  );
  expect(handleDevNotice).not.toHaveBeenCalled();
});

test('validateEndpointResponse records one located notice with the instance path on a violation', () => {
  const handleDevNotice = jest.fn();
  validateEndpointResponse(
    { handleDevNotice },
    {
      endpointConfig: { endpointId: 'ep', responseSchema, '~k': 'k_ep' },
      response: { total: 'three' },
    }
  );
  expect(handleDevNotice).toHaveBeenCalledTimes(1);
  const notice = handleDevNotice.mock.calls[0][0];
  expect(notice.name).toBe('ResponseSchemaWarning');
  expect(notice.level).toBe('warn');
  expect(notice.configKey).toBe('k_ep');
  expect(notice.message).toBe(
    'Endpoint "ep" returned a response that does not match its responseSchema at /total: must be integer.'
  );
  expect(notice.details.endpointId).toBe('ep');
  expect(notice.details.instancePath).toBe('/total');
  expect(notice.details.received).toEqual({ total: 'three' });
});

test('validateEndpointResponse does nothing when the endpoint declares no responseSchema', () => {
  const handleDevNotice = jest.fn();
  validateEndpointResponse(
    { handleDevNotice },
    { endpointConfig: { endpointId: 'ep' }, response: 1 }
  );
  expect(handleDevNotice).not.toHaveBeenCalled();
});

test('validateEndpointResponse compiles nothing without a handleDevNotice hook', () => {
  // An uncompilable schema would throw from ajv if the hook were not the gate.
  expect(() =>
    validateEndpointResponse(
      {},
      {
        endpointConfig: { endpointId: 'prod', responseSchema: { type: 'not-a-type' } },
        response: 1,
      }
    )
  ).not.toThrow();
});
