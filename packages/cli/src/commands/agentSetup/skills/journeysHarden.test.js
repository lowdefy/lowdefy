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
import journeysHarden from './journeysHarden.js';

test('the skill list includes journeys-harden with its renderer and AGENTS.md line', () => {
  const entry = skills.find((skill) => skill.name === 'journeys-harden');
  expect(entry.render).toBe(journeysHarden);
  expect(entry.agentsMdLine).toContain('journeys-harden');
});

test('journeys-harden renders a frontmatter with its name and the design description', () => {
  const skill = journeysHarden({ appPath: '' });
  expect(
    skill.startsWith(
      "---\nname: journeys-harden\ndescription: Use when the developer wants to know whether the app's journeys would catch a broken feature, wants edge-case journeys, or wants candidates proven before committing them. Replays, lints and mutation-tests journeys and writes edge-case variants; never deletes a journey.\n---\n"
    )
  ).toBe(true);
});

test('journeys-harden names the replay, lint, harden, variants and evidence commands in order', () => {
  const skill = journeysHarden({ appPath: '' });
  const commands = [
    'lowdefy test --repeat 3',
    'lowdefy test --repeat 3 tests/journeys/_candidates/',
    'lowdefy test --lint',
    'lowdefy journeys harden --list',
    'lowdefy journeys harden --mutant <id>',
    'lowdefy journeys variants <file>',
    'lowdefy journeys evidence --refresh',
  ];
  const positions = commands.map((command) => skill.indexOf(command));
  positions.forEach((position) => expect(position).toBeGreaterThan(-1));
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
});

test('journeys-harden gives no instruction to delete a journey and forbids fixed waits', () => {
  const skill = journeysHarden({ appPath: '' });
  expect(skill).toContain('Never delete a journey, and never propose deleting one.');
  expect(skill).toContain('no proposal to delete any of them');
  // No step or bullet tells the agent to delete or remove anything.
  expect(skill).not.toMatch(/^\s*(?:-\s*)?(?:\*\*)?(?:delete|remove)\b/im);
  expect(skill).not.toMatch(/\brm\b/);
  expect(skill).toContain('Never add `wait: { ms }`');
});

test('journeys-harden keeps the assertion rule, unapplied mutants, dead config and commit rules', () => {
  const skill = journeysHarden({ appPath: '' });
  expect(skill).toContain(
    'Write no step the compiler or the variants generator did not produce**, except an assertion\n  the developer approved.'
  );
  expect(skill).toContain('never an assertion to add');
  expect(skill).toContain('that is a finding about the\n  app, not about the test');
  expect(skill).toContain('flagging any over 14\n  days');
  expect(skill).toContain('Commit nothing.');
});

test('journeys-harden runs commands from the app directory in a monorepo', () => {
  expect(journeysHarden({ appPath: 'apps/crm' })).toContain(
    'cd apps/crm && lowdefy journeys harden --list'
  );
});
