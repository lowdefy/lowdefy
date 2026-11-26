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

import addFailGate from './addFailGate.js';

// Sets a journey's `stubs` on its data session, in the order written: an entry with `fail` is a
// fail gate (addFailGate), any other an answer stub, which answers its literal `answer`
// (createStubResolver). An answer stub counts `answered`, so one no request reached can be
// reported (listUnansweredStubs). Each entry was validated with node-utils' validateJourneyStub.
function addJourneyStubs({ session, stubs }) {
  (stubs ?? []).forEach((stub) => {
    if (!type.isUndefined(stub.fail)) {
      addFailGate({
        endpoint: stub.endpoint,
        message: stub.fail,
        pageId: stub.pageId,
        requestId: stub.requestId,
        session,
        times: stub.times,
      });
      return;
    }
    session.stubs.push({
      connectionType: stub.connectionType,
      requestType: stub.requestType,
      answer: stub.answer,
      requestId: stub.requestId,
      endpoint: stub.endpoint,
      pageId: stub.pageId,
      match: stub.match,
      answered: 0,
    });
  });
}

export default addJourneyStubs;
