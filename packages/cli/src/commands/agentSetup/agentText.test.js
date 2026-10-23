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
import { expect, test } from 'vitest';

// Every app in a repository renders the same agent files, so the text names
// no app: no `cd <app> &&` before a command and no app-specific dev command.
const texts = [
  { name: 'agentsMd', text: agentsMd({ skills }) },
  ...skills.map((skill) => ({ name: skill.name, text: skill.render() })),
];

test.each(texts)('$name names no app', ({ text }) => {
  expect(text).not.toMatch(/\bcd [^`\n]*&& *lowdefy/);
  expect(text).not.toMatch(/\bcd \S+ && /);
  expect(text).not.toContain('Developers start it');
});

test('agentsMd states the app rule once', () => {
  const text = agentsMd({ skills });
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
