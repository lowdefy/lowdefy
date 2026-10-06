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
  'Use when the developer wants a pull request explored before it merges, wants journeys for what a PR changed, or wants a bug bash. Looks at each changed page as each role, writes a journey for every path a user can take, keeps the ones that pass and reports the ones that fail as findings with their journey.';

test('the skill list includes journeys-from-pr with its renderer and AGENTS.md line, and no journeys-bug-bash', () => {
  const entry = skills.find((skill) => skill.name === 'journeys-from-pr');
  expect(entry.render).toBe(journeysFromPr);
  expect(entry.agentsMdLine).toContain('journeys-from-pr');
  expect(entry.agentsMdLine).toContain('bug bash');
  expect(skills.map((skill) => skill.name)).not.toContain('journeys-bug-bash');
});

test('journeys-from-pr renders a frontmatter with its name and exact description', () => {
  const skill = journeysFromPr({ appPath: '' });
  expect(skill.startsWith(`---\nname: journeys-from-pr\ndescription: ${DESCRIPTION}\n---\n`)).toBe(
    true
  );
});

test('journeys-from-pr names the scope, page, lint and three-run commands and the hub dev tools', () => {
  const skill = journeysFromPr({ appPath: '' });
  [
    'gh pr view <n>',
    'git worktree add --detach ../<repo>-pr-<n>',
    'gh pr checkout <n>',
    'lowdefy_dev_start',
    'lowdefy journeys scope --base <base branch> --json',
    'lowdefy_screenshot_page',
    'lowdefy_get_page_config',
    'lowdefy test --lint <path>',
    'lowdefy test --repeat 3 <path>',
    'lowdefy_dev_stop',
  ].forEach((command) => expect(skill).toContain(command));
});

test('journeys-from-pr writes every journey with its goal as the description, on a data set', () => {
  const skill = journeysFromPr({ appPath: '' });
  expect(skill).toContain('every path a user can take');
  expect(skill).toContain('`name`: what the journey does, at most 100 characters.');
  expect(skill).toContain('`description`: the goal, at most 60 words');
  expect(skill).toContain('`data`: the data set');
  expect(skill).toContain('Read the existing journeys on the page');
});

test('journeys-from-pr reports a finding only with a journey that fails with it', () => {
  const skill = journeysFromPr({ appPath: '' });
  expect(skill).toContain('You report a finding only with a journey that fails with it.');
  expect(skill).toContain('the journey is the regression\n  test');
  expect(skill).toContain('never nightly, never\nin CI');
});

test('journeys-from-pr folds in the bug bash: a goal sentence instead of a diff', () => {
  const skill = journeysFromPr({ appPath: '' });
  expect(skill).toContain('**A bug bash** is this same skill given a goal sentence');
  expect(skill).toContain('`lowdefy journeys scope --json` lists every page');
});

test('journeys-from-pr has no walker instructions', () => {
  const skill = journeysFromPr({ appPath: '' });
  expect(skill).not.toMatch(/journeys explore|--charters?\b|_candidates|--policy|--budget/);
});

test('journeys-from-pr posts comments only after approval, forbids fixed waits and setting allowWriteRequests', () => {
  const skill = journeysFromPr({ appPath: '' });
  expect(skill).toContain('gh pr comment <n> --body-file <file>');
  expect(skill).toContain('only\n  once they approve the text');
  expect(skill).toContain('Never add\n  `wait: { ms }`');
  expect(skill).toContain('You never set `allowWriteRequests`; only the developer does.');
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
