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

import filePluginLint from './filePluginLint.js';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-file-plugin-check-'));

function createContext({ source, typeName }) {
  const file = path.join(directory, `${typeName}.jsx`);
  fs.writeFileSync(file, source);
  return {
    errors: [],
    handleWarning: jest.fn(),
    filePlugins: [
      { kind: 'blocks', file, relativePath: `plugins/blocks/${typeName}.jsx`, typeName },
    ],
  };
}

test('filePluginLint runs on every build, under the js-lint slug', () => {
  expect(filePluginLint.slug).toBe('js-lint');
  expect(filePluginLint.checkOnly).toBe(false);
});

test('filePluginLint reports nothing when there are no file plugins', () => {
  const context = { errors: [], handleWarning: jest.fn() };
  filePluginLint.run({ components: {}, context });
  expect(context.errors).toEqual([]);
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('filePluginLint reports a syntax error as a located config error, not a Vite overlay', () => {
  const context = createContext({
    typeName: 'Broken',
    source: `function Broken({ blockId } {
  return blockId;
}
`,
  });
  filePluginLint.run({ components: {}, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain(
    'File plugin "plugins/blocks/Broken.jsx" has a syntax error at line 1'
  );
  expect(context.errors[0].filePath).toBe('plugins/blocks/Broken.jsx');
  expect(context.errors[0].lineNumber).toBe(1);
  expect(context.errors[0].checkSlug).toBe('js-lint');
});

test('filePluginLint errors on an undefined name and names the environment', () => {
  const context = createContext({
    typeName: 'Undefined',
    source: `function Undefined({ blockId }) {
  return <div id={blockId}>{process.env.HOME}</div>;
}

export default Undefined;
`,
  });
  filePluginLint.run({ components: {}, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain('references "process", which is not defined');
  expect(context.errors[0].message).toContain('runs in the browser');
  expect(context.errors[0].lineNumber).toBe(2);
});

test('filePluginLint warns, rather than errors, on an unused top-level declaration', () => {
  const context = createContext({
    typeName: 'Unused',
    source: `const tone = 'positive';

function Unused({ blockId }) {
  return <div id={blockId} />;
}

export default Unused;
`,
  });
  filePluginLint.run({ components: {}, context });
  expect(context.errors).toEqual([]);
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
  expect(context.handleWarning.mock.calls[0][0].message).toBe(
    'File plugin "plugins/blocks/Unused.jsx" declares "tone" but never uses it, at line 1.'
  );
});

test('filePluginLint reports nothing for a clean block', () => {
  const context = createContext({
    typeName: 'Clean',
    source: `function Clean({ blockId, properties }) {
  return <div id={blockId}>{properties.title}</div>;
}

export default Clean;
`,
  });
  filePluginLint.run({ components: {}, context });
  expect(context.errors).toEqual([]);
  expect(context.handleWarning).not.toHaveBeenCalled();
});
