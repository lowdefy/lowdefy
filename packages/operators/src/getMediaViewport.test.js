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

import getMediaViewport from './getMediaViewport.js';

test.each([
  [320, 'xs'],
  [639, 'xs'],
  [640, 'sm'],
  [767, 'sm'],
  [768, 'md'],
  [1023, 'md'],
  [1024, 'lg'],
  [1279, 'lg'],
  [1280, 'xl'],
  [1535, 'xl'],
  [1536, '2xl'],
  [2560, '2xl'],
])('getMediaViewport maps width %i to size %s', (innerWidth, size) => {
  expect(getMediaViewport({ window: { innerWidth, innerHeight: 500 } })).toEqual({
    size,
    width: innerWidth,
    height: 500,
  });
});
