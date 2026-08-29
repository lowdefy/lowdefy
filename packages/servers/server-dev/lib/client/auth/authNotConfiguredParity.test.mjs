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

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import AuthNotConfigured from './AuthNotConfigured.js';

const authDir = path.dirname(fileURLToPath(import.meta.url));

// The keys of the `const auth = { ... }` literal plus the `auth.x =` assignments
// made after it - both reach the app through the same context object.
function readExposedKeys(source) {
  const literal = source.slice(source.indexOf('const auth = {'), source.indexOf('\n  };'));
  const keys = [...literal.matchAll(/^ {4}([a-zA-Z0-9_]+)[:,]/gm)].map((match) => match[1]);
  const assigned = [...source.matchAll(/^ +auth\.([a-zA-Z0-9_]+) =/gm)].map((match) => match[1]);
  return [...new Set([...keys, ...assigned])].sort();
}

function callAuthNotConfigured() {
  let auth;
  AuthNotConfigured({ authConfig: { enabled: false }, children: (value) => (auth = value) });
  return auth;
}

// An app with no auth section still renders every block and action. A method
// AuthConfigured exposes but AuthNotConfigured omits surfaces as
// "auth.x is not a function" instead of the ConfigError naming the missing config.
test('AuthNotConfigured exposes every key AuthConfigured exposes', async () => {
  const source = await readFile(path.join(authDir, 'AuthConfigured.jsx'), 'utf8');
  const auth = callAuthNotConfigured();
  expect(Object.keys(auth).sort()).toEqual(readExposedKeys(source));
});

test('AuthNotConfigured keeps authConfig and a null user', () => {
  const auth = callAuthNotConfigured();
  expect(auth.authConfig).toEqual({ enabled: false });
  expect(auth.user).toBeNull();
});

test('AuthNotConfigured methods throw a ConfigError naming the missing auth config', () => {
  const auth = callAuthNotConfigured();
  expect(() => auth.signInEmail({})).toThrow(
    'Auth is not configured. Add an "auth" section to lowdefy.yaml to use auth actions.'
  );
  expect(() => auth.signInEmail({})).toThrow(expect.objectContaining({ name: 'ConfigError' }));
});
