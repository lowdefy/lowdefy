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

import fs from 'fs';
import os from 'os';
import path from 'path';

import { vi, afterEach, beforeEach, expect, test } from 'vitest';

const mockRunDeviceTool = vi.fn();
vi.doMock('./runDeviceTool.js', () => ({ default: mockRunDeviceTool }));

const { default: checkIosTools } = await import('./checkIosTools.js');
const { default: prepareDevices } = await import('./prepareDevices.js');

const savedEnv = { ...process.env };
let directory;

function missingTool(command) {
  const cause = Object.assign(new Error(`spawn ${command} ENOENT`), { code: 'ENOENT' });
  return new Error(`${command} failed: spawn ${command} ENOENT`, { cause });
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-dev-app-'));
  delete process.env.LOWDEFY_DEV_APP_IOS;
  delete process.env.LOWDEFY_DEV_APP_ANDROID;
  delete process.env.ANDROID_HOME;
  delete process.env.ANDROID_SDK_ROOT;
  mockRunDeviceTool.mockReset();
  mockRunDeviceTool.mockResolvedValue('');
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
  process.env = { ...savedEnv };
});

function context(options) {
  return { options };
}

test('prepareDevices checks nothing without --ios or --android', async () => {
  expect(await prepareDevices({ context: context({}) })).toEqual([]);
  expect(mockRunDeviceTool).not.toHaveBeenCalled();
});

test('checkIosTools says the simulator needs macOS on another platform', async () => {
  await expect(checkIosTools({ platform: 'linux' })).rejects.toThrow(
    'The iOS simulator runs only on macOS. Use --android, or --lan to pair a phone.'
  );
});

test('checkIosTools asks xcrun for simctl', async () => {
  await checkIosTools({ platform: 'darwin' });
  expect(mockRunDeviceTool).toHaveBeenCalledWith({ command: 'xcrun', args: ['--find', 'simctl'] });
});

test('checkIosTools gives the Xcode install step when simctl is missing', async () => {
  mockRunDeviceTool.mockRejectedValue(
    new Error('xcrun --find simctl failed: xcrun: error: unable to find utility "simctl"')
  );
  await expect(checkIosTools({ platform: 'darwin' })).rejects.toThrow(
    'The iOS simulator needs Xcode. Install it from the App Store (https://apps.apple.com/app/xcode/id497799835), open it once so it installs the iOS simulator, then run: sudo xcode-select --switch /Applications/Xcode.app'
  );
});

test('prepareDevices gives the adb install step when adb is missing', async () => {
  mockRunDeviceTool.mockRejectedValue(missingTool('adb'));
  await expect(prepareDevices({ context: context({ android: true }) })).rejects.toThrow(
    '--android needs adb from the Android SDK. Install Android Studio (https://developer.android.com/studio), or only the SDK platform tools (https://developer.android.com/tools/releases/platform-tools), then put platform-tools on your PATH or set ANDROID_HOME to the SDK folder.'
  );
  expect(mockRunDeviceTool).toHaveBeenCalledWith({ command: 'adb', args: ['version'] });
});

test('prepareDevices uses the SDK tools ANDROID_HOME names', async () => {
  const sdk = path.join(directory, 'sdk');
  fs.mkdirSync(path.join(sdk, 'platform-tools'), { recursive: true });
  fs.mkdirSync(path.join(sdk, 'emulator'), { recursive: true });
  fs.writeFileSync(path.join(sdk, 'platform-tools', 'adb'), '');
  fs.writeFileSync(path.join(sdk, 'emulator', 'emulator'), '');
  process.env.ANDROID_HOME = sdk;
  const apk = path.join(directory, 'lowdefy-dev.apk');
  fs.writeFileSync(apk, '');
  process.env.LOWDEFY_DEV_APP_ANDROID = apk;
  expect(await prepareDevices({ context: context({ android: true }) })).toEqual([
    {
      platform: 'android',
      appPath: apk,
      adb: path.join(sdk, 'platform-tools', 'adb'),
      emulator: path.join(sdk, 'emulator', 'emulator'),
    },
  ]);
});

test('prepareDevices says which variable names the Lowdefy Dev build when it is unset', async () => {
  await expect(prepareDevices({ context: context({ android: true }) })).rejects.toThrow(
    'Set LOWDEFY_DEV_APP_ANDROID to the path of a Lowdefy Dev Android build (.apk). Lowdefy Dev release builds are not published yet, so Lowdefy installs the build this variable names.'
  );
});

test('prepareDevices refuses a Lowdefy Dev build path that does not exist', async () => {
  process.env.LOWDEFY_DEV_APP_ANDROID = path.join(directory, 'missing.apk');
  await expect(prepareDevices({ context: context({ android: true }) })).rejects.toThrow(
    `LOWDEFY_DEV_APP_ANDROID names "${path.join(directory, 'missing.apk')}", which does not exist.`
  );
});

const onMac = process.platform === 'darwin' ? test : test.skip;

onMac('prepareDevices returns the iOS build when xcrun finds simctl', async () => {
  const app = path.join(directory, 'LowdefyDev.app');
  fs.mkdirSync(app);
  process.env.LOWDEFY_DEV_APP_IOS = app;
  expect(await prepareDevices({ context: context({ ios: true }) })).toEqual([
    { platform: 'ios', appPath: app },
  ]);
});
