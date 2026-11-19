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

// Schemes the browser hands to another app on the device. Following one does
// not move the frame, so a link to it is left to the browser.
const deviceProtocols = new Set(['mailto:', 'sms:', 'tel:']);

function findAnchor(event) {
  return event
    .composedPath()
    .find((node) => node.tagName === 'A' && node.hasAttribute('href') === true);
}

// The frame resolves a relative URL against its own sandbox origin, so the
// path of a URL on that origin is one of the app's.
function getAppUrl({ frameOrigin, getBase, url }) {
  const parsed = new URL(url);
  if (parsed.origin !== frameOrigin) {
    return url;
  }
  return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, getBase()).href;
}

// Link handling for a page shown as an MCP App view, where the frame cannot
// follow a link itself: its document is the host's loader on a sandbox origin,
// and the browser is reached only through the host. It is installed once for
// the frame, so block plugins need no changes:
//
// - A click on an anchor that no handler took (the Link component and HTML
//   page links navigate in place and prevent the default) is stopped, and an
//   http: or https: target is opened by the host: a target="_blank" anchor, a
//   modified or middle click on an in-app link, a link to another site. The
//   href is read as written and resolved against the view's address on the
//   app's origin (getBase).
// - window.open opens through the host.
// - Where the browser has the Navigation API, anything else that would load
//   another document in the frame is cancelled and opened by the host: a link
//   whose click a handler hid from the document, a form, a location set by a
//   plugin.
//
// A fragment link stays in the document, and a download and a reload of the
// frame are left alone. Returns a function that removes all of it.
function captureViewLinks({ getBase, openLink, openWindow, window }) {
  const { document } = window;

  function onClick(event) {
    // auxclick also fires for the right button, which opens the context menu.
    if (event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) {
      return;
    }
    const anchor = findAnchor(event);
    if (anchor === undefined || anchor.hasAttribute('download')) {
      return;
    }
    const href = anchor.getAttribute('href');
    if (href.startsWith('#')) {
      return;
    }
    let protocol = null;
    try {
      protocol = new URL(href, getBase()).protocol;
    } catch (error) {
      // An href the URL parser refuses names nothing to open.
    }
    if (deviceProtocols.has(protocol)) {
      return;
    }
    event.preventDefault();
    openLink({ url: href });
  }

  function onNavigate(event) {
    if (
      !event.cancelable ||
      event.navigationType === 'reload' ||
      event.navigationType === 'traverse' ||
      event.hashChange ||
      event.destination.sameDocument ||
      typeof event.downloadRequest === 'string'
    ) {
      return;
    }
    event.preventDefault();
    openLink({
      url: getAppUrl({
        frameOrigin: window.location.origin,
        getBase,
        url: event.destination.url,
      }),
    });
  }

  const frameOpen = window.open;
  window.open = openWindow;
  document.addEventListener('click', onClick);
  document.addEventListener('auxclick', onClick);
  window.navigation?.addEventListener('navigate', onNavigate);

  return () => {
    // Another script may have replaced window.open since; leave theirs.
    if (window.open === openWindow) {
      window.open = frameOpen;
    }
    document.removeEventListener('click', onClick);
    document.removeEventListener('auxclick', onClick);
    window.navigation?.removeEventListener('navigate', onNavigate);
  };
}

export default captureViewLinks;
