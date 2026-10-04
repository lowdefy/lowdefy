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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import evaluateAccess from './evaluateAccess.js';

let buildDirectory;

function writePage(pageId, auth) {
  fs.writeFileSync(
    path.join(buildDirectory, 'pages', `${pageId}.json`),
    JSON.stringify({ id: pageId, auth })
  );
}

beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-explore-access-'));
  fs.mkdirSync(path.join(buildDirectory, 'pages'));
  writePage('tickets', { public: false, roles: ['admin', 'member'] });
  writePage('billing', { public: false, roles: ['admin'] });
  writePage('open', { public: true });
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

const redirected = { pageId: 'home', url: '/home', redirected: true };

test('a redirect from a page whose auth admits a role set production shows on it is role-refused', () => {
  const { admitted, finding } = evaluateAccess({
    buildDirectory,
    pageId: 'tickets',
    observation: redirected,
    roles: ['member'],
    roleMatrixListed: true,
  });
  expect(admitted).toBe(true);
  expect(finding).toEqual(
    expect.objectContaining({
      kind: 'role-refused',
      severity: 'error',
      pageId: 'tickets',
      key: expect.stringMatching(/^role-refused\|tickets\|message:/),
    })
  );
});

test('a redirect the page auth intends is no finding and reads not admitted', () => {
  expect(
    evaluateAccess({
      buildDirectory,
      pageId: 'billing',
      observation: redirected,
      roles: ['member'],
      roleMatrixListed: true,
    })
  ).toEqual({ admitted: false, finding: null });
});

test('a redirect on a role set production does not show on the page is no finding', () => {
  expect(
    evaluateAccess({
      buildDirectory,
      pageId: 'open',
      observation: redirected,
      roles: ['member'],
      roleMatrixListed: false,
    })
  ).toEqual({ admitted: true, finding: null });
});

test('a walk that opened on the page it asked for is admitted with no finding', () => {
  expect(
    evaluateAccess({
      buildDirectory,
      pageId: 'billing',
      observation: { pageId: 'billing', redirected: false },
      roles: [],
      roleMatrixListed: true,
    })
  ).toEqual({ admitted: true, finding: null });
});
