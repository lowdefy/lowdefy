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

import getMcpResourceBinding, { registerMcpResourceBinding } from './getMcpResourceBinding.js';

test('getMcpResourceBinding returns the registered uriPrefix for an auth instance', () => {
  const auth = {};
  registerMcpResourceBinding({ auth, uriPrefix: 'https://app.example.com/api/mcp/' });
  expect(getMcpResourceBinding({ auth })).toEqual({
    uriPrefix: 'https://app.example.com/api/mcp/',
  });
});

test('getMcpResourceBinding returns null for an auth instance with no registered binding', () => {
  expect(getMcpResourceBinding({ auth: {} })).toBe(null);
});

test('getMcpResourceBinding returns null when auth is null or undefined', () => {
  expect(getMcpResourceBinding({ auth: null })).toBe(null);
  expect(getMcpResourceBinding({ auth: undefined })).toBe(null);
});

test('bindings are scoped per auth instance', () => {
  const authA = {};
  const authB = {};
  registerMcpResourceBinding({ auth: authA, uriPrefix: 'https://a.example.com/api/mcp/' });
  registerMcpResourceBinding({ auth: authB, uriPrefix: 'https://b.example.com/api/mcp/' });
  expect(getMcpResourceBinding({ auth: authA }).uriPrefix).toBe('https://a.example.com/api/mcp/');
  expect(getMcpResourceBinding({ auth: authB }).uriPrefix).toBe('https://b.example.com/api/mcp/');
});
