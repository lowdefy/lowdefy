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
import { collectKnownText, listRecordingFiles } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import buildExploreReport from './buildExploreReport.js';
import collectFindings from './collectFindings.js';
import compileWalks from './compileWalks.js';
import formatExploreReport from './formatExploreReport.js';
import writeExploreReport from './writeExploreReport.js';

function readTrace({ configDirectory, run }) {
  const [file] = listRecordingFiles({ configDirectory, source: 'explorer', run });
  if (file === undefined) return null;
  return {
    path: path.relative(configDirectory, file.path).split(path.sep).join('/'),
    bytes: fs.statSync(file.path).size,
  };
}

// After the walks: de-duplicates the findings, compiles the recorded walks
// into candidates, writes report.json and findings.json, and prints the
// summary (or report.json with --json). Returns the report.
async function finishRun({
  context,
  options,
  run,
  runDirectory,
  revisions,
  scope,
  walked,
  buildDirectory,
  startedAt,
}) {
  const configDirectory = context.directories.config;
  const findings = collectFindings({ logs: walked.logs, confirmations: walked.confirmations });
  const candidates = compileWalks({
    configDirectory,
    run,
    pr: revisions.pr,
    scope,
    buildDirectory,
    logs: walked.logs,
    dataName: walked.dataName,
    snapshot: !type.isNone(walked.dataSet?.snapshot),
    knownTextFor: ({ pageIds, typed }) =>
      collectKnownText({ buildDirectory, pageIds, dataSet: walked.dataSet, typed }),
  });
  const report = buildExploreReport({
    run,
    revisions,
    scope,
    walked,
    findings,
    candidates: {
      finding: candidates.finding.map((entry) => path.relative(configDirectory, entry.path)),
      coverage: candidates.coverage.map((file) => path.relative(configDirectory, file)),
      droppedExpectations: candidates.droppedExpectations,
    },
    trace: readTrace({ configDirectory, run }),
    startedAt,
    finishedAt: new Date().toISOString(),
    budgetMs: options.budgetMs,
  });
  await writeExploreReport({ runDirectory, report, findings });
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    formatExploreReport({ report, findings }).forEach((line) => context.logger.info(line));
  }
  return report;
}

export default finishRun;
