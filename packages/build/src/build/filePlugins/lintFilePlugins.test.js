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

import lintFilePlugins from './lintFilePlugins.js';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-file-plugin-lint-'));

function blockRecord({ source, typeName = 'Card' }) {
  const file = path.join(directory, `${typeName}.jsx`);
  fs.writeFileSync(file, source);
  return { kind: 'blocks', file, relativePath: `plugins/blocks/${typeName}.jsx` };
}

function sharedOperatorRecords({ source, typeName = '_titleCase' }) {
  const file = path.join(directory, `${typeName}.js`);
  fs.writeFileSync(file, source);
  const relativePath = `plugins/operators/shared/${typeName}.js`;
  return [
    { kind: 'operators.client', file, relativePath },
    { kind: 'operators.server', file, relativePath },
  ];
}

test('lintFilePlugins reports nothing for a block that only uses imports, JSX and client globals', () => {
  const record = blockRecord({
    source: `import Icon from './Icon.jsx';

function Card({ blockId, properties }) {
  const width = window.innerWidth;
  return (
    <div id={blockId} style={{ width }}>
      <Icon name={properties.icon} />
    </div>
  );
}

export default Card;
`,
  });
  expect(lintFilePlugins({ filePlugins: [record] })).toEqual([
    {
      relativePath: 'plugins/blocks/Card.jsx',
      environment: 'client',
      environmentDescription: 'in the browser',
      undefinedNames: [],
      unusedNames: [],
    },
  ]);
});

test('lintFilePlugins reports an undefined name with the line it is referenced on', () => {
  const record = blockRecord({
    source: `function Card({ blockId }) {
  return <div id={blockId}>{formatTitle(blockId)}</div>;
}

export default Card;
`,
    typeName: 'Undefined',
  });
  const [result] = lintFilePlugins({ filePlugins: [record] });
  expect(result.undefinedNames).toEqual([{ name: 'formatTitle', line: 2, column: 28 }]);
});

test('lintFilePlugins reports a syntax error with its line instead of throwing', () => {
  const record = blockRecord({
    source: `function Card({ blockId } {
  return blockId;
}
`,
    typeName: 'Broken',
  });
  const [result] = lintFilePlugins({ filePlugins: [record] });
  expect(result.syntaxError.line).toBe(1);
  expect(result.syntaxError.message).toEqual(expect.any(String));
  expect(result.undefinedNames).toBeUndefined();
});

test('lintFilePlugins reports a server global used in a client block as undefined', () => {
  const record = blockRecord({
    source: `function Card({ blockId }) {
  return <div id={blockId}>{process.env.HOME}</div>;
}

export default Card;
`,
    typeName: 'ServerGlobal',
  });
  const [result] = lintFilePlugins({ filePlugins: [record] });
  expect(result.undefinedNames.map(({ name }) => name)).toEqual(['process']);
});

test('lintFilePlugins reports a browser global used in a shared operator as undefined', () => {
  const records = sharedOperatorRecords({
    source: `function _titleCase({ params }) {
  return document.title + params;
}

export default _titleCase;
`,
  });
  const results = lintFilePlugins({ filePlugins: records });
  expect(results).toHaveLength(1);
  expect(results[0].environment).toBe('shared');
  expect(results[0].undefinedNames.map(({ name }) => name)).toEqual(['document']);
});

test('lintFilePlugins warns about an unused top-level declaration but not an exported one', () => {
  const record = blockRecord({
    source: `import unusedHelper from './helper.js';

const tone = 'positive';

export function used() {
  return 1;
}

function Card({ blockId }) {
  return <div id={blockId} />;
}

export default Card;
`,
    typeName: 'Unused',
  });
  const [result] = lintFilePlugins({ filePlugins: [record] });
  expect(result.unusedNames).toEqual([
    { name: 'unusedHelper', line: 1, column: 7 },
    { name: 'tone', line: 3, column: 6 },
  ]);
});
