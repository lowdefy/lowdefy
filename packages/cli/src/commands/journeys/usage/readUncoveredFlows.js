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

import COVERAGE_REPORT_VERSION from '../coverageReport/coverageReportVersion.js';
import readCoverage from '../explore/readCoverage.js';

// The production flows no journey covers, from the coverage report `lowdefy
// journeys coverage` writes, most sessions first, with the report's window and
// whether it grouped sessions into flows at all (flowGrouping; flows is empty
// when it did not): exact-sequence clusters over a mining window, not months,
// so they have no rate to tier by. Null when coverage has not been run here
// by this version.
function readUncoveredFlows({ directories }) {
  const report = readCoverage({ directories });
  if (type.isNull(report) || report.version !== COVERAGE_REPORT_VERSION) return null;
  const flows = report.flowGrouping.grouped
    ? [...report.measures.flow.uncovered].sort(
        (a, b) => b.count - a.count || a.key.localeCompare(b.key)
      )
    : [];
  return { window: report.window, flowGrouping: report.flowGrouping, flows };
}

export default readUncoveredFlows;
