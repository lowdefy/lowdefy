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

import createSessionKeepSet from './createSessionKeepSet.js';

// The sessions that have reported feedback on this server instance. A report
// is a developer's promise to open the session's trace, so from the moment it
// arrives every wide event carrying that session_id is kept at info, whatever
// logger.events.sample_rate would have decided.
//
// The bound is the 100 most recently reporting sessions - a few kilobytes of
// ids, dropped oldest first. The set is process-local: on a multi-instance or
// serverless deployment only the instance that took the report force-keeps,
// which is why the report event itself is pinned to info independently.
const MAX_REPORTING_SESSIONS = 100;

export default createSessionKeepSet({ max: MAX_REPORTING_SESSIONS });
