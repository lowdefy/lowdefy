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

import anchorGroup from './anchorGroup.js';
import formatDuration from './formatDuration.js';

const INDENT = '          ';

function location(mutant) {
  return mutant.source ?? mutant.artifact;
}

function mutantLine({ label, mutant }) {
  return `${label.padEnd(10)}${mutant.operator.padEnd(14)}${location(mutant)}  ${mutant.describe}`;
}

function ranLine({ mutant, names }) {
  const ran = mutant.ranBy.map(({ journey }) => `${names.get(journey)} (passed)`).join(', ');
  return `${INDENT}ran: ${ran}`;
}

function plural({ count, word }) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// What `lowdefy journeys harden` prints: survivors first, grouped by page,
// each with the journeys that passed anyway; then unapplied mutants with
// their misses, a defect in harden rather than a gap in the journeys; then
// each journey's score; then the summary line.
function formatHardenReport({ score, baselines, sampled, notExercised, rebuilds, durationMs }) {
  const names = new Map(baselines.map(({ key, name }) => [key, name]));
  const lines = [];
  const survivors = score.mutants.filter(({ status }) => status === 'survived');
  const groups = [...new Set(survivors.map((mutant) => anchorGroup(mutant.anchor)))].sort();
  groups.forEach((group) => {
    lines.push(`${group}:`);
    survivors
      .filter((mutant) => anchorGroup(mutant.anchor) === group)
      .forEach((mutant) => {
        lines.push(mutantLine({ label: 'SURVIVED', mutant }));
        lines.push(ranLine({ mutant, names }));
      });
  });
  const unapplied = score.mutants.filter(({ status }) => status === 'unapplied');
  if (unapplied.length > 0) {
    lines.push('Unapplied (the mutant never reached the journey: a harden defect to report):');
    unapplied.forEach((mutant) => {
      lines.push(mutantLine({ label: 'UNAPPLIED', mutant }));
      const misses = mutant.ranBy.flatMap((verdict) => verdict.misses ?? []);
      const described = misses.map(({ reason, path }) => `${reason} ${path ?? ''}`.trim());
      lines.push(`${INDENT}misses: ${described.length > 0 ? described.join('; ') : 'none'}`);
    });
  }
  score.journeys.forEach((journey) => {
    lines.push(
      `SCORE     ${journey.killed}/${journey.total} killed, ${journey.unique} unique  ${journey.name}  (${journey.file})`
    );
  });
  const count = (status) => score.mutants.filter((mutant) => mutant.status === status).length;
  const run = score.mutants.filter((mutant) => mutant.ranBy.length > 0).length;
  const parts = [
    `${run} mutants run`,
    `${count('killed')} killed`,
    `${count('survived')} survived`,
    `${count('unapplied')} unapplied`,
    plural({ count: count('errored'), word: 'error' }),
    `sampled ${score.mutants.length} of ${sampled.of} (seed ${sampled.seed})`,
    `${notExercised} not exercised`,
  ];
  if (count('changed') > 0) {
    parts.push(`${count('changed')} changed during run`);
  }
  parts.push(plural({ count: rebuilds, word: 'rebuild' }), formatDuration(durationMs));
  lines.push(parts.join(' · '));
  return lines;
}

export default formatHardenReport;
