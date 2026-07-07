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

// Mobile pages count client-side types (blocks, actions, client operators)
// into their own counters; server-side classes (requests, connections, server
// operators, ...) share the main counters — the server executes mobile page
// requests, so their types must reach the server imports. When adding a
// counter class, decide here whether it is per-target or shared.
function createMobileTypeCounters({ typeCounters }) {
  return {
    ...typeCounters,
    actions: createCounter(),
    blocks: createCounter(),
    operators: {
      client: createCounter(),
      server: typeCounters.operators.server,
    },
  };
}

export default createMobileTypeCounters;
