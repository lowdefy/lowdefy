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

// Wraps a request resolver so a routine can be held just before it: when the request's step id
// has a pause gate waiting (pauseBefore), the first routine to reach it takes the gate, tells
// the test it has arrived, and waits to be released before the request runs. Operators are
// evaluated and schemas checked before a resolver is called, so the routine is held with its
// request built and not yet sent. Schema and meta stay on the wrapper, as the request route
// reads them from the resolver.
function holdAtStep({ resolver, testSession }) {
  async function heldResolver(args) {
    const gate = testSession.gates.get(args.requestId)?.shift();
    if (!type.isNone(gate)) {
      testSession.held.add(gate.release);
      gate.arrive();
      await gate.released;
      testSession.held.delete(gate.release);
    }
    return resolver(args);
  }
  return Object.assign(heldResolver, resolver);
}

export default holdAtStep;
