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

import parseProcessTable from './parseProcessTable.js';

test('parseProcessTable reads pid, ppid, pgid, the start time in epoch milliseconds, and the command', () => {
  const text = [
    '    1     0     1 Mon Jul 20 08:00:00 2026 /sbin/launchd',
    '24848 24829 24829 Fri Oct  2 20:55:27 2026 node packages/cli/dist/index.js start --port 3473',
    '25667 24848 24829 Fri Oct  2 20:55:31 2026 /usr/local/bin/node src/index.js',
    '',
    'not a process line',
  ].join('\n');
  expect(parseProcessTable(text)).toEqual([
    {
      pid: 1,
      ppid: 0,
      pgid: 1,
      processStartTime: Date.UTC(2026, 6, 20, 8, 0, 0),
      command: '/sbin/launchd',
    },
    {
      pid: 24848,
      ppid: 24829,
      pgid: 24829,
      processStartTime: Date.UTC(2026, 9, 2, 20, 55, 27),
      command: 'node packages/cli/dist/index.js start --port 3473',
    },
    {
      pid: 25667,
      ppid: 24848,
      pgid: 24829,
      processStartTime: Date.UTC(2026, 9, 2, 20, 55, 31),
      command: '/usr/local/bin/node src/index.js',
    },
  ]);
});
