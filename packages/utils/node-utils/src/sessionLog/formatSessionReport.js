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

import formatSessionSummary from './formatSessionSummary.js';

// A session report (buildSessionReport's, without an error) as text lines:
// one line per session, or the session's header and its log. `empty` is the
// line to print when the window holds no sessions, since only the caller
// knows why it might be empty.
function formatSessionReport({ report, empty }) {
  if (!type.isUndefined(report.log)) {
    const { log } = report;
    return [`Session ${log.id}, ${log.start} to ${log.end}:`, ...log.lines];
  }
  if (report.sessions.length === 0) return [empty];
  return report.sessions.map(formatSessionSummary);
}

export default formatSessionReport;
