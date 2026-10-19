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

import loadRouteTable from './loadRouteTable.js';

test('loadRouteTable reads the routes and basePath of the build', () => {
  const buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-route-table-'));
  const routes = [
    { pageId: 'ticket', path: 'tickets/{space}/{ticket_id}', auth: { public: true } },
  ];
  fs.writeFileSync(path.join(buildDirectory, 'routes.json'), JSON.stringify(routes));
  fs.writeFileSync(path.join(buildDirectory, 'config.json'), JSON.stringify({ basePath: '/app' }));
  expect(loadRouteTable({ buildDirectory })).toEqual({ routes, basePath: '/app' });
});

test('loadRouteTable gives an empty basePath when the app sets none', () => {
  const buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-route-table-'));
  fs.writeFileSync(path.join(buildDirectory, 'routes.json'), '[]');
  fs.writeFileSync(path.join(buildDirectory, 'config.json'), '{}');
  expect(loadRouteTable({ buildDirectory })).toEqual({ routes: [], basePath: '' });
});

test('loadRouteTable gives an empty table without a build', () => {
  expect(loadRouteTable({ buildDirectory: undefined })).toEqual({ routes: [], basePath: '' });
});
