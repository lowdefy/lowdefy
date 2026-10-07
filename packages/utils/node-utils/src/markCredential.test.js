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

import markCredential from './markCredential.js';
import runInCredentialScope from './runInCredentialScope.js';
import scrubCredentials from './scrubCredentials.js';

test('markCredential makes scrubCredentials replace the value in the rest of the scope', () => {
  runInCredentialScope(() => {
    expect(scrubCredentials('key: runtime-made-key-0001')).toEqual('key: runtime-made-key-0001');
    markCredential('runtime-made-key-0001');
    expect(scrubCredentials('key: runtime-made-key-0001')).toEqual('key: [REDACTED]');
  });
});

test('markCredential marks every string leaf of an object or array', () => {
  runInCredentialScope(() => {
    markCredential({ key: 'runtime-made-key-0001', secrets: ['webhook-secret-0002'], length: 21 });
    expect(scrubCredentials('{"key":"runtime-made-key-0001","s":"webhook-secret-0002"}')).toEqual(
      '{"key":"[REDACTED]","s":"[REDACTED]"}'
    );
  });
});

test('markCredential also replaces the encoded forms of the value', () => {
  runInCredentialScope(() => {
    markCredential('runtime/key+0001');
    expect(scrubCredentials(`q=${encodeURIComponent('runtime/key+0001')}`)).toEqual('q=[REDACTED]');
    expect(scrubCredentials(JSON.stringify({ line: 'say "runtime/key+0001"' }))).toEqual(
      '{"line":"say \\"[REDACTED]\\""}'
    );
  });
});

test('A credential marked in one scope is not scrubbed in another', async () => {
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  const first = runInCredentialScope(async () => {
    markCredential('first-scope-key-0001');
    await held;
    return scrubCredentials('first-scope-key-0001 second-scope-key-0002');
  });
  const second = runInCredentialScope(async () => {
    markCredential('second-scope-key-0002');
    release();
    return scrubCredentials('first-scope-key-0001 second-scope-key-0002');
  });
  expect(await first).toEqual('[REDACTED] second-scope-key-0002');
  expect(await second).toEqual('first-scope-key-0001 [REDACTED]');
});

test('A credential stays marked across awaits and timers in its scope', async () => {
  const line = await runInCredentialScope(async () => {
    markCredential('runtime-made-key-0001');
    await new Promise((resolve) => setTimeout(resolve, 1));
    return scrubCredentials('runtime-made-key-0001');
  });
  expect(line).toEqual('[REDACTED]');
});

test('markCredential throws outside a scope', () => {
  expect(() => markCredential('runtime-made-key-0001')).toThrow(
    'A credential can only be marked while the server handles a request.'
  );
});

test('scrubCredentials returns its input outside a scope', () => {
  expect(scrubCredentials('runtime-made-key-0001')).toEqual('runtime-made-key-0001');
});

test('markCredential leaves a value shorter than 8 characters alone', () => {
  runInCredentialScope(() => {
    markCredential('short');
    expect(scrubCredentials('a short line')).toEqual('a short line');
  });
});

test('markCredential keeps scrubbing every value when one is marked many times', () => {
  runInCredentialScope(() => {
    for (let i = 0; i < 1000; i += 1) {
      markCredential('runtime-made-key-0001');
    }
    expect(scrubCredentials('runtime-made-key-0001')).toEqual('[REDACTED]');
    markCredential('webhook-secret-0002');
    expect(scrubCredentials('runtime-made-key-0001 webhook-secret-0002')).toEqual(
      '[REDACTED] [REDACTED]'
    );
  });
});
