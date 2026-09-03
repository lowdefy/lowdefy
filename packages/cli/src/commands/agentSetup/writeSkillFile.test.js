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

import parseSkillSelection from './parseSkillSelection.js';
import writeSkillFile, { listAvailableSkills } from './writeSkillFile.js';

let projectDirectory;
let skillsDirectory;
let context;

function skill(name, version = '5.5.1') {
  return `---\nname: ${name}\ndescription: Use when ${name}.\nkind: reference\nlowdefyVersion: ${version}\n---\n\n# ${name}\n`;
}

beforeEach(() => {
  projectDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-write-skill-project-'));
  skillsDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-write-skill-source-'));
  for (const name of ['lowdefy-config', 'lowdefy-filters', 'lowdefy-list-pages', 'lowdefy-lists']) {
    fs.mkdirSync(path.join(skillsDirectory, name));
    fs.writeFileSync(path.join(skillsDirectory, name, 'SKILL.md'), skill(name));
  }
  fs.writeFileSync(path.join(skillsDirectory, 'README.md'), 'not a skill');
  fs.mkdirSync(path.join(skillsDirectory, 'empty-directory'));
  context = { cliVersion: '5.5.1', logger: { info: jest.fn(), warn: jest.fn() } };
});

afterEach(() => {
  fs.rmSync(projectDirectory, { recursive: true, force: true });
  fs.rmSync(skillsDirectory, { recursive: true, force: true });
});

function installed() {
  const root = path.join(projectDirectory, '.claude', 'skills');
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root).sort();
}

function read(name) {
  return fs.readFileSync(
    path.join(projectDirectory, '.claude', 'skills', name, 'SKILL.md'),
    'utf8'
  );
}

test('listAvailableSkills returns every topic skill directory except lowdefy-config', () => {
  expect(listAvailableSkills({ skillsDirectory })).toEqual([
    'lowdefy-filters',
    'lowdefy-list-pages',
    'lowdefy-lists',
  ]);
});

test('writeSkillFile installs lowdefy-config and every topic skill by default', async () => {
  await writeSkillFile({ context, projectDirectory, appPath: '', port: 3000, skillsDirectory });

  expect(installed()).toEqual([
    'lowdefy-config',
    'lowdefy-filters',
    'lowdefy-list-pages',
    'lowdefy-lists',
  ]);
  expect(read('lowdefy-config')).toContain('http://localhost:3000/lowdefy-docs');
  expect(read('lowdefy-list-pages')).toEqual(skill('lowdefy-list-pages'));
  expect(context.logger.info).toHaveBeenCalledWith(
    "Installed 4 skills into '.claude/skills/' (0 already present)."
  );
});

test('writeSkillFile with skills "none" writes only the templated lowdefy-config skill', async () => {
  await writeSkillFile({
    context,
    projectDirectory,
    appPath: 'apps/myapp',
    port: 4123,
    skills: 'none',
    skillsDirectory,
  });

  expect(installed()).toEqual(['lowdefy-config']);
  expect(read('lowdefy-config')).toContain('http://localhost:4123/lowdefy-docs');
  expect(read('lowdefy-config')).toContain('lives in `apps/myapp/`');
  expect(context.logger.info).toHaveBeenCalledWith(
    "Installed 1 skill into '.claude/skills/' (0 already present)."
  );
});

test('writeSkillFile with a comma-separated list writes those topics plus lowdefy-config', async () => {
  await writeSkillFile({
    context,
    projectDirectory,
    appPath: '',
    port: 3000,
    skills: 'lowdefy-list-pages, lowdefy-filters',
    skillsDirectory,
  });

  expect(installed()).toEqual(['lowdefy-config', 'lowdefy-filters', 'lowdefy-list-pages']);
});

test('writeSkillFile rejects an unknown skill name and lists the available names', async () => {
  await expect(
    writeSkillFile({
      context,
      projectDirectory,
      appPath: '',
      port: 3000,
      skills: 'lowdefy-list-pages,lowdefy-tabels',
      skillsDirectory,
    })
  ).rejects.toThrow(
    'Unknown skill "lowdefy-tabels" in --skills. Available skills: lowdefy-filters, lowdefy-list-pages, lowdefy-lists. Use "all" or "none".'
  );
  expect(installed()).toEqual([]);
});

test('writeSkillFile skips files that already exist and counts them in the summary', async () => {
  const existing = path.join(projectDirectory, '.claude', 'skills', 'lowdefy-filters');
  fs.mkdirSync(existing, { recursive: true });
  fs.writeFileSync(path.join(existing, 'SKILL.md'), 'custom filters skill');
  const configSkill = path.join(projectDirectory, '.claude', 'skills', 'lowdefy-config');
  fs.mkdirSync(configSkill, { recursive: true });
  fs.writeFileSync(path.join(configSkill, 'SKILL.md'), 'custom config skill');

  await writeSkillFile({ context, projectDirectory, appPath: '', port: 3000, skillsDirectory });

  expect(read('lowdefy-filters')).toEqual('custom filters skill');
  expect(read('lowdefy-config')).toEqual('custom config skill');
  expect(read('lowdefy-lists')).toEqual(skill('lowdefy-lists'));
  expect(context.logger.info).toHaveBeenCalledWith(
    "'.claude/skills/lowdefy-filters/SKILL.md' already exists at version unknown - skipping."
  );
  expect(context.logger.info).toHaveBeenCalledWith(
    "'.claude/skills/lowdefy-config/SKILL.md' already exists at version unknown - skipping."
  );
  expect(context.logger.info).toHaveBeenCalledWith(
    "Installed 2 skills into '.claude/skills/' (2 already present)."
  );
});

test('writeSkillFile resolves the shipped skills directory when none is given', async () => {
  await writeSkillFile({ context, projectDirectory, appPath: '', port: 3000, skills: 'none' });

  expect(installed()).toEqual(['lowdefy-config']);
});

test('writeSkillFile installs the real framework skill set from the repository', async () => {
  await writeSkillFile({ context, projectDirectory, appPath: '', port: 3000 });

  const names = installed();
  expect(names).toContain('lowdefy-config');
  expect(names).toContain('lowdefy-list-pages');
  expect(names).toContain('lowdefy-form-validation');
  expect(names).toContain('lowdefy-js-operator');
  expect(names).toHaveLength(29);
  for (const name of names) {
    expect(read(name)).toMatch(new RegExp(`^---\\nname: ${name}\\ndescription: Use when `));
    expect(read(name)).toMatch(/\nkind: (recipe|reference)\nlowdefyVersion: \d+\.\d+\.\d+\n---\n/);
  }
});

test('writeSkillFile reports installed skills that are behind the running version', async () => {
  const existing = path.join(projectDirectory, '.claude', 'skills', 'lowdefy-filters');
  fs.mkdirSync(existing, { recursive: true });
  fs.writeFileSync(path.join(existing, 'SKILL.md'), skill('lowdefy-filters', '5.0.0'));

  await writeSkillFile({ context, projectDirectory, appPath: '', port: 3000, skillsDirectory });

  expect(read('lowdefy-filters')).toEqual(skill('lowdefy-filters', '5.0.0'));
  expect(context.logger.info).toHaveBeenCalledWith(
    "'.claude/skills/lowdefy-filters/SKILL.md' already exists at version 5.0.0 - skipping."
  );
  expect(context.logger.warn).toHaveBeenCalledWith(
    "1 installed skill is not at version 5.5.1: lowdefy-filters. Run 'lowdefy agent-setup --force-skills' to overwrite them."
  );
});

test('writeSkillFile with forceSkills overwrites an installed skill that is behind', async () => {
  const existing = path.join(projectDirectory, '.claude', 'skills', 'lowdefy-filters');
  fs.mkdirSync(existing, { recursive: true });
  fs.writeFileSync(path.join(existing, 'SKILL.md'), skill('lowdefy-filters', '5.0.0'));

  await writeSkillFile({
    context,
    projectDirectory,
    appPath: '',
    port: 3000,
    forceSkills: true,
    skillsDirectory,
  });

  expect(read('lowdefy-filters')).toEqual(skill('lowdefy-filters'));
  expect(context.logger.info).toHaveBeenCalledWith(
    "'.claude/skills/lowdefy-filters/SKILL.md' overwritten (was version 5.0.0)."
  );
  expect(context.logger.warn).not.toHaveBeenCalled();
});

test('writeSkillFile stamps the running version into the templated lowdefy-config skill', async () => {
  await writeSkillFile({
    context,
    projectDirectory,
    appPath: '',
    port: 3000,
    skills: 'none',
    skillsDirectory,
  });

  expect(read('lowdefy-config')).toContain('\nkind: reference\nlowdefyVersion: 5.5.1\n');
});

describe('parseSkillSelection', () => {
  const available = ['lowdefy-a', 'lowdefy-b', 'lowdefy-c'];

  test('returns every available skill for "all", an empty option and undefined', () => {
    expect(parseSkillSelection({ selection: 'all', available })).toEqual(available);
    expect(parseSkillSelection({ selection: '', available })).toEqual(available);
    expect(parseSkillSelection({ selection: undefined, available })).toEqual(available);
  });

  test('returns no topic skills for "none"', () => {
    expect(parseSkillSelection({ selection: 'none', available })).toEqual([]);
  });

  test('returns the named skills in the available order, ignoring whitespace and duplicates', () => {
    expect(
      parseSkillSelection({ selection: ' lowdefy-c,lowdefy-a ,lowdefy-c', available })
    ).toEqual(['lowdefy-a', 'lowdefy-c']);
  });

  test('throws naming every unknown skill', () => {
    expect(() =>
      parseSkillSelection({ selection: 'lowdefy-x,lowdefy-a,lowdefy-y', available })
    ).toThrow(
      'Unknown skills "lowdefy-x", "lowdefy-y" in --skills. Available skills: lowdefy-a, lowdefy-b, lowdefy-c. Use "all" or "none".'
    );
  });
});
