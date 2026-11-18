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

// Whether an answer stub names the request it answers: a stub narrowed by requestId, endpoint,
// pageId or match stands in for one request the journey must make. One keyed only by
// connectionType and requestType is a fallback, such as a shared stub list (one _ref many
// journeys use) or a case table row whose branch makes no outside call, and may go unused.
function namesTarget(stub) {
  return (
    !type.isNone(stub.requestId) ||
    !type.isNone(stub.endpoint) ||
    !type.isNone(stub.pageId) ||
    !type.isUndefined(stub.match)
  );
}

// A journey's answer stubs that name their target and that no request reached, so a journey that
// set one can fail instead of passing while its stub stood in for nothing. A test's session.stub
// counts no answers: it lasts across a file's tests, so it is never reported.
function listUnansweredStubs({ session }) {
  return session.stubs.filter((stub) => stub.answered === 0 && namesTarget(stub));
}

export default listUnansweredStubs;
