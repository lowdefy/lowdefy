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

import agentsMd from './agentsMd.js';
import skills from './skills/index.js';
import testLevel from './skills/testLevel.js';
import { expect, test } from 'vitest';

// Every app in a repository renders the same agent files, so the text names
// no app: no `cd <app> &&` before a command and no app-specific dev command.
const texts = [
  { name: 'agentsMd', text: agentsMd({ cliVersion: '7.0.0', skills }) },
  ...skills.map((skill) => ({ name: skill.name, text: skill.render() })),
];

test.each(texts)('$name names no app', ({ text }) => {
  expect(text).not.toMatch(/\bcd [^`\n]*&& *lowdefy/);
  expect(text).not.toMatch(/\bcd \S+ && /);
  expect(text).not.toContain('Developers start it');
});

test('agentsMd states the app rule once', () => {
  const text = agentsMd({ cliVersion: '7.0.0', skills });
  expect(text.split('A Lowdefy app is a folder containing `lowdefy.yaml`.')).toHaveLength(2);
  expect(text).toContain('pass its folder as `directory`');
  expect(text).toContain('`--config-directory <app>`');
});

test('journeys-autopilot stops and lists the apps instead of guessing', () => {
  const autopilot = skills.find((skill) => skill.name === 'journeys-autopilot').render();
  expect(autopilot).toContain(
    'When that leaves several, stop and list the app folders instead of guessing.'
  );
});

const journeySkills = texts.filter(({ name }) => name.startsWith('journeys-'));

test('there are five journey skills', () => {
  expect(journeySkills.map(({ name }) => name).sort()).toEqual([
    'journeys-autopilot',
    'journeys-from-dev',
    'journeys-from-pr',
    'journeys-from-production',
    'journeys-harden',
  ]);
});

test.each(journeySkills)('$name gives each kind of check one home', ({ text }) => {
  expect(text).toContain(testLevel());
  expect(text).toContain('## Where each check lives');
  expect(text).toContain('A write journey ends with\n  `expect: { db }` on what was stored');
  expect(text).toContain('a journey with\n  no `pageId` and `call` or `request` steps');
  expect(text).toContain(
    'call the request or endpoint with `lowdefy_run_request` or\n  `lowdefy_run_endpoint`, passing `user` and `data`.'
  );
  expect(text).toContain('an endpoint test (`tests/endpoints/`), never a journey per case');
  expect(text).toContain('Say in the pull request when that snapshot changed, and why.');
});

test('journeys-autopilot leaves who can open which page to an access table snapshot', () => {
  const autopilot = skills.find((skill) => skill.name === 'journeys-autopilot').render();
  expect(autopilot).toContain(
    'it already proves which role opens which page: write\n   `refusal` items only for what it cannot show'
  );
  expect(autopilot).toContain('name a changed access table snapshot in the pull request');
});

test('journeys-autopilot writes one journey per write, asserting what it stored', () => {
  const autopilot = skills.find((skill) => skill.name === 'journeys-autopilot').render();
  expect(autopilot).toContain(
    'A `write` item is one journey: the\n   role uses the control and the journey asserts what it stored'
  );
  expect(autopilot).toContain(
    '- A write ends with `expect: { db: { collection, match } }` on the document it stored'
  );
  expect(autopilot).not.toContain('endpoint_test');
  expect(autopilot).not.toContain('an endpoint test for what the write stored');
});

test('the testing rules are the same text for every CLI version, and name no server', () => {
  const rules = (cliVersion) => agentsMd({ cliVersion, skills }).split('### Testing a change')[1];
  expect(rules('7.0.0')).toEqual(rules('8.1.0'));
  expect(rules('7.0.0')).not.toMatch(/localhost|127\.0\.0\.1|https?:\/\//);
});
