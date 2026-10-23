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

import isPhoneLayout from './isPhoneLayout.js';
import { expect, test } from 'vitest';

test('the phone layout is below the md breakpoint', () => {
  expect(isPhoneLayout({ xs: true, sm: true, md: false })).toBe(true);
  expect(isPhoneLayout({ xs: true, sm: true, md: true, lg: true })).toBe(false);
});

test('before the first measure the layout is the wide one', () => {
  expect(isPhoneLayout({})).toBe(false);
  expect(isPhoneLayout(undefined)).toBe(false);
});
