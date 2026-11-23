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

import addNestedEndpoints from './addNestedEndpoints.js';
import addWriteFlags from './addWriteFlags.js';
import matchExercisedPages from './matchExercisedPages.js';
import mergeNetworkSnapshots from './mergeNetworkSnapshots.js';

// What one journey run touched, across all of its actors: the network path
// its browsers measured, the endpoints their routines reached through CallApi,
// which requests and endpoints write, what its pages observed: the events
// that completed and the blocks that were ever visible, and the control each
// page-reading click landed on (`controls`, from the step results the browser
// runner wrote: [{ stepIndex, blockId, control, rowKey }]), which lint L8
// suggests as the step's target.
async function collectExercised({ snapshots, observed, readConfigFile, requestSchemas, steps = [] }) {
  const network = mergeNetworkSnapshots({ snapshots });
  const { endpoints, unfollowed } = await addNestedEndpoints({
    endpoints: network.endpoints,
    readConfigFile,
  });
  const withWrites = await addWriteFlags({
    requests: network.requests,
    endpoints,
    readConfigFile,
    requestSchemas,
  });
  return {
    pages: matchExercisedPages({
      routes: await readConfigFile('routes.json'),
      pagePaths: network.pagePaths,
    }),
    appEvents: network.appEvents,
    requests: withWrites.requests,
    endpoints: withWrites.endpoints,
    unfollowed,
    events: observed.events,
    rendered: observed.rendered,
    controls: steps
      .filter((step) => !type.isNone(step.control))
      .map(({ index, control }) => ({ stepIndex: index, ...control })),
  };
}

export default collectExercised;
