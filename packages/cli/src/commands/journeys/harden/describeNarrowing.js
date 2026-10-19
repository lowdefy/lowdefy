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
function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// The log line(s) for what --page did to the baseline. Silent without --page.
// Says why journeys were kept whole when their record could not be used, so a
// full baseline never looks like a silent fallback.
function describeNarrowing({ narrowed, total }) {
  if (!narrowed.applicable) {
    return [];
  }
  const { noRecord, journeyChanged, otherConfig, noConfigHash } = narrowed.reasons;
  const why = [];
  if (otherConfig > 0) {
    why.push(
      `${plural(
        otherConfig,
        'journey'
      )} last ran on a different config (it changed since the last \`lowdefy test\`)`
    );
  }
  if (noConfigHash > 0) {
    why.push(
      `${plural(
        noConfigHash,
        'journey'
      )} have a record that cannot be matched to this config (rerun \`lowdefy test\`)`
    );
  }
  if (noRecord > 0) {
    why.push(`${plural(noRecord, 'journey')} have no exercised record`);
  }
  if (journeyChanged > 0) {
    why.push(`${plural(journeyChanged, 'journey')} changed since their last run`);
  }
  const lines = [];
  if (narrowed.skipped > 0) {
    lines.push(
      `Baseline: ${narrowed.skipped} of ${total} journeys left out as off-path for --page (their last run touched none of the pages).`
    );
  } else {
    lines.push(
      `Baseline: --page left no journey out, all ${total} run${
        why.length > 0 ? '' : ' (each can reach one of the pages)'
      }.`
    );
  }
  if (why.length > 0) {
    lines.push(`Baseline: kept without a usable record: ${why.join('; ')}.`);
  }
  return lines;
}

export default describeNarrowing;
