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

import generateJsFile from './generateJsFile.js';

test('generateJsFile renders inline bodies only when there are no modules', () => {
  expect(generateJsFile({ map: { A: 'return 1;' }, functionPrototype: '{ args }' })).toBe(`
export default {
  'A': ({ args }) => { return 1; },
  };`);
});

test('generateJsFile emits imports before the map, aliased by sorted hash', () => {
  const result = generateJsFile({
    map: { A: 'return 1;' },
    modules: {
      zzz: { importPath: '../../../lib/z.js', exportName: 'default' },
      bbb: { importPath: '../../../lib/b.js', exportName: 'buildRows' },
    },
    functionPrototype: '{ args }',
  });
  expect(result).toBe(`
import { buildRows as m0 } from '../../../lib/b.js';
import m1 from '../../../lib/z.js';

export default {
  'A': ({ args }) => { return 1; },
  'bbb': m0,
  'zzz': m1,
  };`);
});

test('generateJsFile aliases are stable regardless of insertion order', () => {
  const modules = {
    bbb: { importPath: './b.js', exportName: 'b' },
    aaa: { importPath: './a.js', exportName: 'a' },
  };
  const reversed = { aaa: modules.aaa, bbb: modules.bbb };
  expect(generateJsFile({ map: {}, modules, functionPrototype: '{}' })).toBe(
    generateJsFile({ map: {}, modules: reversed, functionPrototype: '{}' })
  );
});
