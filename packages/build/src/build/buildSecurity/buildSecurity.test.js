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

import buildSecurity from './buildSecurity.js';

const defaultDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://api.lowdefy.net'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'frame-ancestors': ["'self'"],
};

function run(config, { websockets } = {}) {
  const context = {};
  buildSecurity({ components: { config, websockets }, context });
  return context.security;
}

test('buildSecurity sets contentSecurityPolicy to null when config.security is not set', () => {
  expect(run({})).toEqual({ contentSecurityPolicy: null });
});

test('buildSecurity sets contentSecurityPolicy to null when it is false', () => {
  expect(run({ security: { contentSecurityPolicy: false } })).toEqual({
    contentSecurityPolicy: null,
  });
});

test('buildSecurity resolves the default policy when contentSecurityPolicy is true', () => {
  expect(run({ security: { contentSecurityPolicy: true } })).toEqual({
    contentSecurityPolicy: {
      reportOnly: false,
      directives: defaultDirectives,
      nonceDirectives: ['script-src'],
      websockets: false,
    },
  });
});

test('buildSecurity marks the policy for websockets when the app has websockets', () => {
  const security = run(
    { security: { contentSecurityPolicy: true } },
    { websockets: [{ id: 'websocket:changes' }] }
  );
  expect(security.contentSecurityPolicy.websockets).toBe(true);
});

test('buildSecurity carries reportOnly', () => {
  const security = run({ security: { contentSecurityPolicy: { reportOnly: true } } });
  expect(security.contentSecurityPolicy.reportOnly).toBe(true);
  expect(security.contentSecurityPolicy.directives).toEqual(defaultDirectives);
});

test('buildSecurity adds directive sources to the defaults without duplicates', () => {
  const security = run({
    security: {
      contentSecurityPolicy: {
        directives: {
          'script-src': ['https://www.googletagmanager.com', "'self'"],
          'connect-src': ['https://api.example.com'],
          'frame-src': ['https://www.youtube.com'],
          'upgrade-insecure-requests': [],
        },
      },
    },
  });
  expect(security.contentSecurityPolicy.directives).toEqual({
    ...defaultDirectives,
    'script-src': ["'self'", 'https://www.googletagmanager.com'],
    'connect-src': ["'self'", 'https://api.lowdefy.net', 'https://api.example.com'],
    'frame-src': ['https://www.youtube.com'],
    'upgrade-insecure-requests': [],
  });
});

test("buildSecurity drops 'none' from a directive the app adds sources to", () => {
  const security = run({
    security: { contentSecurityPolicy: { directives: { 'object-src': ["'self'"] } } },
  });
  expect(security.contentSecurityPolicy.directives['object-src']).toEqual(["'self'"]);
});

test("buildSecurity leaves the nonce off a directive the app allows 'unsafe-inline' in", () => {
  const security = run({
    security: { contentSecurityPolicy: { directives: { 'script-src': ["'unsafe-inline'"] } } },
  });
  expect(security.contentSecurityPolicy.directives['script-src']).toEqual([
    "'self'",
    "'unsafe-inline'",
  ]);
  expect(security.contentSecurityPolicy.nonceDirectives).toEqual([]);
});

test.each([
  [
    'config.security is not an object',
    { security: 'strict' },
    'App "config.security" should be an object.',
  ],
  [
    'contentSecurityPolicy is a string',
    { security: { contentSecurityPolicy: 'enforce' } },
    'App "config.security.contentSecurityPolicy" should be true, false or an object.',
  ],
  [
    'reportOnly is not a boolean',
    { security: { contentSecurityPolicy: { reportOnly: 'yes' } } },
    'App "config.security.contentSecurityPolicy.reportOnly" should be a boolean.',
  ],
  [
    'directives is an array',
    { security: { contentSecurityPolicy: { directives: ['script-src'] } } },
    'App "config.security.contentSecurityPolicy.directives" should be an object.',
  ],
  [
    'a directive name is not lowercase',
    { security: { contentSecurityPolicy: { directives: { scriptSrc: ['https://a.com'] } } } },
    'App "config.security.contentSecurityPolicy.directives" keys should be directive names in lowercase, like "script-src".',
  ],
  [
    'a directive value is a string',
    { security: { contentSecurityPolicy: { directives: { 'script-src': 'https://a.com' } } } },
    'App "config.security.contentSecurityPolicy.directives.script-src" should be an array of source strings.',
  ],
  [
    'a source has a space',
    {
      security: {
        contentSecurityPolicy: { directives: { 'script-src': ['https://a.com https://b.com'] } },
      },
    },
    'App "config.security.contentSecurityPolicy.directives.script-src" sources should be non-empty strings without spaces, ";" or ",".',
  ],
  [
    'a source has a semicolon',
    {
      security: {
        contentSecurityPolicy: { directives: { 'img-src': ['https://a.com;script-src'] } },
      },
    },
    'App "config.security.contentSecurityPolicy.directives.img-src" sources should be non-empty strings without spaces, ";" or ",".',
  ],
  [
    'a source is not a string',
    { security: { contentSecurityPolicy: { directives: { 'img-src': [1] } } } },
    'App "config.security.contentSecurityPolicy.directives.img-src" sources should be non-empty strings without spaces, ";" or ",".',
  ],
  [
    'a source is empty',
    { security: { contentSecurityPolicy: { directives: { 'img-src': [''] } } } },
    'App "config.security.contentSecurityPolicy.directives.img-src" sources should be non-empty strings without spaces, ";" or ",".',
  ],
])('buildSecurity throws when %s', (_, config, message) => {
  expect(() => run(config)).toThrow(message);
});
