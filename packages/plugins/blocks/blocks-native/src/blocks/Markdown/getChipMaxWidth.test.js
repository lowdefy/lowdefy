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

import getChipMaxWidth from './getChipMaxWidth.js';

test('getChipMaxWidth caps a chip with text after it at three quarters of the line', () => {
  expect(getChipMaxWidth({ followed: true, width: 320 })).toBe(240);
  expect(getChipMaxWidth({ followed: true, width: 343 })).toBe(257);
});

test('getChipMaxWidth lets a chip that ends its line take the whole line', () => {
  expect(getChipMaxWidth({ followed: false, width: 320 })).toBe(320);
});
