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

import createForcedFailure from './createForcedFailure.js';
import matchesRequestKey from './matchesRequestKey.js';

function isArmed(gate) {
  return gate.times === 'all' || gate.fired < gate.times;
}

// Throws the forced failure of the first armed fail gate the request matches, and counts it.
// Called before the request's resolver, so nothing the request would do happens.
function throwAtFailGate({ args, session }) {
  const gate = session.failGates.find(
    (entry) => isArmed(entry) && matchesRequestKey({ entry, request: args })
  );
  if (type.isUndefined(gate)) return;
  gate.fired += 1;
  throw createForcedFailure({ message: gate.message });
}

export default throwAtFailGate;
