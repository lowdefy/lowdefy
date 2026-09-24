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
    },
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
};
`);
});

test('generatePageTypesModule maps a renamed type to its original export', () => {
  const source = generatePageTypesModule({
    imports: {
      actions: [],
      blocks: [{ originalTypeName: 'Button', package: 'my-plugin', typeName: 'MyButton' }],
      operators: [],
    },
  });
  expect(source).toContain('import { Button as b0 } from "my-plugin/blocks";');
  expect(source).toContain('"MyButton": b0,');
});
