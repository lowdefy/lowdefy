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
import journeysFromProduction from './journeysFromProduction.js';

test('the skill list includes journeys-from-production with its renderer and AGENTS.md line', () => {
  const entry = skills.find((skill) => skill.name === 'journeys-from-production');
  expect(entry.render).toBe(journeysFromProduction);
  expect(entry.agentsMdLine).toContain('journeys-from-production');
});

test('journeys-from-production renders a frontmatter with its name and description', () => {
  const skill = journeysFromProduction({ appPath: '' });
  expect(skill.startsWith('---\nname: journeys-from-production\ndescription: Use when')).toBe(true);
});

test('journeys-from-production names the four production commands in order', () => {
  const skill = journeysFromProduction({ appPath: '' });
  const commands = [
    'lowdefy journeys pull posthog --since 30d',
    'lowdefy journeys compile --source production --since 30d',
    'lowdefy journeys coverage --source production --since 30d',
    'lowdefy journeys evidence --refresh',
  ];
  const positions = commands.map((command) => skill.indexOf(command));
  positions.forEach((position) => expect(position).toBeGreaterThan(-1));
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  expect(skill).toContain('lowdefy test --repeat 3 tests/journeys/_candidates/production/');
});

test('journeys-from-production never asks for the key in chat', () => {
  const skill = journeysFromProduction({ appPath: '' });
  expect(skill).toContain('Never ask for the key in chat');
  expect(skill).toContain('POSTHOG_PERSONAL_API_KEY');
  expect(skill).toContain('Query Read');
});

test('journeys-from-production gives no instruction to delete a journey', () => {
  const skill = journeysFromProduction({ appPath: '' });
  expect(skill).toContain('you never propose deleting one');
  expect(skill).toContain('Make no recommendation to delete any of them.');
  // No step or bullet tells the agent to delete or remove anything.
  expect(skill).not.toMatch(/^\s*(?:-\s*)?(?:\*\*)?(?:delete|remove)\b/im);
  expect(skill).not.toMatch(/\brm\b/);
});

test('journeys-from-production keeps the fixture, frustration, flake and commit rules', () => {
  const skill = journeysFromProduction({ appPath: '' });
  expect(skill).toContain(
    'add a\n  fixture document for the journey rather than borrowing a value'
  );
  expect(skill).toContain('A dead click on a\n  block that should do nothing is a finding');
  expect(skill).toContain('Never add `wait: { ms }`');
  expect(skill).toContain('Commit nothing.');
});

test('journeys-from-production has the agent pick a window of at most 30 days and say why', () => {
  const skill = journeysFromProduction({ appPath: '' });
  expect(skill).toContain('A mining window is at most 30 UTC days');
  expect(skill).toContain('say which and why in your report');
  expect(skill).toContain('the window and why you chose it');
  const windows = [...skill.matchAll(/--since (\d+)d/g)].map((match) => Number(match[1]));
  windows.forEach((days) => expect(days).toBeLessThanOrEqual(30));
});

test('journeys-from-production reads routines with the config and decides what deserves a journey', () => {
  const skill = journeysFromProduction({ appPath: '' });
  expect(skill).toContain(
    "read the page's config, the\nrequests and actions its steps run, and the block plugins' code"
  );
  expect(skill).toContain('tokenised-text');
  expect(skill).toContain('1. failures');
  expect(skill).toContain(
    '2. routines that write data, move money, change access or end a process;'
  );
  expect(skill).toContain('3. the rest, by how often production showed them');
  expect(skill).toContain('Never add an interaction the routine did not record.');
  expect(skill).toContain('A click on\n  a label built from values stays without text.');
  expect(skill).toContain('ask them only about findings and dead clicks');
});

test('journeys-from-production never reads production text, secrets, snapshots or PostHog', () => {
  const skill = journeysFromProduction({ appPath: '' });
  expect(skill).toContain(
    "read `.lowdefy/traces/production/salt`, the app's `.env` or any credential;"
  );
  expect(skill).toContain('read `.lowdefy/data/` snapshots;');
  expect(skill).toContain('call PostHog through its MCP, its API or a URL, or run HogQL;');
  expect(skill).toContain('add text to the config to resolve a token');
  expect(skill).not.toContain('## PostHog MCP');
  expect(skill).not.toMatch(/Use the PostHog MCP/);
  expect(skill).not.toMatch(/https:\/\/(?:eu|us|app)\.posthog\.com\/(?:api|project)/);
});

test('journeys-from-production runs commands from the app directory in a monorepo', () => {
  expect(journeysFromProduction({ appPath: 'apps/crm' })).toContain(
    'cd apps/crm && lowdefy journeys pull posthog'
  );
});
