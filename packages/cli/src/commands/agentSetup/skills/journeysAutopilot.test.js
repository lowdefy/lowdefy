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

import skills from './index.js';
import journeysAutopilot from './journeysAutopilot.js';

test('the skill list includes journeys-autopilot with its renderer and AGENTS.md line', () => {
  const entry = skills.find((skill) => skill.name === 'journeys-autopilot');
  expect(entry.render).toBe(journeysAutopilot);
  expect(entry.agentsMdLine).toContain('journeys-autopilot');
});

test('journeys-autopilot renders a frontmatter with its name and description', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill.startsWith('---\nname: journeys-autopilot\ndescription: Use when ')).toBe(true);
  expect(skill).toContain('never deletes or weakens a journey.\n---\n');
});

test('journeys-autopilot bootstraps with Lowdefy-native commands only', () => {
  const skill = journeysAutopilot({ appPath: '' });
  [
    'lowdefy data list',
    'lowdefy journeys scope --json',
    'tests/data/autopilot.yaml',
    'lowdefy test --lint tests/journeys/_candidates',
    'lowdefy test --repeat 3',
    'lowdefy journeys harden --list',
    'lowdefy journeys variants <file>',
    'lowdefy journeys coverage',
  ].forEach((command) => expect(skill).toContain(command));
});

test('journeys-autopilot keeps a ledger with every state and parks findings and flakes outside the suite', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('tests/autopilot.yaml');
  ['todo', 'covered', 'quarantined', 'finding', 'skipped'].forEach((state) =>
    expect(skill).toContain(`\`${state}\``)
  );
  expect(skill).toContain('tests/journeys/_quarantine/');
  expect(skill).toContain('tests/journeys/_findings/');
});

test('journeys-autopilot is one light agent that never touches production or the default branch', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('Spawn no sub-agents');
  expect(skill).toContain('kill a process by port or name');
  expect(skill).toContain('Never run anything against production');
  expect(skill).toContain('Never merge, never push to the default branch');
  expect(skill).toContain('Never ask a question mid-run');
  expect(skill).toContain('/loop /journeys-autopilot');
});

test('journeys-autopilot proves before keeping and never weakens or deletes a journey', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('**PASS** (three in a row)');
  expect(skill).toContain('Assert a real fixture value');
  expect(skill).toContain('Never weaken or delete a journey');
  expect(skill).toContain('Never add `wait: { ms }`');
  expect(skill).not.toMatch(/^\s*(?:-\s*)?(?:\*\*)?(?:delete|remove)\b/im);
  expect(skill).not.toMatch(/\brm\b/);
});

test('journeys-autopilot names the traps and the blocked behaviour', () => {
  const skill = journeysAutopilot({ appPath: '' });
  expect(skill).toContain('ENOENT on\n  `build/routes.json`');
  expect(skill).toContain('A green run means only that nothing written down broke');
  expect(skill).toContain('at least two rows');
  expect(skill).toContain('explicit `urlQuery` date');
  expect(skill).toContain('blocked: <what failed');
});

test('journeys-autopilot runs commands from the app directory in a monorepo', () => {
  expect(journeysAutopilot({ appPath: 'apps/crm' })).toContain(
    'cd apps/crm && lowdefy journeys scope --json'
  );
});
