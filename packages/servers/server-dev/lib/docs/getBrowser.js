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

import { type, urlQuery as urlQueryFn } from '@lowdefy/helpers';

import lowdefyConfig from '../build/config.js';
import createBrowserLifecycle from './createBrowserLifecycle.js';
import guardJourneyOrigin from './guardJourneyOrigin.js';
import isPageReady from './isPageReady.js';
import launchBrowser from './launchBrowser.js';
import { HEADLESS_USER_COOKIE } from '../server/auth/headlessUser.js';
import resolveHeadlessUser from '../server/auth/resolveHeadlessUser.js';
import { JOURNEY_COOKIES, writeJourneyCookie } from '../server/journeyCookies.js';
import recordingCookiePayload from '../server/recording/recordingCookiePayload.js';

// Module-level singleton, shared by every headless caller (screenshots,
// journeys, state inspection, operator evaluation, state loads) and closed
// after 90 s unused. See createBrowserLifecycle.js.
const { getBrowser, trackContext } = createBrowserLifecycle({
  launch: launchBrowser,
  idleTimeout: 90_000,
});

// `origin` should already include any configured basePath prefix that the
// caller can't derive itself (e.g. from a request URL) — here it's read from
// build/config.json (the same source app.js uses to mount the app) so
// callers only need to pass the bare origin. `urlQuery` (an object) is
// appended as a query string, serialized by the same helper the engine uses
// for Link urlQuery, so a page reads it back through _url_query unchanged.
function buildPageUrl({ origin, pageId, urlQuery }) {
  const basePath = lowdefyConfig.basePath ?? '';
  const url = `${origin}${basePath}/${pageId}`;
  const query = urlQueryFn.stringify(urlQuery);
  if (query === '') {
    return url;
  }
  return `${url}?${query}`;
}

// Opens a fresh browser context + page at the app's pageId route. Callers
// obtain `browser` via getBrowser() themselves so they can map a launch
// failure to their own "no browser available" error message, separate from
// navigation failures.
async function openPage({
  browser,
  origin,
  pageId,
  user,
  urlQuery,
  width = 1280,
  height = 800,
  colorScheme = 'light',
  clientAddress,
  dataCookie,
  mutantCookie,
  recording,
  onContext,
  timeout = 15000,
}) {
  const url = buildPageUrl({ origin, pageId, urlQuery });
  // `none` injects no caller: the context starts signed out and the app's own
  // auth resolves every request from the session cookies it sets. Otherwise
  // the user is resolved before the context is created so an invalid `user`
  // can't leave an orphaned context behind.
  const injectedUser = user === 'none' ? null : resolveHeadlessUser({ user });
  // colorScheme is what the page's `prefers-color-scheme` media query reports,
  // so an app following the system theme renders light or dark accordingly.
  const context = await browser.newContext({ viewport: { width, height }, colorScheme });
  trackContext(context);
  // The URLs a data set journey's context tried to reach on another host of the dev server. Each
  // was aborted; the journey runner fails the step that caused it.
  const leftOrigin = [];
  // From here a failure must close the context before rethrowing: callers only
  // learn about the context from the return value, so an error thrown mid-open
  // (a navigation that times out, a crashed page) would otherwise
  // leak a browser context — and its renderer process — on every failed call.
  try {
    // A caller that watches the context (a journey's network counter) hooks in
    // here, before the first request leaves.
    if (!type.isUndefined(onContext)) {
      await onContext(context);
    }
    // Inject an authenticated user so auth-protected pages don't 404 for the
    // cookieless headless context. Mirrors the e2e user-cookie pattern; scoped to
    // `origin` so it rides along on the same-origin /api/* fetches.
    if (injectedUser !== null) {
      await context.addCookies([
        {
          name: HEADLESS_USER_COOKIE,
          value: Buffer.from(JSON.stringify(injectedUser)).toString('base64'),
          url: origin,
        },
      ]);
    }
    // clientAddress is the address the context's requests come from, as far
    // as the dev server's auth rate limits can tell - see createJourneyActors
    // and journeyActor.js. A cookie, not a header, so it only reaches the app;
    // httpOnly, so page JavaScript cannot read the token. Lax, not Strict: a
    // journey opens an emailed link from a data: URL, a cross-site navigation
    // that a Strict cookie does not ride, and that one verify request would
    // then fall back to the shared loopback address (magic-link verify allows
    // 5 per minute per address).
    if (!type.isUndefined(clientAddress)) {
      await context.addCookies([
        writeJourneyCookie({ name: JOURNEY_COOKIES.actor.name, payload: clientAddress, origin }),
      ]);
    }
    // A journey on a data set: every request from this context reads the data
    // session's database (see lib/server/applyDataSetRedirect.js), while the
    // developer's own tabs keep the app's real one. Set before the first
    // navigation, so no request from this context ever goes without it.
    if (!type.isUndefined(dataCookie)) {
      await context.addCookies([
        writeJourneyCookie({ name: JOURNEY_COOKIES.data.name, payload: dataCookie, origin }),
      ]);
      await guardJourneyOrigin({
        context,
        origin,
        onLeave: (departure) => leftOrigin.push(departure),
      });
    }
    // A harden run's mutant: every request from this context reads the mutated
    // artifact (see lib/server/mutants), while other contexts do not.
    if (!type.isUndefined(mutantCookie)) {
      await context.addCookies([
        writeJourneyCookie({ name: JOURNEY_COOKIES.mutant.name, payload: mutantCookie, origin }),
      ]);
    }
    // Every headless context is marked for the dev recorder: 'off' unless the
    // caller records a journey or explorer run, so screenshots and inspection
    // never record, and a run's records are labelled by the server, not the
    // page. See lib/server/recording.
    await context.addCookies([
      writeJourneyCookie({
        name: JOURNEY_COOKIES.recording.name,
        payload: recordingCookiePayload({ recording }),
        origin,
      }),
    ]);
    const page = await context.newPage();
    // 'load', not 'networkidle': every dev page holds the /api/reload event
    // stream open, so the network never goes idle and a networkidle wait
    // always ran to its full timeout before anything else happened.
    await page.goto(url, { waitUntil: 'load', timeout });
    // The engine builds the page context (and runs onInit + initial requests)
    // after the bundle loads — 'load' fires before that. Every caller
    // (screenshot, inspect, eval, checkpoint load, journeys) needs the app's
    // async lifecycle to have settled, not just the bundle to have loaded, so
    // wait on isPageReady - for the page the app shows (a null pageId), which
    // is not the one asked for when the app redirects, as a protected page
    // does for a signed-out caller. Tolerant: on timeout proceed with ready:
    // false and let the caller surface what it finds — a snapshot of a hung
    // page is still useful signal, and a far better answer than a tool failure.
    let ready = true;
    await page.waitForFunction(isPageReady, null, { timeout }).catch(() => {
      ready = false;
    });
    // Images blocks render start loading only once the page is ready; a
    // screenshot taken before they arrive shows empty frames. A lazy image
    // below the fold never loads until scrolled to, so it counts as done.
    await page
      .waitForFunction(
        () =>
          Array.from(document.images).every((image) => image.complete || image.loading === 'lazy'),
        undefined,
        { timeout }
      )
      .catch(() => {});
    return { context, page, ready, url, leftOrigin };
  } catch (error) {
    await context.close().catch(() => {});
    throw error;
  }
}

export { getBrowser, openPage, buildPageUrl };
