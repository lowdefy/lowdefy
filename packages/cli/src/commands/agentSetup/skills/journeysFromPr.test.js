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
import journeysFromPr from './journeysFromPr.js';

const DESCRIPTION =
  'Use when the developer wants a pull request explored before it merges, or wants journeys for what a PR changed. Walks the changed pages as each role on a data set, reports findings proven by failing journeys first, then proposes journeys and proves each before suggesting it.';

test('the skill list includes journeys-from-pr with its renderer and AGENTS.md line', () => {
  const entry = skills.find((skill) => skill.name === 'journeys-from-pr');
  expect(entry.render).toBe(journeysFromPr);
  expect(entry.agentsMdLine).toContain('journeys-from-pr');
});

test('journeys-from-pr renders a frontmatter with its name and exact description', () => {
  const skill = journeysFromPr({ appPath: '' });
  expect(skill.startsWith(`---\nname: journeys-from-pr\ndescription: ${DESCRIPTION}\n---\n`)).toBe(
    true
  );
});

test('journeys-from-pr names the explore, lint and three-run commands and the hub dev tools', () => {
  const skill = journeysFromPr({ appPath: '' });
  [
    'gh pr view <n>',
    'git worktree add --detach ../<repo>-pr-<n>',
    'gh pr checkout <n>',
    'lowdefy_dev_start',
    'lowdefy journeys explore --pr <n>',
    'lowdefy test --lint <path>',
    'lowdefy test --repeat 3 <path>',
    'lowdefy_dev_stop',
  ].forEach((command) => expect(skill).toContain(command));
});

test('journeys-from-pr posts comments only after approval and with only config, fixture and typed text', () => {
  const skill = journeysFromPr({ appPath: '' });
  expect(skill).toContain('gh pr comment <n> --body-file <file>');
  expect(skill).toContain('only once they approve the text');
  expect(skill).toContain('keep only config, fixture and typed text');
  expect(skill).toContain('no screenshot is attached');
});

test('journeys-from-pr forbids fixed waits and setting allowWriteRequests, and never overrules an invariant', () => {
  const skill = journeysFromPr({ appPath: '' });
  expect(skill).toContain('Never add\n    `wait: { ms }`');
  expect(skill).toContain('You never set `allowWriteRequests`; only the developer does.');
  expect(skill).toContain('You never overrule an\ninvariant');
  expect(skill).toContain('you never write a step the compiler did not produce');
  expect(skill).toContain('Commit nothing.');
});

test('journeys-from-pr gives no instruction to delete a journey', () => {
  const skill = journeysFromPr({ appPath: '' });
  expect(skill).not.toMatch(/^\s*(?:-\s*)?(?:\*\*)?(?:delete|remove)\b/im);
  expect(skill).not.toMatch(/\bdelete\b/i);
  expect(skill).not.toMatch(/\brm\b/);
});

test('journeys-from-pr names the app directory in a monorepo', () => {
  expect(journeysFromPr({ appPath: 'apps/crm' })).toContain('`apps/crm` in the worktree');
});

test('journeys-from-pr shows proven findings with the journey that fails, as the regression test', () => {
  const skill = journeysFromPr({ appPath: '' });
  expect(skill).toContain('## 5. Proven findings first, one at a time');
  expect(skill).toContain('errors first, then dead clicks');
  expect(skill).toContain('The journey fails under `lowdefy test` today');
  expect(skill).toContain('the journey is the\n  regression test');
  expect(skill).toContain('`tests/journeys/_candidates/explorer/<run>/`');
  expect(skill).toContain('Ask the developer whether it should do something.');
  expect(skill).not.toContain('do not run it three');
  expect(skill).not.toContain('confirmed');
});
