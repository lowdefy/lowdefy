/*
  Copyright 2020-2022 Lowdefy, Inc

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

import secret from './secret.js';

jest.mock('@lowdefy/operators', () => ({
  getFromObject: jest.fn(),
}));

test('secret calls getFromObject', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  secret({
    arrayIndices: [0],
    params: 'params',
    secrets: { secrets: true },
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
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
  secret({
    arrayIndices: [0],
    params: 'params',
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        object: {},
        operator: '_secret',
        params: 'params',
      },
    ],
  ]);
});

test('secret get all is not allowed', () => {
  expect(() => secret({ params: true })).toThrowErrorMatchingInlineSnapshot(
    `"Getting all secrets is not allowed."`
  );
  expect(() => secret({ params: { all: true } })).toThrowErrorMatchingInlineSnapshot(
    `"Getting all secrets is not allowed."`
  );
  expect(() => secret({ params: { all: 'yes' } })).toThrowErrorMatchingInlineSnapshot(
    `"Getting all secrets is not allowed."`
  );
});

test('secret OpenID Connect and JSON web token secrets are filtered out', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  secret({
    arrayIndices: [0],
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
