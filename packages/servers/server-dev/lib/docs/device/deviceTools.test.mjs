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
import path from 'path';

import { jest } from '@jest/globals';

import setupTestFixtures from '../setupTestFixtures.mjs';

// inspectState and loadState import getBrowser, which reads build/config.json from the working
// directory at import; checkpoints are stored under LOWDEFY_DIRECTORY_CONFIG.
const fixtureDir = setupTestFixtures();
process.chdir(fixtureDir);
process.env.LOWDEFY_DIRECTORY_CONFIG = fixtureDir;

jest.unstable_mockModule('playwright-core', () => ({
  chromium: { launch: jest.fn().mockRejectedValue(new Error("Executable doesn't exist")) },
}));
jest.unstable_mockModule('../installHeadlessShell.js', () => ({ default: () => null }));

const { default: createFakePhoneTab, VIEW_PNG } = await import('./createFakePhoneTab.mjs');
const { default: deviceAction } = await import('./deviceAction.js');
const { default: injectDevice } = await import('./injectDevice.js');
const { default: inspectState } = await import('../inspectState.js');
const { default: loadState } = await import('../loadState.js');
const { default: runDeviceJourney } = await import('./runDeviceJourney.js');
const { default: screenshotDevice } = await import('./screenshotDevice.js');
const { default: startDevice } = await import('./startDevice.js');
const { writeCheckpoint } = await import('../checkpointStore.js');
const { getMock } = await import('../devMockRegistry.js');
const { registerTab, unregisterTab, updateTabPage } = await import('../tabChannel.js');

const TICKET = { pageId: 'ticket', pathParams: {}, instanceKey: 'page:ticket' };
const SIMULATOR = { shell: '7.1.0', platform: 'ios', app: 'com.lowdefy.dev', paired: false };
const EMULATOR = { shell: '7.1.0', platform: 'android', app: 'com.lowdefy.dev', paired: false };
const PAIRED = { shell: '7.1.0', platform: 'ios', app: 'com.lowdefy.dev', paired: true };

const ONE_SIMULATOR = JSON.stringify({
  devices: {
    'com.apple.CoreSimulator.SimRuntime.iOS-18-2': [
      { udid: 'SIM-1', name: 'iPhone 16', state: 'Booted' },
    ],
  },
});
const TWO_SIMULATORS = JSON.stringify({
  devices: {
    'com.apple.CoreSimulator.SimRuntime.iOS-18-2': [
      { udid: 'SIM-1', name: 'iPhone 16', state: 'Booted' },
      { udid: 'SIM-2', name: 'iPhone 16 Pro', state: 'Booted' },
    ],
  },
});
const ONE_EMULATOR = 'List of devices attached\nemulator-5554  device model:sdk_gphone64\n';

// Stands in for runDeviceTool: records each command line and answers the listings. A simulator
// screenshot writes its PNG to the file the command names, as simctl does.
function fakeRun({ simulators = ONE_SIMULATOR, android = ONE_EMULATOR } = {}) {
  const calls = [];
  async function run({ command, args, encoding }) {
    calls.push([command, ...args]);
    if (args.includes('list')) return simulators;
    if (args[0] === 'devices') return android;
    if (args.includes('screenshot')) {
      fs.writeFileSync(args[args.length - 1], 'SIM-PNG');
      return '';
    }
    if (args.includes('screencap')) {
      expect(encoding).toEqual('buffer');
      return Buffer.from('ADB-PNG');
    }
    if (args.includes('push')) {
      calls.push(['payload', JSON.parse(fs.readFileSync(args[args.length - 1], 'utf8'))]);
    }
    return '';
  }
  return { calls, run };
}

const devices = { adb: 'adb', platform: 'darwin' };

let phone;
afterEach(() => {
  phone?.close();
  phone = undefined;
});

function events() {
  return phone.requests.map(({ event, data }) => [event, data.step ?? data.inject ?? null]);
}

test('screenshotDevice runs steps on the phone, then captures a lone simulator with simctl', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: SIMULATOR, page: TICKET });
  const { calls, run } = fakeRun();
  const result = await screenshotDevice({
    device: 'phone-1',
    pageId: 'ticket',
    steps: [{ fill: { blockId: 'title', value: 'Leak' } }, { click: 'save' }],
    devices,
    run,
  });
  expect(events()).toEqual([
    ['step-request', { fill: { blockId: 'title', value: 'Leak' } }],
    ['step-request', { click: 'save' }],
  ]);
  expect(result).toMatchObject({
    data: Buffer.from('SIM-PNG').toString('base64'),
    mimeType: 'image/png',
    capture: 'simctl',
    device: 'phone-1',
    screenshots: [],
  });
  expect(result.failure).toBeUndefined();
  expect(calls[0]).toEqual(['xcrun', 'simctl', 'list', 'devices', 'booted', '--json']);
  expect(calls.at(-1).slice(0, 6)).toEqual([
    'xcrun',
    'simctl',
    'io',
    'SIM-1',
    'screenshot',
    '--type=png',
  ]);
});

test('screenshotDevice captures a lone Android device with adb', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: EMULATOR, page: TICKET });
  const { calls, run } = fakeRun();
  const result = await screenshotDevice({ device: 'phone-1', pageId: 'ticket', devices, run });
  expect(result.capture).toEqual('adb');
  expect(result.data).toEqual(Buffer.from('ADB-PNG').toString('base64'));
  expect(calls.at(-1)).toEqual(['adb', '-s', 'emulator-5554', 'exec-out', 'screencap', '-p']);
});

test('screenshotDevice lets a paired phone capture its own view, running no device tool', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: PAIRED, page: TICKET });
  const { calls, run } = fakeRun();
  const result = await screenshotDevice({ device: 'phone-1', pageId: 'ticket', devices, run });
  expect(calls).toEqual([]);
  expect(events()).toEqual([['step-request', { screenshot: null }]]);
  expect(result).toMatchObject({ data: VIEW_PNG, capture: 'view' });
  expect(result.note).toContain('paired over the network');
});

test('screenshotDevice falls back to the view when several simulators could hold the tab', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: SIMULATOR, page: TICKET });
  const { run } = fakeRun({ simulators: TWO_SIMULATORS });
  const result = await screenshotDevice({ device: 'phone-1', pageId: 'ticket', devices, run });
  expect(result.capture).toEqual('view');
  expect(result.note).toContain('2 iOS simulators are booted');
});

test('screenshotDevice falls back to the view when simctl fails', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: SIMULATOR, page: TICKET });
  const { run: listRun } = fakeRun();
  const run = async (command) => {
    if (command.args.includes('screenshot')) throw new Error('simctl io failed: device busy');
    return listRun(command);
  };
  const result = await screenshotDevice({ device: 'phone-1', pageId: 'ticket', devices, run });
  expect(result.capture).toEqual('view');
  expect(result.note).toContain('simctl io failed: device busy');
});

test('screenshotDevice returns a failed step beside the capture, the later steps skipped', async () => {
  phone = createFakePhoneTab({
    id: 'phone-1',
    device: PAIRED,
    page: TICKET,
    answer: (event, data) =>
      data.step?.click === 'missing' ? { error: 'No block "missing" on the page.' } : undefined,
  });
  const result = await screenshotDevice({
    device: 'phone-1',
    pageId: 'ticket',
    steps: [{ click: 'missing' }, { click: 'save' }],
    devices,
    run: fakeRun().run,
  });
  expect(result.failure).toEqual({
    index: 0,
    step: { click: 'missing' },
    expected: 'step 0 (click) to complete',
    actual: 'No block "missing" on the page.',
    message: 'No block "missing" on the page.',
  });
  expect(events()).toEqual([
    ['step-request', { click: 'missing' }],
    ['step-request', { screenshot: null }],
  ]);
  expect(result.data).toEqual(VIEW_PNG);
});

test('screenshotDevice returns screenshot step captures from the phone', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: PAIRED, page: TICKET });
  const result = await screenshotDevice({
    device: 'phone-1',
    pageId: 'ticket',
    steps: [{ screenshot: 'before' }, { click: 'save' }],
    devices,
    run: fakeRun().run,
  });
  expect(result.screenshots).toEqual([{ name: 'before', data: VIEW_PNG, mimeType: 'image/png' }]);
});

test('screenshotDevice refuses a step a phone does not run, before running any', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: SIMULATOR, page: TICKET });
  const result = await screenshotDevice({
    device: 'phone-1',
    pageId: 'ticket',
    steps: [{ click: 'save' }, { open: 'status' }, { expect: { visible: 'save' } }],
    devices,
    run: fakeRun().run,
  });
  expect(result.error).toEqual(
    'A phone runs the steps click, fill, select, press, wait, screenshot and expect with "state", by blockId. Not supported on a phone: "open", {"expect": ["visible"]} (a phone checks only "state").'
  );
  expect(phone.requests).toEqual([]);
});

test('screenshotDevice refuses a page the phone does not show', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: SIMULATOR, page: TICKET });
  const result = await screenshotDevice({ device: 'phone-1', pageId: 'home', devices });
  expect(result.error).toContain('shows page "ticket", not "home"');
  expect(phone.requests).toEqual([]);
});

test('screenshotDevice refuses an unknown tab and a browser tab', async () => {
  expect((await screenshotDevice({ device: 'nope', pageId: 'ticket' })).error).toContain(
    'No phone is connected as tab "nope"'
  );
  registerTab({ id: 'browser-1', send: () => undefined });
  expect((await screenshotDevice({ device: 'browser-1', pageId: 'ticket' })).error).toContain(
    'is a browser tab, not a phone'
  );
  unregisterTab({ id: 'browser-1' });
});

test('inspectState with device reads that phone, not a browser tab on the same page', async () => {
  registerTab({ id: 'browser-1', send: () => undefined });
  updateTabPage({ id: 'browser-1', ...TICKET });
  phone = createFakePhoneTab({
    id: 'phone-1',
    device: SIMULATOR,
    page: TICKET,
    state: { title: 'From the phone' },
  });
  const result = await inspectState({ pageId: 'ticket', device: 'phone-1' });
  expect(result).toMatchObject({
    source: 'tab',
    device: 'phone-1',
    state: { title: 'From the phone' },
  });
  expect(phone.requests.map(({ event, data }) => [event, data.instanceKey])).toEqual([
    ['inspect-request', 'page:ticket'],
  ]);
  unregisterTab({ id: 'browser-1' });
});

test('inspectState with device refuses source headless, user and a missing phone', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: SIMULATOR, page: TICKET });
  expect(
    await inspectState({ pageId: 'ticket', device: 'phone-1', source: 'headless' })
  ).toMatchObject({ invalidInput: true });
  expect(
    (await inspectState({ pageId: 'ticket', device: 'phone-1', user: { roles: ['admin'] } })).error
  ).toContain('cannot apply "user" to a phone');
  expect((await inspectState({ pageId: 'ticket', device: 'gone' })).error).toContain(
    'No phone is connected as tab "gone"'
  );
});

test('inspectState with device refuses a page the phone has not shown', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: SIMULATOR, page: TICKET });
  const result = await inspectState({ pageId: 'home', device: 'phone-1' });
  expect(result.error).toContain('Tab "phone-1" has not shown page "home"');
});

test.each([
  ['scan', { kind: 'scan', value: { data: 'JOB-42' } }],
  ['photo', { kind: 'photo', value: { base64: 'iVBOR' } }],
  ['nfc', { kind: 'nfc', value: { id: '04:A2' } }],
  ['location', { kind: 'location', value: { latitude: -33.92, longitude: 18.42 } }],
  ['permission', { kind: 'permission', name: 'camera', value: 'denied' }],
  ['network', { kind: 'network', value: 'offline' }],
  ['push', { kind: 'push', value: { aps: { alert: 'Hi' } } }],
  ['clear', { kind: 'clear' }],
])('injectDevice forwards a %s injection to Lowdefy Dev', async (kind, inject) => {
  phone = createFakePhoneTab({ id: 'phone-1', device: EMULATOR, page: TICKET });
  const { calls, run } = fakeRun();
  const result = await injectDevice({ device: 'phone-1', inject, devices, run });
  expect(phone.requests.map(({ event, data }) => [event, data.inject])).toEqual([
    ['inject', { kind: inject.kind, value: inject.value, name: inject.name }],
  ]);
  expect(result).toEqual({ device: 'phone-1', kind, app: { ok: true, kind } });
  expect(calls).toEqual([]);
});

test('injectDevice returns what Lowdefy Dev refused', async () => {
  phone = createFakePhoneTab({
    id: 'phone-1',
    device: EMULATOR,
    page: TICKET,
    answer: () => ({ error: 'A scan injection needs { data }. Received "JOB-42".' }),
  });
  const result = await injectDevice({
    device: 'phone-1',
    inject: { kind: 'scan', value: 'JOB-42' },
    devices,
    run: fakeRun().run,
  });
  expect(result).toEqual({ error: 'A scan injection needs { data }. Received "JOB-42".' });
});

test('injectDevice also sets a location on the simulator with simctl', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: SIMULATOR, page: TICKET });
  const { calls, run } = fakeRun();
  const value = [
    { latitude: -33.92, longitude: 18.42 },
    { latitude: -33.93, longitude: 18.43 },
  ];
  const result = await injectDevice({
    device: 'phone-1',
    inject: { kind: 'location', value },
    devices,
    run,
  });
  expect(phone.requests).toHaveLength(1);
  expect(calls.at(-1)).toEqual([
    'xcrun',
    'simctl',
    'location',
    'SIM-1',
    'start',
    '-33.92,18.42',
    '-33.93,18.43',
  ]);
  expect(result.simulator).toEqual({ ok: true, simulator: 'iPhone 16' });
});

test('injectDevice delivers a push to the simulator with simctl alone', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: SIMULATOR, page: TICKET });
  const { calls, run } = fakeRun();
  const payload = { aps: { alert: { title: 'New ticket', body: 'Ticket 7' } } };
  const result = await injectDevice({
    device: 'phone-1',
    inject: { kind: 'push', value: payload },
    devices,
    run,
  });
  expect(phone.requests).toEqual([]);
  const push = calls.find((call) => call.includes('push'));
  expect(push.slice(0, 5)).toEqual(['xcrun', 'simctl', 'push', 'SIM-1', 'com.lowdefy.dev']);
  expect(calls.at(-1)).toEqual(['payload', payload]);
  expect(result).toEqual({
    device: 'phone-1',
    ok: true,
    kind: 'push',
    via: 'simctl',
    simulator: 'iPhone 16',
  });
});

test('injectDevice sends a push without aps to Lowdefy Dev, even on a simulator', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: SIMULATOR, page: TICKET });
  const { calls, run } = fakeRun();
  const result = await injectDevice({
    device: 'phone-1',
    inject: { kind: 'push', value: { title: 'Hi' } },
    devices,
    run,
  });
  expect(result.error).toBeUndefined();
  expect(phone.requests).toHaveLength(1);
  expect(calls.some((call) => call.includes('push'))).toBe(false);
});

test('injectDevice grants a permission on the simulator after Lowdefy Dev answers it', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: SIMULATOR, page: TICKET });
  const { calls, run } = fakeRun();
  const result = await injectDevice({
    device: 'phone-1',
    inject: { kind: 'permission', name: 'location', value: 'granted' },
    devices,
    run,
  });
  expect(phone.requests).toHaveLength(1);
  expect(calls.at(-1)).toEqual([
    'xcrun',
    'simctl',
    'privacy',
    'SIM-1',
    'grant',
    'location',
    'com.lowdefy.dev',
  ]);
  expect(result.simulator.ok).toBe(true);
});

test('injectDevice leaves a permission the simulator has no service for to Lowdefy Dev', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: SIMULATOR, page: TICKET });
  const { calls, run } = fakeRun();
  const result = await injectDevice({
    device: 'phone-1',
    inject: { kind: 'permission', name: 'camera', value: 'denied' },
    devices,
    run,
  });
  expect(calls.some((call) => call.includes('privacy'))).toBe(false);
  expect(result.simulator.ok).toBe(false);
  expect(result.simulator.note).toContain('no privacy service "camera"');
});

test('injectDevice runs no simctl for a phone paired over the network', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: PAIRED, page: TICKET });
  const { calls, run } = fakeRun();
  await injectDevice({
    device: 'phone-1',
    inject: { kind: 'location', value: { latitude: 1, longitude: 2 } },
    devices,
    run,
  });
  expect(calls).toEqual([]);
  expect(phone.requests).toHaveLength(1);
});

test('runDeviceJourney runs the steps on the phone and checks its state', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: PAIRED, page: TICKET });
  const result = await runDeviceJourney({
    device: 'phone-1',
    pageId: 'ticket',
    steps: [
      { fill: { blockId: 'title', value: 'Leak' } },
      { click: 'save' },
      { expect: { state: { path: 'title', equals: 'Leak' } } },
    ],
  });
  expect(result).toMatchObject({
    pageId: 'ticket',
    device: 'phone-1',
    passed: true,
    state: { title: 'Leak' },
    screenshots: [],
  });
  expect(result.steps.map(({ status }) => status)).toEqual(['ok', 'ok', 'ok']);
});

test('runDeviceJourney fails at an expect state that does not hold, with expected and actual', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: PAIRED, page: TICKET, state: { n: 1 } });
  const result = await runDeviceJourney({
    device: 'phone-1',
    pageId: 'ticket',
    steps: [{ expect: { state: { path: 'n', equals: 2 } } }, { click: 'save' }],
    stepTimeout: 50,
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toEqual({
    index: 0,
    step: { expect: { state: { path: 'n', equals: 2 } } },
    expected: 2,
    actual: 1,
    message: 'Expected state "n" to equal 2 but found 1.',
  });
  expect(result.steps.map(({ status }) => status)).toEqual(['failed', 'skipped']);
});

test('loadState with device sets the checkpoint state on the phone and serves its requests', async () => {
  writeCheckpoint({
    name: 'phone-ticket',
    overwrite: true,
    snapshot: {
      pageId: 'ticket',
      pathParams: {},
      state: { title: 'Annual', priority: 'low' },
      requests: { get_ticket: [{ response: { id: 7 } }] },
    },
  });
  phone = createFakePhoneTab({ id: 'phone-1', device: SIMULATOR, page: TICKET });
  const result = await loadState({ name: 'phone-ticket', device: 'phone-1' });
  expect(phone.requests.map(({ event, data }) => [event, data.state, data.instanceKey])).toEqual([
    ['load-state-request', { title: 'Annual', priority: 'low' }, 'page:ticket'],
  ]);
  expect(result).toMatchObject({
    loaded: true,
    mode: 'device',
    device: 'phone-1',
    verifiedKeys: { title: 'Annual', priority: 'low' },
  });
  expect(getMock({ pageId: 'ticket', requestId: 'get_ticket' })).toBeDefined();
});

test('loadState with device refuses a mode', async () => {
  phone = createFakePhoneTab({ id: 'phone-1', device: SIMULATOR, page: TICKET });
  const result = await loadState({ name: 'phone-ticket', device: 'phone-1', mode: 'headless' });
  expect(result).toMatchObject({ invalidInput: true });
  expect(phone.requests).toEqual([]);
});

test('startDevice boots a simulator, installs Lowdefy Dev and opens it on this server', async () => {
  const appPath = path.join(fixtureDir, 'LowdefyDev.app');
  fs.mkdirSync(appPath, { recursive: true });
  process.env.LOWDEFY_DEV_APP_IOS = appPath;
  const calls = [];
  const run = async ({ command, args }) => {
    calls.push([command, ...args]);
    if (args.includes('available')) {
      return JSON.stringify({
        devices: {
          'com.apple.CoreSimulator.SimRuntime.iOS-18-2': [
            { udid: 'SIM-1', name: 'iPhone 16', state: 'Shutdown' },
          ],
        },
      });
    }
    if (args.includes('openurl')) {
      setTimeout(() => {
        phone = createFakePhoneTab({ id: 'phone-new', device: SIMULATOR });
      }, 10);
    }
    return '';
  };
  const result = await startDevice({
    platform: 'ios',
    origin: 'http://localhost:3005',
    hostPlatform: 'darwin',
    run,
    tabTimeout: 2000,
  });
  expect(calls).toEqual([
    ['xcrun', 'simctl', 'list', 'devices', 'available', '--json'],
    ['xcrun', 'simctl', 'boot', 'SIM-1'],
    ['open', '-a', 'Simulator'],
    ['xcrun', 'simctl', 'bootstatus', 'SIM-1'],
    ['xcrun', 'simctl', 'install', 'SIM-1', appPath],
    [
      'xcrun',
      'simctl',
      'openurl',
      'SIM-1',
      'lowdefy-dev://connect?url=http%3A%2F%2Flocalhost%3A3005',
    ],
  ]);
  expect(result).toEqual({
    started: true,
    platform: 'ios',
    url: 'http://localhost:3005',
    simulator: { udid: 'SIM-1', name: 'iPhone 16' },
    device: 'phone-new',
  });
});

test('startDevice installs on an Android device, reverses the port and opens the link', async () => {
  const appPath = path.join(fixtureDir, 'lowdefy-dev.apk');
  fs.writeFileSync(appPath, '');
  process.env.LOWDEFY_DEV_APP_ANDROID = appPath;
  const calls = [];
  const run = async ({ command, args }) => {
    calls.push([command, ...args]);
    if (args[0] === 'devices') return 'List of devices attached\nemulator-5554\tdevice\n';
    return '';
  };
  const result = await startDevice({
    platform: 'android',
    origin: 'http://localhost:3005',
    run,
    tabTimeout: 10,
  });
  const adb = calls[0][0];
  expect(calls).toEqual([
    [adb, 'devices'],
    [adb, '-s', 'emulator-5554', 'install', '-r', appPath],
    [adb, '-s', 'emulator-5554', 'reverse', 'tcp:3005', 'tcp:3005'],
    [
      adb,
      '-s',
      'emulator-5554',
      'shell',
      'am',
      'start',
      '-a',
      'android.intent.action.VIEW',
      '-d',
      "'lowdefy-dev://connect?url=http%3A%2F%2Flocalhost%3A3005'",
    ],
  ]);
  expect(result.device).toBeNull();
  expect(result.note).toContain('has not joined as a tab');
});

test('startDevice refuses the iOS simulator off macOS and an unknown platform', async () => {
  expect(
    (await startDevice({ platform: 'ios', origin: 'http://localhost:3005', hostPlatform: 'linux' }))
      .error
  ).toContain('runs only on macOS');
  expect((await startDevice({ platform: 'watch', origin: 'http://localhost:3005' })).error).toEqual(
    'start needs "platform" "ios" or "android". Received "watch".'
  );
});

test('deviceAction list names each connected phone by tab id, and the simulators and devices', async () => {
  registerTab({ id: 'browser-1', send: () => undefined });
  phone = createFakePhoneTab({ id: 'phone-1', device: PAIRED, page: TICKET });
  const result = await deviceAction({ action: 'list', devices: { ...devices, ...fakeRun() } });
  expect(result.phones).toEqual([
    {
      device: 'phone-1',
      platform: 'ios',
      app: 'com.lowdefy.dev',
      shell: '7.1.0',
      paired: true,
      pageId: 'ticket',
      pathParams: {},
      connectedAt: expect.any(Date),
    },
  ]);
  expect(result.simulators).toEqual([{ udid: 'SIM-1', name: 'iPhone 16', runtime: 'iOS-18-2' }]);
  expect(result.android).toEqual([
    { serial: 'emulator-5554', emulator: true, model: 'sdk_gphone64' },
  ]);
  unregisterTab({ id: 'browser-1' });
});

test('deviceAction refuses an unknown action', async () => {
  expect(await deviceAction({ action: 'reboot' })).toEqual({
    error: '"action" must be one of list, start, inject. Received "reboot".',
  });
});
