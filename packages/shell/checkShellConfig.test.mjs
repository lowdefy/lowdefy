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

// A shell opens exactly one app; app.config.ts refuses any other shell config.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const checkShellConfig = require('./checkShellConfig.js');

const configPath = 'shell.json';
const app = { id: 'field', name: 'Field', urls: { production: 'https://field.example.com' } };
const shell = { id: 'field', name: 'Field', environment: 'production', app };

test('a shell config naming one app is returned as it is', () => {
  assert.equal(checkShellConfig({ configPath, shell }), shell);
});

test("Lowdefy Dev's shell config names one app", () => {
  const devShell = JSON.parse(fs.readFileSync(new URL('./shell.dev.json', import.meta.url)));
  assert.equal(checkShellConfig({ configPath, shell: devShell }), devShell);
});

test('a shell config listing apps is refused', () => {
  assert.throws(
    () =>
      checkShellConfig({
        configPath,
        shell: { ...shell, app: undefined, apps: [app, { ...app, id: 'other' }] },
      }),
    /^Error: Shell config "shell.json" lists "apps". A shell opens exactly one app: replace "apps" with "app"/
  );
});

test('a shell config listing one app under apps is refused', () => {
  assert.throws(
    () => checkShellConfig({ configPath, shell: { ...shell, apps: [app] } }),
    /lists "apps"/
  );
});

test('a shell config with two apps in app is refused', () => {
  assert.throws(
    () =>
      checkShellConfig({ configPath, shell: { ...shell, app: [app, { ...app, id: 'other' }] } }),
    /^Error: Shell config "shell.json" names 2 apps in "app". A shell opens exactly one app/
  );
});

test('a shell config with no app is refused', () => {
  assert.throws(
    () => checkShellConfig({ configPath, shell: { ...shell, app: undefined } }),
    /^Error: Shell config "shell.json" should name the app it opens as "app"/
  );
});

test('a shell app without an id is refused', () => {
  assert.throws(
    () => checkShellConfig({ configPath, shell: { ...shell, app: { ...app, id: 3 } } }),
    /^Error: Shell config "shell.json" "app.id" should be a string. Received 3.$/
  );
});

test("a shell app without a url for the shell's environment is refused", () => {
  assert.throws(
    () => checkShellConfig({ configPath, shell: { ...shell, environment: 'staging' } }),
    /"app.urls" should have a url for the shell's environment "staging"/
  );
});
