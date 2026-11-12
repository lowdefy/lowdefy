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

function formatSurplus({ label, surplus }) {
  const lines = surplus.values.map((value) => `Only in ${label}: ${value}`);
  const rest = surplus.total - surplus.values.length;
  if (rest > 0) {
    lines.push(`… and ${rest} more only in ${label}.`);
  }
  return lines;
}

// A compareMultisets result as lines: the counts, then the values each side
// holds that the other does not. noun names what was counted ("key ids").
function formatMultisetComparison({ comparison, noun }) {
  const { baselineCount, currentCount, onlyBaseline, onlyCurrent } = comparison;
  return [
    `${baselineCount} ${noun} in baseline, ${currentCount} in current; ` +
      `${onlyBaseline.total} only in baseline, ${onlyCurrent.total} only in current.`,
    ...formatSurplus({ label: 'baseline', surplus: onlyBaseline }),
    ...formatSurplus({ label: 'current', surplus: onlyCurrent }),
  ];
}

export default formatMultisetComparison;
