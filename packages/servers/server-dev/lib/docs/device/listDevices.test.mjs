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
import listDevices from './listDevices.js';

const SIMULATORS = JSON.stringify({
  devices: {
    'com.apple.CoreSimulator.SimRuntime.iOS-18-2': [
      { udid: 'SIM-1', name: 'iPhone 16', state: 'Booted' },
      { udid: 'SIM-2', name: 'iPhone 16 Pro', state: 'Shutdown' },
    ],
    'com.apple.CoreSimulator.SimRuntime.watchOS-11-2': [
      { udid: 'WATCH-1', name: 'Apple Watch', state: 'Booted' },
    ],
  },
});

const ANDROID = [
  'List of devices attached',
  'emulator-5554          device product:sdk_gphone64 model:sdk_gphone64_arm64 device:emu64a transport_id:1',
  'R58N12ABC              device usb:1-1 product:a52 model:SM_A525F device:a52q transport_id:2',
  'emulator-5556          offline transport_id:3',
  '',
].join('\n');

function fakeRun({ simulators = SIMULATORS, android = ANDROID } = {}) {
  const calls = [];
  async function run({ command, args }) {
    calls.push([command, ...args]);
    if (command === 'xcrun') {
      if (simulators instanceof Error) throw simulators;
      return simulators;
    }
    if (android instanceof Error) throw android;
    return android;
  }
  return { calls, run };
}

test('listDevices lists the booted iOS simulators and the Android devices adb sees', async () => {
  const { calls, run } = fakeRun();
  const result = await listDevices({ adb: 'adb', platform: 'darwin', run });
  expect(result).toEqual({
    simulators: [{ udid: 'SIM-1', name: 'iPhone 16', runtime: 'iOS-18-2' }],
    android: [
      { serial: 'emulator-5554', emulator: true, model: 'sdk_gphone64_arm64' },
      { serial: 'R58N12ABC', emulator: false, model: 'SM_A525F' },
    ],
    unavailable: [],
  });
  expect(calls).toEqual([
    ['xcrun', 'simctl', 'list', 'devices', 'booted', '--json'],
    ['adb', 'devices', '-l'],
  ]);
});

test('listDevices runs no xcrun off macOS and says why', async () => {
  const { calls, run } = fakeRun();
  const result = await listDevices({ adb: 'adb', platform: 'linux', run });
  expect(result.simulators).toEqual([]);
  expect(result.android).toHaveLength(2);
  expect(result.unavailable).toEqual(['iOS simulators: they run only on macOS.']);
  expect(calls).toEqual([['adb', 'devices', '-l']]);
});

test('listDevices lists nothing for a tool that is not installed, and says which', async () => {
  const { run } = fakeRun({
    simulators: new Error('xcrun simctl list devices booted --json failed: spawn xcrun ENOENT'),
    android: new Error('adb devices -l failed: spawn adb ENOENT'),
  });
  const result = await listDevices({ adb: 'adb', platform: 'darwin', run });
  expect(result).toEqual({
    simulators: [],
    android: [],
    unavailable: [
      'iOS simulators: xcrun simctl list devices booted --json failed: spawn xcrun ENOENT',
      'Android devices: adb devices -l failed: spawn adb ENOENT',
    ],
  });
});

test('listDevices lists one kind only when asked', async () => {
  const ios = fakeRun();
  expect(
    (await listDevices({ adb: 'adb', platform: 'darwin', run: ios.run, only: 'ios' })).android
  ).toEqual([]);
  expect(ios.calls).toEqual([['xcrun', 'simctl', 'list', 'devices', 'booted', '--json']]);
  const android = fakeRun();
  await listDevices({ adb: 'adb', platform: 'darwin', run: android.run, only: 'android' });
  expect(android.calls).toEqual([['adb', 'devices', '-l']]);
});
