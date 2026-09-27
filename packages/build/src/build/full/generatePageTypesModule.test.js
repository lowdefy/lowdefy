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

import generatePageTypesModule from './generatePageTypesModule.js';

test('generatePageTypesModule aliases imports so a block and an action can share a name', () => {
  const source = generatePageTypesModule({
    imports: {
      actions: [{ originalTypeName: 'Throw', package: '@lowdefy/actions-core', typeName: 'Throw' }],
      blocks: [{ originalTypeName: 'Throw', package: '@lowdefy/blocks-basic', typeName: 'Throw' }],
      operators: [
        { originalTypeName: '_state', package: '@lowdefy/operators-js', typeName: '_state' },
      ],
      icons: [],
    },
    iconData: {},
  });
  expect(source).toEqual(`import { Throw as a0 } from "@lowdefy/actions-core/actions";
import { Throw as b0 } from "@lowdefy/blocks-basic/blocks";
import { _state as o0 } from "@lowdefy/operators-js/operators/client";
export default {
  actions: {
    "Throw": a0,
  },
  blocks: {
    "Throw": b0,
  },
  operators: {
    "_state": o0,
  },
  icons: {

  },
};
`);
});

test('generatePageTypesModule maps a renamed type to its original export', () => {
  const source = generatePageTypesModule({
    imports: {
      actions: [],
      blocks: [{ originalTypeName: 'Button', package: 'my-plugin', typeName: 'MyButton' }],
      operators: [],
      icons: [],
    },
    iconData: {},
  });
  expect(source).toContain('import { Button as b0 } from "my-plugin/blocks";');
  expect(source).toContain('"MyButton": b0,');
});

test('generatePageTypesModule inlines only its page icons, each node array once', async () => {
  const node = [['path', { d: 'm15 5 4 4' }]];
  const source = generatePageTypesModule({
    imports: { actions: [], blocks: [], operators: [], icons: ['Pencil', 'edit'] },
    iconData: {
      Pencil: { node },
      edit: { node },
      Rocket: { node: [['path', { d: 'M4 4h2' }]] },
    },
  });
  const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  const { default: pageTypes } = await import(url);
  expect(pageTypes.icons).toEqual({ Pencil: { node }, edit: { node } });
  expect(source.match(/const n\d+ = /g)).toEqual(['const n0 = ']);
});
