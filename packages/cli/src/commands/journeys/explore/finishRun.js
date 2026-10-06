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

import applyProof from './applyProof.js';
import buildExploreReport from './buildExploreReport.js';
import collectFindings from './collectFindings.js';
import compileWalks from './compileWalks.js';
import formatExploreReport from './formatExploreReport.js';
import proveFindings from './proveFindings.js';
import writeExploreReport from './writeExploreReport.js';

function readTrace({ configDirectory, run }) {
  const [file] = listRecordingFiles({ configDirectory, source: 'explorer', run });
  if (file === undefined) return null;
  return {
    path: path.relative(configDirectory, file.path).split(path.sep).join('/'),
    bytes: fs.statSync(file.path).size,
  };
}

// A candidate that proves nothing is not kept: the walk log and its
// screenshots in the run directory still show what happened. Its directory
// goes too once it is empty.
function deleteUnproven({ candidates, proof }) {
  const provenPaths = new Set(proof.proven.map((entry) => entry.path));
  const unproven = candidates.finding.filter((entry) => !provenPaths.has(entry.path));
  unproven.forEach((entry) => fs.rmSync(entry.path, { force: true }));
  new Set(unproven.map((entry) => path.dirname(entry.path))).forEach((directory) => {
    if (fs.existsSync(directory) && fs.readdirSync(directory).length === 0) {
      fs.rmdirSync(directory);
    }
  });
}

// After the walks: de-duplicates the findings, compiles the recorded walks
// into candidates, proves each finding by running its candidate (outside the
// budget: proofs make no model calls), deletes the candidates that proved
// nothing, writes report.json and findings.json, and prints the summary (or
// report.json with --json). Proofs run on the server the walks used. Returns
// the report.
async function finishRun({
  context,
  options,
  run,
  runDirectory,
  revisions,
  scope,
  walked,
  buildDirectory,
  url,
  startedAt,
}) {
  const configDirectory = context.directories.config;
  const collected = collectFindings({ logs: walked.logs });
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
  const live = options.liveData === true || options.allowExternal.length > 0;
  const proof = await proveFindings({ context, url, findings: collected, candidates, live });
  deleteUnproven({ candidates, proof });
  const findings = applyProof({ findings: collected, proof, configDirectory });
  const report = buildExploreReport({
    run,
    revisions,
    scope,
    walked,
    findings,
    proof: { ms: proof.ms, live },
    candidates: {
      finding: proof.proven.map((entry) => path.relative(configDirectory, entry.path)),
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
    formatExploreReport({ report }).forEach((line) => context.logger.info(line));
  }
  return report;
}

export default finishRun;
