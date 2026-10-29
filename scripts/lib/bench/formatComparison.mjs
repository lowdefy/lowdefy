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

// The comparison as lines for stdout.
function formatComparison({ comparison, labels }) {
  const lines = [];
  const { added, compared, differences, identical, onlyBaseline, onlyCurrent } = comparison;
  lines.push(`Compared ${labels.baseline} with ${labels.current}.`);
  onlyBaseline.forEach((file) => lines.push(`Only in ${labels.baseline}: ${file}`));
  onlyCurrent.forEach((file) => lines.push(`Only in ${labels.current}: ${file}`));
  added.forEach(({ file, identical: ok, lines: details }) => {
    lines.push(`Expected added: ${file}: ${ok ? 'ok' : 'FAILED'}`);
    details.forEach((detail) => lines.push(`    ${detail}`));
  });
  differences.forEach(({ file, lines: details }) => {
    lines.push(`Differs: ${file}`);
    details.forEach((detail) => lines.push(`    ${detail}`));
  });
  if (identical) {
    lines.push(`Identical: ${compared} files and the build messages.`);
  } else {
    const count =
      onlyBaseline.length +
      onlyCurrent.length +
      differences.length +
      added.filter((result) => !result.identical).length;
    lines.push(`Not identical: ${count} difference${count === 1 ? '' : 's'}.`);
  }
  return lines;
}

export default formatComparison;
