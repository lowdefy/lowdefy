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

import { execFileSync } from 'node:child_process';

import { vi, afterAll, expect, test } from 'vitest';

// A real Chromium whose renderer processes are killed as they start, so newPage answers
// `Target crashed` while the browser process stays up and connected. openPage must say the
// browser crashed, and the next getBrowser must hand out a new browser whose openPage works.
// Skipped when no Chromium can be launched, and on Windows, which has no ps.
vi.doMock('../build/config.js', () => ({ default: {} }));

const tag = `crash-test-${process.pid}`;
process.env.LOWDEFY_BROWSER_TAG = tag;

const { getBrowser, openPage } = await import('./getBrowser.js');

const origin = 'http://127.0.0.1:4019';

let browser = null;
if (process.platform !== 'win32') {
  try {
    browser = await getBrowser({ origin });
  } catch {
    browser = null;
  }
}
const chromiumTest = browser === null ? test.skip : test;

const opened = [];

afterAll(async () => {
  await Promise.all(opened.map((context) => context.close().catch(() => {})));
  const current = await getBrowser({ origin }).catch(() => null);
  await current?.close();
  await browser?.close();
}, 30000);

// Synchronous, so a renderer dies within a few milliseconds of starting: soon enough to meet the
// newPage that started it.
function listProcesses() {
  return execFileSync('ps', ['-axo', 'pid=,ppid=,command='], { maxBuffer: 16 * 1024 * 1024 })
    .toString()
    .split('\n')
    .map((line) => line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/))
    .filter(Boolean)
    .map(([, pid, ppid, command]) => ({ pid: Number(pid), ppid: Number(ppid), command }));
}

// The renderers of the tagged browser: on Linux they hang off its zygote, not the browser itself.
function killRenderers() {
  const processes = listProcesses();
  const root = processes.find(
    ({ command }) =>
      / --lowdefy-browser-tag=(\S+)/.exec(command)?.[1] === tag && !command.includes('--type=')
  );
  if (root === undefined) {
    return;
  }
  const tree = new Set([root.pid]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const { pid, ppid } of processes) {
      if (tree.has(ppid) && !tree.has(pid)) {
        tree.add(pid);
        grew = true;
      }
    }
  }
  for (const { pid, command } of processes) {
    if (tree.has(pid) && command.includes('--type=renderer')) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        // Gone already.
      }
    }
  }
}

chromiumTest(
  'a browser whose renderers crash is replaced, and the next openPage works',
  async () => {
    let killing = true;
    const killer = (async () => {
      while (killing) {
        killRenderers();
        await new Promise((resolve) => setTimeout(resolve, 2));
      }
    })();
    // Pageless openPage calls go as far as newPage; one of them meets a renderer killed while it
    // starts. A try may instead open a page whose renderer dies later, which is no crash of
    // newPage, or take the whole browser process down, which getBrowser already handles as a
    // disconnect: either way the next try takes the browser getBrowser gives then. Under load
    // Chromium can also stall on a killed renderer until it exits a minute later; a try that
    // stalls closes its browser, which is that same disconnect sooner.
    let crash = null;
    let crashed = null;
    try {
      for (let attempt = 0; attempt < 40 && crash === null; attempt += 1) {
        const current = await getBrowser({ origin });
        const opening = openPage({ browser: current, origin });
        let timer;
        const stalled = new Promise((resolve) => {
          timer = setTimeout(() => resolve('stalled'), 10000);
        });
        try {
          const result = await Promise.race([opening, stalled]);
          if (result === 'stalled') {
            opening.then((late) => opened.push(late.context)).catch(() => {});
            await current.close().catch(() => {});
            continue;
          }
          opened.push(result.context);
        } catch (error) {
          if (current.isConnected()) {
            crash = error;
            crashed = current;
          }
        } finally {
          clearTimeout(timer);
        }
      }
    } finally {
      killing = false;
      await killer;
    }

    expect(crash?.message).toBe(
      'The headless browser crashed (browserContext.newPage: Target crashed); it is relaunched for the next call.'
    );
    const fresh = await getBrowser({ origin });
    expect(fresh).not.toBe(crashed);

    const { context, page } = await openPage({ browser: fresh, origin });
    opened.push(context);
    expect(await page.evaluate(() => 1 + 1)).toBe(2);
  },
  120000
);
