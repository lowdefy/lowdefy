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

import resolveTargets from './resolveTargets.js';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-snapshot-targets-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('resolveTargets without a manifest captures every page for every dev user', () => {
  const targets = resolveTargets({
    manifest: undefined,
    appPageIds: ['home', 'about'],
    devUsers: ['admin', 'member'],
    configDirectory,
  });
  expect(targets.map((t) => `${t.pageId}/${t.user}`)).toEqual([
    'home/admin',
    'home/member',
    'about/admin',
    'about/member',
  ]);
  expect(targets[0]).toEqual({
    pageId: 'home',
    user: 'admin',
    requestUser: 'admin',
    urlQuery: undefined,
    journey: undefined,
  });
});

test('resolveTargets without dev users captures as the default headless user', () => {
  const targets = resolveTargets({
    manifest: undefined,
    appPageIds: ['home'],
    devUsers: [],
    configDirectory,
  });
  expect(targets).toEqual([
    {
      pageId: 'home',
      user: 'headless',
      requestUser: undefined,
      urlQuery: undefined,
      journey: undefined,
    },
  ]);
});

test('resolveTargets uses the manifest users, urlQuery and journey steps', () => {
  fs.mkdirSync(path.join(configDirectory, 'tests', 'journeys'), { recursive: true });
  fs.writeFileSync(
    path.join(configDirectory, 'tests', 'journeys', 'open.yaml'),
    'name: open\npageId: control\nsteps:\n  - click: open\n'
  );
  const targets = resolveTargets({
    manifest: {
      pages: [
        { pageId: 'controls', users: ['admin', 'member'] },
        {
          pageId: 'control',
          users: ['admin'],
          urlQuery: { slug: 'x' },
          journey: 'tests/journeys/open.yaml',
        },
      ],
    },
    appPageIds: ['ignored'],
    devUsers: ['admin', 'member', 'guest'],
    configDirectory,
  });
  expect(targets.map((t) => `${t.pageId}/${t.user}`)).toEqual([
    'controls/admin',
    'controls/member',
    'control/admin',
  ]);
  expect(targets[2].urlQuery).toEqual({ slug: 'x' });
  expect(targets[2].journey).toEqual([{ click: 'open' }]);
});

test('resolveTargets falls back to every dev user for a manifest page without users', () => {
  const targets = resolveTargets({
    manifest: { pages: [{ pageId: 'home' }] },
    appPageIds: [],
    devUsers: ['admin', 'member'],
    configDirectory,
  });
  expect(targets.map((t) => t.user)).toEqual(['admin', 'member']);
});

test('resolveTargets filters by --pages and --users', () => {
  const targets = resolveTargets({
    manifest: undefined,
    appPageIds: ['home', 'about', 'contact'],
    devUsers: ['admin', 'member'],
    pagesFilter: 'home, contact',
    usersFilter: 'member',
    configDirectory,
  });
  expect(targets.map((t) => `${t.pageId}/${t.user}`)).toEqual(['home/member', 'contact/member']);
});

test('resolveTargets throws when the journey file is missing', () => {
  expect(() =>
    resolveTargets({
      manifest: { pages: [{ pageId: 'a', users: ['admin'], journey: 'tests/journeys/nope.yaml' }] },
      appPageIds: [],
      devUsers: [],
      configDirectory,
    })
  ).toThrow(
    /Journey file "tests\/journeys\/nope.yaml" referenced in tests\/snapshots.yaml not found/
  );
});

test('resolveTargets throws when the journey file has no steps', () => {
  fs.mkdirSync(path.join(configDirectory, 'tests', 'journeys'), { recursive: true });
  fs.writeFileSync(path.join(configDirectory, 'tests', 'journeys', 'bad.yaml'), 'name: bad\n');
  expect(() =>
    resolveTargets({
      manifest: { pages: [{ pageId: 'a', users: ['admin'], journey: 'tests/journeys/bad.yaml' }] },
      appPageIds: [],
      devUsers: [],
      configDirectory,
    })
  ).toThrow(/should contain a journey with a "steps" array/);
});

test('resolveTargets carries the manifest ignore list onto every target for that page', () => {
  const targets = resolveTargets({
    manifest: { pages: [{ pageId: 'home', ignore: ['form.created_at'] }, { pageId: 'about' }] },
    appPageIds: [],
    devUsers: ['admin', 'member'],
    configDirectory,
  });
  expect(targets.map((target) => target.ignore)).toEqual([
    ['form.created_at'],
    ['form.created_at'],
    undefined,
    undefined,
  ]);
});
