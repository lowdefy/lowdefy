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

import { jest } from '@jest/globals';

import writeReportsRuntime from './writeReportsRuntime.js';

function createContext(plugins) {
  return { plugins, writeBuildArtifact: jest.fn() };
}

test('writeReportsRuntime imports the renderers, icons, and client operators when the plugin is declared', async () => {
  const context = createContext([{ name: '@lowdefy/plugin-reports', version: '5.4.0' }]);
  await writeReportsRuntime({ context });
  const [filePath, content] = context.writeBuildArtifact.mock.calls[0];
  expect(filePath).toBe('plugins/reportsRuntime.js');
  expect(content).toContain("import blocksStatic from './blocksStatic.js';");
  expect(content).toContain("import icons from './icons.js';");
  expect(content).toContain("import clientOperators from './operators/client.js';");
  expect(content).toContain("import clientJsMap from './operators/clientJsMap.js';");
  expect(content).toContain(
    'export default { blocksStatic, clientJsMap, clientOperators, icons };'
  );
});

test('writeReportsRuntime writes empty maps and no imports when the plugin is not declared', async () => {
  const context = createContext([{ name: '@lowdefy/plugin-auth0', version: '5.4.0' }]);
  await writeReportsRuntime({ context });
  const [filePath, content] = context.writeBuildArtifact.mock.calls[0];
  expect(filePath).toBe('plugins/reportsRuntime.js');
  expect(content).toBe(
    'export default { blocksStatic: {}, clientJsMap: {}, clientOperators: {}, icons: {} };\n'
  );
});

test('writeReportsRuntime treats a missing plugins list as undeclared', async () => {
  const context = createContext(undefined);
  await writeReportsRuntime({ context });
  expect(context.writeBuildArtifact.mock.calls[0][1]).not.toContain('import');
});
