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

// readPagePath reads build/routes.json from process.cwd(): chdir into a fixture
// that has one before the module loads.
const originalCwd = process.cwd();
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-page-instance-test-'));
fs.mkdirSync(path.join(fixtureDir, 'build'), { recursive: true });
fs.writeFileSync(
  path.join(fixtureDir, 'build', 'routes.json'),
  JSON.stringify([
    { pageId: 'home', path: 'home' },
    { pageId: 'about', path: 'company/about' },
    { pageId: 'ticket', path: 'tickets/{space}/{ticket_id}' },
  ])
);
process.chdir(fixtureDir);

const { default: resolvePageInstance } = await import('./resolvePageInstance.js');

afterAll(() => {
  process.chdir(originalCwd);
  fs.rmSync(fixtureDir, { recursive: true, force: true });
});

test('resolvePageInstance keys a page without placeholders by its id', () => {
  expect(resolvePageInstance({ pageId: 'home' })).toEqual({
    path: 'home',
    instanceKey: 'page:home',
  });
  expect(resolvePageInstance({ pageId: 'about' })).toEqual({
    path: 'company/about',
    instanceKey: 'page:about',
  });
});

test('resolvePageInstance keys a patterned page instance by the path its values build', () => {
  expect(
    resolvePageInstance({ pageId: 'ticket', pathParams: { space: 's', ticket_id: 1 } })
  ).toEqual({
    path: 'tickets/{space}/{ticket_id}',
    instanceKey: 'page:ticket#tickets/s/1',
  });
});

test('resolvePageInstance returns the builder error naming a missing placeholder', () => {
  expect(resolvePageInstance({ pageId: 'ticket', pathParams: { space: 's' } })).toEqual({
    error:
      'Link to page "ticket" is missing a value for path placeholder "ticket_id". Page "ticket" is served at "tickets/{space}/{ticket_id}": pass "pathParams" with a value for each placeholder.',
  });
});

test('resolvePageInstance returns an error for pathParams that are not an object', () => {
  expect(resolvePageInstance({ pageId: 'ticket', pathParams: '1' }).error).toMatch(
    /"pathParams" must be an object of path values/
  );
});

test('resolvePageInstance builds a page the route table does not list as its id', () => {
  expect(resolvePageInstance({ pageId: 'missing' })).toEqual({
    path: undefined,
    instanceKey: 'page:missing',
  });
});
