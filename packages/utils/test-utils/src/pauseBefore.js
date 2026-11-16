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

import checkSessionOpen from './checkSessionOpen.js';

// Holds a routine at a request step, for a test of two calls that race. The next routine to
// reach the step with this id (a request step in an endpoint routine, or a page request's id)
// stops just before the request runs. Returns { reached, release }: `reached` resolves once a
// routine is held there, and release() lets it go on. One gate holds one routine; a second
// routine reaching the step runs straight through, which is what lets a test run the other
// call to completion while the first one waits. Steps that are not requests (CallApi, control
// steps) are not held: name a request step inside them.
function pauseBefore({ stepId, testSession }) {
  checkSessionOpen({ testSession });
  if (!type.isString(stepId) || stepId === '') {
    throw new Error(`pauseBefore takes a step id. Received ${JSON.stringify(stepId)}.`);
  }
  const gate = {};
  const reached = new Promise((resolve) => {
    gate.arrive = resolve;
  });
  gate.released = new Promise((resolve) => {
    gate.release = resolve;
  });
  const gates = testSession.gates.get(stepId) ?? [];
  gates.push(gate);
  testSession.gates.set(stepId, gates);
  return {
    reached,
    release: () => {
      // A gate released before any routine reached it holds nothing later.
      const waiting = testSession.gates.get(stepId) ?? [];
      const index = waiting.indexOf(gate);
      if (index !== -1) waiting.splice(index, 1);
      gate.release();
    },
  };
}

export default pauseBefore;
