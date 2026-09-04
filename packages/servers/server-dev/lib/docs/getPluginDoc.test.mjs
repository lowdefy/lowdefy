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

import { jest } from '@jest/globals';

const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-file-plugin-doc-'));
fs.mkdirSync(path.join(configDirectory, 'plugins', 'blocks'), { recursive: true });
fs.writeFileSync(path.join(configDirectory, 'plugins', 'blocks', 'Card.jsx'), '');
fs.writeFileSync(
  path.join(configDirectory, 'plugins', 'blocks', 'Card.json'),
  JSON.stringify({ meta: { category: 'display' }, readme: '# Card\n\nA card.\n' })
);
fs.writeFileSync(path.join(configDirectory, 'plugins', 'blocks', 'Bare.jsx'), '');
fs.writeFileSync(
  path.join(configDirectory, 'plugins', 'blocks', 'Bare.json'),
  JSON.stringify({ meta: { category: 'display' } })
);

function fileBlock(typeName) {
  return {
    package: null,
    packageId: 'file-plugin',
    originalTypeName: typeName,
    version: null,
    file: path.join(configDirectory, 'plugins', 'blocks', `${typeName}.jsx`),
    relativePath: `plugins/blocks/${typeName}.jsx`,
  };
}

const artifacts = {
  'plugins/availableTypes.json': {
    blocks: {
      Button: { package: '@lowdefy/blocks-antd', originalTypeName: 'Button', version: '5.0.0' },
      Card: fileBlock('Card'),
      Bare: fileBlock('Bare'),
    },
  },
};

jest.unstable_mockModule('./readBuildArtifact.js', () => ({
  default: jest.fn(({ name }) => artifacts[name] ?? null),
}));
jest.unstable_mockModule('./resolvePluginDir.js', () => ({
  default: jest.fn(() => null),
}));

const { default: getPluginDoc } = await import('./getPluginDoc.js');

test('getPluginDoc returns the readme from a file plugin sibling JSON, by type name', () => {
  expect(getPluginDoc({ packageName: 'Card' })).toEqual({
    type: 'Card',
    source: 'file plugin',
    file: 'plugins/blocks/Card.jsx',
    readme: '# Card\n\nA card.\n',
    markdown: '# Card\n\nA card.\n',
  });
});

test('getPluginDoc finds a file plugin by the path list_types reports', () => {
  expect(getPluginDoc({ packageName: 'plugins/blocks/Card.jsx' }).readme).toBe(
    '# Card\n\nA card.\n'
  );
});

test('getPluginDoc tells the agent where to write the readme when there is none', () => {
  const result = getPluginDoc({ packageName: 'Bare' });
  expect(result.readme).toBeUndefined();
  expect(result.markdown).toContain('No documentation for "Bare"');
  expect(result.markdown).toContain('plugins/blocks/Bare.json');
});

test('getPluginDoc still returns null for a package that is not resolvable', () => {
  expect(getPluginDoc({ packageName: '@lowdefy/blocks-antd' })).toBeNull();
});
