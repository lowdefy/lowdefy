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

import createDotPathIgnore from './createDotPathIgnore.mjs';

const appRoot = '/home/dev/repo/.claude/worktrees/feature/app';

test('a file in an app that lives under a dot-folder is not ignored', () => {
  const isDotPath = createDotPathIgnore({ watchPaths: [appRoot] });
  expect(isDotPath(appRoot)).toBe(false);
  expect(isDotPath(`${appRoot}/pages/home.yaml`)).toBe(false);
});

test('a dot-folder or dotfile inside the watched path is ignored', () => {
  const isDotPath = createDotPathIgnore({ watchPaths: [appRoot] });
  expect(isDotPath(`${appRoot}/.lowdefy/server/build/app.json`)).toBe(true);
  expect(isDotPath(`${appRoot}/.git`)).toBe(true);
  expect(isDotPath(`${appRoot}/pages/.home.yaml.swp`)).toBe(true);
});

test('segments are counted from the deepest watched path that holds the file', () => {
  const moduleRoot = `${appRoot}/.modules/layout`;
  const isDotPath = createDotPathIgnore({ watchPaths: [appRoot, moduleRoot] });
  expect(isDotPath(`${moduleRoot}/components/page.yaml`)).toBe(false);
  expect(isDotPath(`${appRoot}/.modules/other/page.yaml`)).toBe(true);
});

test('a file under no watched path is tested by its name only', () => {
  const isDotPath = createDotPathIgnore({ watchPaths: [appRoot] });
  expect(isDotPath('/home/dev/repo/.claude/worktrees/feature/modules/shared/title.yaml')).toBe(
    false
  );
  expect(isDotPath('/home/dev/repo/modules/shared/.title.yaml')).toBe(true);
});

test('a watched path that only shares a prefix with the file does not hold it', () => {
  const isDotPath = createDotPathIgnore({ watchPaths: ['/home/dev/app'] });
  expect(isDotPath('/home/dev/app-other/.cache/file.yaml')).toBe(false);
});
