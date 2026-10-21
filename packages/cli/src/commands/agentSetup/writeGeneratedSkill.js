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
import { writeFile } from '@lowdefy/node-utils';

import hashSkill from './hashSkill.js';
import isUneditedSkill from './isUneditedSkill.js';
import parseSkillFile from './parseSkillFile.js';
import SKILL_FOLDERS from './skillFolders.js';

function renderWithHash({ render, name }) {
  const { frontmatter, body } = parseSkillFile(render());
  if (frontmatter === null) {
    throw new Error(`Skill "${name}" must render a frontmatter block.`);
  }
  const hash = hashSkill({ frontmatter, body });
  return `---\n${frontmatter}\nlowdefy-skill-hash: ${hash}\n---\n${body}`;
}

// A skill's copies in `.agents/skills` and `.claude/skills` are one unit. While
// every existing copy is unedited, both are refreshed on each rerun, and a
// missing one is recreated. An edit to either copy (or a copy with no hash)
// freezes both, so the two never drift apart silently.
async function writeGeneratedSkill({ context, projectDirectory, name, render }) {
  const content = renderWithHash({ render, name });
  const copies = SKILL_FOLDERS.map((folder) => {
    const relativePath = path.join(folder, name, 'SKILL.md');
    const skillPath = path.join(projectDirectory, relativePath);
    const existing = fs.existsSync(skillPath) ? fs.readFileSync(skillPath, 'utf8') : null;
    return { relativePath, skillPath, existing };
  });

  const edited = copies.filter(({ existing }) => existing !== null && !isUneditedSkill(existing));
  if (edited.length > 0) {
    edited.forEach((copy) => {
      const twin = copies.find((other) => other !== copy);
      context.logger.info(
        `'${copy.relativePath}' was edited; its twin '${twin.relativePath}' is frozen with it. Copy the edit across, or delete both and rerun.`
      );
    });
    return;
  }

  for (const { relativePath, skillPath, existing } of copies) {
    if (existing === content) {
      context.logger.info(`'${relativePath}' is up to date.`);
      continue;
    }
    await writeFile(skillPath, content);
    context.logger.info(`${existing === null ? 'Created' : 'Updated'} '${relativePath}'.`);
  }
}

export default writeGeneratedSkill;
