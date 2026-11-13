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

import createViewRouter from './adapters/createViewRouter.js';
import createMcp from './createMcp.js';
import createViewBridge from './host/createViewBridge.js';
import createViewHost from './host/createViewHost.js';
import createWebHost from './host/createWebHost.js';
import createFakeViewLoader from './test/createFakeViewLoader.js';

function createViewLowdefy({ basePath = '' } = {}) {
  const loader = createFakeViewLoader({ basePath });
  const router = createViewRouter({ basePath, path: '/tickets/12?tab=notes' });
  const host = createViewHost({
    bridge: createViewBridge({ view: loader }),
    router,
    window: { document: {}, fetch: vi.fn() },
  });
  const lowdefy = {
    basePath,
    home: { configured: true, pageId: 'home' },
    linkPaths: {},
    pagePaths: { ticket: 'tickets/{ticket_id}' },
    _internal: { globals: host.globals, host },
  };
  return { loader, lowdefy, mcp: createMcp({ lowdefy }) };
}

test('createMcp returns null on the browser host', () => {
  const window = { document: {}, fetch: vi.fn(), location: { origin: 'https://app.example.com' } };
  const host = createWebHost({ router: { basePath: '' }, window });
  expect(createMcp({ lowdefy: { _internal: { globals: host.globals, host } } })).toBe(null);
});

test('getDisplayMode reads the display mode the host reports now', () => {
  const { loader, mcp } = createViewLowdefy();
  expect(mcp.getDisplayMode()).toBe('inline');
  loader.setContext({ displayMode: 'fullscreen' });
  expect(mcp.getDisplayMode()).toBe('fullscreen');
  loader.setContext({ displayMode: 'pip' });
  expect(mcp.getDisplayMode()).toBe('pip');
});

test('onContextChange calls the listener on each host context change until it is stopped', () => {
  const { loader, mcp } = createViewLowdefy();
  const listener = vi.fn();
  const stop = mcp.onContextChange(listener);
  loader.setContext({ displayMode: 'fullscreen' });
  expect(listener.mock.calls).toEqual([[]]);
  stop();
  loader.setContext({ displayMode: 'inline' });
  expect(listener).toHaveBeenCalledTimes(1);
});

test('sendMessage sends the text to the host', async () => {
  const { loader, mcp } = createViewLowdefy();
  await expect(mcp.sendMessage({ text: 'Show ticket 12' })).resolves.toBe(undefined);
  expect(loader.host.sendMessage.mock.calls).toEqual([[{ text: 'Show ticket 12' }]]);
});

test('sendMessage rejects when the host answers with an error result', async () => {
  const { loader, mcp } = createViewLowdefy();
  loader.host.sendMessage.mockResolvedValueOnce({ isError: true });
  await expect(mcp.sendMessage({ text: 'Hello' })).rejects.toMatchObject({
    name: 'UserError',
    message: 'The MCP host refused the message.',
  });
});

test('sendMessage rejects when the call to the host fails', async () => {
  const { loader, mcp } = createViewLowdefy();
  loader.host.sendMessage.mockRejectedValueOnce(new Error('Method not found'));
  await expect(mcp.sendMessage({ text: 'Hello' })).rejects.toThrow('Method not found');
});

test('openLink asks the host to open an http or https url', async () => {
  const { loader, mcp } = createViewLowdefy();
  await expect(mcp.openLink({ url: 'https://example.com/docs?a=1' })).resolves.toBe(undefined);
  await mcp.openLink({ url: 'http://example.com' });
  await mcp.openLink({ url: 'example.com/pricing', urlQuery: { plan: 'team' } });
  expect(loader.host.openLink.mock.calls).toEqual([
    [{ url: 'https://example.com/docs?a=1' }],
    [{ url: 'http://example.com/' }],
    [{ url: 'https://example.com/pricing?plan=team' }],
  ]);
});

test("openLink resolves a page target to the app's absolute URL", async () => {
  const { loader, mcp } = createViewLowdefy({ basePath: '/base' });
  await mcp.openLink({ pageId: 'ticket', pathParams: { ticket_id: 12 }, urlQuery: { tab: 'x' } });
  await mcp.openLink({ pageId: 'reports' });
  await mcp.openLink({ home: true });
  await mcp.openLink({ url: '/reports?year=2026' });
  expect(loader.host.openLink.mock.calls).toEqual([
    [{ url: 'https://app.example.com/base/tickets/12?tab=x' }],
    [{ url: 'https://app.example.com/base/reports' }],
    [{ url: 'https://app.example.com/base/' }],
    [{ url: 'https://app.example.com/base/reports?year=2026' }],
  ]);
});

test('openLink refuses a url that is not a safe link', async () => {
  const { loader, mcp } = createViewLowdefy();
  await expect(mcp.openLink({ url: 'javascript:alert(1)' })).rejects.toThrow(
    'McpOpenLink does not open the url "javascript:alert(1)".'
  );
  await expect(mcp.openLink({ url: ' https://example.com' })).rejects.toThrow(
    'McpOpenLink does not open the url " https://example.com".'
  );
  await expect(mcp.openLink({ url: 'data:text/html,<p>hi</p>' })).rejects.toThrow(
    'McpOpenLink does not open the url'
  );
  expect(loader.host.openLink).not.toHaveBeenCalled();
});

test('openLink refuses a link that is not http or https, and tells no refusal listener', async () => {
  const { loader, lowdefy, mcp } = createViewLowdefy();
  const refused = vi.fn();
  lowdefy._internal.host.view.onLinkRefused(refused);
  await expect(mcp.openLink({ url: 'mailto:someone@example.com' })).rejects.toThrow(
    'McpOpenLink only opens http and https links. Received mailto:someone@example.com.'
  );
  await expect(mcp.openLink({ url: 'tel:+15550100' })).rejects.toThrow(
    'McpOpenLink only opens http and https links. Received tel:+15550100.'
  );
  await expect(mcp.openLink({ url: 'ftp://example.com/file' })).rejects.toThrow(
    'McpOpenLink only opens http and https links. Received ftp://example.com/file.'
  );
  expect(loader.host.openLink).not.toHaveBeenCalled();
  expect(refused).not.toHaveBeenCalled();
});

test('openLink opens a fragment url as the page the view shows, at that fragment', async () => {
  const { loader, mcp } = createViewLowdefy({ basePath: '/base' });
  await expect(mcp.openLink({ url: '#notes' })).resolves.toBe(undefined);
  await mcp.openLink({ url: '#notes', urlQuery: { tab: 'x' } });
  expect(loader.host.openLink.mock.calls).toEqual([
    [{ url: 'https://app.example.com/base/tickets/12?tab=notes#notes' }],
    [{ url: 'https://app.example.com/base/tickets/12?tab=x#notes' }],
  ]);
});

test('openLink throws when no target is given, or more than one', async () => {
  const { loader, mcp } = createViewLowdefy();
  await expect(mcp.openLink({})).rejects.toThrow(
    'McpOpenLink resolved no link. Give one of "url", "pageId" or "home".'
  );
  await expect(mcp.openLink({ pageId: 'reports', url: 'https://example.com' })).rejects.toThrow(
    "Invalid McpOpenLink: To avoid ambiguity, only one of 'home', 'pageId' or 'url' can be defined."
  );
  expect(loader.host.openLink).not.toHaveBeenCalled();
});

// The action's error is how the person hears of the refusal, so the refusal
// listeners, which show the "popup blocked" message, are not told as well.
test('openLink fails with a UserError and tells no refusal listener when the host answers with an error result', async () => {
  const { loader, lowdefy, mcp } = createViewLowdefy();
  const refused = vi.fn();
  lowdefy._internal.host.view.onLinkRefused(refused);
  loader.host.openLink.mockResolvedValueOnce({ isError: true });
  await expect(mcp.openLink({ url: 'https://example.com' })).rejects.toMatchObject({
    name: 'UserError',
    message: 'The MCP host refused to open https://example.com/.',
  });
  expect(refused).not.toHaveBeenCalled();
});

test('openLink fails with a UserError and tells no refusal listener when the call to the host fails', async () => {
  const { loader, lowdefy, mcp } = createViewLowdefy();
  const refused = vi.fn();
  lowdefy._internal.host.view.onLinkRefused(refused);
  loader.host.openLink.mockRejectedValueOnce(new Error('Denied'));
  await expect(mcp.openLink({ pageId: 'reports' })).rejects.toMatchObject({
    name: 'UserError',
    message: 'The MCP host refused to open https://app.example.com/reports.',
  });
  expect(refused).not.toHaveBeenCalled();
});
