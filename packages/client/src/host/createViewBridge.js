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

const VIEW_ADDRESS_META_KEY = 'lowdefy/view';
const VIEW_SESSION_META_KEY = 'lowdefy/viewSession';
const VIEW_SESSION_TOOL = 'lowdefy_view_session';

// Everything the client knows about the MCP Apps host a view runs in, read
// from the object the view's loader hands over (window.__LOWDEFY_VIEW__, see
// viewLoader in @lowdefy/api). It is the one place that depends on how a host
// behaves: how the tool result reaches the view, what a tool call made by the
// view answers, the display mode. A host that behaves differently changes this
// file and nothing else.
//
// The page to show and the session token both travel in a result's _meta. The
// MCP Apps types hand a view the whole CallToolResult, _meta included, but a
// host could drop keys it does not know, so each read fails with a message
// that names the missing key.
function createViewBridge({ view }) {
  if (!type.isObject(view) || !type.isObject(view.host)) {
    throw new Error('The view loader handed over no host connection.');
  }
  const { host } = view;

  // The view's address: the page path and query, starting with "/", with no
  // origin and no basePath. A client that loads a newer build leaves the
  // address it was showing for the next one to start at (setResumePath).
  function getViewPath() {
    if (type.isString(view.resumePath)) {
      return view.resumePath;
    }
    const address = view.toolResult?._meta?.[VIEW_ADDRESS_META_KEY];
    if (!type.isString(address?.path) || !address.path.startsWith('/')) {
      throw new Error(`The tool result carries no "${VIEW_ADDRESS_META_KEY}" address in _meta.`);
    }
    return address.path;
  }

  // Asks the app for a view session through the host. The model never sees
  // this call or its answer.
  async function mintSession() {
    const result = await host.callServerTool({ name: VIEW_SESSION_TOOL, arguments: {} });
    if (result?.isError === true) {
      const text = (result.content ?? []).find((item) => item?.type === 'text')?.text;
      throw new Error(text ?? 'The app refused a view session.');
    }
    const session = result?._meta?.[VIEW_SESSION_META_KEY];
    if (!type.isString(session?.token) || session.token === '') {
      throw new Error(
        `The "${VIEW_SESSION_TOOL}" result carries no "${VIEW_SESSION_META_KEY}" token in _meta.`
      );
    }
    return { expiresAt: session.expiresAt ?? null, token: session.token };
  }

  return {
    appOrigin: view.origin,
    basePath: view.basePath,
    callServerTool: (call) => host.callServerTool(call),
    getBoot: () => view.boot,
    getContext: () => host.getContext(),
    // 'inline', 'fullscreen' or 'pip'; null when the host names none.
    getDisplayMode: () => host.getContext()?.displayMode ?? null,
    getToolInput: () => view.toolInput,
    getToolResult: () => view.toolResult,
    getViewPath,
    hostCapabilities: host.capabilities,
    hostInfo: host.info,
    mintSession,
    onContextChange: (listener) => host.onContextChange(listener),
    openLink: ({ url }) => host.openLink({ url }),
    sendMessage: ({ text }) => host.sendMessage({ text }),
    setBoot: (boot) => {
      view.boot = boot;
    },
    setResumePath: (path) => {
      view.resumePath = path;
    },
    showFallback: ({ message } = {}) => view.showFallback({ message }),
  };
}

export default createViewBridge;
