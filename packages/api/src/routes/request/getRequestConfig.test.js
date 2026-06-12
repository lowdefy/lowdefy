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

import getRequestConfig from './getRequestConfig.js';

const logger = { debug: () => {} };

test('returns the JSON config when no module importer is present', async () => {
  const readConfigFile = async () => ({ requestId: 'r1', properties: { url: '/x' } });
  const request = await getRequestConfig(
    { logger, readConfigFile },
    { pageId: 'p1', requestId: 'r1' }
  );
  expect(request.properties).toEqual({ url: '/x' });
});

test('S3a: a closure module replaces properties with its default export', async () => {
  const readConfigFile = async () => ({ requestId: 'r1', properties: { url: '/x' } });
  const closure = () => ({ url: '/x' });
  const importConfigModule = async (filePath) => {
    expect(filePath).toBe('pages/p1/requests/r1.mjs');
    return { default: closure };
  };
  const request = await getRequestConfig(
    { importConfigModule, logger, readConfigFile },
    { pageId: 'p1', requestId: 'r1' }
  );
  expect(request.properties).toBe(closure);
});

test('S3a: a missing closure module keeps the JSON properties', async () => {
  const readConfigFile = async () => ({ requestId: 'r1', properties: { url: '/x' } });
  const importConfigModule = async () => null;
  const request = await getRequestConfig(
    { importConfigModule, logger, readConfigFile },
    { pageId: 'p1', requestId: 'r1' }
  );
  expect(request.properties).toEqual({ url: '/x' });
});
