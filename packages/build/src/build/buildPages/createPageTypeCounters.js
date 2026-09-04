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

function createRecordingCounter({ counter, recorded }) {
  return {
    ...counter,
    increment: (key, configKey) => {
      recorded.add(key);
      counter.increment(key, configKey);
    },
  };
}

// Every type a page renders is counted while that page builds — its blocks,
// its actions, its client operators, the types an expanded archetype or
// component introduces, and the types a Dynamic block declares. Recording at
// the counter makes the page's type set exact by construction, rather than
// re-deriving it from the built page tree.
function createPageTypeCounters({ typeCounters }) {
  const types = {
    actions: new Set(),
    blocks: new Set(),
    operators: new Set(),
  };
  return {
    types,
    counters: {
      ...typeCounters,
      actions: createRecordingCounter({ counter: typeCounters.actions, recorded: types.actions }),
      blocks: createRecordingCounter({ counter: typeCounters.blocks, recorded: types.blocks }),
      operators: {
        ...typeCounters.operators,
        client: createRecordingCounter({
          counter: typeCounters.operators.client,
          recorded: types.operators,
        }),
      },
    },
  };
}

export default createPageTypeCounters;
