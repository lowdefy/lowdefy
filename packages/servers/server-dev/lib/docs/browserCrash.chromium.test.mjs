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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { vi, afterAll, expect, test } from 'vitest';

// A real Chromium whose renderers exit as they start, so newPage answers `Target crashed` while
// the browser process stays up and connected. openPage must say the browser crashed, and the next
// getBrowser must hand out a new browser whose openPage works. The first browser launched runs
// every renderer through a launcher that exits at once; the ones after it launch as usual.
// Skipped when no Chromium can be launched, and on Windows, which runs no shell script.
vi.doMock('../build/config.js', () => ({ default: {} }));

let directory = null;
let deadRenderer = null;

const launched = [];
vi.doMock('playwright-core', async (importOriginal) => {
  const playwright = await importOriginal();
  const chromium = new Proxy(playwright.chromium, {
    get(target, property) {
      if (property !== 'launch') {
        return Reflect.get(target, property, target);
      }
      return async (options = {}) => {
        const args =
          launched.length === 0
            ? [...(options.args ?? []), `--renderer-cmd-prefix=${deadRenderer}`]
            : options.args;
        const browser = await target.launch({ ...options, args });
        launched.push(browser);
        return browser;
      };
    },
  });
  return { ...playwright, chromium };
});

const { getBrowser, openPage } = await import('./getBrowser.js');

const origin = 'http://127.0.0.1:4019';

let crashing = null;
if (process.platform !== 'win32') {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-browser-crash-'));
  deadRenderer = path.join(directory, 'dead-renderer.sh');
  fs.writeFileSync(deadRenderer, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  try {
    crashing = await getBrowser({ origin });
  } catch {
    crashing = null;
  }
}
// A file whose tests are all skipped runs no afterAll.
function removeDirectory() {
  if (directory !== null) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
if (crashing === null) {
  removeDirectory();
}
const chromiumTest = crashing === null ? test.skip : test;

afterAll(async () => {
  await Promise.all(launched.map((browser) => browser.close().catch(() => {})));
  removeDirectory();
});

chromiumTest(
  'a browser whose renderers crash is replaced, and the next openPage works',
  async () => {
    // A page-less openPage goes as far as newPage, whose renderer exits as it starts.
    // An Error, so the whole message must match, not only part of it.
    await expect(openPage({ browser: crashing, origin })).rejects.toThrow(
      new Error(
        'The headless browser crashed (browserContext.newPage: Target crashed); it is relaunched for the next call.'
      )
    );
    expect(crashing.isConnected()).toBe(true);

    const fresh = await getBrowser({ origin });
    expect(fresh).not.toBe(crashing);

    const { context, page } = await openPage({ browser: fresh, origin });
    try {
      expect(await page.evaluate(() => 1 + 1)).toBe(2);
    } finally {
      await context.close();
    }
  },
  10000
);
