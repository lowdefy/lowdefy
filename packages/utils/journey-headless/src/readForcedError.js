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
import { readForcedFailure } from '@lowdefy/test-utils/dataSets';

// The request id the server stamps on the error it answers with (createWireProjection): on the
// body of a thrown error (a page request's 500), or on the error of a routine that failed (an
// endpoint's success: false).
function readErrorRequestId(body) {
  if (!type.isObject(body)) {
    return undefined;
  }
  return body['~e']?.requestId ?? body.error?.['~e']?.requestId;
}

// The message of the forced failure (a fail gate's) an answer failed with, from the server's
// record of the call on the data session (recordForcedFailure), or null when the answer failed
// with no forced failure. The client only ever sees the generic message, so expect.error reads
// this in its place. Every host reads it here: the headless hosts from the body they answered
// with, a browser run from the body the route sent. A journey with no data session has no fail
// gates, so no forced failure.
function readForcedError({ body, session }) {
  if (type.isNone(session)) {
    return null;
  }
  const rid = readErrorRequestId(body);
  if (type.isUndefined(rid)) {
    return null;
  }
  return readForcedFailure({ rid, session });
}

export default readForcedError;
