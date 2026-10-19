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

import { expect } from '@playwright/test';
import { get } from '@lowdefy/helpers';

import { getState } from '../core/state.js';

async function expectState(page, { key, value, timeout = 5000 }) {
  await expect
    .poll(
      async () => {
        const state = await getState(page);
        return get(state, key);
      },
      { timeout }
    )
    .toEqual(value);
}

export { expectState };
