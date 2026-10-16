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

import hashSkill from './hashSkill.js';
import parseSkillFile from './parseSkillFile.js';

// A SKILL.md agent-setup wrote and nobody has edited: its frontmatter and body
// still hash to the `lowdefy-skill-hash` it carries. A file with no hash is
// not one agent-setup wrote, and reads as edited.
function isUneditedSkill(content) {
  const { frontmatter, hash, body } = parseSkillFile(content);
  return hash !== null && hash === hashSkill({ frontmatter, body });
}

export default isUneditedSkill;
