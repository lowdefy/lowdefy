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

import fs from 'fs';
import os from 'os';
import path from 'path';

import { serializer } from '@lowdefy/helpers';

// A server directory whose build lists an installed plugin, a local plugin
// linked from outside node_modules, one of Lowdefy's own plugins and a local
// module. resolvePluginDir reads process.cwd() at import, so the directory is
// made and entered before the docs modules are imported.
const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-docs-index-test-'));
const serverDir = path.join(rootDir, 'server');
const localPluginDir = path.join(rootDir, 'plugins', 'local-tools');
const moduleRoot = path.join(rootDir, 'modules', 'contacts');

function write(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, typeof data === 'string' ? data : JSON.stringify(data));
}

function writeBuild(name, data) {
  const filePath = path.join(serverDir, 'build', name);
  write(filePath, data);
  // A rewrite inside the same millisecond would keep the old mtime.
  const later = new Date(Date.now() + Math.floor(Math.random() * 100000));
  fs.utimesSync(filePath, later, later);
}

function moduleEntry(overrides = {}) {
  return {
    id: 'contacts',
    source: 'file:../modules/contacts',
    moduleRoot,
    packageRoot: moduleRoot,
    isLocal: true,
    consumerVars: { owner_field: 'created_by' },
    resolvedVarCache: {},
    varDefs: {
      collection: { type: 'string', description: 'Collection of contacts.', default: 'contacts' },
      labels: {
        description: 'Display labels.',
        properties: {
          title: { type: 'string', description: 'List title.', default: 'Contacts' },
        },
      },
      owner_field: { type: 'string', required: true, description: 'Field with the owner id.' },
      sort: { description: 'Sort order.', default: { '_build.env': 'SORT' } },
      template: {
        description: 'Card template.',
        default: { '~deferred': 'contacts:vars.template' },
      },
    },
    manifest: {
      name: 'Contacts',
      description: 'A contact list.',
      exports: {
        pages: [{ id: 'contact-list', description: 'All contacts.' }],
        components: [{ id: 'contact-card', description: 'One contact as a card.' }],
      },
      components: [{ id: 'contact-card', component: { '~deferred': 'contacts:c.0' } }],
      pages: [{ id: 'contacts/contact-list', type: 'Box' }],
    },
    ...overrides,
  };
}

write(path.join(serverDir, 'package.json'), { name: 'server', version: '1.0.0' });
writeBuild('plugins/availableTypes.json', {
  actions: {},
  blocks: {
    Button: { package: '@lowdefy/blocks-antd', version: '5.0.0' },
    ButtonPlus: { package: 'fancy-blocks', version: '2.1.0' },
    FancyCard: { package: 'fancy-blocks', version: '2.1.0' },
    PlainCard: { package: 'fancy-blocks', version: '2.1.0' },
    SetState: { package: 'fancy-blocks', version: '2.1.0' },
  },
  operators: {
    client: { _shout: { package: 'local-tools', version: 'workspace:*' } },
    server: { _shout: { package: 'local-tools', version: 'workspace:*' } },
  },
});
writeBuild('customTypesMap.json', {
  operators: { client: { _shout: { package: 'local-tools', version: 'workspace:*' } } },
});
writeBuild('installedPluginPackages.json', ['@lowdefy/blocks-antd', 'fancy-blocks', 'local-tools']);
writeBuild('modules.json', serializer.serialize({ contacts: moduleEntry() }));

write(path.join(serverDir, 'node_modules/@lowdefy/blocks-antd/package.json'), {
  name: '@lowdefy/blocks-antd',
  version: '5.0.0',
});
write(path.join(serverDir, 'node_modules/@lowdefy/blocks-antd/README.md'), '# Antd blocks\n');
write(path.join(serverDir, 'node_modules/fancy-blocks/package.json'), {
  name: 'fancy-blocks',
  version: '2.1.0',
});
write(path.join(serverDir, 'node_modules/fancy-blocks/README.md'), '# Fancy blocks\n\nCards.\n');
write(
  path.join(serverDir, 'node_modules/fancy-blocks/dist/docs/FancyCard.md'),
  '# FancyCard block\n\nA card with a gradient border.\n'
);
write(path.join(localPluginDir, 'package.json'), { name: 'local-tools', version: '0.3.1' });
write(path.join(localPluginDir, 'README.md'), '# Local tools\n\nShouting operators.\n');
write(path.join(localPluginDir, 'docs/_shout.md'), '# The _shout operator\n\nUppercases text.\n');
// Links out of the package, a link to nowhere and a directory named like a
// doc are never indexed.
write(path.join(rootDir, 'outside.md'), '# Outside\n\nNot part of the plugin.\n');
fs.symlinkSync(path.join(rootDir, 'outside.md'), path.join(localPluginDir, 'docs/leak.md'));
fs.symlinkSync(path.join(rootDir, 'missing.md'), path.join(localPluginDir, 'docs/broken.md'));
fs.mkdirSync(path.join(localPluginDir, 'docs/folder.md'));
fs.symlinkSync(localPluginDir, path.join(serverDir, 'node_modules/local-tools'));
write(path.join(moduleRoot, 'README.md'), '# Contacts module\n\nA list of people you work with.\n');
write(path.join(moduleRoot, 'docs/setup.md'), '# Setting up contacts\n\nCreate the collection.\n');

process.chdir(serverDir);

const { default: getDocsIndex } = await import('./getDocsIndex.js');
const { default: getDoc } = await import('./getDoc.js');
const { default: listPlugins } = await import('./listPlugins.js');
const { default: listTypes } = await import('./listTypes.js');
const { default: searchDocs } = await import('./searchDocs.js');

function appEntries() {
  return getDocsIndex()
    .entries.filter((entry) => entry.source !== 'core')
    .map(({ slug, source, package: packageName, version, title }) => ({
      slug,
      source,
      package: packageName,
      version,
      title,
    }));
}

afterAll(() => {
  process.chdir(os.tmpdir());
  fs.rmSync(rootDir, { recursive: true, force: true });
});

test('docs index lists plugin and module docs, leaving out Lowdefy plugins', () => {
  expect(appEntries()).toEqual([
    {
      slug: 'plugins/fancy-blocks',
      source: 'plugin',
      package: 'fancy-blocks',
      version: '2.1.0',
      title: 'fancy-blocks',
    },
    {
      slug: 'plugins/fancy-blocks/FancyCard',
      source: 'plugin',
      package: 'fancy-blocks',
      version: '2.1.0',
      title: 'FancyCard block',
    },
    {
      slug: 'plugins/local-tools',
      source: 'local-plugin',
      package: 'local-tools',
      version: '0.3.1',
      title: 'local-tools',
    },
    {
      slug: 'plugins/local-tools/_shout',
      source: 'local-plugin',
      package: 'local-tools',
      version: '0.3.1',
      title: 'The _shout operator',
    },
    {
      slug: 'modules/contacts',
      source: 'module',
      package: 'file:../modules/contacts',
      version: 'local',
      title: 'Contacts module',
    },
    {
      slug: 'modules/contacts/setup',
      source: 'module',
      package: 'file:../modules/contacts',
      version: 'local',
      title: 'Setting up contacts',
    },
    {
      slug: 'modules/contacts/manifest',
      source: 'module',
      package: 'file:../modules/contacts',
      version: 'local',
      title: 'contacts module: components, exports and vars',
    },
  ]);
});

test('a plugin type points at its own doc, else at the package README', () => {
  expect(getDoc({ kind: 'block', type: 'FancyCard' }).slug).toEqual(
    'plugins/fancy-blocks/FancyCard'
  );
  expect(getDoc({ kind: 'block', type: 'PlainCard' }).slug).toEqual('plugins/fancy-blocks');
  expect(getDoc({ type: '_shout' }).slug).toEqual('plugins/local-tools/_shout');
});

test('a plugin type named like a core type gets its plugin doc, not the core prefix match', () => {
  expect(getDoc({ kind: 'block', type: 'ButtonPlus' }).slug).toEqual('plugins/fancy-blocks');
});

test('a plugin type named like a core type of another kind leaves the core page to the core type', () => {
  expect(getDoc({ type: 'SetState' }).slug).toEqual('actions/setstate');
  expect(getDoc({ kind: 'action', type: 'SetState' }).slug).toEqual('actions/setstate');
  expect(getDoc({ kind: 'block', type: 'SetState' }).slug).toEqual('plugins/fancy-blocks');
});

test('docs that link outside the package, link nowhere or are directories are left out', () => {
  const slugs = getDocsIndex().entries.map((entry) => entry.slug);
  expect(slugs).toContain('plugins/local-tools/_shout');
  expect(slugs).not.toContain('plugins/local-tools/leak');
  expect(slugs).not.toContain('plugins/local-tools/broken');
  expect(slugs).not.toContain('plugins/local-tools/folder');
  expect(getDoc({ slug: 'plugins/local-tools/leak' })).toBeNull();
});

test('getDoc returns plugin and module docs by slug with their source', () => {
  const readme = getDoc({ slug: 'modules/contacts' });
  expect(readme).toEqual(
    expect.objectContaining({
      slug: 'modules/contacts',
      source: 'module',
      package: 'file:../modules/contacts',
      version: 'local',
    })
  );
  expect(readme.markdown).toContain('A list of people you work with.');
  expect(getDoc({ slug: 'plugins/local-tools' }).markdown).toContain('Shouting operators.');
  expect(getDoc({ slug: 'plugins/@lowdefy/blocks-antd' })).toBeNull();
});

test('getDoc still returns core docs first', () => {
  expect(getDoc({ slug: 'actions/setstate' }).slug).toEqual('actions/setstate');
  expect(getDoc({ kind: 'action', type: 'SetState' }).slug).toEqual('actions/setstate');
});

test('module manifest page lists vars, components and exports', () => {
  const { markdown } = getDoc({ slug: 'modules/contacts/manifest' });
  expect(markdown).toContain('A contact list.');
  expect(markdown).toContain(
    '- `collection` (string, default `"contacts"`): Collection of contacts.'
  );
  expect(markdown).toContain('  - `labels.title` (string, default `"Contacts"`): List title.');
  expect(markdown).toContain('- `owner_field` (string, required): Field with the owner id.');
  expect(markdown).toContain('- `sort` (default computed): Sort order.');
  expect(markdown).toContain('- `template` (default computed): Card template.');
  expect(markdown).toContain('- `contact-card`: One contact as a card.');
  expect(markdown).toContain('- `contact-list`: All contacts.');
});

test('searchDocs finds module and local plugin docs by source', () => {
  expect(searchDocs({ query: 'owner_field', source: 'module' }).map((hit) => hit.slug)).toEqual([
    'modules/contacts/manifest',
  ]);
  const [hit] = searchDocs({ query: 'shouting operators', source: 'local-plugin' });
  expect(hit).toEqual(
    expect.objectContaining({
      slug: 'plugins/local-tools',
      source: 'local-plugin',
      package: 'local-tools',
      version: '0.3.1',
    })
  );
});

test('listTypes and listPlugins name plugin doc slugs', () => {
  const fancy = listTypes({ kind: 'blocks' }).find((item) => item.type === 'FancyCard');
  expect(fancy.docSlug).toEqual('plugins/fancy-blocks/FancyCard');
  const plugins = listPlugins();
  expect(plugins.find((plugin) => plugin.package === 'local-tools').docSlug).toEqual(
    'plugins/local-tools'
  );
  expect(plugins.find((plugin) => plugin.package === '@lowdefy/blocks-antd').docSlug).toBe(
    undefined
  );
});

test('a config-only edit leaves the docs index alone', () => {
  const before = getDocsIndex();
  writeBuild(
    'modules.json',
    serializer.serialize({
      contacts: moduleEntry({
        consumerVars: { owner_field: 'owner' },
        resolvedVarCache: { 'labels.title': 'People' },
      }),
    })
  );
  writeBuild('pages/home.json', { id: 'home', type: 'Box' });
  expect(getDocsIndex()).toBe(before);
});

test('a module change rebuilds the docs index', () => {
  const before = getDocsIndex();
  const changed = moduleEntry();
  changed.varDefs.collection.description = 'Where contacts are stored.';
  writeBuild('modules.json', serializer.serialize({ contacts: changed }));
  const after = getDocsIndex();
  expect(after).not.toBe(before);
  expect(getDoc({ slug: 'modules/contacts/manifest' }).markdown).toContain(
    'Where contacts are stored.'
  );
});

test('a plugin change rebuilds the docs index', () => {
  const before = getDocsIndex();
  writeBuild('installedPluginPackages.json', [
    '@lowdefy/blocks-antd',
    'fancy-blocks',
    'local-tools',
    'x',
  ]);
  expect(getDocsIndex()).not.toBe(before);
});

test('a doc file added to a local plugin or module rebuilds the docs index', () => {
  const before = getDocsIndex();
  write(path.join(localPluginDir, 'docs/whisper.md'), '# Whispering\n\nLowercases text.\n');
  const afterPlugin = getDocsIndex();
  expect(afterPlugin).not.toBe(before);
  expect(afterPlugin.entries.map((entry) => entry.slug)).toContain('plugins/local-tools/whisper');
  write(path.join(moduleRoot, 'docs/import.md'), '# Importing contacts\n');
  expect(getDocsIndex().entries.map((entry) => entry.slug)).toContain('modules/contacts/import');
});

test('a malformed module manifest names the bad parts on its page and breaks no docs call', () => {
  const broken = moduleEntry({
    id: 'broken',
    varDefs: { good: { type: 'string' }, bad: null, nested: { properties: { inner: 'x' } } },
    manifest: {
      components: { card: {} },
      exports: { pages: ['home', null, { id: 'list' }], api: 'all' },
    },
  });
  writeBuild('modules.json', serializer.serialize({ contacts: moduleEntry(), broken }));
  const { markdown } = getDoc({ slug: 'modules/broken/manifest' });
  expect(markdown).toContain('- `good` (string)');
  expect(markdown).toContain(
    '- `bad`: not valid in module.lowdefy.yaml, expected an object. Received null.'
  );
  expect(markdown).toContain(
    '  - `nested.inner`: not valid in module.lowdefy.yaml, expected an object. Received "x".'
  );
  expect(markdown).toContain(
    '- `components`: not valid in module.lowdefy.yaml, expected a list. Received {"card":{}}.'
  );
  expect(markdown).toContain(
    '- `exports.pages.0`: not valid in module.lowdefy.yaml, expected an object with a string id. Received "home".'
  );
  expect(markdown).toContain('- `list`');
  expect(markdown).toContain(
    '- `exports.api`: not valid in module.lowdefy.yaml, expected a list. Received "all".'
  );
  expect(searchDocs({ query: 'not valid', source: 'module' }).map((hit) => hit.slug)).toEqual([
    'modules/broken/manifest',
  ]);
});
