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

import { type } from '@lowdefy/helpers';

import readRoutineSteps from './readRoutineSteps.js';

// The browser never sees a routine's CallApi, in-process or detached, so the
// endpoints a journey reached through one are added from config: every
// endpoint a called endpoint's routine names with a literal endpointId,
// transitively, as { endpointId, via, calls: null }. A computed endpointId
// cannot be followed; such steps are counted as `unfollowed`.
async function addNestedEndpoints({ endpoints, readConfigFile }) {
  const result = endpoints.map((endpoint) => ({ ...endpoint }));
  const visited = new Set(endpoints.map(({ endpointId }) => endpointId));
  const queue = [...visited];
  let unfollowed = 0;
  while (queue.length > 0) {
    const caller = queue.shift();
    const artifact = await readConfigFile(`api/${caller}.json`);
    const callApiSteps = readRoutineSteps({ routine: artifact?.routine }).filter(
      (step) => step.type === 'CallApi'
    );
    callApiSteps.forEach((step) => {
      const endpointId = step.properties?.endpointId;
      if (!type.isString(endpointId)) {
        unfollowed += 1;
        return;
      }
      if (visited.has(endpointId)) {
        return;
      }
      visited.add(endpointId);
      queue.push(endpointId);
      result.push({ endpointId, via: caller, calls: null });
    });
  }
  return { endpoints: result, unfollowed };
}

export default addNestedEndpoints;
