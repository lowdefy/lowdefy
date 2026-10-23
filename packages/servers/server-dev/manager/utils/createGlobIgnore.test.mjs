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

import path from 'path';

import { expect, test } from 'vitest';

import createGlobIgnore from './createGlobIgnore.mjs';

// setupWatcher hands the ignore function paths with the platform separator.
const appRoot = path.join('/home/dev/repo/.claude/worktrees/feature/app');

test('a globstar pattern ignores matching paths at any depth, dot-folders included', () => {
  const isIgnored = createGlobIgnore(['**/node_modules/**']);
  expect(isIgnored(path.join(appRoot, 'node_modules/pkg/index.js'))).toBe(true);
  expect(isIgnored(path.join(appRoot, 'modules/layout/node_modules/pkg/page.yaml'))).toBe(true);
  expect(isIgnored(path.join(appRoot, 'pages/home.yaml'))).toBe(false);
});

test('an absolute watchIgnore glob ignores only the files it matches', () => {
  const isIgnored = createGlobIgnore([path.join(appRoot, 'drafts/**/*.yaml')]);
  expect(isIgnored(path.join(appRoot, 'drafts/page.yaml'))).toBe(true);
  expect(isIgnored(path.join(appRoot, 'drafts/nested/page.yaml'))).toBe(true);
  expect(isIgnored(path.join(appRoot, 'drafts/notes.md'))).toBe(false);
  expect(isIgnored(path.join(appRoot, 'pages/page.yaml'))).toBe(false);
});

test('a plain path ignores that path and everything under it, as chokidar 3 did', () => {
  const isIgnored = createGlobIgnore([path.join(appRoot, 'drafts')]);
  expect(isIgnored(path.join(appRoot, 'drafts'))).toBe(true);
  expect(isIgnored(path.join(appRoot, 'drafts/page.yaml'))).toBe(true);
  expect(isIgnored(path.join(appRoot, 'drafts-old/page.yaml'))).toBe(false);
});

test('a path with forward slashes matches a pattern written with the platform separator', () => {
  const isIgnored = createGlobIgnore([path.join(appRoot, 'drafts', '**')]);
  expect(isIgnored(`${appRoot.split(path.sep).join('/')}/drafts/page.yaml`)).toBe(true);
});

test('any of several patterns ignores a path', () => {
  const isIgnored = createGlobIgnore(['**/node_modules/**', path.join(appRoot, 'drafts/**')]);
  expect(isIgnored(path.join(appRoot, 'node_modules/a.js'))).toBe(true);
  expect(isIgnored(path.join(appRoot, 'drafts/a.yaml'))).toBe(true);
  expect(isIgnored(path.join(appRoot, 'pages/a.yaml'))).toBe(false);
});
