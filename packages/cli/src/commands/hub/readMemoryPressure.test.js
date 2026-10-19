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

import { jest } from '@jest/globals';

import readMemoryPressure from './readMemoryPressure.js';

test.each([
  ['1', 'normal'],
  ['2', 'warn'],
  ['4', 'critical'],
  ['0', 'normal'],
  ['garbage', 'normal'],
])('readMemoryPressure reads macOS level %p as %p', (level, expected) => {
  const exec = (command, args) => {
    expect(command).toBe('sysctl');
    expect(args).toEqual(['-n', 'kern.memorystatus_vm_pressure_level']);
    return `${level}\n`;
  };
  expect(readMemoryPressure({ platform: 'darwin', exec })).toBe(expected);
});

function psi({ some, full }) {
  return [
    `some avg10=${some} avg60=1.00 avg300=0.50 total=123456`,
    `full avg10=${full} avg60=0.50 avg300=0.10 total=6543`,
    '',
  ].join('\n');
}

test.each([
  [psi({ some: '0.00', full: '0.00' }), 'normal'],
  [psi({ some: '9.99', full: '0.00' }), 'normal'],
  [psi({ some: '10.00', full: '2.00' }), 'warn'],
  [psi({ some: '45.10', full: '12.50' }), 'critical'],
  ['some avg10=12.00 avg60=1.00 avg300=0.50 total=1\n', 'warn'],
  ['not pressure stall information', 'normal'],
  ['', 'normal'],
])('readMemoryPressure reads Linux PSI %#', (text, expected) => {
  const readFile = (filePath) => {
    expect(filePath).toBe('/proc/pressure/memory');
    return text;
  };
  expect(readMemoryPressure({ platform: 'linux', readFile })).toBe(expected);
});

test('readMemoryPressure is normal when the PSI file is missing', () => {
  expect(
    readMemoryPressure({ platform: 'linux', psiPath: '/nonexistent/lowdefy/pressure/memory' })
  ).toBe('normal');
});

test('readMemoryPressure is normal when sysctl fails', () => {
  const exec = () => {
    throw new Error('sysctl: unknown oid');
  };
  expect(readMemoryPressure({ platform: 'darwin', exec })).toBe('normal');
});

test('readMemoryPressure is normal on a platform without a pressure signal', () => {
  const exec = jest.fn();
  expect(readMemoryPressure({ platform: 'win32', exec })).toBe('normal');
  expect(exec).not.toHaveBeenCalled();
});

test('readMemoryPressure reads a real level on this machine', () => {
  expect(['normal', 'warn', 'critical']).toContain(readMemoryPressure());
});
