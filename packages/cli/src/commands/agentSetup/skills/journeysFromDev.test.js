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
import journeysFromDev from './journeysFromDev.js';

test('the skill list includes journeys-from-dev with its renderer and AGENTS.md line', () => {
  const entry = skills.find((skill) => skill.name === 'journeys-from-dev');
  expect(entry.render).toBe(journeysFromDev);
  expect(entry.agentsMdLine).toContain('journeys-from-dev');
});

test('journeys-from-dev names the commands it drives', () => {
  const skill = journeysFromDev({ appPath: '' });
  expect(skill).toContain(
    "description: Use when the developer wants journeys (tests) for something they just tried in the dev server, or says 'turn what I clicked into tests'. Reads their recorded dev session as a log, writes journeys for what they were proving, and proves each one before proposing it."
  );
  expect(skill).toContain('lowdefy journeys session --since <window>');
  expect(skill).toContain('lowdefy journeys session <id>');
  expect(skill).toContain('lowdefy_journey_session');
  expect(skill).toContain('lowdefy test --repeat 3 tests/journeys/<file>.yaml');
  expect(skill).not.toMatch(/journeys compile|journeys recordings|_candidates|--build current/);
});

test('journeys-from-dev reads one session, keeps failed attempts and asserts outcomes', () => {
  const skill = journeysFromDev({ appPath: '' });
  expect(skill).toContain('never from\nevery session in the window');
  expect(skill).toContain('A failed\nattempt followed by a fix is two things worth keeping');
  expect(skill).toContain('Never\n  assert an id the app generated');
});

test('journeys-from-dev forbids wait ms and states the fixture and sign-in rules', () => {
  const skill = journeysFromDev({ appPath: '' });
  expect(skill).toContain('Never add `wait: { ms }`');
  expect(skill).toContain("comes from the data set's `fixtures` or `users`");
  expect(skill).toContain('never rows copied from the developer');
  expect(skill).toContain('(password, not recorded)` line means the developer signed in');
  expect(skill).toContain('Commit nothing.');
  expect(skill).not.toMatch(/delete (a|the) journey/i);
  expect(skill).not.toMatch(/\brm\b/);
});

test('journeys-from-dev runs commands from the app directory in a monorepo', () => {
  expect(journeysFromDev({ appPath: 'apps/crm' })).toContain(
    'cd apps/crm && lowdefy journeys session'
  );
});
