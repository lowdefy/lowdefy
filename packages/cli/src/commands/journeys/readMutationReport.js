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

function isCount(value) {
  return type.isInt(value) && value >= 0;
}

function checkCounts({ entry, label }) {
  if (!isCount(entry.killed) || !isCount(entry.total)) {
    return `${label} should have whole-number "killed" and "total".`;
  }
  if (entry.killed > entry.total) {
    return `${label} has "killed" (${entry.killed}) above "total" (${entry.total}).`;
  }
  return undefined;
}

function findProblem({ report }) {
  if (!type.isObject(report)) return 'The report should be an object.';
  const scoreProblem = checkCounts({ entry: report, label: 'The report' });
  if (!type.isUndefined(scoreProblem)) return scoreProblem;
  if (!type.isArray(report.journeys)) return 'The report should have a "journeys" list.';
  for (let index = 0; index < report.journeys.length; index += 1) {
    const entry = report.journeys[index];
    const label = `journeys[${index}]`;
    if (!type.isObject(entry) || !type.isString(entry.file) || !type.isString(entry.name)) {
      return `${label} should have "file" and "name" strings.`;
    }
    const problem = checkCounts({ entry, label });
    if (!type.isUndefined(problem)) return problem;
    if (!type.isUndefined(entry.unique) && !isCount(entry.unique)) {
      return `${label} "unique" should be a whole number.`;
    }
  }
  return undefined;
}

// The hardening run's mutation report, the one place its shape is read:
// .lowdefy/test/mutation.json as { killed, total, journeys: [{ file, name,
// killed, total, unique? }] }, `file` relative to the config directory and
// `unique` the mutants only that journey kills. Null when no hardening run
// wrote one on this machine. The report is another command's artifact, so a
// file that does not match is an error, not something to skip.
function readMutationReport({ directories }) {
  const reportPath = path.join(directories.test, 'mutation.json');
  if (!fs.existsSync(reportPath)) return null;
  let report;
  try {
    report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  } catch (error) {
    throw new Error(`The mutation report at ${reportPath} is not JSON: ${error.message}`);
  }
  const problem = findProblem({ report });
  if (!type.isUndefined(problem)) {
    throw new Error(`The mutation report at ${reportPath} does not match its shape: ${problem}`);
  }
  const byJourney = new Map();
  report.journeys.forEach(({ file, name, killed, total, unique }) => {
    const mutation = { killed, total };
    if (!type.isUndefined(unique)) mutation.unique = unique;
    byJourney.set(`${file}#${name}`, mutation);
  });
  return { byJourney, score: { killed: report.killed, total: report.total } };
}

export default readMutationReport;
