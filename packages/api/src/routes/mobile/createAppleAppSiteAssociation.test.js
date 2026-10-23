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
import createAppleAppSiteAssociation from './createAppleAppSiteAssociation.js';

test('createAppleAppSiteAssociation names every iOS shell and opens every path but the API', () => {
  const mobileConfig = {
    shells: [
      { id: 'field', ios: { bundleId: 'com.example.field', teamId: 'TEAM1' } },
      { id: 'office', ios: { bundleId: 'com.example.office', teamId: 'TEAM2' } },
      { id: 'droid', android: { package: 'com.example.droid', sha256: ['AA:BB'] } },
    ],
  };
  expect(createAppleAppSiteAssociation({ mobileConfig, basePath: '' })).toEqual({
    applinks: {
      details: [
        {
          appIDs: ['TEAM1.com.example.field', 'TEAM2.com.example.office'],
          components: [{ '/': '/api/*', exclude: true }, { '/': '/*' }],
        },
      ],
    },
  });
});

test('createAppleAppSiteAssociation scopes the paths to basePath', () => {
  const mobileConfig = {
    shells: [{ id: 'field', ios: { bundleId: 'com.example.field', teamId: 'TEAM1' } }],
  };
  const document = createAppleAppSiteAssociation({ mobileConfig, basePath: '/app' });
  expect(document.applinks.details[0].components).toEqual([
    { '/': '/app/api/*', exclude: true },
    { '/': '/app/*' },
  ]);
});

test('createAppleAppSiteAssociation leaves out an iOS shell without a team id', () => {
  const mobileConfig = {
    shells: [
      { id: 'field', ios: { bundleId: 'com.example.field' } },
      { id: 'office', ios: { bundleId: 'com.example.office', teamId: 'TEAM2' } },
    ],
  };
  const document = createAppleAppSiteAssociation({ mobileConfig, basePath: '' });
  expect(document.applinks.details[0].appIDs).toEqual(['TEAM2.com.example.office']);
});

test('createAppleAppSiteAssociation returns null without an iOS shell', () => {
  expect(createAppleAppSiteAssociation({ mobileConfig: {}, basePath: '' })).toBeNull();
  expect(
    createAppleAppSiteAssociation({
      mobileConfig: { shells: [{ id: 'droid', android: { package: 'p', sha256: ['AA'] } }] },
      basePath: '',
    })
  ).toBeNull();
});
