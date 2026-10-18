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
    - _ref: pages/about.yaml
    - id: profile
      type: Box
      blocks:
        - id: name
          type: Title
          properties:
            content: Profile
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
    properties:
      content: Today
  - id: go
    type: Button
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
    { path: 'profile', pageId: 'profile' },
  ]);
  expect(readArtifact('mobile/typeSets.json')).toEqual({});
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
