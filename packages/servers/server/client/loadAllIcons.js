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

import { icons } from '../build/plugins/pageTypes.js';

import types from './types.js';

let loading = null;

// Each page loads the icons its config names. A name that only arrives at
// runtime - from state, a request, HTML built from data, theme.icons.include -
// may be outside that set, so the first icon that misses loads every icon the
// app bundles, once per tab. Every caller shares the one load; a failed load
// is logged here and cleared, so the next miss tries again.
function loadAllIcons() {
  if (loading === null) {
    loading = icons().then(
      (module) => {
        Object.assign(types.icons, module.default);
      },
      (error) => {
        loading = null;
        // eslint-disable-next-line no-console
        console.error(error);
        throw error;
      }
    );
  }
  return loading;
}

export default loadAllIcons;
