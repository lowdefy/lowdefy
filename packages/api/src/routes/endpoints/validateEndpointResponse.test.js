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

test('validateEndpointResponse warns once per endpoint in production, where there is no dev notice hook', () => {
  const warn = jest.fn();
  const endpointConfig = { endpointId: 'prod_endpoint', responseSchema };
  validateEndpointResponse({ logger: { warn } }, { endpointConfig, response: { total: 'three' } });
  validateEndpointResponse({ logger: { warn } }, { endpointConfig, response: { total: 'four' } });
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][1]).toBe(
    'Endpoint "prod_endpoint" returned a response that does not match its responseSchema at /total: must be integer.'
  );
});

// R6: one schema describes the JSON shape a caller receives, so the same
// responseSchema is truthful as the MCP outputSchema and as the dev check.
test('validateEndpointResponse does not report a Date returned for a date-time field', () => {
  const handleDevNotice = jest.fn();
  validateEndpointResponse(
    { handleDevNotice },
    {
      endpointConfig: {
        endpointId: 'ep',
        responseSchema: {
          type: 'object',
          properties: { created_at: { type: 'string', format: 'date-time' } },
          required: ['created_at'],
        },
      },
      response: { created_at: new Date(0) },
    }
  );
  expect(handleDevNotice).not.toHaveBeenCalled();
});

test('validateEndpointResponse reports a non-date value for a date-time field', () => {
  const handleDevNotice = jest.fn();
  validateEndpointResponse(
    { handleDevNotice },
    {
      endpointConfig: {
        endpointId: 'ep2',
        responseSchema: {
          type: 'object',
          properties: { created_at: { type: 'string', format: 'date-time' } },
        },
      },
      response: { created_at: 'yesterday' },
    }
  );
  expect(handleDevNotice).toHaveBeenCalledTimes(1);
});
