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

import getAppEvents from './getAppEvents.js';
import testContext from '../../test/testContext.js';

const mockReadConfigFile = jest.fn();

const context = testContext({ readConfigFile: mockReadConfigFile });

beforeEach(() => {
  mockReadConfigFile.mockReset();
});

test('getAppEvents returns the built app events', async () => {
  const events = {
    onInit: { try: [{ id: 'set', type: 'SetGlobal', params: { ready: true } }], catch: [] },
  };
  mockReadConfigFile.mockImplementation((path) => (path === 'events.json' ? events : null));
  const res = await getAppEvents(context);
  expect(res).toEqual(events);
});

test('getAppEvents makes config keys enumerable for transfer to the browser', async () => {
  const action = { id: 'set', type: 'SetGlobal', params: { ready: true } };
  Object.defineProperty(action, '~k', { value: 'c:1', enumerable: false });
  mockReadConfigFile.mockImplementation(() => ({ onInit: { try: [action], catch: [] } }));
  const res = await getAppEvents(context);
  expect(res.onInit.try[0]['~k']).toEqual('c:1');
});
