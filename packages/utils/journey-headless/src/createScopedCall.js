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

// What the server would log of a fault, scrubbed of the values the call marked, as its logger
// scrubs a line: a fault is printed with the journey's result after the call's scope has ended.
function scrubFault({ fault, scrub }) {
  if (type.isString(fault.message)) {
    fault.message = scrub(fault.message);
  }
  if (type.isString(fault.stack)) {
    fault.stack = scrub(fault.stack);
  }
}

// A host call run in a credential scope of its own, as the server runs each request in one
// (runInCredentialScope in its app): `_credential` marks what the routine gives it, and what the
// server logs, what the data session sinks and the faults the call answers with are scrubbed of
// it. credentialScope is the host's { run: runInCredentialScope, bindScrub: bindCredentialScrub }
// from the @lowdefy/node-utils its @lowdefy/api imports: the scope is module state, so another
// copy of the package would set a scope the routine never reads.
function createScopedCall({ credentialScope, run }) {
  return function scopedCall(args) {
    return credentialScope.run(async () => {
      const scrub = credentialScope.bindScrub();
      const answer = await run(args);
      (answer.faults ?? []).forEach((fault) => scrubFault({ fault, scrub }));
      return answer;
    });
  };
}

export default createScopedCall;
