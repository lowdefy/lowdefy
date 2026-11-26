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

// The message of the forced failure the call with request id `rid` failed with, as the server's
// error sink recorded it (recordForcedFailure), or null when no forced failure failed it. The
// last one recorded is the one the call answered with.
function readForcedFailure({ rid, session }) {
  const record = session.forced.findLast((entry) => entry.rid === rid);
  return type.isUndefined(record) ? null : record.message;
}

export default readForcedFailure;
