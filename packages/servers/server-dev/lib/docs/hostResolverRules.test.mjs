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

import hostResolverRules from './hostResolverRules.js';

test('hostResolverRules fails every host on the origin port but the origin host', () => {
  expect(hostResolverRules({ origin: 'http://localhost:3001' })).toEqual(
    'MAP *:3001 ~NOTFOUND, EXCLUDE localhost'
  );
  expect(hostResolverRules({ origin: 'http://127.0.0.1:3001' })).toEqual(
    'MAP *:3001 ~NOTFOUND, EXCLUDE 127.0.0.1'
  );
});

test('hostResolverRules names an IPv6 origin host without its brackets', () => {
  expect(hostResolverRules({ origin: 'http://[::1]:3001' })).toEqual(
    'MAP *:3001 ~NOTFOUND, EXCLUDE ::1'
  );
});

test('hostResolverRules uses the default port of an origin that names none', () => {
  expect(hostResolverRules({ origin: 'http://localhost' })).toEqual(
    'MAP *:80 ~NOTFOUND, EXCLUDE localhost'
  );
  expect(hostResolverRules({ origin: 'https://dev.example.test' })).toEqual(
    'MAP *:443 ~NOTFOUND, EXCLUDE dev.example.test'
  );
});
