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

import fs from 'fs';
import path from 'path';
import { type } from '@lowdefy/helpers';

import COVERAGE_REPORT_VERSION from './coverageReportVersion.js';

// Builds .lowdefy/test/coverage.json and writes it whole: whether sessions
// were grouped into flows, the five measures, the production profile and each
// committed journey's sequence, so the explorer, variants and the app graph
// read production from one file. The same inputs give the same bytes apart
// from `generated`.
function writeCoverageReport({
  directories,
  window,
  flowGrouping,
  measures,
  profile,
  journeys,
  mutation,
  generated,
}) {
  const report = {
    version: COVERAGE_REPORT_VERSION,
    generated,
    source: 'production',
    window: { from: window.from, to: window.to },
    flowGrouping,
    measures,
  };
  if (!type.isUndefined(mutation)) report.mutation = mutation;
  report.production = profile;
  report.journeys = journeys.map(({ file, name, pageId, sequence }) => ({
    file,
    name,
    pageId,
    sequence,
  }));
  fs.mkdirSync(directories.test, { recursive: true });
  const reportPath = path.join(directories.test, 'coverage.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return { report, reportPath };
}

export default writeCoverageReport;
