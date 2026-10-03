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

import hashSkillBody from './hashSkillBody.js';
import parseSkillFile from './parseSkillFile.js';

function renderWithHash({ appPath, render, name }) {
  const { frontmatter, body } = parseSkillFile(render({ appPath }));
  if (frontmatter === null) {
    throw new Error(`Skill "${name}" must render a frontmatter block.`);
  }
  return `---\n${frontmatter}\nlowdefy-skill-hash: ${hashSkillBody(body)}\n---\n${body}`;
}

// A generated skill is refreshed on every rerun while nobody has edited it:
// its body still hashes to the `lowdefy-skill-hash` it was written with.
// A file whose body was edited, or that carries no hash, is left alone.
async function writeGeneratedSkill({ context, projectDirectory, appPath, name, render }) {
  const relativePath = path.join('.claude', 'skills', name, 'SKILL.md');
  const skillPath = path.join(projectDirectory, relativePath);
  const content = renderWithHash({ appPath, render, name });

  if (!fs.existsSync(skillPath)) {
    await writeFile(skillPath, content);
    context.logger.info(`Created '${relativePath}'.`);
    return;
  }
  const existing = fs.readFileSync(skillPath, 'utf8');
  const { hash, body } = parseSkillFile(existing);
  if (hash === null || hash !== hashSkillBody(body)) {
    context.logger.info(`'${relativePath}' was edited - skipping.`);
    return;
  }
  if (existing === content) {
    context.logger.info(`'${relativePath}' is up to date.`);
    return;
  }
  await writeFile(skillPath, content);
  context.logger.info(`Updated '${relativePath}'.`);
}

export default writeGeneratedSkill;
