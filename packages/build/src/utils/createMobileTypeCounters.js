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

import createCounter from './createCounter.js';

// Mobile pages count their client types (blocks, actions, client operators)
// into counters of their own, resolved against the native types map. Every
// other class is shared with the web counters: the server runs a mobile page's
// requests, so their types must reach the server imports. A new counter class
// is shared unless it is added here.
function createMobileTypeCounters({ typeCounters }) {
  return {
    ...typeCounters,
    actions: createCounter(),
    blocks: createCounter(),
    operators: {
      ...typeCounters.operators,
      client: createCounter(),
    },
  };
}

export default createMobileTypeCounters;
