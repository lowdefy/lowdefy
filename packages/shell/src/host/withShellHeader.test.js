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

import withShellHeader from './withShellHeader.js';

test('every call carries the shell version as x-lowdefy-shell', async () => {
  const fetch = jest.fn(async () => ({ status: 200 }));
  const shellFetch = withShellHeader({ fetch, shellVersion: '7.4.0' });
  await shellFetch('https://app.example.com/api/page/home', { headers: { Accept: 'x' } });
  await shellFetch('https://app.example.com/api/user');
  expect(fetch.mock.calls[0][1].headers).toEqual({ Accept: 'x', 'x-lowdefy-shell': '7.4.0' });
  expect(fetch.mock.calls[1][1].headers).toEqual({ 'x-lowdefy-shell': '7.4.0' });
});
