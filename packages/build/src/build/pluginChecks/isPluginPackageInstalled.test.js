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

import isPluginPackageInstalled from './isPluginPackageInstalled.js';
import { expect, test } from 'vitest';

test('isPluginPackageInstalled finds a package the build package depends on', () => {
  expect(
    isPluginPackageInstalled({ context: { directories: {} }, packageName: '@lowdefy/operators-js' })
  ).toBe(true);
});

test('isPluginPackageInstalled is false for a package installed nowhere', () => {
  expect(
    isPluginPackageInstalled({
      context: { directories: {} },
      packageName: '@lowdefy-test/not-installed-anywhere',
    })
  ).toBe(false);
});
