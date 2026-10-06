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

// A page's path is a top-level key, so the skeleton build resolves it behind
// _ref, _var, _build.* and _module.var and writes it to routes.json, and the
// dev server reads a page file's current path with resolvePagePath.

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { serializer } from '@lowdefy/helpers';

process.env.AUTH_SECRET = 'test-secret-for-integration-test';

jest.unstable_mockModule('../buildApp.js', () => ({
  default: ({ components }) => {
    components.app = components.app ?? {};
    components.app.html = components.app.html ?? {};
    components.app.html.appendBody = components.app.html.appendBody ?? '';
    components.app.html.appendHead = components.app.html.appendHead ?? '';
    components.appMeta = { gitSha: 'test-git-sha' };
    return components;
  },
}));
jest.unstable_mockModule('../full/updateServerPackageJson.js', () => ({
  default: jest.fn(async () => {}),
}));
jest.unstable_mockModule('../copyPublicFolder.js', () => ({
  default: jest.fn(async () => {}),
}));
jest.unstable_mockModule('../copyAgentFileSystems.js', () => ({
  default: jest.fn(async () => {}),
}));

const { default: shallowBuild } = await import('./shallowBuild.js');
const { default: buildPageJit } = await import('./buildPageJit.js');
const { default: resolvePagePath } = await import('./resolvePagePath.js');
const { default: prepareJitContext } = await import('./prepareJitContext.js');
const { snapshotTypesMap } = await import('../../test-utils/runBuildForSnapshots.js');

const logger = {
  info: () => {},
  log: () => {},
  warn: () => {},
  error: () => {},
  succeed: () => {},
};

let root;
let configDir;
let buildDir;
let result;

function write(rel, content) {
  const full = path.join(configDir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function readArtifact(name) {
  return serializer.deserialize(JSON.parse(fs.readFileSync(path.join(buildDir, name), 'utf8')));
}

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-shallow-page-path-'));
  configDir = path.join(root, 'config');
  buildDir = path.join(root, '.lowdefy', 'server', 'build');
  fs.mkdirSync(buildDir, { recursive: true });

  write(
    'lowdefy.yaml',
    `lowdefy: local
name: Page paths

modules:
  - id: support
    source: 'file:modules/support'
    vars:
      board_path: 'boards/{board_id}'

pages:
  - _ref: pages/home.yaml
  - _ref: pages/ticket.yaml
  - _ref: pages/report.yaml
  - _ref: pages/docs.yaml
  - _ref:
      path: pages/templated.yaml
      vars:
        id: item
        path: 'items/{item_id}'
  - _ref: pages/about.yaml
  - _ref: pages/links.yaml
`
  );
  write('pages/home.yaml', 'id: home\ntype: Box\n');
  write(
    'pages/ticket.yaml',
    `id: ticket
type: Box
path: tickets/{space}/{ticket_id}
blocks:
  - id: title
    type: Box
`
  );
  write('pages/report.yaml', 'id: report\ntype: Box\npath:\n  _ref: paths/report.yaml\n');
  write('paths/report.yaml', "'reports/{year}'\n");
  write(
    'pages/docs.yaml',
    `id: docs
type: Box
path:
  _build.string.concat:
    - docs/
    - '{slug}'
`
  );
  write(
    'pages/templated.yaml',
    `id:
  _var: id
type: Box
path:
  _var: path
`
  );
  write('pages/about.yaml', 'id: about\ntype: Box\npath: company/about-us\n');
  write(
    'pages/links.yaml',
    `id: links
type: Box
blocks:
  - id: go
    type: Button
    events:
      onClick:
        - id: ticket
          type: Link
          params:
            pageId: ticket
            pathParams:
              space: support
              ticket_id:
                _state: ticket_id
        - id: home
          type: Link
          params: home
  - id: html
    type: Html
    properties:
      html: <a data-page-id="about">About</a>
`
  );
  write(
    'modules/support/module.lowdefy.yaml',
    `name: Support

vars:
  board_path:
    type: string

pages:
  - _ref: pages/ticket.yaml
  - _ref: pages/board.yaml
`
  );
  write(
    'modules/support/pages/ticket.yaml',
    `id: ticket
type: Box
path: '{space}/tickets/{ticket_id}'
`
  );
  write(
    'modules/support/pages/board.yaml',
    `id: board
type: Box
path:
  _module.var: board_path
`
  );

  result = await shallowBuild({
    customTypesMap: snapshotTypesMap,
    directories: { config: configDir, build: buildDir, server: path.dirname(buildDir) },
    logger,
    stage: 'dev',
  });
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('the skeleton build writes routes.json with each page path resolved and module paths scoped', () => {
  const routes = readArtifact('routes.json').map(({ pageId, path: routePath }) => ({
    pageId,
    path: routePath,
  }));
  expect(routes).toEqual([
    { pageId: 'home', path: 'home' },
    { pageId: 'ticket', path: 'tickets/{space}/{ticket_id}' },
    { pageId: 'report', path: 'reports/{year}' },
    { pageId: 'docs', path: 'docs/{slug}' },
    { pageId: 'item', path: 'items/{item_id}' },
    { pageId: 'about', path: 'company/about-us' },
    { pageId: 'links', path: 'links' },
    { pageId: 'support/ticket', path: 'support/{space}/tickets/{ticket_id}' },
    { pageId: 'support/board', path: 'support/boards/{board_id}' },
    { pageId: '404', path: '404' },
  ]);
});

test('routes.json carries each page auth', () => {
  const routes = readArtifact('routes.json');
  expect(routes.find((route) => route.pageId === 'ticket').auth).toEqual({ public: true });
});

test('a JIT-built page artifact keeps its scoped path', async () => {
  const page = await buildPageJit({
    pageId: 'support/ticket',
    pageRegistry: result.pageRegistry,
    context: result.context,
  });
  expect(page.path).toEqual('support/{space}/tickets/{ticket_id}');
  const appPage = await buildPageJit({
    pageId: 'ticket',
    pageRegistry: result.pageRegistry,
    context: result.context,
  });
  expect(appPage.path).toEqual('tickets/{space}/{ticket_id}');
  const unpatterned = await buildPageJit({
    pageId: 'home',
    pageRegistry: result.pageRegistry,
    context: result.context,
  });
  expect(unpatterned.path).toBeUndefined();
});

test('a JIT-built page artifact carries the paths of the pages it links to', async () => {
  const page = await buildPageJit({
    pageId: 'links',
    pageRegistry: result.pageRegistry,
    context: result.context,
  });
  expect(page.linkPaths).toEqual({
    ticket: 'tickets/{space}/{ticket_id}',
    about: 'company/about-us',
  });
});

test('prepareJitContext reads the route table from routes.json', () => {
  const context = prepareJitContext({
    directories: { build: buildDir },
    keyMap: {},
    refMap: {},
  });
  const routes = context.routes.map(({ pageId, path: routePath, segments }) => ({
    pageId,
    path: routePath,
    segments,
  }));
  expect(routes).toContainEqual({
    pageId: 'ticket',
    path: 'tickets/{space}/{ticket_id}',
    segments: [{ fixed: 'tickets' }, { name: 'space' }, { name: 'ticket_id' }],
  });
  expect(routes).toContainEqual({ pageId: 'home', path: 'home', segments: [{ fixed: 'home' }] });
});

test('resolvePagePath reads the path a page file declares now', async () => {
  const { pageRegistry, context } = result;
  expect(await resolvePagePath({ pageId: 'ticket', pageRegistry, context })).toEqual(
    'tickets/{space}/{ticket_id}'
  );
  expect(await resolvePagePath({ pageId: 'support/board', pageRegistry, context })).toEqual(
    'support/boards/{board_id}'
  );
  expect(await resolvePagePath({ pageId: 'home', pageRegistry, context })).toEqual('home');

  write('pages/ticket.yaml', 'id: ticket\ntype: Box\npath: t/{ticket_id}\n');
  expect(await resolvePagePath({ pageId: 'ticket', pageRegistry, context })).toEqual(
    't/{ticket_id}'
  );
  write('pages/ticket.yaml', 'id: ticket\ntype: Box\n');
  expect(await resolvePagePath({ pageId: 'ticket', pageRegistry, context })).toEqual('ticket');
  write('pages/home.yaml', 'id: home\ntype: Box\npath: start\n');
  expect(await resolvePagePath({ pageId: 'home', pageRegistry, context })).toEqual('start');
});
