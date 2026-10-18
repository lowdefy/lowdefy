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

const mockRunDeviceTool = jest.fn();
const mockSpawn = jest.fn(() => ({ unref: jest.fn() }));
jest.unstable_mockModule('./runDeviceTool.js', () => ({ default: mockRunDeviceTool }));
jest.unstable_mockModule('child_process', () => ({ spawn: mockSpawn }));

const { default: connectAndroidDevice } = await import('./connectAndroidDevice.js');

const instance = { url: 'http://localhost:3005', port: 3005 };
const device = {
  platform: 'android',
  appPath: '/builds/lowdefy-dev.apk',
  adb: '/sdk/platform-tools/adb',
  emulator: '/sdk/emulator/emulator',
};
const context = { logger: { info: jest.fn() } };

function commands() {
  return mockRunDeviceTool.mock.calls.map(([{ command, args }]) => [command, ...args]);
}

beforeEach(() => {
  mockRunDeviceTool.mockReset();
  mockSpawn.mockClear();
});

test('connectAndroidDevice installs on a connected phone, reverses the port and opens the dev server', async () => {
  mockRunDeviceTool.mockImplementation(async ({ args }) => {
    if (args[0] === 'devices') {
      return 'List of devices attached\nR58N12ABC\tdevice\nemulator-5556\toffline\n\n';
    }
    return '';
  });
  await connectAndroidDevice({ context, device, ready: Promise.resolve(instance) });
  expect(commands()).toEqual([
    ['/sdk/platform-tools/adb', 'devices'],
    ['/sdk/platform-tools/adb', '-s', 'R58N12ABC', 'install', '-r', '/builds/lowdefy-dev.apk'],
    ['/sdk/platform-tools/adb', '-s', 'R58N12ABC', 'reverse', 'tcp:3005', 'tcp:3005'],
    [
      '/sdk/platform-tools/adb',
      '-s',
      'R58N12ABC',
      'shell',
      'am',
      'start',
      '-a',
      'android.intent.action.VIEW',
      '-d',
      "'lowdefy-dev://connect?url=http%3A%2F%2Flocalhost%3A3005'",
    ],
  ]);
  expect(mockSpawn).not.toHaveBeenCalled();
});

test('connectAndroidDevice starts the first emulator when no device is connected', async () => {
  let devicesCalls = 0;
  mockRunDeviceTool.mockImplementation(async ({ args }) => {
    if (args[0] === 'devices') {
      devicesCalls += 1;
      return devicesCalls === 1
        ? 'List of devices attached\n\n'
        : 'List of devices attached\nemulator-5554\tdevice\n';
    }
    if (args[0] === '-list-avds') {
      return 'Pixel_8_API_35\nPixel_Tablet\n';
    }
    if (args.includes('sys.boot_completed')) {
      return '1\n';
    }
    return '';
  });
  await connectAndroidDevice({ context, device, ready: Promise.resolve(instance) });
  expect(mockSpawn).toHaveBeenCalledWith('/sdk/emulator/emulator', ['-avd', 'Pixel_8_API_35'], {
    detached: true,
    stdio: 'ignore',
  });
  expect(commands()).toContainEqual([
    '/sdk/platform-tools/adb',
    '-s',
    'emulator-5554',
    'reverse',
    'tcp:3005',
    'tcp:3005',
  ]);
});

test('connectAndroidDevice says how to get a device when none is connected or set up', async () => {
  mockRunDeviceTool.mockImplementation(async ({ args }) => {
    if (args[0] === 'devices') {
      return 'List of devices attached\n\n';
    }
    throw new Error('emulator -list-avds failed: spawn emulator ENOENT');
  });
  await expect(
    connectAndroidDevice({ context, device, ready: Promise.resolve(instance) })
  ).rejects.toThrow(
    "No Android phone is connected and no emulator is set up. Connect a phone with USB debugging on, or create a virtual device in Android Studio's Device Manager."
  );
});
