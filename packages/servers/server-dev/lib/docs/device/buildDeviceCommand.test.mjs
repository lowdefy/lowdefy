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
import buildDeviceCommand from './buildDeviceCommand.js';

function commandLine(params) {
  const { command, args } = buildDeviceCommand(params);
  return [command, ...args];
}

test('buildDeviceCommand lists the booted simulators as JSON', () => {
  expect(commandLine({ action: 'list-simulators' })).toEqual([
    'xcrun',
    'simctl',
    'list',
    'devices',
    'booted',
    '--json',
  ]);
});

test('buildDeviceCommand lists the Android devices with their details', () => {
  expect(commandLine({ action: 'list-android', adb: '/sdk/platform-tools/adb' })).toEqual([
    '/sdk/platform-tools/adb',
    'devices',
    '-l',
  ]);
});

test('buildDeviceCommand captures a simulator screen to a PNG file', () => {
  expect(
    commandLine({ action: 'simulator-screenshot', udid: 'SIM-1', file: '/tmp/x/screen.png' })
  ).toEqual(['xcrun', 'simctl', 'io', 'SIM-1', 'screenshot', '--type=png', '/tmp/x/screen.png']);
});

test('buildDeviceCommand captures an Android screen as a PNG on stdout, read as a Buffer', () => {
  const command = buildDeviceCommand({
    action: 'android-screenshot',
    adb: 'adb',
    serial: 'emulator-5554',
  });
  expect([command.command, ...command.args]).toEqual([
    'adb',
    '-s',
    'emulator-5554',
    'exec-out',
    'screencap',
    '-p',
  ]);
  expect(command.encoding).toEqual('buffer');
});

test('buildDeviceCommand sets one simulator location', () => {
  expect(
    commandLine({
      action: 'simulator-location',
      udid: 'SIM-1',
      value: { latitude: -33.9249, longitude: 18.4241 },
    })
  ).toEqual(['xcrun', 'simctl', 'location', 'SIM-1', 'set', '-33.9249,18.4241']);
});

test('buildDeviceCommand moves the simulator along a route of locations', () => {
  expect(
    commandLine({
      action: 'simulator-location',
      udid: 'SIM-1',
      value: [
        { latitude: -33.92, longitude: 18.42 },
        { latitude: -33.93, longitude: 18.43 },
      ],
    })
  ).toEqual(['xcrun', 'simctl', 'location', 'SIM-1', 'start', '-33.92,18.42', '-33.93,18.43']);
});

test('buildDeviceCommand treats a route of one location as a set', () => {
  expect(
    commandLine({
      action: 'simulator-location',
      udid: 'SIM-1',
      value: [{ latitude: 1, longitude: 2 }],
    })
  ).toEqual(['xcrun', 'simctl', 'location', 'SIM-1', 'set', '1,2']);
});

test('buildDeviceCommand delivers a push payload file to the app', () => {
  expect(
    commandLine({
      action: 'simulator-push',
      udid: 'SIM-1',
      bundleId: 'com.lowdefy.dev',
      file: '/tmp/x/payload.json',
    })
  ).toEqual(['xcrun', 'simctl', 'push', 'SIM-1', 'com.lowdefy.dev', '/tmp/x/payload.json']);
});

test('buildDeviceCommand grants a granted permission and revokes a denied one', () => {
  const params = {
    action: 'simulator-privacy',
    udid: 'SIM-1',
    service: 'location',
    bundleId: 'com.lowdefy.dev',
  };
  expect(commandLine({ ...params, answer: 'granted' })).toEqual([
    'xcrun',
    'simctl',
    'privacy',
    'SIM-1',
    'grant',
    'location',
    'com.lowdefy.dev',
  ]);
  expect(commandLine({ ...params, answer: 'denied' })).toEqual([
    'xcrun',
    'simctl',
    'privacy',
    'SIM-1',
    'revoke',
    'location',
    'com.lowdefy.dev',
  ]);
});

test('buildDeviceCommand throws on an unknown action', () => {
  expect(() => buildDeviceCommand({ action: 'shake' })).toThrow(
    'Unknown device command. Received "shake".'
  );
});
