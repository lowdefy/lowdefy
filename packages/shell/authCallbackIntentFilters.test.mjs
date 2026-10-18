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
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { getAuthCallbackIntentFilters } = require('./authCallbackIntentFilters.js');

test('each app gets a verified https app link for the sign-in callback at its environment url', () => {
  const shell = {
    environment: 'production',
    apps: [
      {
        id: 'field',
        urls: { production: 'https://field.example.com', staging: 'https://s.example.com' },
      },
      { id: 'yard', urls: { production: 'https://apps.example.com:8443/yard/' } },
    ],
  };
  assert.deepEqual(getAuthCallbackIntentFilters({ shell }), [
    {
      action: 'VIEW',
      autoVerify: true,
      data: [{ scheme: 'https', host: 'field.example.com', pathPrefix: '/auth/mobile/callback' }],
      category: ['BROWSABLE', 'DEFAULT'],
    },
    {
      action: 'VIEW',
      autoVerify: true,
      data: [
        {
          scheme: 'https',
          host: 'apps.example.com',
          pathPrefix: '/yard/auth/mobile/callback',
          port: '8443',
        },
      ],
      category: ['BROWSABLE', 'DEFAULT'],
    },
  ]);
});

test('an http url, or an app with no url for the environment, gets no app link', () => {
  const shell = {
    environment: 'dev',
    apps: [
      { id: 'dev', urls: { dev: 'http://localhost:3000' } },
      { id: 'other', urls: { production: 'https://other.example.com' } },
    ],
  };
  assert.deepEqual(getAuthCallbackIntentFilters({ shell }), []);
});
