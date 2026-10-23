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

import { vi, afterEach, beforeEach, expect, test } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

import hashSkill from './hashSkill.js';
import parseSkillFile from './parseSkillFile.js';
import writeSkillFiles from './writeSkillFiles.js';

let projectDirectory;
let context;

function testSkill(version, name = 'test-skill') {
  return {
    name,
    render: () =>
      `---\nname: ${name}\ndescription: A test skill.\n---\n\n# Test skill ${version}\n`,
    agentsMdLine: `\`${name}\`: version ${version}.`,
  };
}

const AGENTS = path.join('.agents', 'skills');
const CLAUDE = path.join('.claude', 'skills');
const relative = (folder, name = 'test-skill', file = 'SKILL.md') => path.join(folder, name, file);
const absolute = (...args) => path.join(projectDirectory, relative(...args));
const read = (...args) => fs.readFileSync(absolute(...args), 'utf8');
const write = (filePath, content) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

beforeEach(() => {
  projectDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-skills-test-'));
  context = { logger: { info: vi.fn() } };
});

afterEach(() => {
  fs.rmSync(projectDirectory, { recursive: true, force: true });
});

test('writeSkillFiles writes every listed skill to both folders with identical content', async () => {
  const skills = [testSkill(1), testSkill(1, 'other-skill')];
  await writeSkillFiles({ context, projectDirectory, skills });
  for (const { name } of skills) {
    const content = read(CLAUDE, name);
    expect(read(AGENTS, name)).toEqual(content);
    const { hash, body, frontmatter } = parseSkillFile(content);
    expect(frontmatter).toEqual(`name: ${name}\ndescription: A test skill.`);
    expect(body).toEqual('\n# Test skill 1\n');
    expect(hash).toEqual(hashSkill({ frontmatter, body }));
    expect(context.logger.info).toHaveBeenCalledWith(`Created '${relative(AGENTS, name)}'.`);
    expect(context.logger.info).toHaveBeenCalledWith(`Created '${relative(CLAUDE, name)}'.`);
  }
});

test('writeSkillFiles updates both unedited copies when the renderer changed', async () => {
  await writeSkillFiles({ context, projectDirectory, skills: [testSkill(1)] });
  await writeSkillFiles({ context, projectDirectory, skills: [testSkill(2)] });
  expect(read(CLAUDE)).toContain('# Test skill 2');
  expect(read(AGENTS)).toEqual(read(CLAUDE));
  expect(context.logger.info).toHaveBeenCalledWith(`Updated '${relative(AGENTS)}'.`);
  expect(context.logger.info).toHaveBeenCalledWith(`Updated '${relative(CLAUDE)}'.`);
});

test('writeSkillFiles notes both copies are up to date on a rerun with no change', async () => {
  await writeSkillFiles({ context, projectDirectory, skills: [testSkill(1)] });
  await writeSkillFiles({ context, projectDirectory, skills: [testSkill(1)] });
  expect(context.logger.info).toHaveBeenCalledWith(`'${relative(AGENTS)}' is up to date.`);
  expect(context.logger.info).toHaveBeenCalledWith(`'${relative(CLAUDE)}' is up to date.`);
});

test.each([
  ['.claude', CLAUDE, AGENTS],
  ['.agents', AGENTS, CLAUDE],
])(
  'writeSkillFiles freezes both copies when the %s copy was edited, naming it and its twin',
  async (_, editedFolder, twinFolder) => {
    await writeSkillFiles({ context, projectDirectory, skills: [testSkill(1)] });
    const original = read(twinFolder);
    const edited = read(editedFolder).replace('Test skill 1', 'My own skill');
    fs.writeFileSync(absolute(editedFolder), edited);
    await writeSkillFiles({ context, projectDirectory, skills: [testSkill(2)] });
    expect(read(editedFolder)).toEqual(edited);
    expect(read(twinFolder)).toEqual(original);
    expect(context.logger.info).toHaveBeenCalledWith(
      `'${relative(editedFolder)}' was edited; its twin '${relative(
        twinFolder
      )}' is frozen with it. Copy the edit across, or delete both and rerun.`
    );
  }
);

test('writeSkillFiles treats an edited frontmatter as an edit', async () => {
  await writeSkillFiles({ context, projectDirectory, skills: [testSkill(1)] });
  const edited = read(CLAUDE).replace(
    'description: A test skill.',
    'description: Use when the team asks for tests.'
  );
  fs.writeFileSync(absolute(CLAUDE), edited);
  await writeSkillFiles({ context, projectDirectory, skills: [testSkill(2)] });
  expect(read(CLAUDE)).toEqual(edited);
  expect(read(AGENTS)).toContain('# Test skill 1');
});

test('writeSkillFiles recreates a deleted copy when the other is unedited', async () => {
  await writeSkillFiles({ context, projectDirectory, skills: [testSkill(1)] });
  fs.rmSync(absolute(AGENTS));
  await writeSkillFiles({ context, projectDirectory, skills: [testSkill(1)] });
  expect(read(AGENTS)).toEqual(read(CLAUDE));
  expect(context.logger.info).toHaveBeenLastCalledWith(`'${relative(CLAUDE)}' is up to date.`);
  expect(context.logger.info).toHaveBeenCalledWith(`Created '${relative(AGENTS)}'.`);
});

test('writeSkillFiles leaves a hashless lowdefy-config skill unchanged and writes no twin', async () => {
  write(absolute(CLAUDE, 'lowdefy-config'), '---\nname: lowdefy-config\n---\nhand written\n');
  await writeSkillFiles({
    context,
    projectDirectory,
    skills: [testSkill(1, 'lowdefy-config')],
  });
  expect(read(CLAUDE, 'lowdefy-config')).toEqual('---\nname: lowdefy-config\n---\nhand written\n');
  expect(fs.existsSync(absolute(AGENTS, 'lowdefy-config'))).toBe(false);
});

test('writeSkillFiles deletes an unedited retired skill, keeping the folder when other files remain', async () => {
  await writeSkillFiles({
    context,
    projectDirectory,
    skills: [testSkill(1), testSkill(1, 'retired')],
  });
  write(absolute(CLAUDE, 'retired', 'notes.md'), 'mine');
  await writeSkillFiles({ context, projectDirectory, skills: [testSkill(1)] });
  expect(fs.existsSync(absolute(CLAUDE, 'retired'))).toBe(false);
  expect(read(CLAUDE, 'retired', 'notes.md')).toEqual('mine');
  expect(fs.existsSync(path.join(projectDirectory, AGENTS, 'retired'))).toBe(false);
  expect(fs.existsSync(absolute(CLAUDE))).toBe(true);
  expect(context.logger.info).toHaveBeenCalledWith(
    `Removed retired skill '${relative(CLAUDE, 'retired')}'.`
  );
  expect(context.logger.info).toHaveBeenCalledWith(
    `Removed retired skill '${relative(AGENTS, 'retired')}'.`
  );
});

test('writeSkillFiles leaves an edited retired skill and logs that it is no longer maintained', async () => {
  await writeSkillFiles({
    context,
    projectDirectory,
    skills: [testSkill(1), testSkill(1, 'retired')],
  });
  const edited = read(AGENTS, 'retired').replace('Test skill 1', 'My own skill');
  fs.writeFileSync(absolute(AGENTS, 'retired'), edited);
  await writeSkillFiles({ context, projectDirectory, skills: [testSkill(1)] });
  expect(read(AGENTS, 'retired')).toEqual(edited);
  expect(context.logger.info).toHaveBeenCalledWith(
    `'${relative(
      AGENTS,
      'retired'
    )}' is no longer maintained by Lowdefy. It was edited, so it is left in place.`
  );
  // Its unedited twin is Lowdefy's own copy, so it goes.
  expect(fs.existsSync(path.join(projectDirectory, CLAUDE, 'retired'))).toBe(false);
});

test('writeSkillFiles never touches a skill folder without a lowdefy-skill-hash', async () => {
  const content = '---\nname: team-skill\ndescription: Ours.\n---\n\n# Team skill\n';
  write(absolute(AGENTS, 'team-skill'), content);
  write(absolute(CLAUDE, 'team-skill'), content);
  await writeSkillFiles({ context, projectDirectory, skills: [testSkill(1)] });
  expect(read(AGENTS, 'team-skill')).toEqual(content);
  expect(read(CLAUDE, 'team-skill')).toEqual(content);
});

test('writeSkillFiles refuses a renderer without frontmatter', async () => {
  const skill = { name: 'bad-skill', render: () => '# No frontmatter', agentsMdLine: 'bad' };
  await expect(writeSkillFiles({ context, projectDirectory, skills: [skill] })).rejects.toThrow(
    'Skill "bad-skill" must render a frontmatter block.'
  );
});
