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

import { getAsIssuer, getMcpResourceMetadataUri, getMcpResourceUri } from './getMcpUri.js';

const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

afterEach(() => {
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
});

describe('getMcpResourceUri', () => {
  test('getMcpResourceUri returns the single resource without basePath', () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com';
    expect(getMcpResourceUri({ config: {} })).toEqual('https://app.example.com/api/mcp');
  });

  test('getMcpResourceUri includes basePath and strips trailing slash on BETTER_AUTH_URL', () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com/';
    expect(getMcpResourceUri({ config: { basePath: '/base' } })).toEqual(
      'https://app.example.com/base/api/mcp'
    );
  });

  test('getMcpResourceUri trims whitespace on BETTER_AUTH_URL', () => {
    process.env.BETTER_AUTH_URL = '  https://app.example.com  ';
    expect(getMcpResourceUri({ config: {} })).toEqual('https://app.example.com/api/mcp');
  });

  test('getMcpResourceUri returns null when BETTER_AUTH_URL is unset', () => {
    delete process.env.BETTER_AUTH_URL;
    expect(getMcpResourceUri({ config: {} })).toEqual(null);
  });

  test('getMcpResourceUri returns null when BETTER_AUTH_URL is empty or whitespace', () => {
    process.env.BETTER_AUTH_URL = '   ';
    expect(getMcpResourceUri({ config: {} })).toEqual(null);
  });
});

describe('getMcpResourceMetadataUri', () => {
  test('getMcpResourceMetadataUri inserts the well-known segment ahead of the resource path', () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com';
    expect(getMcpResourceMetadataUri({ config: {} })).toEqual(
      'https://app.example.com/.well-known/oauth-protected-resource/api/mcp'
    );
  });

  test('getMcpResourceMetadataUri places the well-known segment after the basePath', () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com/';
    expect(getMcpResourceMetadataUri({ config: { basePath: '/base' } })).toEqual(
      'https://app.example.com/base/.well-known/oauth-protected-resource/api/mcp'
    );
  });

  test('getMcpResourceMetadataUri returns null when BETTER_AUTH_URL is unset', () => {
    delete process.env.BETTER_AUTH_URL;
    expect(getMcpResourceMetadataUri({ config: {} })).toEqual(null);
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
