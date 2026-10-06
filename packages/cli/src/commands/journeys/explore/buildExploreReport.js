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

import summariseTimings from './summariseTimings.js';

function countBy(values) {
  const counts = {};
  values.forEach((value) => {
    counts[value] = (counts[value] ?? 0) + 1;
  });
  return counts;
}

// Groups the not-proven findings by reason, in the order applyProof gives.
function groupByReason(findings) {
  const groups = {};
  findings
    .filter((finding) => finding.status === 'not-proven')
    .forEach((finding) => {
      groups[finding.reason] = [...(groups[finding.reason] ?? []), finding];
    });
  return groups;
}

// report.json: what the run compared, the charter that steered it (null
// without one), what it walked and what that cost, the targets it did not walk
// and why, its findings (proven ones first, then the not-proven ones grouped
// by reason), how long the proofs took, the candidates it kept, and its trace
// file. findings comes from applyProof, in report order. readExploreRuns
// reads run, pr, base, head and finishedAt from it.
function buildExploreReport({
  run,
  revisions,
  charter = null,
  scope,
  walked,
  findings,
  proof,
  candidates,
  trace,
  startedAt,
  finishedAt,
  budgetMs,
}) {
  const { logs, costs, policy } = walked;
  const steps = logs.reduce((total, log) => total + log.steps.length, 0);
  const asked = costs.calls;
  return {
    run,
    pr: revisions.pr,
    base: revisions.base,
    head: revisions.head,
    dirty: revisions.dirty,
    charter,
    startedAt,
    finishedAt,
    policy: {
      name: policy.name,
      backend: policy.backend ?? null,
      modelId: policy.modelId ?? null,
      fallbackModelId: policy.fallbackModelId ?? null,
      switched: policy.switched?.() ?? null,
    },
    data: walked.dataName,
    scope: {
      pages: scope.pages.map((page) => page.pageId),
      appWide: scope.appWide,
      uncompared: scope.uncompared,
      removedPages: scope.removedPages,
    },
    budget: { budgetMs, walkMs: walked.walkMs, stopped: walked.stopped },
    ran: {
      pages: new Set(logs.map((log) => log.pageId)).size,
      targets: new Set(logs.map((log) => `${log.pageId}\u0000${log.user ?? ''}`)).size,
      walks: logs.length,
      steps,
    },
    stopReasons: countBy(logs.map((log) => log.stopReason)),
    timings: summariseTimings({ logs }),
    model: {
      ...costs,
      usdPerQuestion: asked === 0 ? null : costs.usd / asked,
      estimated: costs.estimatedUsd > 0,
    },
    notRun: walked.notRun,
    accessChanged: logs
      .filter((log) => log.stopReason === 'access-changed')
      .map((log) => ({ pageId: log.pageId, user: log.user })),
    findings: {
      proven: findings.filter((finding) => finding.status === 'proven'),
      notProven: groupByReason(findings),
    },
    proof,
    candidates,
    trace,
  };
}

export default buildExploreReport;
