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

import { createUrl } from '@lowdefy/client-core';
import { resolveTarget } from '@lowdefy/engine';
import { UserError } from '@lowdefy/errors';
import { getSafeHref, type } from '@lowdefy/helpers';

import getOpenLinkUrl from './host/getOpenLinkUrl.js';

// A host answers a request it carried out with a result, and one it refused with a result marked
// isError or with a rejected call. A refusal is the person's answer to the host's prompt, not a
// fault in the app, so it is a UserError: shown and logged in the browser, never on the server.
function assertNotRefused({ message, result }) {
  if (result?.isError === true) {
    throw new UserError(message);
  }
}

// The absolute URL of a link target. A page of the app is opened at the app's own address: the
// view's window.location is on the app's origin (createViewLocation), and createUrl applies the
// basePath.
function getLinkUrl({ lowdefy, params }) {
  if (type.isString(params.url) && params.url !== '' && type.isNone(getSafeHref(params.url))) {
    throw new Error(`McpOpenLink does not open the url ${JSON.stringify(params.url)}.`);
  }
  const target = resolveTarget({ lowdefy, name: 'McpOpenLink', target: params });
  if (type.isNone(target)) {
    throw new Error('McpOpenLink resolved no link. Give one of "url", "pageId" or "home".');
  }
  if (target.kind === 'external') {
    return target.href;
  }
  const { origin } = lowdefy._internal.globals.window.location;
  return `${origin}${createUrl({
    basePath: lowdefy.basePath,
    pathname: target.pathname,
    query: target.query,
  })}`;
}

// What a page can read from and ask of the MCP host it is shown in as a view: lowdefy._internal.mcp,
// which the _mcp operator and the McpSendMessage and McpOpenLink actions use. Null for a page that
// is not a view (the browser host has no host.view), where _mcp reads null and both actions fail.
function createMcp({ lowdefy }) {
  const { view } = lowdefy._internal.host;
  if (type.isNone(view)) {
    return null;
  }
  const { bridge } = view;

  // The link leaves through the view's one way out (host.view.openLink, createViewOpenLink), which
  // holds the rule for what a host is asked to open. That path answers false for a link it does
  // not hand over and for one the host refuses; the same rule (getOpenLinkUrl) is asked first, so
  // the action's error says which of the two it was. A refusal is told by the action's own error
  // alone, so onLinkRefused is not told of it as well.
  async function openLink(params) {
    const link = getLinkUrl({ lowdefy, params });
    const url = getOpenLinkUrl({ base: lowdefy._internal.globals.window.location.href, url: link });
    if (url === null) {
      throw new Error(`McpOpenLink only opens http and https links. Received ${link}.`);
    }
    const opened = await view.openLink({ url, notifyRefused: false });
    if (!opened) {
      throw new UserError(`The MCP host refused to open ${url}.`);
    }
  }

  async function sendMessage({ text }) {
    const result = await bridge.sendMessage({ text });
    assertNotRefused({ message: 'The MCP host refused the message.', result });
  }

  return {
    // 'inline', 'fullscreen' or 'pip'; null when the host names none.
    getDisplayMode: () => bridge.getDisplayMode(),
    // Called on every change of the host's context, the display mode among them. Returns a
    // function that stops the listener.
    onContextChange: (listener) => bridge.onContextChange(() => listener()),
    openLink,
    sendMessage,
  };
}

export default createMcp;
