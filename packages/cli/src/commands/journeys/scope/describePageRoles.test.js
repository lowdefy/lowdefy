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

import admitsRoles from './admitsRoles.js';
import createScope from './createScope.js';
import describePageRoles from './describePageRoles.js';
import formatPageRoleLines from './formatPageRoleLines.js';
import readDataSetUsers from './readDataSetUsers.js';
import selectHeadPages from './selectHeadPages.js';

const users = [
  { dataSet: 'default', user: 'admin', roles: ['admin'] },
  { dataSet: 'default', user: 'member', roles: ['member'] },
  { dataSet: 'empty', user: 'guest', roles: [] },
];

function page({ pageId, auth }) {
  return { id: `page:${pageId}`, pageId, type: 'Box', auth: { ...auth, '~k': 'k1' } };
}

test('admitsRoles admits everyone on a public page, any signed-in caller on a protected page without roles, and a holder of a listed role', () => {
  expect(admitsRoles({ auth: { public: true }, roles: [] })).toBe(true);
  expect(admitsRoles({ auth: { public: false }, roles: [] })).toBe(true);
  expect(admitsRoles({ auth: { public: false, roles: ['admin'] }, roles: ['admin'] })).toBe(true);
  expect(admitsRoles({ auth: { public: false, roles: ['admin'] }, roles: ['member'] })).toBe(false);
});

test('describePageRoles names the access and the data set users a page admits', () => {
  expect(
    describePageRoles({ page: page({ pageId: 'home', auth: { public: true } }), users })
  ).toEqual({ access: 'public', roles: [], users });
  expect(
    describePageRoles({ page: page({ pageId: 'inbox', auth: { public: false } }), users })
  ).toEqual({ access: 'signed-in', roles: [], users });
  expect(
    describePageRoles({
      page: page({ pageId: 'settings', auth: { public: false, roles: ['admin', 'owner'] } }),
      users,
    })
  ).toEqual({ access: 'roles', roles: ['admin', 'owner'], users: [users[0]] });
});

test('selectHeadPages lists every head page but 404, each with reason head', () => {
  const headBuild = { pages: { tickets: {}, 404: {}, home: {} } };
  expect(selectHeadPages({ headBuild })).toEqual({
    pages: [
      { pageId: 'home', reasons: ['head'], authChanged: false, blocks: [] },
      { pageId: 'tickets', reasons: ['head'], authChanged: false, blocks: [] },
    ],
    appWide: [],
    uncompared: [],
    removedPages: [],
    warnings: [],
  });
});

test('createScope adds who can open each page and leaves out the run details', () => {
  const headBuild = {
    pages: { settings: page({ pageId: 'settings', auth: { public: false, roles: ['admin'] } }) },
  };
  const scope = createScope({
    revisions: { root: '/repo', base: 'b', head: 'h', dirty: false, pr: null, context: {} },
    targets: {
      pages: [{ pageId: 'settings', reasons: ['page'], authChanged: false, blocks: [] }],
      appWide: ['menus.json'],
      uncompared: [],
      removedPages: ['old'],
      warnings: ['w'],
    },
    plugins: { missingFromHead: [], versionChanged: [] },
    headBuild,
    users,
  });
  expect(scope).toEqual({
    base: 'b',
    head: 'h',
    dirty: false,
    pages: [
      {
        pageId: 'settings',
        reasons: ['page'],
        authChanged: false,
        blocks: [],
        roles: { access: 'roles', roles: ['admin'], users: [users[0]] },
      },
    ],
    appWide: ['menus.json'],
    uncompared: [],
    plugins: { missingFromHead: [], versionChanged: [] },
    removedPages: ['old'],
  });
  expect(formatPageRoleLines({ scope })).toEqual(['  settings: roles admin; users default/admin']);
});

test('formatPageRoleLines says none when no data set user can open a page', () => {
  const scope = {
    pages: [{ pageId: 'home', roles: { access: 'public', roles: [], users: [] } }],
  };
  expect(formatPageRoleLines({ scope })).toEqual(['  home: public; users none']);
});

test('readDataSetUsers lists the users of every data set under tests/data', async () => {
  const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-scope-users-'));
  try {
    expect(await readDataSetUsers({ configDirectory })).toEqual([]);
    fs.mkdirSync(path.join(configDirectory, 'tests', 'data'), { recursive: true });
    fs.writeFileSync(
      path.join(configDirectory, 'tests', 'data', 'default.yaml'),
      'users:\n  admin: { id: u1, roles: [admin] }\n  member: { id: u2, roles: [member] }\n'
    );
    fs.writeFileSync(path.join(configDirectory, 'tests', 'data', 'empty.yaml'), 'fixtures: {}\n');
    expect(await readDataSetUsers({ configDirectory })).toEqual([
      { dataSet: 'default', user: 'admin', roles: ['admin'] },
      { dataSet: 'default', user: 'member', roles: ['member'] },
    ]);
  } finally {
    fs.rmSync(configDirectory, { recursive: true, force: true });
  }
});
