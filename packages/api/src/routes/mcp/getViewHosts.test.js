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

import { createHash } from 'node:crypto';
import { afterEach, expect, test } from 'vitest';

import getViewHosts from './getViewHosts.js';

const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

afterEach(() => {
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
});

function claudeDomain(resourceUri) {
  const hash = createHash('sha256').update(resourceUri).digest('hex');
  return `${hash.slice(0, 32)}.claudemcpcontent.com`;
}

test('getViewHosts returns the one Claude host, its domain hashed from the MCP resource URI', () => {
  process.env.BETTER_AUTH_URL = 'https://app.example.com';
  const domain = claudeDomain('https://app.example.com/api/mcp');
  expect(getViewHosts({ config: {} })).toEqual([
    { id: 'claude', domain, origin: `https://${domain}` },
  ]);
  expect(domain).toMatch(/^[0-9a-f]{32}\.claudemcpcontent\.com$/);
});

test('getViewHosts hashes the resource URI without a trailing slash, whatever the pinned origin ends in', () => {
  process.env.BETTER_AUTH_URL = 'https://app.example.com';
  const withoutSlash = getViewHosts({ config: {} });
  process.env.BETTER_AUTH_URL = 'https://app.example.com/';
  expect(getViewHosts({ config: {} })).toEqual(withoutSlash);
  expect(withoutSlash[0].domain).not.toBe(claudeDomain('https://app.example.com/api/mcp/'));
});

test('getViewHosts hashes the basePath as part of the resource URI', () => {
  process.env.BETTER_AUTH_URL = 'https://app.example.com';
  expect(getViewHosts({ config: { basePath: '/base' } })[0].domain).toBe(
    claudeDomain('https://app.example.com/base/api/mcp')
  );
});

test('getViewHosts returns no host when the canonical origin is not pinned', () => {
  delete process.env.BETTER_AUTH_URL;
  expect(getViewHosts({ config: {} })).toEqual([]);
});
