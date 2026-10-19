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

import decideFlowGrouping from './decideFlowGrouping.js';

test('decideFlowGrouping groups from 100000 rows on', () => {
  expect(decideFlowGrouping({ rows: 99999 })).toEqual({
    grouped: false,
    rows: 99999,
    threshold: 100000,
    forced: false,
  });
  expect(decideFlowGrouping({ rows: 100000 }).grouped).toBe(true);
});

test('decideFlowGrouping follows --group and --no-group at any size', () => {
  expect(decideFlowGrouping({ rows: 10, group: true })).toEqual({
    grouped: true,
    rows: 10,
    threshold: 100000,
    forced: true,
  });
  expect(decideFlowGrouping({ rows: 500000, group: false })).toEqual({
    grouped: false,
    rows: 500000,
    threshold: 100000,
    forced: true,
  });
});
