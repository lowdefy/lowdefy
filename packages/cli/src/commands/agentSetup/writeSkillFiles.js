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

import removeRetiredSkills from './removeRetiredSkills.js';
import writeGeneratedSkill from './writeGeneratedSkill.js';

// Writes every skill in the list to .agents/skills/<name>/SKILL.md and
// .claude/skills/<name>/SKILL.md, then removes the skills it no longer lists.
async function writeSkillFiles({ context, projectDirectory, skills }) {
  for (const skill of skills) {
    await writeGeneratedSkill({
      context,
      projectDirectory,
      name: skill.name,
      render: skill.render,
    });
  }
  removeRetiredSkills({ context, projectDirectory, skills });
}

export default writeSkillFiles;
