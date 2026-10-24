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

import createTeeCounter from '../../utils/createTeeCounter.js';

// The app counters a page's types are counted into. A shared page is built
// once, so its client types are counted into the web and the mobile counters
// both; the server-side counters are the same objects for either target.
function getTargetTypeCounters({ target, context }) {
  if (target === 'web') {
    return context.typeCounters;
  }
  if (target === 'mobile') {
    return context.typeCountersMobile;
  }
  const { typeCounters, typeCountersMobile } = context;
  return {
    ...typeCounters,
    actions: createTeeCounter({
      counter: typeCounters.actions,
      pageCounter: typeCountersMobile.actions,
    }),
    blocks: createTeeCounter({
      counter: typeCounters.blocks,
      pageCounter: typeCountersMobile.blocks,
    }),
    operators: {
      ...typeCounters.operators,
      client: createTeeCounter({
        counter: typeCounters.operators.client,
        pageCounter: typeCountersMobile.operators.client,
      }),
    },
  };
}

export default getTargetTypeCounters;
