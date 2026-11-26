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

import getPackageName from './getPackageName.js';

test('getPackageName returns a package name as it is', () => {
  expect(getPackageName({ name: '@lowdefy/api' })).toEqual('@lowdefy/api');
  expect(getPackageName({ name: 'mongodb' })).toEqual('mongodb');
});

test('getPackageName returns the package an entry belongs to', () => {
  expect(getPackageName({ name: '@lowdefy/connection-mongodb/clients' })).toEqual(
    '@lowdefy/connection-mongodb'
  );
  expect(getPackageName({ name: 'mongodb/lib/bson' })).toEqual('mongodb');
});
