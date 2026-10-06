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

function seconds(ms) {
  return ms === null ? '-' : (ms / 1000).toFixed(1);
}

function usd(value) {
  return `$${value.toFixed(2)}`;
}

function formatFinding(finding) {
  const label = finding.severity === 'error' ? 'ERROR' : finding.severity.toUpperCase();
  const walks = `${finding.walks.length} walk${finding.walks.length === 1 ? '' : 's'}`;
  return `  ${label} ${finding.kind}  ${finding.pageId}  ${finding.message}  ${
    finding.source ?? ''
  }  (${walks}, ${finding.users.join(', ')})`;
}

const REASON_TEXT = {
  'not-reproduced': 'its journey did not fail with it twice',
  environment: 'this data set cannot run a $search stage',
  'no-candidate': 'no journey could be compiled for it',
  'live-writes': 'the run wrote to live connections',
};

function plural({ count, word }) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// The run summary printed after the walks: the charter, if any, what ran and
// what it cost, what did not run and why, access the PR changed, the findings
// (proven ones, each with the journey that fails with it, then the not-proven
// ones by reason), how long the proofs took, the candidates kept and the
// trace file's size.
function formatExploreReport({ report }) {
  const { ran, timings, model } = report;
  const lines = [];
  lines.push(
    `Policy    ${report.policy.name}${
      report.policy.modelId ? ` ${report.policy.modelId}` : ''
    }   data ${report.data ?? 'none'}`
  );
  if (report.charter !== null) {
    lines.push(`Charter   ${report.charter.goal}`);
  }
  const { switched } = report.policy;
  if (switched !== null) {
    lines.push(
      `Fallback  ${switched.from} → ${switched.to} for the rest of the run (${
        switched.reason === 'refused' ? 'the Gateway refused it' : 'a request was over its limits'
      })`
    );
  }
  lines.push(
    `Ran       ${ran.pages} pages, ${ran.targets} (page, role) targets; ${ran.walks} walks; ${
      ran.steps
    } steps; ${seconds(timings.step.meanMs)} s/step, p90 ${seconds(
      timings.step.p90Ms
    )} (act ${seconds(timings.step.actMs)}, observe ${seconds(
      timings.step.observeMs
    )}, decide ${seconds(timings.step.decideMs)})`
  );
  lines.push(
    `Walks     ${seconds(timings.walk.meanMs)} s/walk outside steps (data ${seconds(
      timings.walk.dataMs
    )}, open ${seconds(timings.walk.openMs)}, close ${seconds(timings.walk.closeMs)})`
  );
  if (model.calls > 0 || model.failedCalls > 0) {
    const perQuestion =
      model.usdPerQuestion === null ? '' : ` (${usd(model.usdPerQuestion)}/question)`;
    lines.push(
      `Model     ${model.calls} calls · ${model.inputTokens} in · ${model.outputTokens} out · ${usd(
        model.usd
      )}${model.estimated ? ' estimated' : ''}${perQuestion}${
        model.failedCalls > 0 ? ` · ${model.failedCalls} failed` : ''
      }`
    );
  }
  if (report.budget.stopped !== null) {
    lines.push(`Stopped   ${report.budget.stopped.reason}`);
  }
  if (report.notRun.length > 0) {
    lines.push(
      `Not run   ${report.notRun
        .map(
          (entry) =>
            `${entry.pageId} × ${entry.user ?? (entry.roles ?? []).join('+')}: ${entry.reason}`
        )
        .join('   ')}`
    );
  }
  report.accessChanged.forEach(({ pageId, user }) => {
    lines.push(`Access    changed in this PR: ${pageId} no longer admits ${user}`);
  });
  const { proven, notProven } = report.findings;
  const notProvenCount = Object.values(notProven).reduce((total, group) => total + group.length, 0);
  lines.push(`Findings  ${proven.length} proven, ${notProvenCount} not proven`);
  proven.forEach((finding) => lines.push(`${formatFinding(finding)}  → ${finding.candidate}`));
  Object.entries(notProven).forEach(([reason, group]) => {
    lines.push(
      `Not proven, ${REASON_TEXT[reason]}: ${plural({ count: group.length, word: 'finding' })}`
    );
    group.forEach((finding) => lines.push(formatFinding(finding)));
  });
  if (report.proof.live) {
    lines.push(
      'Proofs    none: a run on live connections proves nothing. Rerun on a data set (--data <name>) to prove its findings.'
    );
  } else {
    lines.push(`Proofs    ${seconds(report.proof.ms)} s, outside the budget`);
  }
  lines.push(
    `Candidates  ${report.candidates.finding.length} finding · ${report.candidates.coverage.length} coverage → tests/journeys/_candidates/explorer/${report.run}/`
  );
  if (report.trace !== null) {
    lines.push(`Trace     ${report.trace.path} (${Math.ceil(report.trace.bytes / 1024)} KB)`);
  }
  return lines;
}

export default formatExploreReport;
