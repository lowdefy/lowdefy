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

// Page lifecycle events. Browser signals a page can react to, so apps do not
// have to poll to notice that a tab went away and came back, that the network
// dropped, or that the window was resized.
//
// - onVisible  document became visible again, or the window regained focus.
// - onHidden   document became hidden, or the window lost focus.
// - onOnline   the browser reports the network is back.
// - onOffline  the browser reports the network is gone.
// - onResize   the window was resized.
//
// None of these fire on the initial page load - the active state is seeded from
// the document when the page mounts, and only transitions away from that seed
// trigger an event.

const VISIBILITY_DEBOUNCE_MS = 300;
const RESIZE_DEBOUNCE_MS = 200;

function createPageLifecycleManager() {
  let destroyed = false;
  let removeListeners = [];
  let timeouts = [];

  function init(context) {
    destroyed = false;
    const globals = context?._internal?.lowdefy?._internal?.globals ?? {};
    const win = globals.window;
    const doc = globals.document;
    // Server side render guard - there are no browser listeners to attach to.
    if (typeof document === 'undefined' || !win || !doc) return;
    if (typeof win.addEventListener !== 'function' || typeof doc.addEventListener !== 'function') {
      return;
    }

    const events = context._internal.rootBlock?.events ?? {};
    const configured = (name) => !!events[name];

    const trigger = (name, event) => {
      if (destroyed) return;
      // Page lifecycle chains run like onMountAsync - non blocking, and a
      // failure in the chain must not break the page.
      try {
        Promise.resolve(context._internal.triggerPageEvent({ name, event })).catch((error) => {
          context._internal.lowdefy._internal.handleError?.(error);
        });
      } catch (error) {
        context._internal.lowdefy._internal.handleError?.(error);
      }
    };

    const setTimer = (fn, ms) => {
      const timeout = setTimeout(() => {
        timeouts = timeouts.filter((t) => t !== timeout);
        fn();
      }, ms);
      timeouts.push(timeout);
      return timeout;
    };

    const listen = (target, name, handler) => {
      target.addEventListener(name, handler);
      removeListeners.push(() => target.removeEventListener(name, handler));
    };

    // --- onVisible / onHidden ------------------------------------------------
    if (configured('onVisible') || configured('onHidden')) {
      // Seeded from the document so the initial load never fires an event.
      let active = doc.visibilityState !== 'hidden';
      let pending = null;

      const flush = () => {
        const next = pending;
        pending = null;
        if (destroyed || !next) return;
        // A focus that only restores a state we are already in is not an event.
        if (next.active === active) return;
        active = next.active;
        trigger(next.active ? 'onVisible' : 'onHidden', {
          visible: next.active,
          reason: next.reason,
        });
      };

      // A tab coming back to the front fires visibilitychange and focus. Both
      // are collected into one window so the event chain only runs once.
      const signal = (nextActive, reason) => {
        if (destroyed) return;
        if (pending) {
          pending.active = nextActive;
          // A visibilitychange is the more precise reason, so it wins the pair.
          if (reason === 'visibility') pending.reason = 'visibility';
          return;
        }
        pending = { active: nextActive, reason };
        setTimer(flush, VISIBILITY_DEBOUNCE_MS);
      };

      listen(doc, 'visibilitychange', () => {
        signal(doc.visibilityState !== 'hidden', 'visibility');
      });
      listen(win, 'focus', () => signal(true, 'focus'));
      listen(win, 'blur', () => signal(false, 'focus'));
    }

    // --- onOnline / onOffline ------------------------------------------------
    if (configured('onOnline')) {
      listen(win, 'online', () => trigger('onOnline', { online: true }));
    }
    if (configured('onOffline')) {
      listen(win, 'offline', () => trigger('onOffline', { online: false }));
    }

    // --- onResize ------------------------------------------------------------
    if (configured('onResize')) {
      let resizeTimeout = null;
      listen(win, 'resize', () => {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
          timeouts = timeouts.filter((t) => t !== resizeTimeout);
        }
        resizeTimeout = setTimer(() => {
          resizeTimeout = null;
          trigger('onResize', { width: win.innerWidth, height: win.innerHeight });
        }, RESIZE_DEBOUNCE_MS);
      });
    }
  }

  function destroy() {
    destroyed = true;
    removeListeners.forEach((remove) => remove());
    removeListeners = [];
    timeouts.forEach((timeout) => clearTimeout(timeout));
    timeouts = [];
  }

  return { init, destroy };
}

export { RESIZE_DEBOUNCE_MS, VISIBILITY_DEBOUNCE_MS };
export default createPageLifecycleManager;
