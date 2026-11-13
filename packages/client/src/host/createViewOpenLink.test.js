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

import createViewOpenLink from './createViewOpenLink.js';

function setup({ openLink = vi.fn(async () => ({})) } = {}) {
  const refused = vi.fn();
  const links = createViewOpenLink({
    bridge: { openLink },
    getBase: () => 'https://app.example.com/base/tickets/12',
  });
  const stop = links.onRefused(refused);
  return { links, openLink, refused, stop };
}

test('createViewOpenLink openLink hands the host an absolute URL and resolves to true', async () => {
  const { links, openLink, refused } = setup();
  await expect(links.openLink({ url: '/base/runs' })).resolves.toBe(true);
  expect(openLink).toHaveBeenCalledWith({ url: 'https://app.example.com/base/runs' });
  expect(refused).not.toHaveBeenCalled();
});

test('createViewOpenLink openLink never hands the host a javascript, data or file URL', async () => {
  const { links, openLink, refused } = setup();
  await expect(links.openLink({ url: 'javascript:alert(1)' })).resolves.toBe(false);
  await expect(links.openLink({ url: 'data:text/html,x' })).resolves.toBe(false);
  await expect(links.openLink({ url: 'file:///etc/passwd' })).resolves.toBe(false);
  expect(links.openWindow('javascript:alert(1)')).toBeNull();
  expect(links.openWindow('data:text/html,x')).toBeNull();
  expect(links.openWindow('file:///etc/passwd')).toBeNull();
  expect(openLink).not.toHaveBeenCalled();
  expect(refused).not.toHaveBeenCalled();
});

test('createViewOpenLink tells its listeners when the host answers with an error', async () => {
  const { links, refused } = setup({ openLink: vi.fn(async () => ({ isError: true })) });
  await expect(links.openLink({ url: 'https://other.example.org/' })).resolves.toBe(false);
  expect(refused).toHaveBeenCalledWith({ url: 'https://other.example.org/' });
});

test('createViewOpenLink tells its listeners when the host call fails', async () => {
  const { links, refused } = setup({
    openLink: vi.fn(async () => {
      throw new Error('Method not found');
    }),
  });
  await expect(links.openLink({ url: 'https://other.example.org/' })).resolves.toBe(false);
  expect(refused).toHaveBeenCalledTimes(1);
});

test('createViewOpenLink tells no listener of a refusal when the caller tells the person itself', async () => {
  const { links, refused } = setup({ openLink: vi.fn(async () => ({ isError: true })) });
  await expect(
    links.openLink({ url: 'https://other.example.org/', notifyRefused: false })
  ).resolves.toBe(false);
  expect(refused).not.toHaveBeenCalled();
});

test('createViewOpenLink stops telling a listener that was removed', async () => {
  const { links, refused, stop } = setup({ openLink: vi.fn(async () => ({ isError: true })) });
  stop();
  await links.openLink({ url: 'https://other.example.org/' });
  expect(refused).not.toHaveBeenCalled();
});

test('createViewOpenLink openWindow answers like window.open with a window that is closed', () => {
  const { links, openLink } = setup();
  const handle = links.openWindow('https://other.example.org/docs', '_blank', 'noopener');
  expect(openLink).toHaveBeenCalledWith({ url: 'https://other.example.org/docs' });
  expect(handle.closed).toBe(true);
  expect(() => {
    handle.focus();
    handle.blur();
    handle.close();
  }).not.toThrow();
});

test('createViewOpenLink openWindow with no URL opens nothing and answers null', () => {
  const { links, openLink } = setup();
  expect(links.openWindow()).toBeNull();
  expect(links.openWindow('')).toBeNull();
  expect(links.openWindow('about:blank')).toBeNull();
  expect(openLink).not.toHaveBeenCalled();
});
