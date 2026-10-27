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

import { vi, beforeEach, expect, test } from 'vitest';

const mockRunDeviceTool = vi.fn();
vi.doMock('./runDeviceTool.js', () => ({ default: mockRunDeviceTool }));

const { default: connectIosSimulator } = await import('./connectIosSimulator.js');

const instance = { url: 'http://localhost:3000/app', port: 3000 };
const device = { platform: 'ios', appPath: '/builds/LowdefyDev.app' };

function listing(devices) {
  return JSON.stringify({ devices });
}

function respond({ list }) {
  mockRunDeviceTool.mockImplementation(async ({ args }) => {
    if (args[1] === 'list') {
      return list;
    }
    return '';
  });
}

function commands() {
  return mockRunDeviceTool.mock.calls.map(([{ command, args }]) => [command, ...args]);
}

const context = { logger: { info: vi.fn() } };

beforeEach(() => {
  mockRunDeviceTool.mockReset();
});

test('connectIosSimulator boots the newest iPhone, installs Lowdefy Dev and opens the dev server', async () => {
  respond({
    list: listing({
      'com.apple.CoreSimulator.SimRuntime.iOS-17-5': [
        { udid: 'OLD', name: 'iPhone 15', state: 'Shutdown' },
      ],
      'com.apple.CoreSimulator.SimRuntime.iOS-18-2': [
        { udid: 'IPAD', name: 'iPad Air', state: 'Shutdown' },
        { udid: 'NEW', name: 'iPhone 16', state: 'Shutdown' },
      ],
      'com.apple.CoreSimulator.SimRuntime.watchOS-11-0': [
        { udid: 'WATCH', name: 'iPhone Watch', state: 'Shutdown' },
      ],
    }),
  });
  await connectIosSimulator({ context, device, ready: Promise.resolve(instance) });
  expect(commands()).toEqual([
    ['xcrun', 'simctl', 'list', 'devices', 'available', '--json'],
    ['xcrun', 'simctl', 'boot', 'NEW'],
    ['open', '-a', 'Simulator'],
    ['xcrun', 'simctl', 'bootstatus', 'NEW'],
    ['xcrun', 'simctl', 'install', 'NEW', '/builds/LowdefyDev.app'],
    [
      'xcrun',
      'simctl',
      'openurl',
      'NEW',
      'lowdefy-dev://connect?url=http%3A%2F%2Flocalhost%3A3000%2Fapp',
    ],
  ]);
});

test('connectIosSimulator uses a simulator that is already booted', async () => {
  respond({
    list: listing({
      'com.apple.CoreSimulator.SimRuntime.iOS-18-2': [
        { udid: 'NEW', name: 'iPhone 16', state: 'Shutdown' },
        { udid: 'BOOTED', name: 'iPhone 16 Pro', state: 'Booted' },
      ],
    }),
  });
  await connectIosSimulator({ context, device, ready: Promise.resolve(instance) });
  expect(commands().map((command) => command.slice(0, 3))).toEqual([
    ['xcrun', 'simctl', 'list'],
    ['xcrun', 'simctl', 'install'],
    ['xcrun', 'simctl', 'openurl'],
  ]);
});

test('connectIosSimulator opens nothing when the dev server exits before it is ready', async () => {
  respond({
    list: listing({
      'com.apple.CoreSimulator.SimRuntime.iOS-18-2': [
        { udid: 'BOOTED', name: 'iPhone 16', state: 'Booted' },
      ],
    }),
  });
  await connectIosSimulator({ context, device, ready: Promise.resolve(null) });
  expect(commands().map((command) => command[2])).toEqual(['list', 'install']);
});

test('connectIosSimulator says how to install a simulator when there is no iPhone', async () => {
  respond({ list: listing({}) });
  await expect(
    connectIosSimulator({ context, device, ready: Promise.resolve(instance) })
  ).rejects.toThrow(
    'No iPhone simulator is installed. In Xcode, open Settings > Components and install an iOS simulator.'
  );
});
