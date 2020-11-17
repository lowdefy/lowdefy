/*
  Copyright 2020 Lowdefy, Inc

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

import path from 'path';
import createRequestLoader from './requestLoader';
import { ConfigurationError } from '../context/errors';

const CONFIGURATION_BASE_PATH = path.resolve(process.cwd(), 'src/test/config');

test('load request', async () => {
  const requestLoader = createRequestLoader({ CONFIGURATION_BASE_PATH });
  const res = await requestLoader.load({
    pageId: 'page1',
    contextId: 'page1',
    requestId: 'request1',
  });
  expect(res).toEqual({
    id: 'request:page1:page1:request1',
    type: 'TestRequest',
  });
});

test('load request, request does not exist', async () => {
  const requestLoader = createRequestLoader({ CONFIGURATION_BASE_PATH });
  const res = await requestLoader.load({
    pageId: 'page1',
    contextId: 'page1',
    requestId: 'doesNotExist',
  });
  expect(res).toEqual(null);
});

test('load request, context does not exist', async () => {
  const requestLoader = createRequestLoader({ CONFIGURATION_BASE_PATH });
  const res = await requestLoader.load({
    pageId: 'page1',
    contextId: 'doesNotExist',
    requestId: 'doesNotExist',
  });
  expect(res).toEqual(null);
});

test('load request, page does not exist', async () => {
  const requestLoader = createRequestLoader({ CONFIGURATION_BASE_PATH });
  const res = await requestLoader.load({
    pageId: 'doesNotExist',
    contextId: 'doesNotExist',
    requestId: 'doesNotExist',
  });
  expect(res).toEqual(null);
});

test('load request, invalid JSON', async () => {
  const requestLoader = createRequestLoader({ CONFIGURATION_BASE_PATH });
  await expect(
    requestLoader.load({ pageId: 'page1', contextId: 'page1', requestId: 'invalid' })
  ).rejects.toThrow(ConfigurationError);
});
