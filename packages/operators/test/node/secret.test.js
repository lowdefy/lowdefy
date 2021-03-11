/*
  Copyright 2020-2021 Lowdefy, Inc

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

import secret from '../../src/node/secret';
import getFromObject from '../../src/getFromObject';

jest.mock('../../src/getFromObject');

console.error = () => {};

test('secret calls getFromObject', () => {
  secret({
    arrayIndices: [0],
    env: 'env',
    location: 'location',
    params: 'params',
    secrets: { secrets: true },
  });
  expect(getFromObject.mock.calls).toEqual([
    [
      {
        env: 'env',
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

test('secret default value', () => {
  secret({
    arrayIndices: [0],
    env: 'env',
    location: 'location',
    params: 'params',
  });
  expect(getFromObject.mock.calls).toEqual([
    [
      {
        env: 'env',
        location: 'location',
        object: {},
        operator: '_secret',
        params: 'params',
      },
    ],
  ]);
});

test('secret get all is not allowed', () => {
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

test('secret OpenID Connect and JSON web token secrets are filtered out', () => {
  secret({
    arrayIndices: [0],
    env: 'env',
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
  expect(getFromObject.mock.calls).toEqual([
    [
      {
        env: 'env',
        location: 'location',
        object: {
          OTHER: 'OTHER',
        },
        operator: '_secret',
        params: 'params',
      },
    ],
  ]);
});
