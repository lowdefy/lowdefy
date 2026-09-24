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

const secret = 'planted/secret+value=1';
const shortSecret = 'short77';

process.env.LOWDEFY_SECRET_API_KEY = secret;
process.env.LOWDEFY_SECRET_SHORT = shortSecret;

const { default: scrubEvent } = await import('./scrubEvent.js');

test('scrubEvent replaces a planted secret in strings at every depth of objects and arrays', () => {
  expect(
    scrubEvent({
      message: `failed ${secret}`,
      nested: { list: [`a ${secret}`, { deeper: [[secret]] }] },
    })
  ).toEqual({
    message: 'failed [REDACTED]',
    nested: { list: ['a [REDACTED]', { deeper: [['[REDACTED]']] }] },
  });
});

test('scrubEvent leaves keys as they are, even a key holding a secret', () => {
  expect(scrubEvent({ [secret]: 'value' })).toEqual({ [secret]: 'value' });
});

test('scrubEvent returns a copy and does not mutate the value it scrubs', () => {
  const event = { extra: { detail: secret }, values: [secret] };
  const scrubbed = scrubEvent(event);
  expect(scrubbed).not.toBe(event);
  expect(scrubbed.extra).not.toBe(event.extra);
  expect(event).toEqual({ extra: { detail: secret }, values: [secret] });
});

test('scrubEvent returns numbers, booleans, null and undefined unchanged', () => {
  expect(scrubEvent({ a: 1, b: true, c: null, d: undefined })).toEqual({
    a: 1,
    b: true,
    c: null,
    d: undefined,
  });
  expect(scrubEvent(null)).toBeNull();
});

test('scrubEvent scrubs a top-level string', () => {
  expect(scrubEvent(`value ${secret}`)).toEqual('value [REDACTED]');
});

test('scrubEvent leaves a secret shorter than 8 characters alone', () => {
  expect(scrubEvent({ detail: `value ${shortSecret}` })).toEqual({
    detail: `value ${shortSecret}`,
  });
});

test('scrubEvent returns class instances unchanged', () => {
  class Client {
    constructor() {
      this.detail = secret;
    }
  }
  const client = new Client();
  const date = new Date(0);
  const scrubbed = scrubEvent({ client, date });
  expect(scrubbed.client).toBe(client);
  expect(scrubbed.date).toBe(date);
});

test('scrubEvent copies a cycle as a cycle', () => {
  const data = { message: secret };
  data.self = data;
  const scrubbed = scrubEvent({ data });
  expect(scrubbed.data.message).toEqual('[REDACTED]');
  expect(scrubbed.data.self).toBe(scrubbed.data);
});
