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

import extractInitiator from './extractInitiator.js';

test('extractInitiator pulls user fields from context.user', () => {
  const result = extractInitiator({
    user: { id: 'u1', sub: 'oauth|abc', roles: ['admin'] },
    headers: {},
  });
  expect(result.userId).toBe('u1');
  expect(result.sub).toBe('oauth|abc');
  expect(result.roles).toEqual(['admin']);
});

test('extractInitiator falls back to user.sub when id is missing', () => {
  const result = extractInitiator({
    user: { sub: 'oauth|abc' },
    headers: {},
  });
  expect(result.userId).toBe('oauth|abc');
});

test('extractInitiator extracts ip from x-forwarded-for first entry', () => {
  const result = extractInitiator({
    user: {},
    headers: { 'x-forwarded-for': '203.0.113.1, 198.51.100.2' },
  });
  expect(result.ip).toBe('203.0.113.1');
});

test('extractInitiator falls back to x-real-ip then cf-connecting-ip', () => {
  const realIp = extractInitiator({
    user: {},
    headers: { 'x-real-ip': '1.2.3.4' },
  });
  expect(realIp.ip).toBe('1.2.3.4');

  const cf = extractInitiator({
    user: {},
    headers: { 'cf-connecting-ip': '5.6.7.8' },
  });
  expect(cf.ip).toBe('5.6.7.8');
});

test('extractInitiator extracts userAgent from headers', () => {
  const result = extractInitiator({
    user: {},
    headers: { 'user-agent': 'Mozilla/5.0' },
  });
  expect(result.userAgent).toBe('Mozilla/5.0');
});

test('extractInitiator falls back to context.session.user when context.user absent', () => {
  const result = extractInitiator({
    session: { user: { id: 'u1' } },
    headers: {},
  });
  expect(result.userId).toBe('u1');
});
