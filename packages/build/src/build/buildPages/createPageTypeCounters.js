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

import createCounter from '../../utils/createCounter.js';
import createTeeCounter from '../../utils/createTeeCounter.js';

// Page building counts types into the app counters (types.json, the plugin
// barrels). The tee also records the client types each page uses, so the
// production client can load one page's plugin code instead of the whole app's.
function createPageTypeCounters({ typeCounters }) {
  const pageCounters = {
    actions: createCounter(),
    blocks: createCounter(),
    operators: createCounter(),
  };
  return {
    pageCounters,
    typeCounters: {
      ...typeCounters,
      actions: createTeeCounter({
        counter: typeCounters.actions,
        pageCounter: pageCounters.actions,
      }),
      blocks: createTeeCounter({
        counter: typeCounters.blocks,
        pageCounter: pageCounters.blocks,
      }),
      operators: {
        ...typeCounters.operators,
        client: createTeeCounter({
          counter: typeCounters.operators.client,
          pageCounter: pageCounters.operators,
        }),
      },
    },
  };
}

export default createPageTypeCounters;
