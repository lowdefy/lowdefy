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

import { expect, test } from 'vitest';
import createUpdateMessage from './createUpdateMessage.js';
import parseShellVersion from './parseShellVersion.js';

test('the update message carries the shell version, profile and runtime version', () => {
  expect(
    createUpdateMessage({ profile: 'field', runtimeVersion: '3-field', shellVersion: '6.1.0' })
  ).toBe('lowdefy-shell@6.1.0 profile=field runtime=3-field');
});

test('parseShellVersion reads the version back, as written and as update:list shows it', () => {
  const message = createUpdateMessage({
    profile: 'field',
    runtimeVersion: '3-field',
    shellVersion: '6.1.0-alpha.2',
  });
  expect(parseShellVersion(message)).toBe('6.1.0-alpha.2');
  expect(parseShellVersion(`"${message}" (2 hours ago by someone)`)).toBe('6.1.0-alpha.2');
});

test('parseShellVersion returns null for a message without a shell version', () => {
  expect(parseShellVersion('hotfix')).toBe(null);
  expect(parseShellVersion('"lowdefy-shell@" (now)')).toBe(null);
  expect(parseShellVersion(undefined)).toBe(null);
});
