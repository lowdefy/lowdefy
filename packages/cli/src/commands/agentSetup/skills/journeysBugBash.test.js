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
import journeysBugBash from './journeysBugBash.js';

const DESCRIPTION =
  "Use when the developer wants a bug bash, wants the app explored for bugs without a pull request to follow, or wants several directions tried at once. Writes 3 to 6 charters from the app's pages and runs them as one explore run, unattended, then reports proven findings first.";

test('the skill list includes journeys-bug-bash with its renderer and AGENTS.md line', () => {
  const entry = skills.find((skill) => skill.name === 'journeys-bug-bash');
  expect(entry.render).toBe(journeysBugBash);
  expect(entry.agentsMdLine).toContain('journeys-bug-bash');
});

test('journeys-bug-bash renders a frontmatter with its name and exact description', () => {
  const skill = journeysBugBash({ appPath: '' });
  expect(skill.startsWith(`---\nname: journeys-bug-bash\ndescription: ${DESCRIPTION}\n---\n`)).toBe(
    true
  );
});

test('journeys-bug-bash starts the dev server first and runs the one --charters command', () => {
  const skill = journeysBugBash({ appPath: '' });
  const start = skill.indexOf('lowdefy_dev_start');
  const run = skill.indexOf('lowdefy journeys explore --charters <file>');
  expect(start).toBeGreaterThan(-1);
  expect(run).toBeGreaterThan(start);
  expect(skill).toContain('lowdefy_app_map');
  expect(skill).toContain('## 4. Run it, once');
  expect(skill).toContain('You never run two explore processes at once');
});

test('journeys-bug-bash writes 3 to 6 charters outside the repository, as { goal, pages?, roles? }', () => {
  const skill = journeysBugBash({ appPath: '' });
  expect(skill).toContain('Write 3 to 6 charters to a file outside the repository');
  expect(skill).toContain('`{ goal, pages?, roles? }`');
  expect(skill).toContain('**edge input**');
  expect(skill).toContain('**error paths**');
});

test('journeys-bug-bash reports proven findings first, each journey as the regression test, and runs unattended', () => {
  const skill = journeysBugBash({ appPath: '' });
  expect(skill).toContain('Run it unattended');
  expect(skill).toContain('errors first, then dead clicks');
  expect(skill).toContain('it is the\n  regression test');
  expect(skill).toContain('the charters that hit it');
  expect(skill).toContain('You never write an\nexpectation');
  expect(skill).toContain('Commit nothing.');
  expect(skill).not.toMatch(/\bdelete (?:the|a|this) journey/i);
});

test('journeys-bug-bash reports the changed pages no charter walked', () => {
  const skill = journeysBugBash({ appPath: '' });
  expect(skill).toContain('**Pages no charter walked**');
  expect(skill).toContain('reason `no-charter`');
});

test('journeys-bug-bash names the app directory in a monorepo', () => {
  expect(journeysBugBash({ appPath: 'apps/crm' })).toContain('the app directory being\n`apps/crm`');
});
