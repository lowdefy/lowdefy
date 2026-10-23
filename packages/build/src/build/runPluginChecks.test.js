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

import { vi, afterAll, beforeAll, expect, test } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

import createContext from '../createContext.js';
import runPluginChecks from './runPluginChecks.js';

let tempDirectory;
let packageIndex = 0;

beforeAll(() => {
  tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-run-plugin-checks-'));
});

afterAll(() => {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
});

// A server directory holding fixture plugins. Each package name is unique, so
// the ESM module cache never hands one test another test's ./checks.
function createServer() {
  const serverDir = fs.mkdtempSync(path.join(tempDirectory, 'server-'));
  fs.writeFileSync(path.join(serverDir, 'package.json'), '{ "name": "server" }\n');
  return serverDir;
}

function addPlugin(serverDir, { checks } = {}) {
  packageIndex += 1;
  const name = `@lowdefy-test/plugin-${packageIndex}`;
  const pkgDir = path.join(serverDir, 'node_modules', name);
  fs.mkdirSync(pkgDir, { recursive: true });
  const exports = { './types': './types.js' };
  fs.writeFileSync(path.join(pkgDir, 'types.js'), 'export default {};\n');
  if (checks) {
    exports['./checks'] = './checks.js';
    fs.writeFileSync(path.join(pkgDir, 'checks.js'), checks);
  }
  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({ name, type: 'module', exports })
  );
  return name;
}

function createTestContext({ serverDir, typesMap, skipPluginChecks, pluginInstallFollows }) {
  const logger = { warn: vi.fn(), error: vi.fn(), info: vi.fn(), log: vi.fn() };
  return createContext({
    customTypesMap: typesMap,
    directories: {
      build: path.join(serverDir, 'build'),
      config: path.join(serverDir, 'config'),
      server: serverDir,
    },
    logger,
    pluginInstallFollows,
    skipPluginChecks,
    stage: 'dev',
  });
}

// A node as the build leaves it: keyed, with a keyMap entry whose
// ~ignoreBuildChecks (if any) the suppression walk reads.
function keyed(context, key, node, { ignore, parent } = {}) {
  node['~k'] = key;
  context.keyMap[key] = { key, '~k_parent': parent };
  if (ignore !== undefined) {
    context.keyMap[key]['~ignoreBuildChecks'] = ignore;
  }
  return node;
}

const ifTestChecks = `
export default {
  operators: {
    _if: [
      {
        id: 'if-test',
        level: 'error',
        description: '_if needs test.',
        check: ({ params, kind, type }) =>
          params && typeof params === 'object' && !('test' in params)
            ? kind + ' ' + type + ' has no test key.'
            : null,
      },
    ],
  },
};
`;

function messages(list) {
  return list.map((exception) => exception.message);
}

test('runPluginChecks runs an operator rule on client and server operator nodes', async () => {
  const serverDir = createServer();
  const pkg = addPlugin(serverDir, { checks: ifTestChecks });
  const context = createTestContext({
    serverDir,
    typesMap: {
      operators: { client: { _if: { package: pkg } }, server: { _if: { package: pkg } } },
    },
  });
  const clientNode = keyed(context, 'c1', { _if: { then: 1 } });
  const serverNode = keyed(context, 's1', { _if: { then: 1 } });
  const validNode = keyed(context, 'c2', { _if: { test: true, then: 1 } });
  context.typeCounters.operators.client.increment('_if', 'c1', clientNode);
  context.typeCounters.operators.client.increment('_if', 'c2', validNode);
  context.typeCounters.operators.server.increment('_if', 's1', serverNode);

  const { pending } = await runPluginChecks({ context });

  expect(messages(context.errors)).toEqual([
    'operators _if has no test key.',
    'operators _if has no test key.',
  ]);
  expect(context.errors.map((error) => error.configKey).sort()).toEqual(['c1', 's1']);
  expect(context.errors[0].name).toBe('ConfigError');
  expect(context.errors[0].checkSlug).toBe('if-test');
  expect(context.errors[0].checkGroup).toBe('plugin-checks');
  expect(pending).toEqual([]);
});

test('runPluginChecks runs block, action, request and connection rules on their nodes', async () => {
  const serverDir = createServer();
  const pkg = addPlugin(serverDir, {
    checks: `
const rule = (id) => [{ id, level: 'error', description: id, check: ({ node, kind, type, params }) =>
  kind + ':' + type + ':' + (node.id ?? node.blockId) + ':' + String(params) }];
export default {
  blocks: { Box: rule('box-rule') },
  actions: { SetState: rule('set-state-rule') },
  requests: { Find: rule('find-rule') },
  connections: { Db: rule('db-rule') },
};
`,
  });
  const context = createTestContext({
    serverDir,
    typesMap: {
      blocks: { Box: { package: pkg } },
      actions: { SetState: { package: pkg } },
      requests: { Find: { package: pkg } },
      connections: { Db: { package: pkg } },
    },
  });
  context.typeCounters.blocks.increment('Box', 'b', keyed(context, 'b', { blockId: 'box' }));
  context.typeCounters.actions.increment('SetState', 'a', keyed(context, 'a', { id: 'set' }));
  context.typeCounters.requests.increment('Find', 'r', keyed(context, 'r', { id: 'find' }));
  context.typeCounters.connections.increment('Db', 'n', keyed(context, 'n', { id: 'db' }));

  await runPluginChecks({ context });

  expect(messages(context.errors)).toEqual([
    'blocks:Box:box:undefined',
    'actions:SetState:set:undefined',
    'requests:Find:find:undefined',
    'connections:Db:db:undefined',
  ]);
  expect(context.errors.map((error) => error.checkSlug)).toEqual([
    'box-rule',
    'set-state-rule',
    'find-rule',
    'db-rule',
  ]);
});

test('runPluginChecks reports a warning rule as a ConfigWarning and a list of messages each', async () => {
  const serverDir = createServer();
  const pkg = addPlugin(serverDir, {
    checks: `
export default {
  blocks: {
    Box: [
      { id: 'box-warn', level: 'warning', description: '', check: () => 'Box looks odd.' },
      { id: 'box-many', level: 'error', description: '', check: () => ['First.', 'Second.'] },
    ],
  },
};
`,
  });
  const context = createTestContext({ serverDir, typesMap: { blocks: { Box: { package: pkg } } } });
  context.typeCounters.blocks.increment('Box', 'b', keyed(context, 'b', { blockId: 'box' }));

  await runPluginChecks({ context });

  expect(messages(context.errors)).toEqual(['First.', 'Second.']);
  const warning = context.warnings.find((item) => item.message === 'Box looks odd.');
  expect(warning.name).toBe('ConfigWarning');
  expect(warning.checkSlug).toBe('box-warn');
  expect(warning.checkGroup).toBe('plugin-checks');
  expect(warning.configKey).toBe('b');
});

test('runPluginChecks reports a throwing rule and a bad return value at the node, and checks the other nodes', async () => {
  const serverDir = createServer();
  const pkg = addPlugin(serverDir, {
    checks: `
export default {
  blocks: {
    Box: [
      { id: 'box-throws', level: 'warning', description: '', check: ({ node }) => {
        if (node.blockId === 'one') throw new Error('boom');
        return null;
      } },
      { id: 'box-bad', level: 'error', description: '', check: () => 42 },
    ],
  },
};
`,
  });
  const context = createTestContext({ serverDir, typesMap: { blocks: { Box: { package: pkg } } } });
  context.typeCounters.blocks.increment('Box', 'b1', keyed(context, 'b1', { blockId: 'one' }));
  context.typeCounters.blocks.increment('Box', 'b2', keyed(context, 'b2', { blockId: 'two' }));

  await runPluginChecks({ context });

  const badReturn = `Plugin check box-bad (${pkg}) failed: check returned 42; expected null, a message or a list of messages.`;
  expect(messages(context.errors)).toEqual([badReturn, badReturn]);
  expect(context.errors.map((error) => error.configKey)).toEqual(['b1', 'b2']);
  const thrown = context.warnings.filter((item) => item.checkSlug === 'box-throws');
  expect(thrown.map((item) => item.message)).toEqual([
    `Plugin check box-throws (${pkg}) failed: boom`,
  ]);
  expect(thrown[0].configKey).toBe('b1');
});

test('runPluginChecks runs a package rule only on the nodes the types map gives that package', async () => {
  const serverDir = createServer();
  const jsPkg = addPlugin(serverDir, { checks: ifTestChecks });
  const customPkg = addPlugin(serverDir, {
    checks: `
export default {
  operators: {
    _if: [{ id: 'custom-if', level: 'error', description: '', check: ({ kind }) => 'custom ' + kind }],
  },
};
`,
  });
  const context = createTestContext({
    serverDir,
    typesMap: {
      operators: { client: { _if: { package: jsPkg } }, server: { _if: { package: customPkg } } },
    },
  });
  context.typeCounters.operators.client.increment('_if', 'c', keyed(context, 'c', { _if: {} }));
  context.typeCounters.operators.server.increment('_if', 's', keyed(context, 's', { _if: {} }));

  await runPluginChecks({ context });

  expect(context.errors.map((error) => [error.configKey, error.checkSlug])).toEqual([
    ['c', 'if-test'],
    ['s', 'custom-if'],
  ]);
});

test('runPluginChecks looks rules up by the original type name of a prefixed type', async () => {
  const serverDir = createServer();
  const pkg = addPlugin(serverDir, { checks: ifTestChecks });
  const context = createTestContext({
    serverDir,
    typesMap: { operators: { client: { _my_if: { package: pkg, originalTypeName: '_if' } } } },
  });
  context.typeCounters.operators.client.increment(
    '_my_if',
    'c',
    keyed(context, 'c', { _my_if: {} })
  );

  await runPluginChecks({ context });

  expect(messages(context.errors)).toEqual(['operators _my_if has no test key.']);
});

test.each([
  ['the rule id', ['if-test']],
  ['plugin-checks', ['plugin-checks']],
  ['true', true],
])(
  'runPluginChecks rules are silenced by ~ignoreBuildChecks %s on an ancestor',
  async (_, ignore) => {
    const serverDir = createServer();
    const pkg = addPlugin(serverDir, { checks: ifTestChecks });
    const context = createTestContext({
      serverDir,
      typesMap: { operators: { client: { _if: { package: pkg } } } },
    });
    keyed(context, 'parent', {}, { ignore });
    if (Array.isArray(ignore)) {
      ignore
        .filter((slug) => slug !== 'plugin-checks')
        .forEach((slug) => context.pluginCheckSlugRefs.set(slug, ['parent']));
    }
    const node = keyed(context, 'c', { _if: {} }, { parent: 'parent' });
    context.typeCounters.operators.client.increment('_if', 'c', node);

    await runPluginChecks({ context });

    expect(context.errors).toEqual([]);
  }
);

test('runPluginChecks fails each node listing a slug no loaded rule has', async () => {
  const serverDir = createServer();
  const pkg = addPlugin(serverDir, { checks: ifTestChecks });
  const context = createTestContext({
    serverDir,
    typesMap: { operators: { client: { _if: { package: pkg } } } },
  });
  context.pluginCheckSlugRefs.set('if-tset', ['k1', 'k2']);
  context.pluginCheckSlugRefs.set('if-test', ['k3']);
  context.typeCounters.operators.client.increment(
    '_if',
    'c',
    keyed(context, 'c', { _if: { test: true } })
  );

  await runPluginChecks({ context });

  const unknown =
    '~ignoreBuildChecks slug "if-tset" is not a built-in check or a rule of any plugin the app uses.';
  expect(context.errors.map((error) => [error.configKey, error.message])).toEqual([
    ['k1', unknown],
    ['k2', unknown],
  ]);
});

test('runPluginChecks returns a used package that is not installed as pending, and warns on a slug it cannot check', async () => {
  const serverDir = createServer();
  const context = createTestContext({
    serverDir,
    typesMap: { blocks: { Box: { package: '@lowdefy-test/not-installed' } } },
  });
  context.pluginCheckSlugRefs.set('some-rule', ['k1']);
  context.typeCounters.blocks.increment('Box', 'b', keyed(context, 'b', { blockId: 'box' }));

  const { pending } = await runPluginChecks({ context });

  expect(context.errors).toEqual([]);
  expect(pending).toEqual([{ name: '@lowdefy-test/not-installed', schemaChecked: true }]);
  expect(messages(context.warnings)).toEqual([
    '~ignoreBuildChecks slug "some-rule" is not a built-in check or a rule of any loaded plugin. It may be a rule of a plugin whose rules did not load: @lowdefy-test/not-installed.',
    'Plugin checks for @lowdefy-test/not-installed did not run: package not installed.',
  ]);
});

test('runPluginChecks returns a pending connection-only package without warning', async () => {
  const serverDir = createServer();
  const context = createTestContext({
    serverDir,
    typesMap: {
      connections: { TestConnection: { package: '@lowdefy-test/connection-not-installed' } },
      requests: { TestRequest: { package: '@lowdefy-test/connection-not-installed' } },
    },
  });
  context.typeCounters.connections.increment(
    'TestConnection',
    'c',
    keyed(context, 'c', { connectionId: 'db' })
  );
  context.typeCounters.requests.increment('TestRequest', 'r', keyed(context, 'r', { id: 'get' }));

  const { pending } = await runPluginChecks({ context });

  expect(pending).toEqual([
    { name: '@lowdefy-test/connection-not-installed', schemaChecked: false },
  ]);
  expect(context.errors).toEqual([]);
  expect(context.warnings).toEqual([]);
});

test('runPluginChecks holds the pending warning when a plugin install follows', async () => {
  const serverDir = createServer();
  const context = createTestContext({
    serverDir,
    typesMap: { blocks: { Box: { package: '@lowdefy-test/not-installed' } } },
    pluginInstallFollows: true,
  });
  context.typeCounters.blocks.increment('Box', 'b', keyed(context, 'b', { blockId: 'box' }));

  const { pending } = await runPluginChecks({ context });

  expect(pending).toEqual([{ name: '@lowdefy-test/not-installed', schemaChecked: true }]);
  expect(context.warnings).toEqual([]);
});

test('runPluginChecks with skipPluginChecks gives no pending warning', async () => {
  const serverDir = createServer();
  const context = createTestContext({
    serverDir,
    typesMap: { blocks: { Box: { package: '@lowdefy-test/not-installed' } } },
    skipPluginChecks: true,
  });
  context.typeCounters.blocks.increment('Box', 'b', keyed(context, 'b', { blockId: 'box' }));

  const { pending } = await runPluginChecks({ context });

  expect(pending).toEqual([{ name: '@lowdefy-test/not-installed', schemaChecked: true }]);
  expect(messages(context.warnings)).toEqual([
    'Plugin checks were skipped (--skip-plugin-checks).',
  ]);
});

test('runPluginChecks treats an installed package with no ./checks as having no rules', async () => {
  const serverDir = createServer();
  const pkg = addPlugin(serverDir);
  const context = createTestContext({ serverDir, typesMap: { blocks: { Box: { package: pkg } } } });
  context.pluginCheckSlugRefs.set('some-rule', ['k1']);
  context.typeCounters.blocks.increment('Box', 'b', keyed(context, 'b', { blockId: 'box' }));

  const { pending } = await runPluginChecks({ context });

  expect(pending).toEqual([]);
  expect(messages(context.errors)).toEqual([
    '~ignoreBuildChecks slug "some-rule" is not a built-in check or a rule of any plugin the app uses.',
  ]);
});

test('runPluginChecks warns once for a rule id two sources share, and runs both', async () => {
  const serverDir = createServer();
  const checks = (blockType, message) => `
export default {
  blocks: { ${blockType}: [{ id: 'shared-id', level: 'error', description: '', check: () => '${message}' }] },
  actions: { SetState: [{ id: 'state-refs', level: 'error', description: '', check: () => null }] },
};
`;
  const first = addPlugin(serverDir, { checks: checks('Box', 'first') });
  const second = addPlugin(serverDir, { checks: checks('Card', 'second') });
  const context = createTestContext({
    serverDir,
    typesMap: { blocks: { Box: { package: first }, Card: { package: second } } },
  });
  context.typeCounters.blocks.increment('Box', 'b', keyed(context, 'b', { blockId: 'b' }));
  context.typeCounters.blocks.increment('Card', 'c', keyed(context, 'c', { blockId: 'c' }));

  await runPluginChecks({ context });

  expect(messages(context.errors)).toEqual(['first', 'second']);
  expect(messages(context.warnings)).toEqual([
    `Check id "state-refs" is used by a built-in check and ${first} and ${second}. Both checks run, and ~ignoreBuildChecks: [state-refs] silences both.`,
    `Check id "shared-id" is used by ${first} and ${second}. Both checks run, and ~ignoreBuildChecks: [shared-id] silences both.`,
  ]);
});

test('runPluginChecks with skipPluginChecks loads rules and checks slugs but runs no rule', async () => {
  const serverDir = createServer();
  const pkg = addPlugin(serverDir, { checks: ifTestChecks });
  const context = createTestContext({
    serverDir,
    typesMap: { operators: { client: { _if: { package: pkg } } } },
    skipPluginChecks: true,
  });
  context.pluginCheckSlugRefs.set('no-such-rule', ['k1']);
  context.typeCounters.operators.client.increment('_if', 'c', keyed(context, 'c', { _if: {} }));

  await runPluginChecks({ context });

  expect(messages(context.errors)).toEqual([
    '~ignoreBuildChecks slug "no-such-rule" is not a built-in check or a rule of any plugin the app uses.',
  ]);
  expect(messages(context.warnings)).toEqual([
    'Plugin checks were skipped (--skip-plugin-checks).',
  ]);
});

test('runPluginChecks fails the build when a ./checks export has the wrong shape', async () => {
  const serverDir = createServer();
  const pkg = addPlugin(serverDir, {
    checks: `export default { blocks: { Box: [{ id: 'Not Kebab', level: 'error', check: () => null }] } };`,
  });
  const context = createTestContext({ serverDir, typesMap: { blocks: { Box: { package: pkg } } } });
  context.typeCounters.blocks.increment('Box', 'b', keyed(context, 'b', { blockId: 'box' }));

  await runPluginChecks({ context });

  expect(messages(context.errors)).toEqual([
    `Plugin checks for ${pkg} could not load: blocks.Box: rule id "Not Kebab" is not a kebab-case string.`,
  ]);
});

test('runPluginChecks ignores a type the types map does not define', async () => {
  const serverDir = createServer();
  const context = createTestContext({ serverDir, typesMap: {} });
  context.typeCounters.blocks.increment('Missing', 'b', keyed(context, 'b', { blockId: 'b' }));

  const { pending } = await runPluginChecks({ context });

  expect(context.errors).toEqual([]);
  expect(pending).toEqual([]);
});

test('runPluginChecks lists each warning message at one node', async () => {
  const serverDir = createServer();
  const pkg = addPlugin(serverDir, {
    checks: `
export default {
  blocks: {
    Box: [{ id: 'box-warns', level: 'warning', description: '', check: () => ['One.', 'Two.'] }],
  },
};
`,
  });
  const context = createTestContext({ serverDir, typesMap: { blocks: { Box: { package: pkg } } } });
  context.typeCounters.blocks.increment('Box', 'b', keyed(context, 'b', { blockId: 'box' }));
  // Both warnings resolve to the same source line.
  context.handleWarning = vi.fn();

  await runPluginChecks({ context });

  const warnings = context.handleWarning.mock.calls.map(([warning]) => warning);
  expect(warnings.map((warning) => warning.dedupKey)).toEqual([
    'b\nbox-warns\nOne.',
    'b\nbox-warns\nTwo.',
  ]);
});

test('runPluginChecks with allSlugPackages accepts a slug for a rule of a package this build does not use', async () => {
  const serverDir = createServer();
  const usedPkg = addPlugin(serverDir);
  const otherPkg = addPlugin(serverDir, { checks: ifTestChecks });
  const typesMap = {
    blocks: { Box: { package: usedPkg } },
    operators: { client: { _if: { package: otherPkg } } },
  };
  const devContext = createTestContext({ serverDir, typesMap });
  devContext.pluginCheckSlugRefs.set('if-test', ['k1']);
  devContext.typeCounters.blocks.increment('Box', 'b', keyed(devContext, 'b', { blockId: 'b' }));

  await runPluginChecks({ context: devContext, allSlugPackages: true });

  expect(devContext.errors).toEqual([]);

  const fullContext = createTestContext({ serverDir, typesMap });
  fullContext.pluginCheckSlugRefs.set('if-test', ['k1']);
  fullContext.typeCounters.blocks.increment('Box', 'b', keyed(fullContext, 'b', { blockId: 'b' }));

  await runPluginChecks({ context: fullContext });

  expect(messages(fullContext.errors)).toEqual([
    '~ignoreBuildChecks slug "if-test" is not a built-in check or a rule of any plugin the app uses.',
  ]);
});

test('runPluginChecks with allSlugPackages reports no load failure or clash for a package it only reads ids from', async () => {
  const serverDir = createServer();
  const usedPkg = addPlugin(serverDir);
  const brokenPkg = addPlugin(serverDir, { checks: 'export default 42;' });
  const clashingPkg = addPlugin(serverDir, {
    checks: `export default { blocks: { Card: [{ id: 'state-refs', level: 'error', description: '', check: () => null }] } };`,
  });
  const context = createTestContext({
    serverDir,
    typesMap: {
      blocks: {
        Box: { package: usedPkg },
        Broken: { package: brokenPkg },
        Card: { package: clashingPkg },
      },
    },
  });
  context.typeCounters.blocks.increment('Box', 'b', keyed(context, 'b', { blockId: 'b' }));

  await runPluginChecks({ context, allSlugPackages: true });

  expect(context.errors).toEqual([]);
  expect(context.warnings).toEqual([]);
});

test('runPluginChecks reports a rule at the configKey an operator was counted at when it has no ~k of its own', async () => {
  const serverDir = createServer();
  const pkg = addPlugin(serverDir, { checks: ifTestChecks });
  const context = createTestContext({
    serverDir,
    typesMap: { operators: { client: { _if: { package: pkg } } } },
  });
  // countOperators counts an operator object with no ~k under its parent's ~k.
  context.keyMap.parent = { key: 'parent' };
  context.typeCounters.operators.client.increment('_if', 'parent', { _if: { then: 1 } });

  await runPluginChecks({ context });

  expect(context.errors.map((error) => [error.configKey, error.checkSlug])).toEqual([
    ['parent', 'if-test'],
  ]);
});

test('runPluginChecks in a dev build loads only the used packages when no node names a plugin slug', async () => {
  const serverDir = createServer();
  const used = addPlugin(serverDir, { checks: ifTestChecks });
  const unused = addPlugin(serverDir, { checks: ifTestChecks });
  const context = createTestContext({
    serverDir,
    typesMap: {
      operators: { client: { _if: { package: used }, _unused: { package: unused } } },
    },
  });
  context.typeCounters.operators.client.increment(
    '_if',
    'c',
    keyed(context, 'c', { _if: { test: true } })
  );

  await runPluginChecks({ context, allSlugPackages: true });
  expect([...context.pluginChecksCache.keys()]).toEqual([used]);

  context.pluginCheckSlugRefs.set('if-test', ['c']);
  await runPluginChecks({ context, allSlugPackages: true });
  expect([...context.pluginChecksCache.keys()].sort()).toEqual([used, unused].sort());
  expect(context.errors).toEqual([]);
});
