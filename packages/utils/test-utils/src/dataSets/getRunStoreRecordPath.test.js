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

import os from 'node:os';
import path from 'node:path';

import { expect, test } from 'vitest';

import getRunStoreRecordPath from './getRunStoreRecordPath.js';

test('getRunStoreRecordPath names one record per owner process, in a folder of the user under the temporary directory', () => {
  const recordPath = getRunStoreRecordPath({ ownerPid: 4321 });
  expect(path.basename(recordPath)).toEqual('data-store-4321.json');
  expect(path.dirname(path.dirname(recordPath))).toEqual(os.tmpdir());
  expect(path.basename(path.dirname(recordPath))).toMatch(/^lowdefy-test-store-(\d+|user)$/);
  expect(getRunStoreRecordPath({ ownerPid: 4322 })).not.toEqual(recordPath);
});
