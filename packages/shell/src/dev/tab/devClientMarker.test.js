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

import DEV_CLIENT_MARKER from './devClientMarker.js';

const { DEV_CLIENT_MARKER: RELEASE_CHECK_MARKER } = require('../../../shellVariant.js');

test('the dev-tab client marker matches the one the release bundle check looks for', () => {
  expect(DEV_CLIENT_MARKER).toBe(RELEASE_CHECK_MARKER);
});
