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

import isUneditedSkill from './isUneditedSkill.js';
import parseSkillFile from './parseSkillFile.js';
import SKILL_FOLDERS from './skillFolders.js';

// Removes skills agent-setup once wrote that are no longer on its list. Only
// a SKILL.md carrying a `lowdefy-skill-hash` is Lowdefy's: an unedited one is
// deleted, with its folder only when nothing else is left in it; an edited one
// is left and logged. Skills without a hash are never touched.
function removeRetiredSkills({ context, projectDirectory, skills }) {
  const names = new Set(skills.map((skill) => skill.name));
  for (const folder of SKILL_FOLDERS) {
    const folderPath = path.join(projectDirectory, folder);
    if (!fs.existsSync(folderPath)) continue;
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || names.has(entry.name)) continue;
      const relativePath = path.join(folder, entry.name, 'SKILL.md');
      const skillPath = path.join(projectDirectory, relativePath);
      if (!fs.existsSync(skillPath)) continue;
      const content = fs.readFileSync(skillPath, 'utf8');
      if (parseSkillFile(content).hash === null) continue;
      if (!isUneditedSkill(content)) {
        context.logger.info(
          `'${relativePath}' is no longer maintained by Lowdefy. It was edited, so it is left in place.`
        );
        continue;
      }
      fs.rmSync(skillPath);
      const skillDirectory = path.dirname(skillPath);
      if (fs.readdirSync(skillDirectory).length === 0) {
        fs.rmdirSync(skillDirectory);
      }
      context.logger.info(`Removed retired skill '${relativePath}'.`);
    }
  }
}

export default removeRetiredSkills;
