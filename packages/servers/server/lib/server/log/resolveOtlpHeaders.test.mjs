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

import resolveOtlpHeaders from './resolveOtlpHeaders.js';

test('resolveOtlpHeaders returns an empty object when no headers are configured', () => {
  expect(resolveOtlpHeaders({})).toEqual({});
});

test('resolveOtlpHeaders passes literal string headers through', () => {
  expect(resolveOtlpHeaders({ headers: { 'X-Axiom-Dataset': 'lowdefy' } })).toEqual({
    'X-Axiom-Dataset': 'lowdefy',
  });
});

test('resolveOtlpHeaders resolves a _secret header against the process secrets', () => {
  expect(
    resolveOtlpHeaders({
      headers: { Authorization: { _secret: 'AXIOM_TOKEN' } },
      secrets: { AXIOM_TOKEN: 'Bearer xaat-123' },
    })
  ).toEqual({ Authorization: 'Bearer xaat-123' });
});

test('resolveOtlpHeaders throws when the secret is not set', () => {
  expect(() =>
    resolveOtlpHeaders({ headers: { Authorization: { _secret: 'AXIOM_TOKEN' } }, secrets: {} })
  ).toThrow('reads secret "AXIOM_TOKEN", which is not set');
});

test('resolveOtlpHeaders refuses an operator that is not _secret', () => {
  expect(() => resolveOtlpHeaders({ headers: { Authorization: { _env: 'AXIOM_TOKEN' } } })).toThrow(
    'should be a string or a "_secret" operator'
  );
});

test('resolveOtlpHeaders refuses a non-string, non-operator value', () => {
  expect(() => resolveOtlpHeaders({ headers: { Authorization: 42 } })).toThrow(
    'App "logger.otlp.headers.Authorization" should be a string or a "_secret" operator. Received 42.'
  );
});
