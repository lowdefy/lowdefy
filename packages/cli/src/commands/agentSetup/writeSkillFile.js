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

import parseSkillSelection from './parseSkillSelection.js';
import resolveSkillsDirectory from './resolveSkillsDirectory.js';
import skillMd from './skillMd.js';

const CONFIG_SKILL = 'lowdefy-config';

// Every skills/<name>/SKILL.md shipped with the CLI except lowdefy-config, which is templated
// with the port and app path by skillMd.js rather than copied.
export function listAvailableSkills({ skillsDirectory }) {
  return fs
    .readdirSync(skillsDirectory)
    .filter(
      (name) => name !== CONFIG_SKILL && fs.existsSync(path.join(skillsDirectory, name, 'SKILL.md'))
    )
    .sort();
}

function skillRelativePath(name) {
  return path.join('.claude', 'skills', name, 'SKILL.md');
}

// Writes one skill, skipping (and reporting) a file the project already has so local edits
// are never overwritten. Returns true when a file was written.
async function writeOneSkill({ context, projectDirectory, name, content }) {
  const relativePath = skillRelativePath(name);
  const filePath = path.join(projectDirectory, relativePath);
  if (fs.existsSync(filePath)) {
    context.logger.info(`'${relativePath}' already exists - skipping.`);
    return false;
  }
  await writeFile(filePath, content);
  return true;
}

async function writeSkillFile({
  context,
  projectDirectory,
  appPath,
  port,
  skills,
  skillsDirectory = resolveSkillsDirectory(),
}) {
  const available = listAvailableSkills({ skillsDirectory });
  const selected = parseSkillSelection({ selection: skills, available });

  let installed = 0;
  let present = 0;
  const count = (written) => {
    if (written) {
      installed += 1;
    } else {
      present += 1;
    }
  };

  count(
    await writeOneSkill({
      context,
      projectDirectory,
      name: CONFIG_SKILL,
      content: skillMd({ port, appPath }),
    })
  );
  for (const name of selected) {
    const content = fs.readFileSync(path.join(skillsDirectory, name, 'SKILL.md'), 'utf8');
    count(await writeOneSkill({ context, projectDirectory, name, content }));
  }

  context.logger.info(
    `Installed ${installed} skill${
      installed === 1 ? '' : 's'
    } into '.claude/skills/' (${present} already present).`
  );
}

export default writeSkillFile;
