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
const { getAppLinkIntentFilters, getAssociatedDomains } = require('./appLinks.js');

function shellAt(url) {
  return { environment: 'production', app: { urls: { production: url } } };
}

test('an https app url gives the applinks domain and an autoVerify filter for its host', () => {
  const shell = shellAt('https://field.example.com');
  assert.deepEqual(getAssociatedDomains({ shell }), ['applinks:field.example.com']);
  assert.deepEqual(getAppLinkIntentFilters({ shell }), [
    {
      action: 'VIEW',
      autoVerify: true,
      data: [{ scheme: 'https', host: 'field.example.com' }],
      category: ['BROWSABLE', 'DEFAULT'],
    },
  ]);
});

test('a basePath and port are kept', () => {
  const shell = shellAt('https://example.com:8443/acme/');
  assert.deepEqual(getAssociatedDomains({ shell }), ['applinks:example.com:8443']);
  assert.deepEqual(getAppLinkIntentFilters({ shell })[0].data, [
    { scheme: 'https', host: 'example.com', pathPrefix: '/acme', port: '8443' },
  ]);
});

test('an http app url gives no app links', () => {
  const shell = shellAt('http://localhost:3000');
  assert.deepEqual(getAssociatedDomains({ shell }), []);
  assert.deepEqual(getAppLinkIntentFilters({ shell }), []);
});
