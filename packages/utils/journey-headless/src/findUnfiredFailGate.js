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
  drainSessionWork,
  listUnansweredStubs,
  listUnfiredFailGates,
} from '@lowdefy/test-utils/dataSets';

const DRAIN_TIMEOUT_MS = 30000;

// A journey's failure when a fail gate its stubs set never fired, or else an answer stub that names
// its target never answered, so a check can't pass while testing nothing: { index, step, expected,
// actual, message } on its last step, as a journey's ending is judged there; undefined when every
// gate fired and every such stub answered. A stub keyed only by connectionType and requestType is
// a fallback and may go unused (listUnansweredStubs). `session` is the data session. Its background
// work (context.waitUntil) is drained first, so a request only that work makes is counted. Work
// still running after the wait (as when the session closes) is judged as it stands.
async function findUnfiredFailGate({ session, steps }) {
  await drainSessionWork({ work: session.work, timeoutMs: DRAIN_TIMEOUT_MS });
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
      message: `The ${description} never answered: no request the journey made matched it, or an earlier stub answered first, so nothing used its answer. A stub that names its request (requestId, endpoint, pageId or match) must answer; one keyed only by connectionType and requestType is a fallback and may go unused.`,
    };
  }
  return undefined;
}

export default findUnfiredFailGate;
