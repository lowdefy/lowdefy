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

import { expect, test, vi } from 'vitest';

import dropThreadDatabases from './dropThreadDatabases.js';

test("dropThreadDatabases drops every database a thread of this process left, and no other thread's", async () => {
  const dropped = [];
  const names = [
    'admin',
    'ld_aaaaaaaaaaaa_0',
    `ld_p${process.pid}t3_bbbbbbbbbbbb_0`,
    `ld_p${process.pid}t3_bbbbbbbbbbbb_1`,
    `ld_p${process.pid}t3_cccccccccccc_0`,
    `ld_p${process.pid}t31_dddddddddddd_0`,
    `ld_p${process.pid}_eeeeeeeeeeee_0`,
  ];
  const client = {
    db: (name) => ({
      admin: () => ({
        listDatabases: vi.fn(async () => ({ databases: names.map((item) => ({ name: item })) })),
      }),
      dropDatabase: async () => {
        dropped.push(name);
      },
    }),
  };
  await dropThreadDatabases({ client, threadId: 3 });
  expect(dropped).toEqual([
    `ld_p${process.pid}t3_bbbbbbbbbbbb_0`,
    `ld_p${process.pid}t3_bbbbbbbbbbbb_1`,
    `ld_p${process.pid}t3_cccccccccccc_0`,
  ]);
});
