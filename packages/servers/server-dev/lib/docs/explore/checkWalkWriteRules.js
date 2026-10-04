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

import isWriteRequestsAllowed from '../isWriteRequestsAllowed.js';
import readConnectionArtifacts from '../dataSets/readConnectionArtifacts.js';

const DATA_SET_CONNECTION_TYPE = 'MongoDBCollection';
const OPT_IN = 'cli.agentTools.allowWriteRequests: true in lowdefy.yaml';

// The walk route's own write rules, enforced whatever the caller: walks click
// Save and Delete, so a walk on an app with a MongoDBCollection connection
// runs on a data set unless the caller asks for live data and the app opted
// in, and clicking controls that reach a connection no data set redirects
// (allowExternal) needs the same opt-in. Returns an error message, or
// undefined when the walk may open.
async function checkWalkWriteRules({ buildDirectory, data, liveData, allowExternal }) {
  const needsLiveData = type.isNone(data);
  const needsExternal = (allowExternal ?? []).length > 0;
  let hasDataSetConnection = false;
  if (needsLiveData) {
    const artifacts = await readConnectionArtifacts({ buildDirectory });
    hasDataSetConnection = Object.values(artifacts).some(
      (artifact) => artifact.type === DATA_SET_CONNECTION_TYPE
    );
  }
  const writesLiveData = needsLiveData && hasDataSetConnection;
  if (!writesLiveData && !needsExternal) {
    return undefined;
  }
  const allowed = await isWriteRequestsAllowed();
  if (writesLiveData && liveData !== true) {
    return `Walks click Save and Delete, and this app has a ${DATA_SET_CONNECTION_TYPE} connection. Name a data set ("data") so walks write to a disposable copy, or pass "liveData": true with ${OPT_IN} to write to what the app's connections point at.`;
  }
  if (writesLiveData && !allowed) {
    return `A walk on live data needs ${OPT_IN}.`;
  }
  if (needsExternal && !allowed) {
    return `Walks that click controls reaching ${allowExternal.join(', ')} need ${OPT_IN}.`;
  }
  return undefined;
}

export default checkWalkWriteRules;
