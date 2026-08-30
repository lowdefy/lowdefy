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

import fs from 'node:fs';
import path from 'node:path';

import { countSkillLines } from './skillFile.mjs';

// One row per skills/<name>/SKILL.md, sorted by name, plus a total row.
function collectSkillMetrics({ skillsDirectory }) {
  const rows = [];
  for (const name of fs.readdirSync(skillsDirectory).sort()) {
    const skillPath = path.join(skillsDirectory, name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;
    rows.push({ name, ...countSkillLines(fs.readFileSync(skillPath, 'utf8')) });
  }
  const total = rows.reduce(
    (sum, row) => ({
      total: sum.total + row.total,
      generated: sum.generated + row.generated,
      recipe: sum.recipe + row.recipe,
    }),
    { total: 0, generated: 0, recipe: 0 }
  );
  return { rows, total };
}

export function formatSkillMetrics({ rows, total }) {
  const totalLabel = `total (${rows.length} skills)`;
  const width = Math.max(totalLabel.length, ...rows.map((row) => row.name.length));
  const line = (label, row) =>
    `${label.padEnd(width)}  ${String(row.total).padStart(6)}  ${String(row.generated).padStart(
      9
    )}  ${String(row.recipe).padStart(6)}`;
  return [
    `${'skill'.padEnd(width)}  ${'lines'.padStart(6)}  ${'generated'.padStart(
      9
    )}  ${'recipe'.padStart(6)}`,
    ...rows.map((row) => line(row.name, row)),
    line(totalLabel, total),
  ].join('\n');
}

export default collectSkillMetrics;
