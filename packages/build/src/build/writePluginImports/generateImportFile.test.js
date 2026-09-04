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
import generateImportFile from './generateImportFile.js';

const record = {
  kind: 'blocks',
  typeName: 'Badge',
  originalTypeName: 'Badge',
  package: null,
  packageId: 'file-plugin',
  file: '/app/plugins/blocks/Badge.jsx',
  relativePath: 'plugins/blocks/Badge.jsx',
};

function context({ stage }) {
  return {
    directories: { build: '/app/.lowdefy/server/build', server: '/app/.lowdefy/server' },
    filePlugins: [record],
    stage,
  };
}

test('generateImportFile imports a package plugin from its package subpath', () => {
  const file = generateImportFile({
    artifactPath: 'plugins/blocks.js',
    context: context({ stage: 'prod' }),
    imports: [{ package: '@lowdefy/blocks-antd', typeName: 'Card', originalTypeName: 'Card' }],
    importPath: 'blocks',
    kind: 'blocks',
  });
  expect(file).toEqual(
    `import { Card as Card } from '@lowdefy/blocks-antd/blocks';
export default {
  Card,
  };`
  );
});

test('generateImportFile imports a file plugin in place in dev', () => {
  const file = generateImportFile({
    artifactPath: 'plugins/blocks.js',
    context: context({ stage: 'dev' }),
    imports: [{ package: null, typeName: 'Badge', originalTypeName: 'Badge' }],
    importPath: 'blocks',
    kind: 'blocks',
  });
  expect(file).toEqual(
    `import Badge from '../../../../plugins/blocks/Badge.jsx';
export default {
  Badge,
  };`
  );
});

test('generateImportFile imports the copy under the server directory in prod', () => {
  const file = generateImportFile({
    artifactPath: 'plugins/blocks.js',
    context: context({ stage: 'prod' }),
    imports: [{ package: null, typeName: 'Badge', originalTypeName: 'Badge' }],
    importPath: 'blocks',
    kind: 'blocks',
  });
  expect(file).toEqual(
    `import Badge from '../../plugins/blocks/Badge.jsx';
export default {
  Badge,
  };`
  );
});

test('generateImportFile emits both branches in one barrel', () => {
  const file = generateImportFile({
    artifactPath: 'plugins/blocks.js',
    context: context({ stage: 'prod' }),
    imports: [
      { package: '@lowdefy/blocks-antd', typeName: 'Card', originalTypeName: 'Card' },
      { package: null, typeName: 'Badge', originalTypeName: 'Badge' },
    ],
    importPath: 'blocks',
    kind: 'blocks',
  });
  expect(file).toEqual(
    `import { Card as Card } from '@lowdefy/blocks-antd/blocks';
import Badge from '../../plugins/blocks/Badge.jsx';
export default {
  Card,
  Badge,
  };`
  );
});

test('generateImportFile resolves an operator barrel from its own directory', () => {
  const operator = {
    ...record,
    kind: 'operators.server',
    typeName: '_titleCase',
    originalTypeName: '_titleCase',
    file: '/app/plugins/operators/shared/_titleCase.js',
    relativePath: 'plugins/operators/shared/_titleCase.js',
  };
  const file = generateImportFile({
    artifactPath: 'plugins/operators/server.js',
    context: { ...context({ stage: 'prod' }), filePlugins: [operator] },
    imports: [{ package: null, typeName: '_titleCase', originalTypeName: '_titleCase' }],
    importPath: 'operators/server',
    kind: 'operators.server',
  });
  expect(file).toEqual(
    `import _titleCase from '../../../plugins/operators/shared/_titleCase.js';
export default {
  _titleCase,
  };`
  );
});

test('generateImportFile throws when a type has no package and no discovered file', () => {
  expect(() =>
    generateImportFile({
      artifactPath: 'plugins/blocks.js',
      context: { ...context({ stage: 'prod' }), filePlugins: [] },
      imports: [{ package: null, typeName: 'Badge', originalTypeName: 'Badge' }],
      importPath: 'blocks',
      kind: 'blocks',
    })
  ).toThrow('No file plugin was discovered for blocks type "Badge".');
});
