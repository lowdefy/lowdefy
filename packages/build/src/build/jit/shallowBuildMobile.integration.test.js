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

// The skeleton build adds mobile pages to the route table and the page
// registry, writes the dev mobile artifacts, and a JIT build of a mobile page
// resolves its client types against the native types map.

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { icons as lucideIcons } from 'lucide';
import { serializer, type } from '@lowdefy/helpers';

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
const { snapshotTypesMap, snapshotTypesMapMobile } = await import(
  '../../test-utils/runBuildForSnapshots.js'
);

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
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-shallow-mobile-'));
  configDir = path.join(root, 'config');
  buildDir = path.join(root, '.lowdefy', 'server', 'build');
  fs.mkdirSync(buildDir, { recursive: true });

  write(
    'lowdefy.yaml',
    `lowdefy: local
name: Mobile

pages:
  - _ref: pages/home.yaml
  - _ref: pages/about.yaml

mobile:
  homePageId: today
  minShellVersion: 7.4.0
  menus:
    tabs:
      - pageId: today
        icon: House
        title: Today
      - pageId: about
        title: About
  shells:
    - id: field
      ios:
        bundleId: com.example.field
        teamId: ABCDE12345
  pages:
    - _ref: mobile/today.yaml
    - _ref: mobile/jobs.yaml
    - _ref: mobile/grid.yaml
    - _ref: mobile/hover.yaml
    - _ref: pages/about.yaml
    - id: profile
      type: Box
      blocks:
        - id: name
          type: Title
          class: p-4 text-lg
          properties:
            content: Profile
            icon: Bell
`
  );
  write('pages/home.yaml', 'id: home\ntype: Box\n');
  write('pages/about.yaml', 'id: about\ntype: Box\npath: company/about\n');
  write(
    'mobile/today.yaml',
    `id: today
type: Box
blocks:
  - id: title
    type: Title
    class: px-3 bg-primary
    properties:
      content: Today
  - id: go
    type: Button
    properties:
      icon: House
    events:
      onClick:
        - id: link
          type: Link
          params: profile
`
  );
  // Html is a web block with no native version.
  write(
    'mobile/jobs.yaml',
    `id: jobs
type: Box
path: jobs/{job_id}
blocks:
  - id: html
    type: Html
`
  );

  // A grid style has no React Native form.
  write(
    'mobile/grid.yaml',
    `id: grid
type: Box
blocks:
  - id: cards
    type: Box
    style:
      display: grid
`
  );

  // A hover class has no React Native form.
  write(
    'mobile/hover.yaml',
    `id: hover
type: Box
blocks:
  - id: link
    type: Title
    class: hover:underline
`
  );

  result = await shallowBuild({
    customTypesMap: snapshotTypesMap,
    customTypesMapMobile: snapshotTypesMapMobile,
    directories: { config: configDir, build: buildDir, server: path.dirname(buildDir) },
    logger,
    stage: 'dev',
  });
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('the skeleton build gives mobile and shared pages routes and a target in the page registry', () => {
  const routes = readArtifact('routes.json').map(({ pageId, path: routePath }) => ({
    pageId,
    path: routePath,
  }));
  expect(routes).toEqual(
    expect.arrayContaining([
      { pageId: 'home', path: 'home' },
      { pageId: 'about', path: 'company/about' },
      { pageId: 'today', path: 'today' },
      { pageId: 'jobs', path: 'jobs/{job_id}' },
      { pageId: 'profile', path: 'profile' },
    ])
  );
  expect(result.pageRegistry.get('home').target).toBeUndefined();
  expect(result.pageRegistry.get('about').target).toEqual('both');
  expect(result.pageRegistry.get('today').target).toEqual('mobile');
  expect(result.pageRegistry.get('profile').target).toEqual('mobile');
});

test('the skeleton build writes the mobile config and a page index without hashes or type sets', () => {
  const config = readArtifact('mobile/config.json');
  expect(config.homePageId).toEqual('today');
  expect(config.minShellVersion).toEqual('7.4.0');
  expect(config.menus.tabs.map((item) => item.pageId)).toEqual(['today', 'about']);
  expect(config.menus.tabs[0].iconData).toBeDefined();
  expect(config.shells).toEqual([
    {
      id: 'field',
      ios: { bundleId: 'com.example.field', teamId: 'ABCDE12345' },
    },
  ]);
  expect(readArtifact('mobile/pageIndex.json')).toEqual([
    { path: 'company/about', pageId: 'about' },
    { path: 'today', pageId: 'today' },
    { path: 'jobs/{job_id}', pageId: 'jobs' },
    { path: 'grid', pageId: 'grid' },
    { path: 'hover', pageId: 'hover' },
    { path: 'profile', pageId: 'profile' },
  ]);
  expect(readArtifact('mobile/typeSets.json')).toEqual({});
});

test('the skeleton build writes the mobile theme and the class map of inline mobile pages', () => {
  const theme = readArtifact('mobile/theme.json');
  expect(theme.darkMode).toEqual('system');
  expect(type.isString(theme.light.colorPrimary)).toBe(true);
  expect(type.isString(theme.dark.colorBgBase)).toBe(true);
  const classMap = readArtifact('mobile/classMap.json');
  expect(Object.keys(classMap)).toEqual(expect.arrayContaining(['p-4', 'text-lg']));
});

test('the web menu leaves mobile-only pages out', () => {
  const menus = readArtifact('menus.json');
  const pageIds = menus[0].links.map((link) => link.pageId);
  expect(pageIds).toEqual(['home', 'about']);
});

test('a JIT build of a mobile page carries its target and native types', async () => {
  const page = await buildPageJit({
    pageId: 'today',
    pageRegistry: result.pageRegistry,
    context: result.context,
  });
  expect(page.target).toEqual('mobile');
  expect(page.slots.content.blocks.map((block) => block.type)).toEqual(['Title', 'Button']);
});

test('a JIT build of a shared page carries target both', async () => {
  const page = await buildPageJit({
    pageId: 'about',
    pageRegistry: result.pageRegistry,
    context: result.context,
  });
  expect(page.target).toEqual('both');
});

test('a JIT build of a mobile page using a type with no native version fails', async () => {
  await expect(
    buildPageJit({
      pageId: 'jobs',
      pageRegistry: result.pageRegistry,
      context: result.context,
    })
  ).rejects.toMatchObject({
    buildErrors: expect.arrayContaining([
      expect.objectContaining({
        message: expect.stringContaining('Block type "Html" on block "html" on page "jobs"'),
      }),
    ]),
  });
});

test('a JIT build of a mobile page with a style React Native cannot honour fails', async () => {
  await expect(
    buildPageJit({
      pageId: 'grid',
      pageRegistry: result.pageRegistry,
      context: result.context,
    })
  ).rejects.toMatchObject({
    buildErrors: expect.arrayContaining([
      expect.objectContaining({
        message: expect.stringContaining('Style "display" in slot "block" on block "cards"'),
      }),
    ]),
  });
});

test('a JIT build of a mobile page carries the class map entries of its own classes', async () => {
  expect(Object.keys(readArtifact('mobile/classMap.json'))).not.toContain('px-3');
  const page = await buildPageJit({
    pageId: 'today',
    pageRegistry: result.pageRegistry,
    context: result.context,
  });
  expect(page._classMap).toEqual({
    'bg-primary': { backgroundColor: expect.any(String) },
    'dark:bg-primary': { backgroundColor: expect.any(String) },
    'px-3': { paddingLeft: 12, paddingRight: 12 },
  });
  expect(page._classMap['bg-primary']).not.toEqual(page._classMap['dark:bg-primary']);
  expect(readArtifact('pages/today.json')._classMap).toEqual(page._classMap);
});

test('a JIT build of a shared page carries a class map, and a web page none', async () => {
  const about = await buildPageJit({
    pageId: 'about',
    pageRegistry: result.pageRegistry,
    context: result.context,
  });
  expect(about._classMap).toEqual({});
  const home = await buildPageJit({
    pageId: 'home',
    pageRegistry: result.pageRegistry,
    context: result.context,
  });
  expect(home._classMap).toBeUndefined();
});

test('a JIT build of a mobile page carries the icon data of the icons it draws', async () => {
  const page = await buildPageJit({
    pageId: 'today',
    pageRegistry: result.pageRegistry,
    context: result.context,
  });
  expect(page._icons.House).toEqual({ node: lucideIcons.House });
  expect(page._icons.loading).toEqual({ node: lucideIcons.LoaderCircle });
  expect(readArtifact('pages/today.json')._icons).toEqual(page._icons);
});

test('a JIT build of a shared page carries icon data, and a web page none', async () => {
  const about = await buildPageJit({
    pageId: 'about',
    pageRegistry: result.pageRegistry,
    context: result.context,
  });
  expect(Object.keys(about._icons)).toContain('icon-missing');
  const home = await buildPageJit({
    pageId: 'home',
    pageRegistry: result.pageRegistry,
    context: result.context,
  });
  expect(home._icons).toBeUndefined();
});

test('the skeleton build writes an inline mobile page with its icon data', () => {
  expect(readArtifact('pages/profile.json')._icons.Bell).toEqual({ node: lucideIcons.Bell });
});

test('a JIT build of a mobile page with a class React Native cannot honour fails', async () => {
  await expect(
    buildPageJit({
      pageId: 'hover',
      pageRegistry: result.pageRegistry,
      context: result.context,
    })
  ).rejects.toMatchObject({
    buildErrors: expect.arrayContaining([
      expect.objectContaining({
        message: expect.stringContaining(
          'Class "hover:underline" on block "link" on page "hover" has no native form'
        ),
      }),
    ]),
  });
});
