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

import getMutationReportPath from './getMutationReportPath.js';
import mergeMutationReport from './mergeMutationReport.js';
import requestCurrentMutantIds from './requestCurrentMutantIds.js';

function readPrevious(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`The mutation report at ${filePath} is not JSON: ${error.message}`);
  }
}

async function mergeWithPrevious({ previous, report, journeyKeys, url }) {
  const listedThisRun = new Set(report.mutants.map(({ id }) => id));
  const currentIds = await requestCurrentMutantIds({
    url,
    mutants: previous.mutants.filter(({ id }) => !listedThisRun.has(id)),
  });
  return mergeMutationReport({ previous, report, journeyKeys, currentIds });
}

// Writes this run's report into .lowdefy/test/mutation.json, merged per
// journey with the report an earlier run wrote (mergeMutationReport), so a
// run over one journey keeps the others' scores. `journeyKeys` is every
// journey's `file#name` now; the dev server at `url` says which earlier
// mutants this run did not list still exist. Never touches a journey file.
async function writeMutationReport({ directories, report, journeyKeys, url }) {
  const filePath = getMutationReportPath({ directories });
  const previous = readPrevious(filePath);
  const written = type.isNone(previous)
    ? report
    : await mergeWithPrevious({ previous, report, journeyKeys, url });
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(written, null, 2)}\n`);
  return filePath;
}

export default writeMutationReport;
