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
import requestStateEmpty from './requestStateEmpty.js';
import { createTenantContext, pageRequest, endpointStep } from './testSites.js';

test('requestStateEmpty runs under check only', () => {
  expect(requestStateEmpty.slug).toBe('request-state-empty');
  expect(requestStateEmpty.checkOnly).toBe(true);
});

test('requestStateEmpty errors when a page request reads _state anywhere in its properties', () => {
  const context = createTenantContext();
  const components = pageRequest({
    type: 'MongoDBFind',
    properties: { query: { status: { _state: 'filter_status' } } },
  });
  requestStateEmpty.run({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    'Request "get_controls" at page "controls" reads "_state" in its request properties. _state is always empty in a request — a request is evaluated on the server with an empty state, so this value is undefined. Pass the value in the request payload and read it with _payload.'
  );
  expect(context.errors[0]).toMatchObject({
    configKey: 'k_get_controls',
    checkSlug: 'request-state-empty',
  });
});

test('requestStateEmpty errors on the dotted _state shorthand', () => {
  const context = createTenantContext();
  const components = pageRequest({
    type: 'MongoDBFind',
    properties: { query: { organization_id: { $in: [{ '_state.selected': 'org' }] } } },
  });
  requestStateEmpty.run({ components, context });
  expect(context.errors).toHaveLength(1);
});

test('requestStateEmpty does not fire for a routine step, whose state the routine writes', () => {
  const context = createTenantContext();
  const components = endpointStep({
    type: 'MongoDBFind',
    properties: { query: { status: { _state: 'filter_status' } } },
  });
  requestStateEmpty.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('requestStateEmpty does not fire on a request that reads only the payload', () => {
  const context = createTenantContext();
  const components = pageRequest({
    type: 'MongoDBFind',
    properties: { query: { status: { _payload: 'status' } } },
  });
  requestStateEmpty.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('requestStateEmpty fires on a page request whose connection is not walled', () => {
  const context = createTenantContext();
  const components = {
    pages: [
      {
        pageId: 'notes',
        requests: [
          {
            requestId: 'get_notes',
            type: 'MongoDBFind',
            connectionId: 'notes_unwalled',
            properties: { query: { owner: { _state: 'user_id' } } },
            '~k': 'k_get_notes',
          },
        ],
      },
    ],
  };
  requestStateEmpty.run({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].configKey).toBe('k_get_notes');
});

