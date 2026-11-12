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

/* eslint-disable no-var, prefer-arrow-callback, object-shorthand */

// The script of an MCP App view. It runs in the host's sandbox frame, not on
// the server: renderViewLoader writes this function's source into the view's
// HTML and calls it there with the app's origin and basePath. So it reads
// nothing from this module's scope and imports nothing, and it is written in
// syntax the package build leaves as it is.
//
// A host caches a view's HTML across deploys, so a loader served by an old
// build meets the client bundle of a new one. Everything below is therefore a
// public interface between the two: add to it, never rename or remove.
//
// What it does, in order:
// 1. Connects to the host over postMessage (the MCP Apps ui/initialize
//    handshake) and keeps the host context, the tool input and the tool result
//    as the host sends them. It reports the page's height to the host as it
//    changes.
// 2. Asks the app for GET {origin}{basePath}/api/view/boot, which answers
//    { buildId, js, css }: the view entry script and a list of stylesheets,
//    each a path under the app's origin that starts with "/" and holds the
//    basePath.
// 3. Once it has the host connection, the boot answer and a tool result that
//    carries a view address, sets window.__LOWDEFY_VIEW__ and loads the
//    stylesheets and the entry script. The client entry does no handshake of
//    its own; it reads everything from that object:
//
//    window.__LOWDEFY_VIEW__ = {
//      version: 1,
//      origin,        // the app's origin, 'https://app.example.com'
//      basePath,      // the app's basePath, '' or '/base'
//      boot,          // the boot answer, { buildId, js, css }
//      toolInput,     // { arguments } as the host sent it, or null
//      toolResult,    // the tool's CallToolResult. The page to show is
//                     // toolResult._meta['lowdefy/view'].path: its path and
//                     // query, starting with '/', with no origin or basePath.
//      host: {
//        info,          // the host's { name, version }
//        capabilities,  // the host's MCP Apps capabilities
//        getContext(),  // the latest host context: displayMode, theme, ...
//        onContextChange(listener),  // called with the context on each
//                                    // change; returns a function that stops it
//        callServerTool({ name, arguments }),  // resolves to a CallToolResult
//        openLink({ url }),                    // opens a URL in the browser
//        sendMessage({ text }),                // sends the host a user message
//      },
//      showFallback({ message }),  // replaces the page with the fallback below
//    };
//
// 4. When the app cannot be reached, the call failed or carries no view
//    address, or the client calls showFallback (it could not get a session),
//    shows the tool's title, the result as text and a button that opens the
//    page in the browser.
function viewLoader(settings) {
  var PROTOCOL_VERSION = '2026-01-26';
  var VIEW_ADDRESS_META_KEY = 'lowdefy/view';
  var appUrl = settings.origin + settings.basePath;

  var nextRequestId = 1;
  var pendingRequests = {};
  var hostContext = {};
  var contextListeners = [];
  var fallbackShown = false;
  var fallbackMessage = null;
  var resolveToolResult;
  var toolResultReceived = new Promise(function (resolve) {
    resolveToolResult = resolve;
  });

  function post(message) {
    message.jsonrpc = '2.0';
    window.parent.postMessage(message, '*');
  }

  function request(method, params) {
    return new Promise(function (resolve, reject) {
      var id = nextRequestId;
      nextRequestId += 1;
      pendingRequests[id] = { resolve: resolve, reject: reject };
      post({ id: id, method: method, params: params });
    });
  }

  function notify(method, params) {
    post({ method: method, params: params });
  }

  var view = {
    version: 1,
    origin: settings.origin,
    basePath: settings.basePath,
    boot: null,
    toolInput: null,
    toolResult: null,
    host: {
      info: null,
      capabilities: {},
      getContext: function () {
        return hostContext;
      },
      onContextChange: function (listener) {
        contextListeners.push(listener);
        return function () {
          contextListeners = contextListeners.filter(function (candidate) {
            return candidate !== listener;
          });
        };
      },
      callServerTool: function (call) {
        return request('tools/call', { name: call.name, arguments: call.arguments || {} });
      },
      openLink: function (link) {
        return request('ui/open-link', { url: link.url });
      },
      sendMessage: function (message) {
        return request('ui/message', {
          role: 'user',
          content: [{ type: 'text', text: message.text }],
        });
      },
    },
    showFallback: showFallback,
  };

  // A path is appended to the app's origin, so anything that does not start
  // with "/" could name another host ("@other.example") and is not a path.
  function appPath(value) {
    return typeof value === 'string' && value.charAt(0) === '/' ? value : null;
  }

  function getViewAddress() {
    var result = view.toolResult;
    if (!result || result.isError || !result._meta || !result._meta[VIEW_ADDRESS_META_KEY]) {
      return null;
    }
    return appPath(result._meta[VIEW_ADDRESS_META_KEY].path);
  }

  function getToolTitle() {
    var tool = (hostContext.toolInfo && hostContext.toolInfo.tool) || {};
    return tool.title || (tool.annotations && tool.annotations.title) || tool.name || '';
  }

  function getResultText() {
    var content = (view.toolResult && view.toolResult.content) || [];
    return content
      .filter(function (item) {
        return item && item.type === 'text' && typeof item.text === 'string';
      })
      .map(function (item) {
        return item.text;
      })
      .join('\n');
  }

  function openInBrowser() {
    var url = appUrl + (getViewAddress() || '/');
    view.host.openLink({ url: url }).catch(function () {
      window.open(url, '_blank', 'noopener');
    });
  }

  // Built with textContent only: the title and the result are whatever the
  // tool returned.
  function renderFallback() {
    var container = document.getElementById('lowdefy-view-fallback');
    if (!container) {
      container = document.createElement('div');
      container.id = 'lowdefy-view-fallback';
      container.style.cssText =
        'font-family:var(--font-sans,system-ui,sans-serif);color:var(--color-text-primary,inherit);padding:16px;';
      document.body.appendChild(container);
    }
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    var root = document.getElementById('root');
    if (root) {
      root.style.display = 'none';
    }

    var title = document.createElement('h1');
    title.style.cssText = 'font-size:16px;font-weight:600;margin:0 0 8px;';
    title.textContent = getToolTitle();
    container.appendChild(title);

    if (fallbackMessage) {
      var message = document.createElement('p');
      message.style.cssText = 'margin:0 0 8px;';
      message.textContent = fallbackMessage;
      container.appendChild(message);
    }

    var text = document.createElement('pre');
    text.style.cssText =
      'font-family:var(--font-mono,monospace);font-size:13px;white-space:pre-wrap;word-break:break-word;margin:0 0 12px;';
    text.textContent = getResultText();
    container.appendChild(text);

    var button = document.createElement('button');
    button.type = 'button';
    button.style.cssText =
      'font:inherit;padding:6px 12px;border-radius:var(--border-radius-md,6px);border:1px solid var(--color-border-primary,currentColor);background:transparent;color:inherit;cursor:pointer;';
    button.textContent = 'Open in browser';
    button.addEventListener('click', openInBrowser);
    container.appendChild(button);
  }

  function showFallback(options) {
    fallbackShown = true;
    if (options && typeof options.message === 'string') {
      fallbackMessage = options.message;
    }
    renderFallback();
  }

  function onHostRequest(message) {
    // ui/resource-teardown and ping need no work; anything else is not
    // something a view answers.
    if (message.method === 'ui/resource-teardown' || message.method === 'ping') {
      post({ id: message.id, result: {} });
      return;
    }
    post({ id: message.id, error: { code: -32601, message: 'Method not found.' } });
  }

  function onHostNotification(message) {
    var params = message.params || {};
    if (message.method === 'ui/notifications/tool-input') {
      view.toolInput = params;
      return;
    }
    if (message.method === 'ui/notifications/tool-result') {
      view.toolResult = params;
      resolveToolResult();
      // A result that arrives after the app could not be reached.
      if (fallbackShown) {
        renderFallback();
      }
      return;
    }
    if (message.method === 'ui/notifications/tool-cancelled') {
      showFallback();
      return;
    }
    if (message.method === 'ui/notifications/host-context-changed') {
      var next = {};
      Object.keys(hostContext).forEach(function (key) {
        next[key] = hostContext[key];
      });
      Object.keys(params).forEach(function (key) {
        next[key] = params[key];
      });
      hostContext = next;
      contextListeners.forEach(function (listener) {
        listener(hostContext);
      });
    }
  }

  window.addEventListener('message', function (event) {
    if (event.source !== window.parent) {
      return;
    }
    var message = event.data;
    if (!message || message.jsonrpc !== '2.0') {
      return;
    }
    if (typeof message.method === 'string') {
      if (message.id === undefined || message.id === null) {
        onHostNotification(message);
      } else {
        onHostRequest(message);
      }
      return;
    }
    var pending = pendingRequests[message.id];
    if (!pending) {
      return;
    }
    delete pendingRequests[message.id];
    if (message.error) {
      pending.reject(new Error(message.error.message || 'The host refused the request.'));
    } else {
      pending.resolve(message.result);
    }
  });

  // The host sizes the frame to the height the view reports.
  function reportSize() {
    var lastHeight = null;
    function send() {
      var height = Math.ceil(document.documentElement.getBoundingClientRect().height);
      if (height !== lastHeight) {
        lastHeight = height;
        notify('ui/notifications/size-changed', { height: height });
      }
    }
    send();
    if (typeof ResizeObserver === 'function') {
      var observer = new ResizeObserver(send);
      observer.observe(document.documentElement);
      observer.observe(document.body);
    }
  }

  function connect() {
    return request('ui/initialize', {
      appInfo: { name: 'lowdefy-view', version: String(view.version) },
      appCapabilities: {},
      protocolVersion: PROTOCOL_VERSION,
    }).then(function (result) {
      hostContext = result.hostContext || {};
      view.host.info = result.hostInfo || null;
      view.host.capabilities = result.hostCapabilities || {};
      notify('ui/notifications/initialized', {});
      reportSize();
      // The tool's title is in the host context, which a fallback shown before
      // the host answered did not have.
      if (fallbackShown) {
        renderFallback();
      }
    });
  }

  function fetchBoot() {
    return fetch(appUrl + '/api/view/boot').then(function (response) {
      if (!response.ok) {
        throw new Error('The app answered ' + response.status + '.');
      }
      return response.json();
    });
  }

  function start(boot) {
    if (fallbackShown) {
      return;
    }
    if (getViewAddress() === null) {
      showFallback();
      return;
    }
    var entry = appPath(boot.js);
    var stylesheets = (boot.css || []).map(appPath);
    if (entry === null || stylesheets.indexOf(null) !== -1) {
      showFallback();
      return;
    }
    view.boot = boot;
    window.__LOWDEFY_VIEW__ = view;
    stylesheets.forEach(function (file) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = settings.origin + file;
      document.head.appendChild(link);
    });
    var script = document.createElement('script');
    script.type = 'module';
    script.crossOrigin = 'anonymous';
    script.src = settings.origin + entry;
    script.addEventListener('error', function () {
      showFallback();
    });
    document.body.appendChild(script);
  }

  var connected = connect();
  var booted = fetchBoot();
  Promise.all([booted, connected, toolResultReceived])
    .then(function (results) {
      start(results[0]);
    })
    .catch(function () {
      showFallback();
    });
}

export default viewLoader;
