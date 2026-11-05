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

import assert from 'node:assert/strict';
import { test } from 'node:test';

import getAppSlug from './getAppSlug.mjs';

test('getAppSlug names an app in the repository by its path', () => {
  assert.equal(
    getAppSlug({ configDirectory: '/repo/packages/docs', repoRoot: '/repo' }),
    'packages-docs'
  );
});

test('getAppSlug names an app outside the repository by its folder', () => {
  assert.equal(
    getAppSlug({ configDirectory: '/work/client-app', repoRoot: '/repo' }),
    'client-app'
  );
});
