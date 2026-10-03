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

// JIT page builds on one kept dev context, as the dev server runs them:
//
//   shallowBuild -> artifacts on disk -> hydrated kept context (mirror of
//   server-dev getBuildContext) -> buildPageJit on per-build contexts
//
// The dev server keeps a built page until a file the page's build read
// changes. That is only sound if every config file a page build reads comes
// through context.readConfigFile, and all app code it runs through
// context.importAppCode. The guard test below holds the build to that: fs is
// patched before any build module loads, so a read that bypasses both fails it.

import { AsyncLocalStorage } from 'node:async_hooks';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';
import { serializer } from '@lowdefy/helpers';

const fileChannel = new AsyncLocalStorage();
let guardedRoot = null;
const strayReads = [];
const readCounts = new Map();

function toFilePath(file) {
  if (file instanceof URL) return fileURLToPath(file);
  if (typeof file === 'string') return path.resolve(file);
  return null;
}

function observeRead(file) {
  const filePath = toFilePath(file);
  if (filePath === null) return;
  readCounts.set(filePath, (readCounts.get(filePath) ?? 0) + 1);
  if (guardedRoot === null || fileChannel.getStore() === true) return;
  if (filePath === guardedRoot || filePath.startsWith(guardedRoot + path.sep)) {
    strayReads.push(filePath);
  }
}

// Patched before the build modules load, so modules that capture fs functions
// at import (node-utils promisifies fs.readFile) capture the observed ones.
for (const [target, name] of [
  [fs, 'readFile'],
  [fs, 'readFileSync'],
  [fs, 'createReadStream'],
  [fs.promises, 'readFile'],
]) {
  const original = target[name];
  jest.spyOn(target, name).mockImplementation(function observedRead(file, ...args) {
    observeRead(file);
    return original.call(this, file, ...args);
  });
}

// Steps that touch the real server filesystem or git, mocked so shallowBuild
// runs against a throwaway directory.
const mockComputeAppMeta = (source = {}) => ({
  slug: source.slug ?? null,
  name: source.name ?? null,
  version: source.version ?? null,
  description: source.description ?? null,
  license: source.license ?? null,
  lowdefyVersion: source.lowdefy ?? null,
  gitSha: 'test-git-sha',
});
jest.unstable_mockModule('../buildApp.js', () => ({
  computeAppMeta: mockComputeAppMeta,
  default: ({ components, context }) => {
    components.app = components.app ?? {};
    components.app.html = components.app.html ?? {};
    components.app.html.appendBody = components.app.html.appendBody ?? '';
    components.app.html.appendHead = components.app.html.appendHead ?? '';
    components.appMeta = context?.appMeta ?? mockComputeAppMeta(components);
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

// Every per-build context a page build makes, for the owned-field test.
const pageBuildContexts = [];
const { default: realCreatePageBuildContext } = await import('./createPageBuildContext.js');
jest.unstable_mockModule('./createPageBuildContext.js', () => ({
  default: (keptContext) => {
    const pageBuildContext = realCreatePageBuildContext(keptContext);
    pageBuildContexts.push(pageBuildContext);
    return pageBuildContext;
  },
}));

const { default: shallowBuild } = await import('./shallowBuild.js');
const { default: buildPageJit } = await import('./buildPageJit.js');
const { default: pageBuildOwnedFields } = await import('./pageBuildOwnedFields.js');
const { default: prepareJitContext } = await import('./prepareJitContext.js');
const { default: createContext } = await import('../../createContext.js');
const { default: makeId } = await import('../../utils/makeId.js');
const { hydrateDeferredRecords } = await import('../buildRefs/deferredRegistry.js');
const { snapshotTypesMap } = await import('../../test-utils/runBuildForSnapshots.js');

const installedPluginPackages = new Set(['@lowdefy/blocks-basic', '@lowdefy/actions-core']);
const logger = {
  info: () => {},
  log: () => {},
  warn: () => {},
  error: () => {},
  succeed: () => {},
};

function writeFixture(configDir) {
  const write = (rel, content) => {
    const full = path.join(configDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  };
  // App code in the config directory is ES modules.
  write('package.json', JSON.stringify({ type: 'module' }));
  write(
    'lowdefy.yaml',
    `lowdefy: local
name: Page build inputs

modules:
  - id: inviter
    source: 'file:modules/inviter'

pages:
  - _ref: pages/home.yaml
  - _ref:
      path: pages/templated.yaml
      vars:
        title:
          _ref: vars/title.yaml
  - _ref:
      path: pages/nunjucks.yaml.njk
      vars:
        heading:
          _ref: vars/heading.yaml
  - _ref:
      resolver: resolvers/page.js
      vars:
        title: Resolved
  - _ref: pages/transformed.yaml
  - _ref:
      path: pages/page-transformed.yaml
      transformer: transformers/markPage.js
  - _ref:
      path: pages/templated.yaml
      vars:
        id: vars-transformed
        title: Vars title
      transformer: transformers/markPage.js
  - _ref:
      resolver: resolvers/page.js
      transformer: transformers/markPage.js
      vars:
        id: resolver-transformed
        title: Resolver title
  - _ref: pages/card-one.yaml
  - _ref: pages/card-two.yaml
  - _ref: pages/broken.yaml
  - _ref: pages/warns.yaml
`
  );
  // A file _ref, and a page-level _ref to a .js file.
  write(
    'pages/home.yaml',
    `id: home
type: Box
blocks:
  - _ref: blocks/shared.yaml
  - _ref: blocks/banner.js
`
  );
  write('blocks/shared.yaml', 'id: shared\ntype: Box\n');
  write('blocks/banner.js', "export default { id: 'banner', type: 'Box' };\n");
  // A _ref with vars, the vars from a file.
  write(
    'pages/templated.yaml',
    `id:
  _var:
    key: id
    default: templated
type: Box
properties:
  title:
    _var: title
`
  );
  write('vars/title.yaml', 'Templated title\n');
  // A nunjucks _ref with vars.
  write(
    'pages/nunjucks.yaml.njk',
    `id: nunjucks
type: Box
properties:
  title: {{ heading }}
`
  );
  write('vars/heading.yaml', 'Nunjucks heading\n');
  // A resolver page and a transformer page. Both are pure: app code may read
  // anything, so a page that runs it is rebuilt after every edit, and the
  // guard holds only the build's own reads.
  write(
    'resolvers/page.js',
    "export default function resolve(refPath, vars) {\n  return { id: vars.id ?? 'resolved', type: 'Box', properties: { title: vars.title } };\n}\n"
  );
  // A transformer on a page's own _ref, on a file page, a page with vars and a
  // resolver page.
  write('pages/page-transformed.yaml', 'id: page-transformed\ntype: Box\n');
  write(
    'transformers/markPage.js',
    'export default function transform(page, vars) {\n  return { ...page, properties: { ...page.properties, transformed: true, title: vars.title ?? null } };\n}\n'
  );
  write(
    'pages/transformed.yaml',
    `id: transformed
type: Box
blocks:
  _ref:
    path: blocks/shared.yaml
    transformer: transformers/addBlock.js
`
  );
  write(
    'transformers/addBlock.js',
    "export default function transform(block) {\n  return [block, { id: 'added', type: 'Box' }];\n}\n"
  );
  // A page that fails with an unknown block type, and one that warns.
  write(
    'pages/broken.yaml',
    `id: broken
type: Box
blocks:
  - id: typo
    type: Buton
`
  );
  write(
    'pages/warns.yaml',
    `id: warns
type: Box
blocks:
  - id: misspelt
    type: Box
    propertys:
      title: Hello
`
  );
  // A module page.
  write(
    'modules/inviter/module.lowdefy.yaml',
    `name: Inviter

exports:
  components:
    - id: card

vars:
  greeting:
    default:
      _ref: defaults/greeting.yaml
  signature:
    default:
      _ref: defaults/signature.yaml

components:
  - id: card
    component:
      _ref: components/card.yaml

pages:
  - _ref: pages/invite.yaml
  - _ref: pages/welcome.yaml
`
  );
  write(
    'modules/inviter/pages/invite.yaml',
    `id: invite
type: Box
blocks:
  - _ref: blocks/form.yaml
  - id: greeting
    type: Box
    properties:
      title:
        _module.var: greeting
`
  );
  // Module pages that use a var whose default refs a file. The skeleton build
  // resolves module pages with their manifest, so the value is cached in
  // modules.json and the file is a skeleton source.
  write(
    'modules/inviter/pages/welcome.yaml',
    `id: welcome
type: Box
blocks:
  - id: greeting
    type: Box
    properties:
      title:
        _module.var: greeting
`
  );
  write('modules/inviter/defaults/greeting.yaml', 'text: Hello\n');
  // App pages that use a module component with a var whose default refs a
  // file. Page content is not built by the skeleton build, so each page build
  // resolves the var.
  write(
    'modules/inviter/components/card.yaml',
    `id: card
type: Box
properties:
  title:
    _module.var: signature
`
  );
  write('modules/inviter/defaults/signature.yaml', 'text: Regards\n');
  for (const pageId of ['card-one', 'card-two']) {
    write(
      `pages/${pageId}.yaml`,
      `id: ${pageId}
type: Box
blocks:
  - _ref:
      module: inviter
      component: card
`
    );
  }
  write('modules/inviter/blocks/form.yaml', 'id: form\ntype: Box\n');
}

function readArtifact(buildDir, fileName) {
  try {
    return serializer.deserialize(
      JSON.parse(fs.readFileSync(path.join(buildDir, fileName), 'utf8'))
    );
  } catch {
    return null;
  }
}

// Mirror of server-dev getBuildContext: a fresh dev context with the skeleton
// artifacts restored, filled up front by prepareJitContext.
function hydrateContext({ buildDir, configDir }) {
  const context = createContext({
    customTypesMap: snapshotTypesMap,
    directories: {
      build: buildDir,
      config: configDir,
      server: path.resolve(buildDir, '..'),
    },
    logger,
    stage: 'dev',
  });
  Object.assign(context.refMap, readArtifact(buildDir, 'refMap.json') ?? {});
  Object.assign(context.keyMap, readArtifact(buildDir, 'keyMap.json') ?? {});
  const jsMap = readArtifact(buildDir, 'jsMap.json') ?? { client: {}, server: {} };
  context.jsMap.client = jsMap.client ?? {};
  context.jsMap.server = jsMap.server ?? {};
  Object.assign(context.modules, readArtifact(buildDir, 'modules.json') ?? {});
  hydrateDeferredRecords(context, readArtifact(buildDir, 'deferredRecords.json'));
  context.installedPluginPackages = installedPluginPackages;
  context.components = { api: [] };
  context.bundledIcons = new Set(readArtifact(buildDir, 'iconImports.json') ?? []);
  context.dynamicIconData = {};
  makeId.continueFrom(readArtifact(buildDir, 'idCounter.json'));

  // As the dev server's read records do: mark what passes the two channels.
  const readConfigFile = context.readConfigFile;
  context.readConfigFile = (filePath) => fileChannel.run(true, () => readConfigFile(filePath));
  const importAppCode = context.importAppCode;
  context.importAppCode = (filePath) => fileChannel.run(true, () => importAppCode(filePath));
  return prepareJitContext(context);
}

let buildDir;
let configDir;
let pageRegistry;

beforeAll(async () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-page-inputs-')));
  configDir = path.join(root, 'config');
  // Outside the config directory, so the guard sees config reads only: build
  // artifacts are the skeleton's, not page inputs.
  buildDir = path.join(root, 'server', 'build');
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(buildDir, { recursive: true });
  writeFixture(configDir);

  await shallowBuild({
    customTypesMap: snapshotTypesMap,
    directories: {
      config: configDir,
      build: buildDir,
      server: path.join(root, 'server'),
    },
    logger,
    stage: 'dev',
  });
  pageRegistry = readArtifact(buildDir, 'pageRegistry.json');
});

afterEach(() => {
  guardedRoot = null;
  strayReads.length = 0;
  pageBuildContexts.length = 0;
});

function findBlock(block, blockId) {
  if (block.blockId === blockId) return block;
  for (const area of Object.values(block.slots ?? {})) {
    for (const child of area.blocks ?? []) {
      const found = findBlock(child, blockId);
      if (found) return found;
    }
  }
  return null;
}

async function buildPage({ pageId, context }) {
  return buildPageJit({ pageId, pageRegistry, context });
}

const inputPages = [
  'home',
  'templated',
  'nunjucks',
  'resolved',
  'transformed',
  'page-transformed',
  'vars-transformed',
  'resolver-transformed',
  'card-one',
  'card-two',
  'inviter/invite',
  'inviter/welcome',
];

test('the fixture registers every kind of page the guard covers', () => {
  expect(Object.keys(pageRegistry)).toEqual(expect.arrayContaining(inputPages));
  expect(pageRegistry.resolved.resolverOriginal.resolver).toBe('resolvers/page.js');
  expect(pageRegistry.templated.unresolvedVars).toBeDefined();
  expect(pageRegistry['inviter/invite'].moduleEntryId).toBe('inviter');
});

test("a transformer on a page's own _ref runs in its JIT page build", async () => {
  const context = hydrateContext({ buildDir, configDir });

  const pageTransformed = await buildPage({ pageId: 'page-transformed', context });
  expect(pageTransformed.properties).toEqual({ transformed: true, title: null });

  const varsTransformed = await buildPage({ pageId: 'vars-transformed', context });
  expect(varsTransformed.properties).toEqual({ transformed: true, title: 'Vars title' });

  const resolverTransformed = await buildPage({ pageId: 'resolver-transformed', context });
  expect(resolverTransformed.properties).toEqual({ transformed: true, title: 'Resolver title' });

  const untransformed = await buildPage({ pageId: 'templated', context });
  expect(untransformed.properties).toEqual({ title: 'Templated title' });
});

test('a module var default file the skeleton build resolved is a skeleton source', () => {
  const skeletonSourceFiles = readArtifact(buildDir, 'skeletonSourceFiles.json');
  const modules = readArtifact(buildDir, 'modules.json');
  expect(modules.inviter.resolvedVarCache.greeting).toEqual({ text: 'Hello' });
  expect(skeletonSourceFiles).toContain(
    path.join(configDir, 'modules', 'inviter', 'defaults', 'greeting.yaml')
  );
  expect(skeletonSourceFiles).not.toContain(
    path.join(configDir, 'modules', 'inviter', 'pages', 'welcome.yaml')
  );
});

test('every page build that resolves a module var reads the file its default refs', async () => {
  const context = hydrateContext({ buildDir, configDir });
  const signatureFile = path.join(configDir, 'modules', 'inviter', 'defaults', 'signature.yaml');
  const read = [];
  const readConfigFile = context.readConfigFile;
  context.readConfigFile = (filePath) => {
    read.push(path.resolve(configDir, filePath));
    return readConfigFile(filePath);
  };

  const buildCard = async (pageId) => {
    read.length = 0;
    const page = await buildPage({ pageId, context });
    return { reads: [...read], title: findBlock(page, 'card').properties.title };
  };

  for (const build of [
    await buildCard('card-one'),
    await buildCard('card-two'),
    await buildCard('card-one'),
  ]) {
    expect(build.reads).toContain(signatureFile);
    expect(build.title).toEqual({ text: 'Regards' });
  }
});

test('a page build reads config files only through readConfigFile and importAppCode', async () => {
  const context = hydrateContext({ buildDir, configDir });
  guardedRoot = configDir;

  for (const pageId of inputPages) {
    const page = await buildPage({ pageId, context });
    expect(page.pageId).toBe(pageId);
  }

  expect(strayReads).toEqual([]);
});

test('the guard catches a config read that bypasses readConfigFile', async () => {
  guardedRoot = configDir;
  fs.readFileSync(path.join(configDir, 'pages', 'home.yaml'), 'utf8');
  expect(strayReads).toEqual([path.join(configDir, 'pages', 'home.yaml')]);
});

test('pages that run app code load it through importAppCode, YAML-only pages do not', async () => {
  const context = hydrateContext({ buildDir, configDir });
  const loaded = [];
  const importAppCode = context.importAppCode;
  context.importAppCode = (filePath) => {
    loaded.push(filePath);
    return importAppCode(filePath);
  };

  const loadedBy = async (pageId) => {
    loaded.length = 0;
    await buildPage({ pageId, context });
    return [...loaded];
  };

  expect(await loadedBy('home')).toEqual(['blocks/banner.js']);
  expect(await loadedBy('resolved')).toEqual(['resolvers/page.js']);
  expect(await loadedBy('transformed')).toEqual(['transformers/addBlock.js']);
  expect(await loadedBy('page-transformed')).toEqual(['transformers/markPage.js']);
  expect(await loadedBy('vars-transformed')).toEqual(['transformers/markPage.js']);
  expect(await loadedBy('resolver-transformed')).toEqual([
    'resolvers/page.js',
    'transformers/markPage.js',
  ]);
  expect(await loadedBy('templated')).toEqual([]);
  expect(await loadedBy('nunjucks')).toEqual([]);
  expect(await loadedBy('inviter/invite')).toEqual([]);
});

test('a page build leaves no field of its own on its context outside the owned fields', async () => {
  const context = hydrateContext({ buildDir, configDir });

  for (const pageId of [...inputPages, 'warns']) {
    await buildPage({ pageId, context });
  }
  await expect(buildPage({ pageId: 'broken', context })).rejects.toThrow('Buton');
  await buildPage({ pageId: 'home', context });

  expect(pageBuildContexts.length).toBe(inputPages.length + 3);
  const strays = [];
  for (const pageBuildContext of pageBuildContexts) {
    for (const field of Object.keys(pageBuildContext)) {
      if (pageBuildOwnedFields.includes(field)) continue;
      if (pageBuildContext[field] !== context[field]) strays.push(field);
    }
  }
  expect(strays).toEqual([]);
});

test('a page with an unknown block type does not fail a page built after it on the same context', async () => {
  const context = hydrateContext({ buildDir, configDir });

  await expect(buildPage({ pageId: 'broken', context })).rejects.toThrow(
    'Block type "Buton" was used but is not defined.'
  );

  const page = await buildPage({ pageId: 'home', context });
  expect(page.pageId).toBe('home');
});

test('pages built concurrently on one context keep their own errors and warnings', async () => {
  const context = hydrateContext({ buildDir, configDir });

  const [broken, warns, templated] = await Promise.allSettled([
    buildPage({ pageId: 'broken', context }),
    buildPage({ pageId: 'warns', context }),
    buildPage({ pageId: 'templated', context }),
  ]);

  expect(broken.status).toBe('rejected');
  const brokenErrors = (broken.reason.buildErrors ?? [broken.reason])
    .map((error) => error.message)
    .join('\n');
  expect(brokenErrors).toMatch('Buton');
  expect(brokenErrors).not.toMatch('propertys');
  expect(warns.status).toBe('fulfilled');
  expect(warns.value._warnings.map((warning) => warning.message).join('\n')).toMatch('propertys');
  expect(templated.status).toBe('fulfilled');
  expect(templated.value._warnings).toBeUndefined();
});

test('a page built again lists its warnings again', async () => {
  const context = hydrateContext({ buildDir, configDir });

  const first = await buildPage({ pageId: 'warns', context });
  const second = await buildPage({ pageId: 'warns', context });

  const messages = (page) => page._warnings.map((warning) => warning.message);
  expect(messages(first).length).toBeGreaterThan(0);
  expect(messages(second)).toEqual(messages(first));
});

test('the icon sets and the auth projection load once per kept context', async () => {
  const context = hydrateContext({ buildDir, configDir });
  const iconContextPromise = context.iconContextPromise;
  const authConfigProjection = context.authConfigProjection;
  expect(iconContextPromise).toBeDefined();
  expect(authConfigProjection).toBeDefined();
  await iconContextPromise;
  readCounts.clear();

  await buildPage({ pageId: 'home', context });
  await buildPage({ pageId: 'templated', context });

  expect(readCounts.get(path.join(buildDir, 'theme.json'))).toBeUndefined();
  expect(readCounts.get(path.join(buildDir, 'authConfigProjection.json'))).toBeUndefined();
  expect(context.iconContextPromise).toBe(iconContextPromise);
  expect(context.authConfigProjection).toBe(authConfigProjection);
});
