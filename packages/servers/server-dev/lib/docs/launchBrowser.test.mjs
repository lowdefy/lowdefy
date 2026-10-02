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

const mockLaunch = jest.fn();
const mockInstall = jest.fn();
jest.unstable_mockModule('playwright-core', () => ({ chromium: { launch: mockLaunch } }));
jest.unstable_mockModule('./installHeadlessShell.js', () => ({ default: mockInstall }));

const { default: launchBrowser } = await import('./launchBrowser.js');

const shellMissing = new Error(
  "browserType.launch: Executable doesn't exist at /cache/chromium_headless_shell-1217/chrome-headless-shell"
);
const chromeMissing = new Error('browserType.launch: Chromium distribution "chrome" is not found.');

function isChromeLaunch(options) {
  return options.channel === 'chrome';
}

afterEach(() => {
  delete process.env.LOWDEFY_BROWSER_TAG;
});

test('launchBrowser launches the headless shell and never system Chrome when the shell is installed', async () => {
  const shell = { name: 'shell' };
  mockLaunch.mockResolvedValue(shell);

  expect(await launchBrowser()).toBe(shell);
  expect(mockLaunch).toHaveBeenCalledTimes(1);
  expect(mockLaunch.mock.calls[0][0]).toEqual({ args: [] });
  expect(mockInstall).not.toHaveBeenCalled();
});

test('launchBrowser tags the browser with the tag the manager gave this child', async () => {
  process.env.LOWDEFY_BROWSER_TAG = 'tag-1';
  mockLaunch.mockImplementation(async (options) => {
    if (isChromeLaunch(options)) return { name: 'chrome' };
    throw shellMissing;
  });
  mockInstall.mockReturnValue(null);

  await launchBrowser();

  expect(mockLaunch.mock.calls[0][0]).toEqual({ args: ['--lowdefy-browser-tag=tag-1'] });
  expect(mockLaunch.mock.calls[1][0]).toEqual({
    channel: 'chrome',
    args: ['--lowdefy-browser-tag=tag-1'],
  });
});

test('launchBrowser serves the call with system Chrome while the shell installs', async () => {
  const chrome = { name: 'chrome' };
  mockLaunch.mockImplementation(async (options) => {
    if (isChromeLaunch(options)) return chrome;
    throw shellMissing;
  });
  // Never settles: the call must not wait for the download.
  mockInstall.mockReturnValue(new Promise(() => {}));

  expect(await launchBrowser()).toBe(chrome);
  expect(mockInstall).toHaveBeenCalledTimes(1);
});

test('launchBrowser waits for the shell install when system Chrome is missing too', async () => {
  const shell = { name: 'shell' };
  let installed = false;
  mockLaunch.mockImplementation(async (options) => {
    if (isChromeLaunch(options)) throw chromeMissing;
    if (!installed) throw shellMissing;
    return shell;
  });
  mockInstall.mockImplementation(async () => {
    installed = true;
    return { installed: true };
  });

  expect(await launchBrowser()).toBe(shell);
  expect(mockLaunch).toHaveBeenCalledTimes(3);
});

test('launchBrowser says why when both browsers are missing and the install failed or timed out', async () => {
  mockLaunch.mockImplementation(async (options) => {
    throw isChromeLaunch(options) ? chromeMissing : shellMissing;
  });
  mockInstall.mockResolvedValue({
    installed: false,
    reason: 'the install did not finish within 3 minutes',
  });

  await expect(launchBrowser()).rejects.toThrow(
    'The chromium-headless-shell install failed (the install did not finish within 3 minutes), and system Chrome is not installed.'
  );
});

test('launchBrowser throws the shell error when both browsers are missing and downloads are off', async () => {
  mockLaunch.mockImplementation(async (options) => {
    throw isChromeLaunch(options) ? chromeMissing : shellMissing;
  });
  mockInstall.mockReturnValue(null);

  await expect(launchBrowser()).rejects.toBe(shellMissing);
  expect(mockLaunch).toHaveBeenCalledTimes(2);
});

test('launchBrowser falls back to system Chrome without installing when the shell fails for another reason', async () => {
  const chrome = { name: 'chrome' };
  mockLaunch.mockImplementation(async (options) => {
    if (isChromeLaunch(options)) return chrome;
    throw new Error('browserType.launch: Target page, context or browser has been closed');
  });

  expect(await launchBrowser()).toBe(chrome);
  expect(mockInstall).not.toHaveBeenCalled();
});
