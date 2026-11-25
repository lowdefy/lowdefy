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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect, test } from 'vitest';

import removeDroppedRequests from './removeDroppedRequests.js';

test('removeDroppedRequests removes the artifacts of requests the page no longer has', () => {
  const buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-dropped-requests-'));
  const directory = path.join(buildDirectory, 'pages', 'module/page', 'requests');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'removed.json'), '{}');
  fs.writeFileSync(path.join(directory, 'kept.json'), '{}');

  removeDroppedRequests({
    buildDirectory,
    pageId: 'module/page',
    requests: [{ requestId: 'kept' }],
  });

  expect(fs.readdirSync(directory)).toEqual(['kept.json']);
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('removeDroppedRequests leaves a page with no request artifacts as it is', () => {
  const buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-dropped-requests-'));

  removeDroppedRequests({ buildDirectory, pageId: 'home', requests: [] });

  expect(fs.existsSync(path.join(buildDirectory, 'pages'))).toBe(false);
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});
