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

import createDevAppLink from './createDevAppLink.js';

test('createDevAppLink encodes the dev server url into a connect link', () => {
  expect(createDevAppLink({ url: 'http://localhost:3000' })).toBe(
    'lowdefy-dev://connect?url=http%3A%2F%2Flocalhost%3A3000'
  );
});

test('createDevAppLink encodes quotes and brackets so the link stays inside shell quotes', () => {
  expect(createDevAppLink({ url: "http://a'b(c)!*" })).toBe(
    'lowdefy-dev://connect?url=http%3A%2F%2Fa%27b%28c%29%21%2A'
  );
});
