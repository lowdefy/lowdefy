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

import { expect, test } from 'vitest';

// The committed native block types must match the @lowdefy/blocks-native source: run
// `pnpm --filter=@lowdefy/build native-block-types` after changing a blocks-native block or meta.
import nativeBlockTypes from './nativeBlockTypes.js';
import blocksNativeTypes from '../../plugins/blocks/blocks-native/src/types.js';

test('src/nativeBlockTypes.js matches the @lowdefy/blocks-native types', () => {
  expect(nativeBlockTypes).toEqual(blocksNativeTypes);
});
