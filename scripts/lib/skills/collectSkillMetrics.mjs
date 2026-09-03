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

import { parseFrontmatter } from './skillFile.mjs';

// The metric is how many skills are recipes - a recipe is a workaround an agent has to carry for
// something the framework should do natively, so the number falling is the framework growing up.
// Bytes are not the metric: a reference skill grows with the framework, and prose length is
// trivially gamed.
function collectSkillMetrics({ skillsDirectory }) {
  const rows = [];
  for (const name of fs.readdirSync(skillsDirectory).sort()) {
    const skillPath = path.join(skillsDirectory, name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;
    const frontmatter = parseFrontmatter(fs.readFileSync(skillPath, 'utf8')) ?? {};
    rows.push({
      name,
      kind: frontmatter.kind ?? 'unknown',
      lowdefyVersion: frontmatter.lowdefyVersion ?? 'unknown',
    });
  }
  const recipes = rows.filter((row) => row.kind === 'recipe').map((row) => row.name);
  return { rows, recipes };
}

export function formatSkillMetrics({ rows, recipes }) {
  const width = Math.max(0, ...rows.map((row) => row.name.length));
  return [
    ...rows.map((row) => `${row.name.padEnd(width)}  ${row.kind}`),
    '',
    `recipe skills: ${recipes.length} of ${rows.length}`,
    ...recipes.map((name) => `  ${name}`),
    '',
    'Retire a recipe by name in the changeset of the feature that makes it unnecessary.',
  ].join('\n');
}

export default collectSkillMetrics;
