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

import { expect, test, vi } from 'vitest';

import loadViewBuild from './loadViewBuild.js';

const appOrigin = 'https://app.example.com';

function createDocument({ stylesheets = [] } = {}) {
  const links = stylesheets.map((href) => ({
    href,
    remove() {
      links.splice(links.indexOf(this), 1);
    },
  }));
  const scripts = [];
  return {
    body: { appendChild: (script) => scripts.push(script) },
    createElement: (tag) => ({ tag, addEventListener: vi.fn() }),
    head: { appendChild: (link) => links.push(link) },
    links,
    querySelectorAll: () => [...links],
    scripts,
  };
}

function createBridge({ boot }) {
  const bridge = {
    appOrigin,
    basePath: '/base',
    boot,
    getBoot: () => bridge.boot,
    setBoot: (next) => {
      bridge.boot = next;
    },
    setResumePath: vi.fn(),
    showFallback: vi.fn(),
  };
  return bridge;
}

function bootResponse(boot, status = 200) {
  return vi.fn(async () => ({ ok: status === 200, status, json: async () => boot }));
}

const running = {
  buildId: 'build-1',
  js: '/base/assets/view-1.js',
  css: ['/base/assets/a-1.css', '/base/assets/shared.css'],
};

test('loadViewBuild asks the app for its boot answer and starts the new entry', async () => {
  const next = {
    buildId: 'build-2',
    js: '/base/assets/view-2.js',
    css: ['/base/assets/a-2.css', '/base/assets/shared.css'],
  };
  const document = createDocument({
    stylesheets: [
      `${appOrigin}/base/assets/a-1.css`,
      `${appOrigin}/base/assets/shared.css`,
      'https://sandbox.example.net/host.css',
    ],
  });
  const bridge = createBridge({ boot: running });
  const fetch = bootResponse(next);
  const restart = vi.fn();
  const unmount = vi.fn();
  await loadViewBuild({
    bridge,
    document,
    fetch,
    restart,
    resumePath: '/tickets/12?tab=notes',
    unmount,
  });
  expect(fetch).toHaveBeenCalledWith('https://app.example.com/base/api/view/boot');
  expect(unmount).toHaveBeenCalledTimes(1);
  expect(restart).not.toHaveBeenCalled();
  expect(bridge.boot).toBe(next);
  expect(bridge.setResumePath).toHaveBeenCalledWith('/tickets/12?tab=notes');
  expect(document.links.map((link) => link.href)).toEqual([
    `${appOrigin}/base/assets/shared.css`,
    'https://sandbox.example.net/host.css',
    `${appOrigin}/base/assets/a-2.css`,
  ]);
  expect(document.scripts).toHaveLength(1);
  expect(document.scripts[0]).toMatchObject({
    crossOrigin: 'anonymous',
    src: `${appOrigin}/base/assets/view-2.js`,
    type: 'module',
  });
});

test('loadViewBuild starts the same bundle again when the app still names its entry', async () => {
  const document = createDocument();
  const bridge = createBridge({ boot: running });
  const restart = vi.fn();
  const unmount = vi.fn();
  await loadViewBuild({
    bridge,
    document,
    fetch: bootResponse({ ...running }),
    restart,
    resumePath: '/tickets/12',
    unmount,
  });
  expect(unmount).toHaveBeenCalledTimes(1);
  expect(restart).toHaveBeenCalledTimes(1);
  expect(document.scripts).toEqual([]);
});

test('loadViewBuild leaves the running client alone when the app cannot be reached', async () => {
  const unmount = vi.fn();
  await expect(
    loadViewBuild({
      bridge: createBridge({ boot: running }),
      document: createDocument(),
      fetch: bootResponse({}, 503),
      restart: vi.fn(),
      resumePath: '/tickets/12',
      unmount,
    })
  ).rejects.toThrow('The app answered 503 to /api/view/boot.');
  expect(unmount).not.toHaveBeenCalled();
});

test('loadViewBuild refuses an entry that is not a path under the app origin', async () => {
  const document = createDocument();
  const unmount = vi.fn();
  await expect(
    loadViewBuild({
      bridge: createBridge({ boot: running }),
      document,
      fetch: bootResponse({ buildId: 'build-2', js: '@other.example/view.js', css: [] }),
      restart: vi.fn(),
      resumePath: '/tickets/12',
      unmount,
    })
  ).rejects.toThrow('The app named a view file that is not a path.');
  expect(unmount).not.toHaveBeenCalled();
  expect(document.scripts).toEqual([]);
});
