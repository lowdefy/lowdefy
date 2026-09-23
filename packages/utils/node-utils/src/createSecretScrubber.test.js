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

import createSecretScrubber from './createSecretScrubber.js';

// '?' and '>' runs put '/' and '+' into the base64, so the standard and URL-safe alphabets differ.
const BASE64_SECRET = 'PLANTED???>>>secret???>>>';

test('createSecretScrubber replaces a secret in a message', () => {
  const scrub = createSecretScrubber({ secrets: { API_KEY: 'PLANTEDAPIKEY123' }, env: {} });
  expect(scrub('Request failed: https://api.example.com/v1?key=PLANTEDAPIKEY123&x=1')).toEqual(
    'Request failed: https://api.example.com/v1?key=[REDACTED]&x=1'
  );
});

test('createSecretScrubber replaces every occurrence of a secret', () => {
  const scrub = createSecretScrubber({ secrets: { API_KEY: 'PLANTEDAPIKEY123' }, env: {} });
  expect(scrub('PLANTEDAPIKEY123 and PLANTEDAPIKEY123')).toEqual('[REDACTED] and [REDACTED]');
});

test('createSecretScrubber replaces the URL-encoded form of a secret', () => {
  const secret = 'PLANTED/key+with=chars';
  const scrub = createSecretScrubber({ secrets: { API_KEY: secret }, env: {} });
  const encoded = encodeURIComponent(secret);
  expect(encoded).not.toEqual(secret);
  expect(scrub(`GET https://api.example.com/?key=${encoded}`)).toEqual(
    'GET https://api.example.com/?key=[REDACTED]'
  );
});

test('createSecretScrubber replaces the JSON-escaped form of a secret', () => {
  const secret = 'PLANTED"quoted"secret';
  const scrub = createSecretScrubber({ secrets: { API_KEY: secret }, env: {} });
  const json = JSON.stringify({ body: { token: secret } });
  expect(json).toContain('PLANTED\\"quoted\\"secret');
  expect(scrub(json)).toEqual('{"body":{"token":"[REDACTED]"}}');
});

describe('createSecretScrubber replaces the secret inside a Basic auth header', () => {
  // 'user:' prefixes of 3, 4 and 5 bytes start the secret at byte offsets 0, 1 and 2.
  const users = ['ab', 'abc', 'abcd'];

  users.forEach((user) => {
    const prefixBytes = user.length + 1;
    const offset = prefixBytes % 3;

    test(`standard base64, secret at byte offset ${offset}`, () => {
      const scrub = createSecretScrubber({ secrets: { PASSWORD: BASE64_SECRET }, env: {} });
      const encoded = Buffer.from(`${user}:${BASE64_SECRET}`).toString('base64');
      expect(encoded).toMatch(/[+/]/);
      const scrubbed = scrub(`Basic ${encoded}`);
      const match = scrubbed.match(/^Basic ([A-Za-z0-9+/]*)\[REDACTED\]([A-Za-z0-9+/=]*)$/);
      expect(match).not.toBeNull();
      // Only characters that mix in the user's bytes or the padding survive.
      expect(match[1].length).toBeLessThanOrEqual(Math.ceil((8 * prefixBytes) / 6));
      expect(match[2].length).toBeLessThanOrEqual(4);
    });

    test(`URL-safe base64, secret at byte offset ${offset}`, () => {
      const scrub = createSecretScrubber({ secrets: { PASSWORD: BASE64_SECRET }, env: {} });
      const encoded = Buffer.from(`${user}:${BASE64_SECRET}`).toString('base64url');
      expect(encoded).toMatch(/[-_]/);
      const scrubbed = scrub(`token=${encoded}`);
      const match = scrubbed.match(/^token=([A-Za-z0-9_-]*)\[REDACTED\]([A-Za-z0-9_-]*)$/);
      expect(match).not.toBeNull();
      expect(match[1].length).toBeLessThanOrEqual(Math.ceil((8 * prefixBytes) / 6));
      expect(match[2].length).toBeLessThanOrEqual(4);
    });
  });
});

test('createSecretScrubber replaces a leaf of a JSON-encoded secret on its own', () => {
  const scrub = createSecretScrubber({
    secrets: { DB: '{"user":"dbuser","password":"PLANTEDPASSWORD1"}' },
    env: {},
  });
  expect(scrub('Authentication failed for password PLANTEDPASSWORD1')).toEqual(
    'Authentication failed for password [REDACTED]'
  );
});

test('createSecretScrubber still replaces the whole JSON-encoded secret', () => {
  const secret = '{"user":"dbuser","password":"PLANTEDPASSWORD1"}';
  const scrub = createSecretScrubber({ secrets: { DB: secret }, env: {} });
  expect(scrub(`Config: ${secret}`)).toEqual('Config: [REDACTED]');
});

test('createSecretScrubber collects string leaves of a JSON-encoded array secret', () => {
  const scrub = createSecretScrubber({
    secrets: { KEYS: '["PLANTEDKEYONE1", {"nested": "PLANTEDKEYTWO2"}]' },
    env: {},
  });
  expect(scrub('PLANTEDKEYONE1 PLANTEDKEYTWO2')).toEqual('[REDACTED] [REDACTED]');
});

test('createSecretScrubber collects a secret with a nested name', () => {
  // getSecretsFromEnv sets LOWDEFY_SECRET_A.B at secrets.A.B.
  const scrub = createSecretScrubber({ secrets: { A: { B: 'PLANTEDNESTED123' } }, env: {} });
  expect(scrub('value PLANTEDNESTED123')).toEqual('value [REDACTED]');
});

test('createSecretScrubber collects CRON_SECRET and AUTH_SECRET from env', () => {
  const scrub = createSecretScrubber({
    secrets: {},
    env: {
      CRON_SECRET: 'PLANTEDCRONSECRET',
      AUTH_SECRET: 'PLANTEDAUTHSECRET',
      OTHER: 'PLANTEDOTHER',
    },
  });
  expect(scrub('PLANTEDCRONSECRET PLANTEDAUTHSECRET PLANTEDOTHER')).toEqual(
    '[REDACTED] [REDACTED] PLANTEDOTHER'
  );
});

test('createSecretScrubber reads process.env by default', () => {
  const realEnv = process.env;
  process.env = { CRON_SECRET: 'PLANTEDCRONSECRET' };
  try {
    const scrub = createSecretScrubber({ secrets: {} });
    expect(scrub('PLANTEDCRONSECRET')).toEqual('[REDACTED]');
  } finally {
    process.env = realEnv;
  }
});

test('createSecretScrubber leaves a secret shorter than 8 characters alone', () => {
  const scrub = createSecretScrubber({
    secrets: { FLAG: 'true', SHORT: '1234567' },
    env: { CRON_SECRET: 'short' },
  });
  expect(scrub('enabled: true, pin 1234567, short')).toEqual('enabled: true, pin 1234567, short');
});

test('createSecretScrubber replaces a secret of exactly 8 characters', () => {
  const scrub = createSecretScrubber({ secrets: { PIN: '12345678' }, env: {} });
  expect(scrub('pin 12345678')).toEqual('pin [REDACTED]');
});

test('createSecretScrubber replaces a longer secret before a shorter secret it contains', () => {
  const scrub = createSecretScrubber({
    secrets: { SHORT: 'PLANTEDKEY', LONG: 'PLANTEDKEYEXTENDED' },
    env: {},
  });
  expect(scrub('PLANTEDKEYEXTENDED')).toEqual('[REDACTED]');
});

test('createSecretScrubber returns non-string input unchanged', () => {
  const scrub = createSecretScrubber({ secrets: { API_KEY: 'PLANTEDAPIKEY123' }, env: {} });
  const object = { message: 'PLANTEDAPIKEY123' };
  expect(scrub(object)).toBe(object);
  expect(scrub(42)).toBe(42);
  expect(scrub(null)).toBe(null);
  expect(scrub(undefined)).toBe(undefined);
});

test('createSecretScrubber returns its input when there are no secrets', () => {
  const scrub = createSecretScrubber({ secrets: {}, env: {} });
  expect(scrub('nothing to hide here')).toEqual('nothing to hide here');
});
