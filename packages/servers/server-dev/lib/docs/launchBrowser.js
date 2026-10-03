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

import { type } from '@lowdefy/helpers';

import installHeadlessShell from './installHeadlessShell.js';
import isHeadlessShellIncomplete from './isHeadlessShellIncomplete.js';

// The manager tags every browser this child launches, so it can kill one
// left behind when the child is killed outright (system Chrome runs in its
// own process group and outlives a SIGKILLed parent). Chrome and the shell
// ignore switches they do not know.
function launchArgs() {
  const tag = process.env.LOWDEFY_BROWSER_TAG;
  if (type.isNone(tag) || tag === '') {
    return [];
  }
  return [`--lowdefy-browser-tag=${tag}`];
}

function isExecutableMissing(error) {
  return type.isString(error?.message) && error.message.includes("Executable doesn't exist");
}

// A shell whose install was cut short (a timed-out install this server
// killed, a dev server killed mid-download) has its executable but no
// completion marker, and fails to launch with some other error. It is as
// missing as one never installed, and the installer repairs it.
async function isShellMissing(error) {
  if (isExecutableMissing(error)) {
    return true;
  }
  return isHeadlessShellIncomplete();
}

// Playwright's chromium-headless-shell first: a fifth of system Chrome's
// memory per page, a launch under a second, and it exits with its parent.
// System Chrome is the fallback while the shell is missing. playwright-core
// is imported here, not at the top of the module, so the Vite child does not
// load it at boot.
async function launchBrowser() {
  const { chromium } = await import('playwright-core');
  const args = launchArgs();
  try {
    return await chromium.launch({ args });
  } catch (shellError) {
    const install = (await isShellMissing(shellError)) ? installHeadlessShell() : null;
    try {
      return await chromium.launch({ channel: 'chrome', args });
    } catch {
      if (type.isNone(install)) {
        throw shellError;
      }
      // No Chrome either: this call waits for the shell download, which
      // gives up after a time limit (installHeadlessShell.js).
      const { installed, reason } = await install;
      if (!installed) {
        throw new Error(
          `The chromium-headless-shell install failed (${reason}), and system Chrome is not installed.`
        );
      }
      return await chromium.launch({ args });
    }
  }
}

export default launchBrowser;
