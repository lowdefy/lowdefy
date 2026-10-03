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

import createPairingBuffer from './createPairingBuffer.js';
import createPasswordRedactor from './createPasswordRedactor.js';
import createRecordBatcher from './createRecordBatcher.js';
import createRecordingSession from './createRecordingSession.js';
import keyChord from './keyChord.js';
import sendRecords from './sendRecords.js';

// Dev tools draw their own UI over the app; clicks on it are not the app.
const IGNORED_ROOTS = '[data-lowdefy-feedback]';

function elementOf(target) {
  if (target === null || target === undefined) return null;
  if (target.nodeType === 1) return target;
  return target.parentElement ?? null;
}

function valueOf(element) {
  if (element.type === 'checkbox' || element.type === 'radio') return element.checked;
  if ('value' in element) return element.value;
  return element.textContent ?? null;
}

// Guards a listener: a bad payload or a broken hook must never reach the app
// the recorder rides on.
function safely(handler) {
  return function guarded(...args) {
    try {
      handler(...args);
    } catch {
      // Recording is best effort.
    }
  };
}

// The dev recorder for one tab: subscribes to the engine's trace hook with
// state, listens to DOM interactions in the capture phase, pairs them through
// the pairing buffer and batches finished records to /api/dev-recording. It
// opens no connection of its own: sends are short keepalive POSTs, and the
// recorder flushes on the shared dev stream's reload event (attachStream).
// Returns null, subscribing to nothing, when recording is off for this page.
function createRecorder({ basePath, lowdefy, recording, window, getTrace }) {
  if (recording?.enabled !== true) return null;
  const { document } = window;
  const trace = getTrace(lowdefy);
  const session = createRecordingSession({ storage: window.sessionStorage });
  const batcher = createRecordBatcher({
    send: (records) => sendRecords({ basePath, records, fetch: window.fetch.bind(window) }),
  });
  const buffer = createPairingBuffer({
    onRecord: (record) => batcher.add(record),
    getSession: () => session.getId(),
    getRoles: () => lowdefy.user?.roles ?? [],
    getBuild: () => lowdefy._devBuildId ?? null,
    redactor: createPasswordRedactor(),
  });
  let pageId = null;
  // A pageview waits here until Page.jsx renders the page's config, because
  // only then is the build the page runs on known: the pageview fires on the
  // route change, while the config fetch is still suspended.
  let pendingPageview = null;

  function currentUrl() {
    return `${window.location.pathname}${window.location.search}`;
  }

  function describe(element) {
    if (element === null || element.closest(IGNORED_ROOTS) !== null) return null;
    return trace.describeElement(element);
  }

  const onClick = safely((event) => {
    const element = elementOf(event.target);
    const target = describe(element);
    if (target === null) return;
    buffer.addInteraction({ kind: 'click', element, target, pageId });
  });

  const onInput = safely((event) => {
    const element = elementOf(event.target);
    const target = describe(element);
    if (target === null) return;
    buffer.addInteraction({ kind: 'change', element, target, pageId, value: valueOf(element) });
  });

  const onKeyDown = safely((event) => {
    const key = keyChord(event, { platform: window.navigator.platform });
    if (key === null) return;
    const element = elementOf(event.target);
    if (element !== null && element.closest(IGNORED_ROOTS) !== null) return;
    const target = element === null || element === document.body ? null : describe(element);
    buffer.addInteraction({ kind: 'key', element, target, pageId, key });
  });

  const onPopState = safely(() => {
    buffer.addInteraction({ kind: 'back', pageId });
  });

  const onTrace = safely((payload) => {
    buffer.addEvent(payload, { urlAfter: currentUrl() });
  });

  function flush() {
    try {
      buffer.flushAll();
      return batcher.flush();
    } catch {
      return Promise.resolve();
    }
  }

  function recordPendingPageview({ build }) {
    if (pendingPageview === null) return;
    const { t, pageId: viewedPageId, url } = pendingPageview;
    pendingPageview = null;
    buffer.addInteraction({ t, kind: 'pageview', pageId: viewedPageId, url, build });
  }

  // The tab is going away, so a page that never rendered keeps build null and
  // the route stamps its current build, as for any record that names none.
  const onPageHide = safely(() => {
    recordPendingPageview({ build: null });
    flush();
  });

  const unsubscribe = trace.subscribe(onTrace, { state: true });
  document.addEventListener('click', onClick, true);
  document.addEventListener('input', onInput, true);
  document.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('popstate', onPopState);
  window.addEventListener('pagehide', onPageHide);
  window.__lowdefyRecorder = { flush };

  // The time and url are the navigation's; the build waits for pageRendered.
  // A page left before its config rendered is recorded with build null.
  function pageview(nextPageId) {
    try {
      recordPendingPageview({ build: null });
      pageId = nextPageId;
      pendingPageview = { t: Date.now(), pageId, url: currentUrl() };
    } catch {
      // Recording is best effort.
    }
  }

  // Called by Page.jsx (lowdefy._devPageRendered) once it has rendered a page
  // config, with the build that config was served under. Its effect runs after
  // the Recorder's pageview effect for the same route change, since the
  // Recorder renders before the Suspense boundary Page sits under. Renders
  // after a config reload find no pending pageview and change nothing.
  function pageRendered({ pageId: renderedPageId, buildId }) {
    try {
      if (pendingPageview === null || pendingPageview.pageId !== renderedPageId) return;
      recordPendingPageview({ build: buildId ?? null });
    } catch {
      // Recording is best effort.
    }
  }
  lowdefy._devPageRendered = pageRendered;

  // Listens on the tab's one shared dev stream (DevStreamContext), never a
  // stream of its own. A config reload flushes so the attempt before it is
  // sent promptly; each record already carries the build it was made under.
  function attachStream(source) {
    if (source === null || source === undefined) return () => {};
    const onReload = safely(() => {
      flush();
    });
    source.addEventListener('reload', onReload);
    return () => source.removeEventListener('reload', onReload);
  }

  function stop() {
    recordPendingPageview({ build: null });
    flush();
    unsubscribe();
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('input', onInput, true);
    document.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('popstate', onPopState);
    window.removeEventListener('pagehide', onPageHide);
    if (window.__lowdefyRecorder?.flush === flush) {
      delete window.__lowdefyRecorder;
    }
    if (lowdefy._devPageRendered === pageRendered) {
      delete lowdefy._devPageRendered;
    }
  }

  return { attachStream, flush, pageRendered, pageview, stop };
}

export default createRecorder;
