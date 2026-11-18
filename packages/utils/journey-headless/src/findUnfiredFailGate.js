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
import {
  describeAnswerStub,
  describeFailGate,
  listUnansweredStubs,
  listUnfiredFailGates,
} from '@lowdefy/test-utils/dataSets';

// A journey's failure when a fail gate its stubs set never fired, or else an answer stub never
// answered, so a check can't pass while testing nothing: { index, step, expected, actual, message }
// on its last step, as a journey's ending is judged there; undefined when every gate fired and
// every stub answered. `session` is the data session.
function findUnfiredFailGate({ session, steps }) {
  const index = steps.length - 1;
  const [gate] = listUnfiredFailGates({ session });
  if (!type.isUndefined(gate)) {
    const description = describeFailGate(gate);
    return {
      index,
      step: steps[index],
      expected: `a request to reach the forced failure on ${description}`,
      actual: 'no request reached it',
      message: `The forced failure on ${description} ("${gate.message}") never fired: no request the journey made matched it, so nothing tested what it fails.`,
    };
  }
  const [stub] = listUnansweredStubs({ session });
  if (!type.isUndefined(stub)) {
    const description = describeAnswerStub(stub);
    return {
      index,
      step: steps[index],
      expected: `a request to be answered by the ${description}`,
      actual: 'no request reached it',
      message: `The ${description} never answered: no request the journey made matched it, or an earlier stub answered first, so nothing used its answer.`,
    };
  }
  return undefined;
}

export default findUnfiredFailGate;
