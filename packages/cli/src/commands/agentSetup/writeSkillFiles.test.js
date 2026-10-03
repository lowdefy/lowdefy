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

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

import hashSkill from './hashSkill.js';
import parseSkillFile from './parseSkillFile.js';
import upsertAgentsMdSection from './upsertAgentsMdSection.js';
import writeSkillFiles from './writeSkillFiles.js';

let projectDirectory;
let context;

function testSkill(version) {
  return {
    name: 'test-skill',
    render: ({ appPath }) =>
      `---\nname: test-skill\ndescription: A test skill.\n---\n\n# Test skill ${version}\n\nApp at '${appPath}'.\n`,
    agentsMdLine: `\`test-skill\`: version ${version}.`,
  };
}

const skillPath = () => path.join(projectDirectory, '.claude', 'skills', 'test-skill', 'SKILL.md');

beforeEach(() => {
  projectDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-skills-test-'));
  context = { logger: { info: jest.fn() } };
});

afterEach(() => {
  fs.rmSync(projectDirectory, { recursive: true, force: true });
});

test('writeSkillFiles writes a fresh skill with a hash that matches its frontmatter and body', async () => {
  await writeSkillFiles({ context, projectDirectory, appPath: 'app', skills: [testSkill(1)] });
  const content = fs.readFileSync(skillPath(), 'utf8');
  const { hash, body, frontmatter } = parseSkillFile(content);
  expect(frontmatter).toEqual('name: test-skill\ndescription: A test skill.');
  expect(body).toEqual("\n# Test skill 1\n\nApp at 'app'.\n");
  expect(hash).toEqual(hashSkill({ frontmatter, body }));
  expect(context.logger.info).toHaveBeenCalledWith(
    `Created '${path.join('.claude', 'skills', 'test-skill', 'SKILL.md')}'.`
  );
});

test('writeSkillFiles overwrites an unedited skill when its renderer changed', async () => {
  await writeSkillFiles({ context, projectDirectory, appPath: '', skills: [testSkill(1)] });
  await writeSkillFiles({ context, projectDirectory, appPath: '', skills: [testSkill(2)] });
  expect(fs.readFileSync(skillPath(), 'utf8')).toContain('# Test skill 2');
  expect(context.logger.info).toHaveBeenCalledWith(
    `Updated '${path.join('.claude', 'skills', 'test-skill', 'SKILL.md')}'.`
  );
});

test('writeSkillFiles leaves an edited skill alone and logs that it was edited', async () => {
  await writeSkillFiles({ context, projectDirectory, appPath: '', skills: [testSkill(1)] });
  const edited = fs.readFileSync(skillPath(), 'utf8').replace('Test skill 1', 'My own skill');
  fs.writeFileSync(skillPath(), edited);
  await writeSkillFiles({ context, projectDirectory, appPath: '', skills: [testSkill(2)] });
  expect(fs.readFileSync(skillPath(), 'utf8')).toEqual(edited);
  expect(context.logger.info).toHaveBeenCalledWith(
    `'${path.join('.claude', 'skills', 'test-skill', 'SKILL.md')}' was edited - skipping.`
  );
});

test('writeSkillFiles leaves a skill whose frontmatter was edited alone', async () => {
  await writeSkillFiles({ context, projectDirectory, appPath: '', skills: [testSkill(1)] });
  const edited = fs
    .readFileSync(skillPath(), 'utf8')
    .replace('description: A test skill.', 'description: Use when the team asks for tests.');
  fs.writeFileSync(skillPath(), edited);
  await writeSkillFiles({ context, projectDirectory, appPath: '', skills: [testSkill(2)] });
  expect(fs.readFileSync(skillPath(), 'utf8')).toEqual(edited);
  expect(context.logger.info).toHaveBeenCalledWith(
    `'${path.join('.claude', 'skills', 'test-skill', 'SKILL.md')}' was edited - skipping.`
  );
});

test('writeSkillFiles leaves a skill with no stored hash alone', async () => {
  fs.mkdirSync(path.dirname(skillPath()), { recursive: true });
  fs.writeFileSync(skillPath(), 'hand written');
  await writeSkillFiles({ context, projectDirectory, appPath: '', skills: [testSkill(1)] });
  expect(fs.readFileSync(skillPath(), 'utf8')).toEqual('hand written');
});

test('writeSkillFiles refuses a renderer without frontmatter', async () => {
  const skill = { name: 'bad-skill', render: () => '# No frontmatter', agentsMdLine: 'bad' };
  await expect(
    writeSkillFiles({ context, projectDirectory, appPath: '', skills: [skill] })
  ).rejects.toThrow('Skill "bad-skill" must render a frontmatter block.');
});

test('upsertAgentsMdSection replaces the skills list on a rerun with a changed list', async () => {
  const args = { context, projectDirectory, appPath: '', devCommand: 'pnpm dev' };
  await upsertAgentsMdSection({ ...args, skills: [testSkill(1)] });
  await upsertAgentsMdSection({ ...args, skills: [testSkill(2), testSkill(3)] });
  const agentsMd = fs.readFileSync(path.join(projectDirectory, 'AGENTS.md'), 'utf8');
  expect(agentsMd).not.toContain('version 1.');
  expect(agentsMd).toContain('- `test-skill`: version 2.\n- `test-skill`: version 3.\n');
  expect(agentsMd.split('<!-- lowdefy-skills:start -->')).toHaveLength(2);
});
