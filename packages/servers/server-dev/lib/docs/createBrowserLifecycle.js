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

// One shared browser per dev server child, launched on first use and closed
// once unused for idleTimeout ms, so a server that lives for hours does not
// hold a browser it used once. The close waits for three things: no open
// context, no launch in flight, and no getBrowser() call for idleTimeout ms.
// The last one covers a caller between getBrowser() and its first
// newContext, which holds the browser without a context yet.
//
// A browser can also break while it stays connected: its newContext or
// newPage answers `Target crashed` from then on. openPage reports that with
// retire(browser), and the next getBrowser() launches a new browser. The
// retired one closes once its last context closes, so calls already running
// on it end as they would have.
function createBrowserLifecycle({ launch, idleTimeout }) {
  // Cached as a promise so concurrent calls awaiting a launch share it.
  let browserPromise = null;
  // The browser browserPromise resolved to, null while a launch is in
  // flight, so retire() can tell whether a browser is still the one handed out.
  let currentBrowser = null;
  let launching = 0;
  let openContexts = 0;
  let idleTimer = null;
  // Open contexts per browser with any open, so a retired browser closes when
  // its last one does.
  const contextsByBrowser = new Map();
  const retired = new Set();

  function closeRetiredIfUnused(browser) {
    if (!retired.has(browser) || contextsByBrowser.has(browser)) {
      return;
    }
    retired.delete(browser);
    browser.close().catch(() => {});
  }

  function closeIfIdle() {
    idleTimer = null;
    if (type.isNone(browserPromise) || openContexts > 0 || launching > 0) {
      return;
    }
    const closing = browserPromise;
    browserPromise = null;
    currentBrowser = null;
    closing.then((browser) => browser.close()).catch(() => {});
  }

  function armIdleClose() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(closeIfIdle, idleTimeout);
    // Never the reason the process stays up.
    idleTimer.unref();
  }

  function startLaunch() {
    launching += 1;
    const launched = launch();
    browserPromise = launched;
    currentBrowser = null;
    launched
      .then((browser) => {
        if (browserPromise === launched) {
          currentBrowser = browser;
        }
      })
      .catch(() => {
        // Forget a failed launch so the next call retries instead of
        // replaying the rejection forever.
        if (browserPromise === launched) {
          browserPromise = null;
        }
      })
      .finally(() => {
        launching -= 1;
        // A launch can outlast the idle timeout (it may wait for the shell
        // download), so the countdown starts again once it settles.
        armIdleClose();
      });
  }

  async function getBrowser() {
    armIdleClose();
    if (type.isNone(browserPromise)) {
      startLaunch();
    }
    const current = browserPromise;
    const browser = await current;
    if (browser.isConnected()) {
      return browser;
    }
    // The browser crashed or was closed under us. Concurrent callers that
    // all saw it share one relaunch.
    if (browserPromise === current) {
      startLaunch();
    }
    return browserPromise;
  }

  // Stops handing out a browser that is connected but broken. Concurrent
  // callers that hit the same crash share one relaunch: only the first call
  // for the current browser retires it, and a browser already replaced is
  // left alone.
  function retire(browser) {
    if (browser !== currentBrowser) {
      return;
    }
    browserPromise = null;
    currentBrowser = null;
    retired.add(browser);
    closeRetiredIfUnused(browser);
  }

  // Counts a context of browser until it closes. Playwright emits close for
  // every way a context ends: context.close(), browser.close() or a browser crash.
  function trackContext({ browser, context }) {
    openContexts += 1;
    contextsByBrowser.set(browser, (contextsByBrowser.get(browser) ?? 0) + 1);
    context.on('close', () => {
      openContexts -= 1;
      const left = contextsByBrowser.get(browser) - 1;
      if (left === 0) {
        contextsByBrowser.delete(browser);
      } else {
        contextsByBrowser.set(browser, left);
      }
      closeRetiredIfUnused(browser);
      if (openContexts === 0) {
        armIdleClose();
      }
    });
  }

  return { getBrowser, retire, trackContext };
}

export default createBrowserLifecycle;
