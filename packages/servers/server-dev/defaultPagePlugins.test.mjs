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

import fs from 'node:fs';

import { expect, test } from 'vitest';

import defaultTypesMap from '../../build/dist/defaultTypesMap.js';

// Pages build on demand, so the config build cannot see which page-level types
// an app uses. A page that needs a package the server lacks makes the server
// install it and restart, which ends any journey running in that server.
test('server-dev depends on every default package with a page-level type', () => {
  const { dependencies } = JSON.parse(
    fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')
  );
  const pageLevelTypes = [
    ...Object.values(defaultTypesMap.blocks),
    ...Object.values(defaultTypesMap.actions),
    ...Object.values(defaultTypesMap.operators.client),
  ];
  const packages = [...new Set(pageLevelTypes.map((type) => type.package))];

  expect(packages.filter((name) => dependencies[name] === undefined)).toEqual([]);
});
