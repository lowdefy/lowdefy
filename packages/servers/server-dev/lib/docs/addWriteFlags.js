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

// A request writes when its type declares meta.checkWrite: true. An endpoint
// writes when a step of its routine has such a type, or when an endpoint it
// reaches through CallApi writes, so a caller that writes only through a
// nested endpoint still reads as a write.
async function addWriteFlags({ requests, endpoints, readConfigFile, requestSchemas }) {
  function isWriteType(stepType) {
    return requestSchemas[stepType]?.meta?.checkWrite === true;
  }

  const routines = new Map();
  async function readEndpoint(endpointId) {
    if (!routines.has(endpointId)) {
      const artifact = await readConfigFile(`api/${endpointId}.json`);
      const steps = readRoutineSteps({ routine: artifact?.routine });
      routines.set(endpointId, {
        writes: steps.some((step) => isWriteType(step.type)),
        targets: steps
          .filter((step) => step.type === 'CallApi' && type.isString(step.properties?.endpointId))
          .map((step) => step.properties.endpointId),
      });
    }
    return routines.get(endpointId);
  }

  async function reachesWrite(endpointId) {
    const visited = new Set([endpointId]);
    const queue = [endpointId];
    while (queue.length > 0) {
      const { writes, targets } = await readEndpoint(queue.shift());
      if (writes) {
        return true;
      }
      targets
        .filter((target) => !visited.has(target))
        .forEach((target) => {
          visited.add(target);
          queue.push(target);
        });
    }
    return false;
  }

  const requestsWithWrite = [];
  for (const request of requests) {
    const artifact = await readConfigFile(
      `pages/${request.pageId}/requests/${request.requestId}.json`
    );
    requestsWithWrite.push({ ...request, write: isWriteType(artifact?.type) });
  }
  const endpointsWithWrite = [];
  for (const endpoint of endpoints) {
    endpointsWithWrite.push({ ...endpoint, write: await reachesWrite(endpoint.endpointId) });
  }
  return { requests: requestsWithWrite, endpoints: endpointsWithWrite };
}

export default addWriteFlags;
