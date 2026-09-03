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

// The version the generator stamped into the frontmatter. A skill installed by an older CLI, or
// one a developer wrote by hand, has no stamp - reported as unknown rather than guessed at.
function installedVersion(content) {
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) return null;
  const version = frontmatter[1].match(/^lowdefyVersion: *(.+?) *$/m);
  return version ? version[1] : null;
}

// Writes one skill. An existing file is never overwritten unless --force-skills was given, so
// local edits survive; the version it was installed at is reported either way, which is what
// makes an install that has silently fallen behind the running framework visible.
async function writeOneSkill({ context, projectDirectory, name, content, force, version }) {
  const relativePath = skillRelativePath(name);
  const filePath = path.join(projectDirectory, relativePath);
  if (fs.existsSync(filePath)) {
    const existingVersion = installedVersion(fs.readFileSync(filePath, 'utf8'));
    const behind = existingVersion !== version;
    if (!force) {
      context.logger.info(
        `'${relativePath}' already exists${
          behind ? ` at version ${existingVersion ?? 'unknown'}` : ''
        } - skipping.`
      );
      return { written: false, behind };
    }
    await writeFile(filePath, content);
    context.logger.info(
      `'${relativePath}' overwritten (was version ${existingVersion ?? 'unknown'}).`
    );
    return { written: true, behind: false };
  }
  await writeFile(filePath, content);
  return { written: true, behind: false };
}

async function writeSkillFile({
  context,
  projectDirectory,
  appPath,
  port,
  skills,
  forceSkills = false,
  version = context.cliVersion,
  skillsDirectory = resolveSkillsDirectory(),
}) {
  const available = listAvailableSkills({ skillsDirectory });
  const selected = parseSkillSelection({ selection: skills, available });

  let installed = 0;
  let present = 0;
  const behind = [];
  const count = (name, result) => {
    if (result.written) {
      installed += 1;
    } else {
      present += 1;
    }
    if (result.behind) {
      behind.push(name);
    }
  };

  count(
    CONFIG_SKILL,
    await writeOneSkill({
      context,
      projectDirectory,
      name: CONFIG_SKILL,
      content: skillMd({ port, appPath, version }),
      force: forceSkills,
      version,
    })
  );
  for (const name of selected) {
    const content = fs.readFileSync(path.join(skillsDirectory, name, 'SKILL.md'), 'utf8');
    count(
      name,
      await writeOneSkill({
        context,
        projectDirectory,
        name,
        content,
        force: forceSkills,
        version,
      })
    );
  }

  context.logger.info(
    `Installed ${installed} skill${
      installed === 1 ? '' : 's'
    } into '.claude/skills/' (${present} already present).`
  );
  if (behind.length > 0) {
    context.logger.warn(
      `${behind.length} installed skill${
        behind.length === 1 ? ' is' : 's are'
      } not at version ${version}: ${behind.join(
        ', '
      )}. Run 'lowdefy agent-setup --force-skills' to overwrite them.`
    );
  }
}

export default writeSkillFile;
