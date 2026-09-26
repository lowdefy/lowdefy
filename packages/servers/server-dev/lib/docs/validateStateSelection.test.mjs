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

import validateStateSelection from './validateStateSelection.js';

test.each([undefined, true, false, [], ['form.name', 'rows']])(
  'validateStateSelection accepts %j',
  (state) => {
    expect(validateStateSelection({ state })).toBeUndefined();
  }
);

test.each(['all', null, 1, [''], ['a', 2], { path: 'a' }])(
  'validateStateSelection rejects %j',
  (state) => {
    expect(validateStateSelection({ state })).toMatch(
      /^The "state" option must be true, false or an array of state paths/
    );
  }
);
