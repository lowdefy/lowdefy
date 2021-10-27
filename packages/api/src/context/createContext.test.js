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

import createAuthorize from './createAuthorize';
import createContext from './createContext';
import createReadConfigFile from './readConfigFile';
import verifyAuthorizationHeader from './verifyAuthorizationHeader';

jest.mock('./createAuthorize');
jest.mock('./readConfigFile');
jest.mock('./verifyAuthorizationHeader');

const getSecrets = jest.fn();

getSecrets.mockImplementation(() => ({ secret: true }));

createAuthorize.mockImplementation(({ authenticated, roles = [] }) => ({ authenticated, roles }));

createReadConfigFile.mockImplementation(({ configDirectory }) => (path) => ({
  configDirectory,
  path,
}));

verifyAuthorizationHeader.mockImplementation(() => ({
  authenticated: true,
  user: { sub: 'sub' },
  roles: ['roles'],
}));

test('createContext', async () => {
  const contextFn = await createContext({ configDirectory: 'configDirectory', getSecrets });
  const context = contextFn({
    headers: { header: 'header' },
    host: 'host',
    logger: 'logger',
    protocol: 'https',
    setHeader: 'setHeaderFunction',
  });
  expect(context).toMatchInlineSnapshot(`
    Object {
      "authenticated": true,
      "authorize": Object {
        "authenticated": true,
        "roles": Array [
          "roles",
        ],
      },
      "config": Object {
        "configDirectory": "configDirectory",
        "path": "config.json",
      },
      "connectionTypes": Object {
        "configDirectory": "configDirectory",
        "path": "connectionTypes.json",
      },
      "headers": Object {
        "header": "header",
      },
      "host": "host",
      "logger": "logger",
      "protocol": "https",
      "readConfigFile": [Function],
      "secrets": Object {
        "secret": true,
      },
      "setHeader": "setHeaderFunction",
      "user": Object {
        "sub": "sub",
      },
    }
  `);
  expect(verifyAuthorizationHeader.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "authenticated": true,
          "authorize": Object {
            "authenticated": true,
            "roles": Array [
              "roles",
            ],
          },
          "config": Object {
            "configDirectory": "configDirectory",
            "path": "config.json",
          },
          "connectionTypes": Object {
            "configDirectory": "configDirectory",
            "path": "connectionTypes.json",
          },
          "headers": Object {
            "header": "header",
          },
          "host": "host",
          "logger": "logger",
          "protocol": "https",
          "readConfigFile": [Function],
          "secrets": Object {
            "secret": true,
          },
          "setHeader": "setHeaderFunction",
          "user": Object {
            "sub": "sub",
          },
        },
      ],
    ]
  `);
});
