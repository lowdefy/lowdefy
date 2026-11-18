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
import { describeFailGate, listUnfiredFailGates } from '@lowdefy/test-utils/dataSets';

// A journey's failure when a fail gate its stubs set never fired, so a check can't pass while
// testing nothing: { index, step, expected, actual, message } on its last step, as a journey's
// ending is judged there; undefined when every gate fired. `session` is the data session.
function findUnfiredFailGate({ session, steps }) {
  const [gate] = listUnfiredFailGates({ session });
  if (type.isUndefined(gate)) {
    return undefined;
  }
  const index = steps.length - 1;
  const description = describeFailGate(gate);
  return {
    index,
    step: steps[index],
    expected: `a request to reach the forced failure on ${description}`,
    actual: 'no request reached it',
    message: `The forced failure on ${description} ("${gate.message}") never fired: no request the journey made matched it, so nothing tested what it fails.`,
  };
}

export default findUnfiredFailGate;
