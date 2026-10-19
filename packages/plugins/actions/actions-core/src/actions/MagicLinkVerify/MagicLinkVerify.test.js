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

import MagicLinkVerify from './MagicLinkVerify.js';

const mockMagicLinkVerify = jest.fn();
const methods = { magicLinkVerify: mockMagicLinkVerify };

beforeEach(() => {
  mockMagicLinkVerify.mockReset();
});

test('MagicLinkVerify action invocation passes the params through', () => {
  MagicLinkVerify({ methods, params: { callbackUrl: { pageId: 'dashboard' } } });
  expect(mockMagicLinkVerify.mock.calls).toEqual([[{ callbackUrl: { pageId: 'dashboard' } }]]);
});

test('MagicLinkVerify action invocation without params defaults from the page URL query', () => {
  MagicLinkVerify({ methods, params: undefined });
  expect(mockMagicLinkVerify.mock.calls).toEqual([[undefined]]);
});
