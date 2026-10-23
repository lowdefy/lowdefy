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

import readBuildArtifacts from './readBuildArtifacts.js';
import { afterEach, beforeEach, expect, test } from 'vitest';

let buildDirectory;

function writeArtifact(file, value) {
  fs.mkdirSync(path.dirname(path.join(buildDirectory, file)), { recursive: true });
  fs.writeFileSync(path.join(buildDirectory, file), JSON.stringify(value));
}

beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-scope-read-'));
  writeArtifact('keyMap.json', {});
  writeArtifact('refMap.json', {});
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('pages, requests, endpoints, connections and websockets are read by id', () => {
  writeArtifact('pages/home.json', { id: 'home' });
  writeArtifact('pages/home/requests/getItems.json', { id: 'getItems' });
  writeArtifact('api/save.json', { id: 'save' });
  writeArtifact('connections/mongo.json', { id: 'mongo' });
  writeArtifact('websockets/feed.json', { id: 'feed' });
  writeArtifact('menus.json', []);
  writeArtifact('appMeta.json', { buildId: 'x' });
  writeArtifact('routes.json', []);
  const build = readBuildArtifacts({ buildDirectory });
  expect(build.pages).toEqual({ home: { id: 'home' } });
  expect(build.requests).toEqual({ home: { getItems: { id: 'getItems' } } });
  expect(build.endpoints).toEqual({ save: { id: 'save' } });
  expect(build.connections).toEqual({ mongo: { id: 'mongo' } });
  expect(build.websockets).toEqual({ feed: { id: 'feed' } });
  expect(build.appWide).toEqual({ 'menus.json': [] });
  expect(Object.keys(build.files).sort()).toEqual(['keyMap.json', 'refMap.json', 'routes.json']);
});

test('ids holding a slash, as module ids do, are read', () => {
  writeArtifact('pages/user-admin/users.json', { id: 'user-admin/users' });
  writeArtifact('pages/user-admin/users/requests/getUsers.json', { id: 'getUsers' });
  writeArtifact('pages/user-admin/users/edit.json', { id: 'user-admin/users/edit' });
  writeArtifact('api/user-admin/invite.json', { id: 'user-admin/invite' });
  writeArtifact('connections/user-admin/users.json', { id: 'user-admin/users' });
  writeArtifact('websockets/notifications/feed.json', { id: 'notifications/feed' });
  const build = readBuildArtifacts({ buildDirectory });
  expect(Object.keys(build.pages).sort()).toEqual(['user-admin/users', 'user-admin/users/edit']);
  expect(build.requests).toEqual({ 'user-admin/users': { getUsers: { id: 'getUsers' } } });
  expect(Object.keys(build.endpoints)).toEqual(['user-admin/invite']);
  expect(Object.keys(build.connections)).toEqual(['user-admin/users']);
  expect(Object.keys(build.websockets)).toEqual(['notifications/feed']);
  expect(Object.keys(build.files).sort()).toEqual(['keyMap.json', 'refMap.json']);
});

test('request ids holding a slash are read as requests of their page', () => {
  writeArtifact('pages/home.json', { id: 'home' });
  writeArtifact('pages/home/requests/reports/summary.json', { id: 'reports/summary' });
  writeArtifact('pages/user-admin/users.json', { id: 'user-admin/users' });
  writeArtifact('pages/user-admin/users/requests/admin/list.json', { id: 'admin/list' });
  const build = readBuildArtifacts({ buildDirectory });
  expect(Object.keys(build.pages).sort()).toEqual(['home', 'user-admin/users']);
  expect(build.requests).toEqual({
    home: { 'reports/summary': { id: 'reports/summary' } },
    'user-admin/users': { 'admin/list': { id: 'admin/list' } },
  });
});

test('requests go to the longest page id that is a page', () => {
  writeArtifact('pages/crm.json', { id: 'crm' });
  writeArtifact('pages/crm/requests.json', { id: 'crm/requests' });
  writeArtifact('pages/crm/requests/requests/list.json', { id: 'list' });
  const build = readBuildArtifacts({ buildDirectory });
  expect(Object.keys(build.pages).sort()).toEqual(['crm', 'crm/requests']);
  expect(build.requests).toEqual({ 'crm/requests': { list: { id: 'list' } } });
});

test('a requests folder under no page is a page path, not requests', () => {
  writeArtifact('pages/reports/requests/summary.json', { id: 'reports/requests/summary' });
  const build = readBuildArtifacts({ buildDirectory });
  expect(Object.keys(build.pages)).toEqual(['reports/requests/summary']);
  expect(build.requests).toEqual({});
});
