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

// What a change event rebuilds: the dev server keeps its JIT build context and
// built pages across edits, and rebuilds a page only when a file its last build
// read changed, it ran app code, or it was built on an earlier context.

import fs from 'fs';
import os from 'os';
import path from 'path';
import { jest } from '@jest/globals';

import buildPageIfNeeded, {
  getBuildContext,
  getPageJitEnrichment,
  reviewBuiltPage,
  syncBuildSignals,
} from './jitPageBuilder.js';

// A JIT page build loads the build package's plugins on first use.
jest.setTimeout(30000);

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function writeJson(filePath, data) {
  writeFile(filePath, JSON.stringify(data));
}

let lastSignal = 0;

// A config build's output, as far as a JIT page build reads it, and the app's
// config files. pages maps a page id to its registry entry (refPath, and
// unresolvedVars when its vars come from a file).
function createApp({ files, pages }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-page-rebuilds-'));
  const buildDirectory = path.join(root, 'server', 'build');
  const configDirectory = path.join(root, 'config');
  writeJson(path.join(buildDirectory, 'idCounter.json'), { prefix: 'cfg1_', counter: 10 });
  writeJson(path.join(buildDirectory, 'keyMap.json'), {});
  writeJson(path.join(buildDirectory, 'refMap.json'), {});
  writeJson(path.join(buildDirectory, 'installedPluginPackages.json'), [
    '@lowdefy/actions-core',
    '@lowdefy/blocks-antd',
    '@lowdefy/blocks-basic',
    '@lowdefy/operators-js',
  ]);
  writeJson(path.join(buildDirectory, 'theme.json'), {});
  writeFile(path.join(configDirectory, 'package.json'), '{"type":"module"}');
  for (const [file, content] of Object.entries(files)) {
    writeFile(path.join(configDirectory, file), content);
  }
  const registry = {};
  for (const [pageId, entry] of Object.entries(pages)) {
    registry[pageId] = { pageId, auth: { public: true }, refId: `ref-${pageId}`, ...entry };
  }
  writeJson(path.join(buildDirectory, 'pageRegistry.json'), registry);
  const app = { root, buildDirectory, configDirectory };
  app.request = (pageId) =>
    buildPageIfNeeded({ pageId, buildDirectory, configDirectory }).then(
      (result) => (result === true ? 'served' : 'built'),
      (error) => {
        error.outcome = 'failed';
        throw error;
      }
    );
  app.edit = (file, content) => writeFile(path.join(configDirectory, file), content);
  // What the manager writes after a batch of watched changes.
  app.signalChange = () => {
    lastSignal += 1;
    writeFile(path.join(buildDirectory, 'invalidatePages'), String(lastSignal));
  };
  // A config build publish renames a new page registry into place.
  app.publishRegistry = () => {
    const registryPath = path.join(buildDirectory, 'pageRegistry.json');
    const stagedPath = `${registryPath}.staged`;
    fs.copyFileSync(registryPath, stagedPath);
    const { atime, mtime } = fs.statSync(registryPath);
    fs.renameSync(stagedPath, registryPath);
    return { atime, mtime };
  };
  app.context = () => {
    syncBuildSignals({ buildDirectory, configDirectory });
    return getBuildContext(buildDirectory, configDirectory);
  };
  app.remove = () => fs.rmSync(root, { recursive: true, force: true });
  return app;
}

// Runs onWrite once, when the build of pageId writes its page: after the build
// read its files, before it ends.
function duringBuildOf({ app, pageId, onWrite }) {
  const context = app.context();
  const writeBuildArtifact = context.writeBuildArtifact;
  let done = false;
  context.writeBuildArtifact = async (fileName, content) => {
    if (!done && fileName === `pages/${pageId}.json`) {
      done = true;
      await onWrite();
    }
    return writeBuildArtifact(fileName, content);
  };
}

const sharedRefPages = {
  files: {
    'pages/a.yaml': 'id: a\ntype: Box\nblocks:\n  - _ref: blocks/shared.yaml\n',
    'pages/b.yaml': 'id: b\ntype: Box\nblocks:\n  - _ref: blocks/shared.yaml\n',
    'pages/c.yaml': 'id: c\ntype: Box\n',
    'blocks/shared.yaml': 'id: shared\ntype: Box\n',
  },
  pages: {
    a: { refPath: 'pages/a.yaml' },
    b: { refPath: 'pages/b.yaml' },
    c: { refPath: 'pages/c.yaml' },
  },
};

test('editing a page file rebuilds that page and leaves an unrelated built page compiled', async () => {
  const app = createApp(sharedRefPages);
  expect(await app.request('a')).toBe('built');
  expect(await app.request('c')).toBe('built');
  expect(await app.request('a')).toBe('served');

  app.edit('pages/a.yaml', 'id: a\ntype: Box\nproperties:\n  title: Edited\n');
  app.signalChange();

  expect(await app.request('c')).toBe('served');
  expect(await app.request('a')).toBe('built');
  expect(await app.request('a')).toBe('served');
  const page = JSON.parse(fs.readFileSync(path.join(app.buildDirectory, 'pages', 'a.json')));
  expect(page.properties.title).toBe('Edited');
  app.remove();
});

test('editing a shared _ref file rebuilds every page that read it, and only those', async () => {
  const app = createApp(sharedRefPages);
  for (const pageId of ['a', 'b', 'c']) await app.request(pageId);

  app.edit('blocks/shared.yaml', 'id: shared\ntype: Box\nproperties:\n  title: New\n');
  app.signalChange();

  expect(await app.request('a')).toBe('built');
  expect(await app.request('b')).toBe('built');
  expect(await app.request('c')).toBe('served');
  app.remove();
});

test('editing a file that is not read by any built page rebuilds nothing', async () => {
  const app = createApp(sharedRefPages);
  for (const pageId of ['a', 'c']) await app.request(pageId);

  app.edit('pages/b.yaml', 'id: b\ntype: Box\nproperties:\n  title: Unread\n');
  app.signalChange();

  expect(await app.request('a')).toBe('served');
  expect(await app.request('c')).toBe('served');
  app.remove();
});

test('editing a vars file rebuilds the pages whose vars resolved from it', async () => {
  const app = createApp({
    files: {
      'pages/templated.yaml': 'id: templated\ntype: Box\nproperties:\n  title:\n    _var: title\n',
      'pages/other.yaml': 'id: other\ntype: Box\n',
      'vars/title.yaml': 'First\n',
    },
    pages: {
      templated: {
        refPath: 'pages/templated.yaml',
        unresolvedVars: { title: { _ref: 'vars/title.yaml' } },
      },
      other: { refPath: 'pages/other.yaml' },
    },
  });
  await app.request('templated');
  await app.request('other');

  app.edit('vars/title.yaml', 'Second\n');
  app.signalChange();

  expect(await app.request('other')).toBe('served');
  expect(await app.request('templated')).toBe('built');
  const page = JSON.parse(
    fs.readFileSync(path.join(app.buildDirectory, 'pages', 'templated.json'))
  );
  expect(page.properties.title).toBe('Second');
  app.remove();
});

test('editing a nunjucks file rebuilds the pages that referenced it', async () => {
  const app = createApp({
    files: {
      'pages/nunjucks.yaml.njk': 'id: nunjucks\ntype: Box\nproperties:\n  title: {{ heading }}\n',
      'pages/other.yaml': 'id: other\ntype: Box\n',
    },
    pages: {
      nunjucks: { refPath: 'pages/nunjucks.yaml.njk', unresolvedVars: { heading: 'Hello' } },
      other: { refPath: 'pages/other.yaml' },
    },
  });
  await app.request('nunjucks');
  await app.request('other');

  app.edit(
    'pages/nunjucks.yaml.njk',
    'id: nunjucks\ntype: Box\nproperties:\n  title: Hi {{ heading }}\n'
  );
  app.signalChange();

  expect(await app.request('other')).toBe('served');
  expect(await app.request('nunjucks')).toBe('built');
  app.remove();
});

test('a page that ran app code rebuilds after any edit, even to a file only its app code reads', async () => {
  const app = createApp({
    files: {
      'pages/coded.yaml': 'id: coded\ntype: Box\nblocks:\n  - _ref: blocks/banner.js\n',
      'pages/plain.yaml': 'id: plain\ntype: Box\n',
      'blocks/banner.js':
        "import fs from 'fs';\n" +
        "const title = fs.readFileSync(new URL('./title.txt', import.meta.url), 'utf8');\n" +
        "export default { id: 'banner', type: 'Box', properties: { title } };\n",
      'blocks/title.txt': 'First',
    },
    pages: {
      coded: { refPath: 'pages/coded.yaml' },
      plain: { refPath: 'pages/plain.yaml' },
    },
  });
  await app.request('coded');
  await app.request('plain');

  app.edit('blocks/title.txt', 'Second');
  app.signalChange();

  expect(await app.request('plain')).toBe('served');
  expect(await app.request('coded')).toBe('built');
  expect(await app.request('coded')).toBe('served');
  app.remove();
});

test('an edit during a running build rebuilds the page on its next request, also one that waited on its lock', async () => {
  const app = createApp(sharedRefPages);
  let waiter;
  duringBuildOf({
    app,
    pageId: 'a',
    onWrite: () => {
      app.edit('blocks/shared.yaml', 'id: shared\ntype: Box\nproperties:\n  title: Late\n');
      app.signalChange();
      waiter = app.request('a');
    },
  });

  expect(await app.request('a')).toBe('built');
  expect(await waiter).toBe('built');
  expect(await app.request('a')).toBe('served');
  app.remove();
});

test('a check that a rebuild overtook does not mark the rebuilt page current', async () => {
  const app = createApp(sharedRefPages);
  const original = 'id: shared\ntype: Box\nproperties:\n  title: Original\n';
  app.edit('blocks/shared.yaml', original);
  app.signalChange();
  await app.request('a');
  app.edit('blocks/shared.yaml', 'id: shared\ntype: Box\nproperties:\n  title: Interim\n');
  app.signalChange();

  // While the rebuild of the interim content runs, the file goes back to what
  // the previous build read, and a build status review checks that build's
  // record. The rebuild ends before the check's reads do.
  let releaseReads;
  const readsHeld = new Promise((resolve) => {
    releaseReads = resolve;
  });
  let review;
  duringBuildOf({
    app,
    pageId: 'a',
    onWrite: () => {
      app.edit('blocks/shared.yaml', original);
      app.signalChange();
      const signals = syncBuildSignals({
        buildDirectory: app.buildDirectory,
        configDirectory: app.configDirectory,
      });
      const context = getBuildContext(app.buildDirectory, app.configDirectory);
      const readConfigFile = context.readConfigFile;
      context.readConfigFile = async (filePath) => {
        await readsHeld;
        return readConfigFile(filePath);
      };
      review = reviewBuiltPage({ pageId: 'a', ...signals });
      context.readConfigFile = readConfigFile;
    },
  });

  expect(await app.request('a')).toBe('built');
  releaseReads();
  expect(await review).toBe('edited');
  expect(await app.request('a')).toBe('built');
  const page = fs.readFileSync(path.join(app.buildDirectory, 'pages', 'a.json'), 'utf8');
  expect(page).toContain('"title":"Original"');
  app.remove();
});

test('an edit during a running build that the build already read is still caught', async () => {
  const app = createApp(sharedRefPages);
  // The build reads through the read cache, which still holds what was on disk
  // before the edit: the edit's change event arrives after the build read it.
  await app.context().readConfigFile('blocks/shared.yaml');
  app.edit('blocks/shared.yaml', 'id: shared\ntype: Box\nproperties:\n  title: Late\n');

  expect(await app.request('a')).toBe('built');
  app.signalChange();

  expect(await app.request('a')).toBe('built');
  const page = fs.readFileSync(path.join(app.buildDirectory, 'pages', 'a.json'), 'utf8');
  expect(page).toContain('"title":"Late"');
  app.remove();
});

test('a registry publish during a running build rebuilds the page on the new context, with its _js', async () => {
  const app = createApp({
    files: {
      'pages/js.yaml': 'id: js\ntype: Box\nproperties:\n  title:\n    _js: return "from js";\n',
    },
    pages: { js: { refPath: 'pages/js.yaml' } },
  });
  const firstContext = app.context();
  duringBuildOf({ app, pageId: 'js', onWrite: () => app.publishRegistry() });

  expect(await app.request('js')).toBe('built');
  expect(await app.request('js')).toBe('built');
  const secondContext = getBuildContext(app.buildDirectory, app.configDirectory);
  expect(secondContext).not.toBe(firstContext);
  expect(await app.request('js')).toBe('served');

  const pageConfig = JSON.parse(fs.readFileSync(path.join(app.buildDirectory, 'pages', 'js.json')));
  const { jsEntries } = getPageJitEnrichment({ pageConfig });
  expect(jsEntries).toContain('from js');
  app.remove();
});

test('two change signals written in one millisecond are both seen', async () => {
  const app = createApp(sharedRefPages);
  const signalPath = path.join(app.buildDirectory, 'invalidatePages');
  await app.request('a');
  app.signalChange();
  const time = new Date(1_700_000_000_000);
  fs.utimesSync(signalPath, time, time);
  expect(await app.request('a')).toBe('served');

  app.edit('pages/a.yaml', 'id: a\ntype: Box\nproperties:\n  title: Again\n');
  app.signalChange();
  fs.utimesSync(signalPath, time, time);

  expect(await app.request('a')).toBe('built');
  app.remove();
});

test('two registry publishes with the same modified time both recreate the context', async () => {
  const app = createApp(sharedRefPages);
  const registryPath = path.join(app.buildDirectory, 'pageRegistry.json');
  await app.request('a');
  const { atime, mtime } = app.publishRegistry();
  fs.utimesSync(registryPath, atime, mtime);
  expect(await app.request('a')).toBe('built');
  expect(await app.request('a')).toBe('served');

  app.publishRegistry();
  fs.utimesSync(registryPath, atime, mtime);

  expect(await app.request('a')).toBe('built');
  app.remove();
});

test('a recorded file whose read throws during the check rebuilds the page, and the build reports it', async () => {
  const app = createApp(sharedRefPages);
  await app.request('a');
  await app.request('c');
  const sharedPath = path.join(app.configDirectory, 'blocks', 'shared.yaml');
  fs.chmodSync(sharedPath, 0o000);
  app.signalChange();

  try {
    expect(await app.request('c')).toBe('served');
    const error = await app.request('a').catch((caught) => caught);
    expect(error.outcome).toBe('failed');
    expect(error.message).toMatch('EACCES');
  } finally {
    fs.chmodSync(sharedPath, 0o644);
  }
  app.signalChange();
  expect(await app.request('a')).toBe('built');
  app.remove();
});

test('warnings are logged to the terminal again after an edit', async () => {
  const app = createApp({
    files: {
      'pages/warns.yaml':
        'id: warns\ntype: Box\nblocks:\n  - id: misspelt\n    type: Box\n    propertys:\n      title: Hello\n',
    },
    pages: { warns: { refPath: 'pages/warns.yaml' } },
  });
  const context = app.context();
  const warn = jest.spyOn(context.logger, 'warn').mockImplementation(() => {});
  const loggedWarnings = () =>
    warn.mock.calls.filter(([warning]) => warning?.message?.includes('propertys')).length;

  await app.request('warns');
  expect(loggedWarnings()).toBe(1);

  app.edit(
    'pages/warns.yaml',
    `${fs.readFileSync(path.join(app.configDirectory, 'pages/warns.yaml'))}# edited\n`
  );
  app.signalChange();
  await app.request('warns');

  expect(loggedWarnings()).toBe(2);
  warn.mockRestore();
  app.remove();
});

test('a page with an unknown block type does not fail another page, and fixing it fixes the page on the kept context', async () => {
  const app = createApp({
    files: {
      'pages/broken.yaml': 'id: broken\ntype: Box\nblocks:\n  - id: typo\n    type: Buton\n',
      'pages/fine.yaml': 'id: fine\ntype: Box\n',
    },
    pages: {
      broken: { refPath: 'pages/broken.yaml' },
      fine: { refPath: 'pages/fine.yaml' },
    },
  });
  const context = app.context();

  await expect(app.request('broken')).rejects.toThrow('Buton');
  expect(await app.request('fine')).toBe('built');

  app.edit('pages/broken.yaml', 'id: broken\ntype: Box\nblocks:\n  - id: typo\n    type: Button\n');
  app.signalChange();

  expect(await app.request('broken')).toBe('built');
  expect(await app.request('fine')).toBe('served');
  expect(app.context()).toBe(context);
  app.remove();
});
