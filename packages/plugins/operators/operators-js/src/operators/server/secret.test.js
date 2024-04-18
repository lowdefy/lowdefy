/*
  Copyright 2020-2024 Lowdefy, Inc

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

jest.unstable_mockModule('@lowdefy/operators', () => ({
  getFromObject: jest.fn(),
}));

console.error = () => {};

test('secret calls getFromObject', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  const secret = (await import('./secret.js')).default;
  secret({
    arrayIndices: [0],
    location: 'location',
    params: 'params',
    secrets: { secrets: true },
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        location: 'location',
        object: {
          secrets: true,
        },
        operator: '_secret',
        params: 'params',
      },
    ],
  ]);
});

test('secret default value', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  const secret = (await import('./secret.js')).default;
  secret({
    arrayIndices: [0],
    location: 'location',
    params: 'params',
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        location: 'location',
        object: {},
        operator: '_secret',
        params: 'params',
      },
    ],
  ]);
});

test('secret get all is not allowed', async () => {
  const secret = (await import('./secret.js')).default;

  expect(() => secret({ params: true })).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: Getting all secrets is not allowed. Received: true at undefined."`
  );
  expect(() => secret({ params: { all: true } })).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: Getting all secrets is not allowed. Received: {\\"all\\":true} at undefined."`
  );
  expect(() => secret({ params: { all: 'yes' } })).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: Getting all secrets is not allowed. Received: {\\"all\\":\\"yes\\"} at undefined."`
  );
});

test('secret OpenID Connect and JSON web token secrets are filtered out', async () => {
  const secret = (await import('./secret.js')).default;
  const lowdefyOperators = await import('@lowdefy/operators');
  secret({
    arrayIndices: [0],
    location: 'location',
    params: 'params',
    secrets: {
      OPENID_CLIENT_ID: 'OPENID_CLIENT_ID',
      OPENID_CLIENT_SECRET: 'OPENID_CLIENT_SECRET',
      OPENID_DOMAIN: 'OPENID_DOMAIN',
      JWT_SECRET: 'JWT_SECRET',
      OTHER: 'OTHER',
    },
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        location: 'location',
        object: {
          OPENID_CLIENT_ID: 'OPENID_CLIENT_ID',
          OPENID_DOMAIN: 'OPENID_DOMAIN',
          OTHER: 'OTHER',
        },
        operator: '_secret',
        params: 'params',
      },
    ],
  ]);
});
