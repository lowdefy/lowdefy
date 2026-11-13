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

import { expect, test, vi } from 'vitest';
import * as Clipboard from 'expo-clipboard';

import createShellHost from './createShellHost.js';

vi.mock('expo-clipboard', () => ({ setStringAsync: vi.fn(async () => true) }));
vi.mock('./createDeviceStore.js', () => ({ default: () => ({}) }));
vi.mock('./networkStatus.js', () => ({ default: { subscribe: () => () => undefined } }));

// Copy link and the other CopyToClipboard actions reach the phone's clipboard through the host.
test('the host clipboard copies through expo-clipboard', async () => {
  const session = {
    apiBase: 'https://field.example.com',
    getCurrentInstanceId: () => null,
    getCurrentPath: () => '/',
  };
  const host = createShellHost({ fetch: vi.fn(), router: {}, session, tokenStore: {} });
  await host.globals.clipboard.setString('https://field.example.com/tasks/12');
  expect(Clipboard.setStringAsync.mock.calls).toEqual([['https://field.example.com/tasks/12']]);
});
