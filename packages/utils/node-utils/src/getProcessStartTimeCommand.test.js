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

import getProcessStartTimeCommand from './getProcessStartTimeCommand.js';
import parsePsStartTime from './parsePsStartTime.js';
import parseWmiStartTime from './parseWmiStartTime.js';

test('getProcessStartTimeCommand reads lstart from ps in the C locale and UTC on macOS and Linux', () => {
  ['darwin', 'linux'].forEach((platform) => {
    const { command, args, options, parse } = getProcessStartTimeCommand({ pid: 4242, platform });
    expect(command).toEqual('ps');
    expect(args).toEqual(['-o', 'lstart=', '-p', '4242']);
    expect(options.env).toMatchObject({ LC_ALL: 'C', TZ: 'UTC' });
    expect(parse).toBe(parsePsStartTime);
  });
});

test('getProcessStartTimeCommand reads the raw WMI creation time, with its UTC offset, on Windows', () => {
  const { command, args, options, parse } = getProcessStartTimeCommand({
    pid: 4242,
    platform: 'win32',
  });
  expect(command).toEqual('powershell.exe');
  expect(args.slice(0, 4)).toEqual(['-NoLogo', '-NoProfile', '-NonInteractive', '-Command']);
  expect(args[4]).toContain("Get-WmiObject -Class Win32_Process -Filter 'ProcessId = 4242'");
  expect(args[4]).toContain('$p.CreationDate');
  expect(args[4]).not.toContain('ToUniversalTime');
  expect(parse).toBe(parseWmiStartTime);
  expect(options).toMatchObject({ windowsHide: true });
  expect(options.timeout).toBeGreaterThan(0);
});

test('getProcessStartTimeCommand throws for a pid that is not a positive integer', () => {
  [undefined, null, 0, -1, 1.5, '4242', '1; Stop-Computer'].forEach((pid) => {
    expect(() => getProcessStartTimeCommand({ pid, platform: 'win32' })).toThrow(
      `Process id must be a positive integer. Received ${JSON.stringify(pid)}.`
    );
  });
});
