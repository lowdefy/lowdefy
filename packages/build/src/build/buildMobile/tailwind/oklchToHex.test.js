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

import oklchToHex from './oklchToHex.js';

test('oklchToHex converts Tailwind 4 palette colours to sRGB hex', () => {
  expect(oklchToHex('oklch(63.7% 0.237 25.331)')).toBe('#fb2c36');
  expect(oklchToHex('oklch(21% 0.034 264.665)')).toBe('#101828');
  expect(oklchToHex('oklch(100% 0 0)')).toBe('#ffffff');
});

test('oklchToHex keeps alpha below one and leaves other colours as they are', () => {
  expect(oklchToHex('oklch(0% 0 0 / 50%)')).toBe('#00000080');
  expect(oklchToHex('#ff0000')).toBe('#ff0000');
  expect(oklchToHex('red')).toBe('red');
});
