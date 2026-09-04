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

// A config directory with two file blocks: one with an examples file beside
// it, one without.
const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-file-plugin-examples-'));
fs.mkdirSync(path.join(configDirectory, 'plugins', 'blocks'), { recursive: true });
fs.writeFileSync(path.join(configDirectory, 'plugins', 'blocks', 'Card.jsx'), '');
fs.writeFileSync(path.join(configDirectory, 'plugins', 'blocks', 'Bare.jsx'), '');
const examplesYaml = `- title: Default
  blocks:
    - id: card
      type: Card
      properties:
        title: Hello
`;
fs.writeFileSync(
  path.join(configDirectory, 'plugins', 'blocks', 'Card.examples.yaml'),
  examplesYaml
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

const { default: getExamples } = await import('./getExamples.js');

test('getExamples returns the examples yaml beside a file plugin', () => {
  expect(getExamples({ type: 'Card' })).toEqual({
    type: 'Card',
    source: 'file plugin',
    file: 'plugins/blocks/Card.jsx',
    files: { 'examples.yaml': examplesYaml },
  });
});

test('getExamples tells the agent which file to add when a file plugin has no examples', () => {
  const result = getExamples({ type: 'Bare' });
  expect(result.source).toBe('file plugin');
  expect(result.files).toBeUndefined();
  expect(result.note).toContain('No examples file for "Bare"');
  expect(result.note).toContain('plugins/blocks/Bare.examples.yaml');
});

test('getExamples still returns null for a package block with no examples', () => {
  expect(getExamples({ type: 'Button' })).toBeNull();
});

test('getExamples still returns null for a type that does not exist', () => {
  expect(getExamples({ type: 'Nope' })).toBeNull();
});
