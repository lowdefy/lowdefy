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

import { createDataSetRefusal } from './dataSets/index.js';

// The resolver of a request type with no stub, on a connection type that does not say how it
// runs under a data session. Stubbing one request type of such a type lets its connection
// through the gate, so every other request type of it refuses here, with the refusal the gate
// gives a connection it does not let through.
function createRefusingResolver({ connectionType, requestType, testSession }) {
  return async function refusingResolver(args) {
    throw createDataSetRefusal({
      artifact: { connectionId: args.connectionId, type: connectionType },
      session: testSession.dataSession.session,
      reason: `its type does not say how to redirect it, and request type "${requestType}" has no stub`,
    });
  };
}

export default createRefusingResolver;
