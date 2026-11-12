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

import getOpenLinkUrl from './getOpenLinkUrl.js';

// What window.open answers in a view. The host opens the link in the browser
// and hands back no window, so this is one that is already closed: a caller
// that focuses or closes its popup does not throw.
function createClosedHandle() {
  return {
    blur: () => {},
    close: () => {},
    closed: true,
    focus: () => {},
  };
}

// The one way out of a view: every link that does not navigate the view in
// place is opened in the browser by the host (the bridge's openLink). Only an
// http: or https: URL is handed over, as an absolute URL (getOpenLinkUrl).
//
// openLink({ url }) resolves to true when the host opened the link.
// openWindow(url) has the shape of window.open: null when nothing was handed
// to the host, as for a blocked popup.
// onRefused(listener) is told ({ url }) each time the host refuses a link or
// cannot open it, and returns a function that stops the listener.
function createViewOpenLink({ bridge, getBase }) {
  const refusedListeners = new Set();

  async function send(url) {
    let opened = false;
    try {
      const result = await bridge.openLink({ url });
      opened = result?.isError !== true;
    } catch (error) {
      opened = false;
    }
    if (!opened) {
      refusedListeners.forEach((listener) => listener({ url }));
    }
    return opened;
  }

  async function openLink({ url }) {
    const target = getOpenLinkUrl({ base: getBase(), url });
    if (target === null) {
      return false;
    }
    return send(target);
  }

  function openWindow(url) {
    const target = getOpenLinkUrl({ base: getBase(), url });
    if (target === null) {
      return null;
    }
    send(target);
    return createClosedHandle();
  }

  return {
    onRefused: (listener) => {
      refusedListeners.add(listener);
      return () => refusedListeners.delete(listener);
    },
    openLink,
    openWindow,
  };
}

export default createViewOpenLink;
