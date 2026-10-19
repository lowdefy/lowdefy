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

import createShellHost from './createShellHost.js';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));
jest.mock('./createDeviceStore.js', () => () => ({}));
jest.mock('./networkStatus.js', () => ({ subscribe: () => () => undefined }));

// Copy link and the other CopyToClipboard actions reach the phone's clipboard through the host.
test('the host clipboard copies through expo-clipboard', async () => {
  const Clipboard = jest.requireMock('expo-clipboard');
  const session = {
    apiBase: 'https://field.example.com',
    getCurrentInstanceId: () => null,
    getCurrentPath: () => '/',
  };
  const host = createShellHost({ fetch: jest.fn(), router: {}, session, tokenStore: {} });
  await host.globals.clipboard.setString('https://field.example.com/tasks/12');
  expect(Clipboard.setStringAsync.mock.calls).toEqual([['https://field.example.com/tasks/12']]);
});
