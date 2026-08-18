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

import {
  getAsIssuer,
  getMcpResourceUri,
  getMcpUriPrefix,
  isWellFormedOrgSegment,
} from './getMcpUri.js';

const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

afterEach(() => {
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
});

describe('getMcpUriPrefix', () => {
  test('getMcpUriPrefix returns prefix without basePath', () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com';
    expect(getMcpUriPrefix({ config: {} })).toEqual('https://app.example.com/api/mcp/');
  });

  test('getMcpUriPrefix includes basePath and strips trailing slash on BETTER_AUTH_URL', () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com/';
    expect(getMcpUriPrefix({ config: { basePath: '/base' } })).toEqual(
      'https://app.example.com/base/api/mcp/'
    );
  });

  test('getMcpUriPrefix trims whitespace on BETTER_AUTH_URL', () => {
    process.env.BETTER_AUTH_URL = '  https://app.example.com  ';
    expect(getMcpUriPrefix({ config: {} })).toEqual('https://app.example.com/api/mcp/');
  });

  test('getMcpUriPrefix returns null when BETTER_AUTH_URL is unset', () => {
    delete process.env.BETTER_AUTH_URL;
    expect(getMcpUriPrefix({ config: {} })).toEqual(null);
  });

  test('getMcpUriPrefix returns null when BETTER_AUTH_URL is empty or whitespace', () => {
    process.env.BETTER_AUTH_URL = '   ';
    expect(getMcpUriPrefix({ config: {} })).toEqual(null);
  });
});

describe('getMcpResourceUri', () => {
  test('getMcpResourceUri appends orgId to the prefix', () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com';
    expect(getMcpResourceUri({ config: {}, orgId: 'org_8f2k1x' })).toEqual(
      'https://app.example.com/api/mcp/org_8f2k1x'
    );
  });

  test('getMcpResourceUri includes basePath with trailing slash on BETTER_AUTH_URL', () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com/';
    expect(getMcpResourceUri({ config: { basePath: '/base' }, orgId: 'acme' })).toEqual(
      'https://app.example.com/base/api/mcp/acme'
    );
  });

  test('getMcpResourceUri returns null when BETTER_AUTH_URL is unset', () => {
    delete process.env.BETTER_AUTH_URL;
    expect(getMcpResourceUri({ config: {}, orgId: 'org_8f2k1x' })).toEqual(null);
  });
});

describe('getAsIssuer', () => {
  test('getAsIssuer returns auth issuer without basePath', () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com';
    expect(getAsIssuer({ config: {} })).toEqual('https://app.example.com/api/auth');
  });

  test('getAsIssuer includes basePath and strips trailing slash on BETTER_AUTH_URL', () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com/';
    expect(getAsIssuer({ config: { basePath: '/base' } })).toEqual(
      'https://app.example.com/base/api/auth'
    );
  });

  test('getAsIssuer returns null when BETTER_AUTH_URL is unset', () => {
    delete process.env.BETTER_AUTH_URL;
    expect(getAsIssuer({ config: {} })).toEqual(null);
  });
});

describe('isWellFormedOrgSegment', () => {
  test('isWellFormedOrgSegment accepts a BetterAuth generated org id', () => {
    expect(isWellFormedOrgSegment('vXk9qLmT2sHwZ8fRAnB1c4dE7gYjKpQu')).toEqual(true);
  });

  test('isWellFormedOrgSegment accepts a pinned-policy slug', () => {
    expect(isWellFormedOrgSegment('acme-corp')).toEqual(true);
    expect(isWellFormedOrgSegment('org_8f2k1x')).toEqual(true);
  });

  test('isWellFormedOrgSegment rejects the empty string', () => {
    expect(isWellFormedOrgSegment('')).toEqual(false);
  });

  test('isWellFormedOrgSegment rejects segments longer than 64 characters', () => {
    expect(isWellFormedOrgSegment('a'.repeat(64))).toEqual(true);
    expect(isWellFormedOrgSegment('a'.repeat(65))).toEqual(false);
  });

  test('isWellFormedOrgSegment rejects path separators and dots', () => {
    expect(isWellFormedOrgSegment('a/b')).toEqual(false);
    expect(isWellFormedOrgSegment('a.b')).toEqual(false);
    expect(isWellFormedOrgSegment('..')).toEqual(false);
  });

  test('isWellFormedOrgSegment rejects percent-encoding', () => {
    expect(isWellFormedOrgSegment('%2e')).toEqual(false);
    expect(isWellFormedOrgSegment('a%2fb')).toEqual(false);
  });

  test('isWellFormedOrgSegment rejects whitespace and unicode', () => {
    expect(isWellFormedOrgSegment('a b')).toEqual(false);
    expect(isWellFormedOrgSegment('örg')).toEqual(false);
    expect(isWellFormedOrgSegment('org\u200b')).toEqual(false);
  });

  test('isWellFormedOrgSegment rejects non-string input', () => {
    expect(isWellFormedOrgSegment(undefined)).toEqual(false);
    expect(isWellFormedOrgSegment(null)).toEqual(false);
    expect(isWellFormedOrgSegment(42)).toEqual(false);
  });
});
