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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, expect, test } from 'vitest';

import loadClientPlugins from './loadClientPlugins.js';

const actionsDirectory = path.resolve(import.meta.dirname, '../../../plugins/actions');

let directory;

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

// A build's client plugin files, written as the build writes them, with the action packages they
// import linked from this workspace into a node_modules beside the build.
function writeBuild({ actions }) {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-journey-headless-plugins-'));
  const buildDirectory = path.join(directory, 'build');
  const pluginsDirectory = path.join(buildDirectory, 'plugins');
  fs.mkdirSync(path.join(pluginsDirectory, 'operators'), { recursive: true });
  fs.mkdirSync(path.join(directory, 'node_modules', '@lowdefy'), { recursive: true });
  ['actions-core', 'actions-pdf-make'].forEach((name) => {
    fs.symlinkSync(
      path.join(actionsDirectory, name),
      path.join(directory, 'node_modules', '@lowdefy', name),
      'dir'
    );
  });
  const imports = actions
    .map(({ name, from }) => `import { ${name} as ${name} } from '${from}';`)
    .join('\n');
  fs.writeFileSync(
    path.join(pluginsDirectory, 'actions.js'),
    `${imports}\nexport default {\n${actions.map(({ name }) => `  ${name},`).join('\n')}\n};\n`
  );
  fs.writeFileSync(path.join(pluginsDirectory, 'operators', 'client.js'), 'export default {};\n');
  fs.writeFileSync(
    path.join(pluginsDirectory, 'operators', 'clientJsMap.js'),
    'export default {};\n'
  );
  fs.writeFileSync(
    path.join(pluginsDirectory, 'blockMetas.json'),
    JSON.stringify({ Box: { category: 'container' } })
  );
  return buildDirectory;
}

test("loadClientPlugins imports the build's actions in Node, PdfMake included, and stubs the browser-only ones by name", async () => {
  const buildDirectory = writeBuild({
    actions: [
      { name: 'PdfMake', from: '@lowdefy/actions-pdf-make/actions' },
      { name: 'SetState', from: '@lowdefy/actions-core/actions' },
      { name: 'CopyToClipboard', from: '@lowdefy/actions-core/actions' },
    ],
  });
  const plugins = await loadClientPlugins({ buildDirectory });
  expect(Object.keys(plugins.actions)).toEqual(['PdfMake', 'SetState', 'CopyToClipboard']);
  expect(() => plugins.actions.PdfMake({ params: {} })).toThrow('PdfMake needs the browser.');
  expect(() => plugins.actions.CopyToClipboard({ params: {} })).toThrow(
    'CopyToClipboard needs the browser.'
  );
  expect(plugins.actions.SetState.name).toBe('SetState');
  expect(plugins.blockMetas).toEqual({ Box: { category: 'container' } });
  expect(plugins.operators).toEqual({});
  expect(plugins.jsMap).toEqual({});
});
