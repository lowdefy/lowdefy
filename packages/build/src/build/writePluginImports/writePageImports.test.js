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

import writePageImports from './writePageImports.js';

const mockWriteBuildArtifact = jest.fn();

function makeComponents({ experimental } = {}) {
  return {
    config: { experimental },
    imports: {
      actions: [
        { typeName: 'Link', originalTypeName: 'Link', package: '@lowdefy/actions-core' },
        { typeName: 'Reset', originalTypeName: 'Reset', package: '@lowdefy/actions-core' },
        {
          typeName: 'SetDarkMode',
          originalTypeName: 'SetDarkMode',
          package: '@lowdefy/actions-core',
        },
      ],
      blocks: [
        { typeName: 'Box', originalTypeName: 'Box', package: '@lowdefy/blocks-basic' },
        { typeName: 'Button', originalTypeName: 'Button', package: '@lowdefy/blocks-antd' },
        { typeName: 'Card', originalTypeName: 'Card', package: '@lowdefy/blocks-antd' },
      ],
      operators: {
        client: [
          { typeName: '_state', originalTypeName: '_state', package: '@lowdefy/operators-js' },
          { typeName: '_sum', originalTypeName: '_sum', package: '@lowdefy/operators-js' },
          { typeName: '_not', originalTypeName: '_not', package: '@lowdefy/operators-js' },
        ],
      },
    },
    pages: [{ pageId: 'one' }, { pageId: 'two' }],
  };
}

function makeContext({ stage = 'prod' } = {}) {
  return {
    directories: { build: '/app/.lowdefy/server/build', server: '/app/.lowdefy/server' },
    filePlugins: [],
    pageTypes: {
      one: {
        actions: new Set(['Link']),
        blocks: new Set(['Button']),
        operators: new Set(['_state']),
      },
      two: {
        actions: new Set(['Reset']),
        blocks: new Set(['Card']),
        operators: new Set(['_sum']),
      },
    },
    stage,
    writeBuildArtifact: mockWriteBuildArtifact,
  };
}

function written(artifactPath) {
  const call = mockWriteBuildArtifact.mock.calls.find(([path]) => path === artifactPath);
  return call?.[1];
}

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writePageImports writes a module per page importing only that page own types', async () => {
  await writePageImports({ components: makeComponents(), context: makeContext() });
  expect(written('plugins/pages/one.js')).toEqual(
    `import { Link as _t1 } from "@lowdefy/actions-core/actions";
import { SetDarkMode as _t2 } from "@lowdefy/actions-core/actions";
import { Box as _t3 } from "@lowdefy/blocks-basic/blocks";
import { Button as _t4 } from "@lowdefy/blocks-antd/blocks";
import { _state as _t5 } from "@lowdefy/operators-js/operators/client";
import { _not as _t6 } from "@lowdefy/operators-js/operators/client";
export const actions = {
  "Link": _t1,
  "SetDarkMode": _t2,
};
export const blocks = {
  "Box": _t3,
  "Button": _t4,
};
export const operators = {
  "_state": _t5,
  "_not": _t6,
};
`
  );
  const two = written('plugins/pages/two.js');
  expect(two).toContain('"Reset": _t1');
  expect(two).toContain('"Card": _t4');
  expect(two).toContain('"_sum": _t5');
  expect(two).not.toContain('Button');
  expect(two).not.toContain('_state');
});

test('writePageImports seeds every page with the mandatory runtime types', async () => {
  await writePageImports({ components: makeComponents(), context: makeContext() });
  ['plugins/pages/one.js', 'plugins/pages/two.js'].forEach((artifactPath) => {
    const module = written(artifactPath);
    expect(module).toContain('"SetDarkMode"');
    expect(module).toContain('"Box"');
    expect(module).toContain('"_not"');
  });
});

test('writePageImports writes an index of page module importers', async () => {
  await writePageImports({ components: makeComponents(), context: makeContext() });
  expect(written('plugins/pages/index.js')).toEqual(
    `export default {
  "one": () => import("./one.js"),
  "two": () => import("./two.js"),
};
`
  );
});

test('writePageImports writes only an empty index in a dev build', async () => {
  await writePageImports({
    components: makeComponents(),
    context: makeContext({ stage: 'dev' }),
  });
  expect(mockWriteBuildArtifact).toHaveBeenCalledTimes(1);
  expect(written('plugins/pages/index.js')).toEqual('export default {\n};\n');
});

test('writePageImports writes only an empty index when perPageImports is off', async () => {
  await writePageImports({
    components: makeComponents({ experimental: { perPageImports: false } }),
    context: makeContext(),
  });
  expect(mockWriteBuildArtifact).toHaveBeenCalledTimes(1);
  expect(written('plugins/pages/index.js')).toEqual('export default {\n};\n');
});

test('writePageImports imports a file plugin block by path', async () => {
  const components = makeComponents();
  components.imports.blocks.push({
    typeName: 'Badge',
    originalTypeName: 'Badge',
    package: null,
  });
  const context = makeContext();
  context.filePlugins = [
    {
      kind: 'blocks',
      typeName: 'Badge',
      relativePath: 'plugins/blocks/Badge.jsx',
      file: '/app/plugins/blocks/Badge.jsx',
    },
  ];
  context.pageTypes.one.blocks.add('Badge');
  await writePageImports({ components, context });
  expect(written('plugins/pages/one.js')).toContain(
    'import _t5 from "../../../plugins/blocks/Badge.jsx";'
  );
});
