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

import { buildPageUrl, getBrowser, openPage } from './getBrowser.js';
import noBrowserError from './noBrowserError.js';
import { loadMocks } from './devMockRegistry.js';
import { readCheckpoint } from './checkpointStore.js';
import resolvePageInstance from './resolvePageInstance.js';
import resolveToolCaller from './resolveToolCaller.js';
import unsettledPageNote from './unsettledPageNote.js';
import withBrowserSlot from './withBrowserSlot.js';
import withDataSession from './withDataSession.js';

const VERIFY_KEY_COUNT = 3;
const READY_TIMEOUT = 15000;

// Loads a state checkpoint's recorded requests into devMockRegistry (shared
// by both modes below — src/routes/request.js consults it regardless of how
// the page was opened), then either:
//   - 'headless': drives a headless page to the checkpoint's page instance
//     (pageId, pathParams) and urlQuery, injects its recorded state directly
//     into that instance's context, and verifies
//     a few keys round-tripped. Good for an agent verifying its own change.
//     Takes a `user` (and `data`, see resolveToolCaller) so a checkpoint
//     captured on a role-gated page restores into a page that actually
//     renders (see resolveHeadlessUser.js).
//   - 'registry-only': just returns a URL a human can open in a real browser
//     tab — client/Inspector.jsx's `?_checkpoint=` bootstrap does the state
//     injection client-side once that tab loads.
async function loadState({ origin, name, mode = 'headless', user, data }) {
  if (type.isNone(name) || !type.isString(name)) {
    return { error: `loadState requires a "name" string. Received ${JSON.stringify(name)}.` };
  }

  // `user` only reaches a page this function opens itself. In 'registry-only'
  // mode the developer opens the returned URL in their own browser, carrying
  // their own session, so an injected caller would be silently dropped.
  if ((!type.isNone(user) || !type.isNone(data)) && mode === 'registry-only') {
    const param = type.isNone(user) ? 'data' : 'user';
    return {
      error: `loadState cannot apply "${param}" in "registry-only" mode — the developer opens the returned URL in their own browser, carrying their own session and database. Use the default "headless" mode.`,
      invalidInput: true,
    };
  }

  let checkpoint;
  try {
    checkpoint = readCheckpoint({ name });
  } catch (error) {
    return { error: error.message };
  }

  const pageId = checkpoint.checkpoint.pageId;
  if (type.isNone(pageId)) {
    return { error: `Checkpoint "${name}" has no recorded pageId.` };
  }

  const { pathParams } = checkpoint;
  const instance = resolvePageInstance({ pageId, pathParams });
  if (!type.isUndefined(instance.error)) {
    return { error: `Checkpoint "${name}" cannot open its page: ${instance.error}` };
  }

  loadMocks({ pageId, mocks: checkpoint.requests });

  // The checkpoint keeps the query string the page was captured at.
  const urlQuery = urlQueryFn.parse(checkpoint.urlQuery);

  if (mode === 'registry-only') {
    const url = buildPageUrl({
      origin,
      pageId,
      path: instance.path,
      pathParams,
      urlQuery: { ...urlQuery, _checkpoint: name },
    });
    return {
      url,
      instructions:
        'Open this URL in a browser — state is injected on load, requests serve recorded data.',
    };
  }

  if (mode !== 'headless') {
    return {
      error: `loadState "mode" must be "headless" or "registry-only". Received ${JSON.stringify(
        mode
      )}.`,
    };
  }

  if (type.isNone(origin) || !type.isString(origin)) {
    return { error: `loadState requires an "origin" string. Received ${JSON.stringify(origin)}.` };
  }

  const caller = await resolveToolCaller({ user, data });
  if (!type.isUndefined(caller.error)) {
    return caller;
  }

  return withBrowserSlot({
    task: () =>
      withDataSession({
        dataSet: caller.dataSet,
        task: ({ dataCookie }) =>
          loadStateInBrowser({
            origin,
            name,
            mode,
            user: caller.user,
            dataCookie,
            pageId,
            instance,
            pathParams,
            urlQuery,
            checkpoint,
          }),
      }),
  });
}

// The part of loadState that runs in the browser, inside a browser slot.
async function loadStateInBrowser({
  origin,
  name,
  mode,
  user,
  dataCookie,
  pageId,
  instance,
  pathParams,
  urlQuery,
  checkpoint,
}) {
  let browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    return { error: noBrowserError(error) };
  }

  let context;
  try {
    const opened = await openPage({
      browser,
      origin,
      pageId,
      path: instance.path,
      pathParams,
      urlQuery,
      user,
      dataCookie,
      timeout: READY_TIMEOUT,
    });
    context = opened.context;
    const { page } = opened;

    await page.waitForFunction(
      (contextKey) => Boolean(window.lowdefy?.contexts?.[contextKey]),
      instance.instanceKey,
      {
        timeout: READY_TIMEOUT,
      }
    );

    const stateEntries = Object.entries(checkpoint.state ?? {});
    await page.evaluate(
      ({ contextKey, entries }) => {
        const pageContext = window.lowdefy.contexts[contextKey];
        entries.forEach(([key, value]) => {
          pageContext._internal.State.set(key, value);
        });
        pageContext._internal.update();
      },
      { contextKey: instance.instanceKey, entries: stateEntries }
    );

    const verifyKeys = stateEntries.slice(0, VERIFY_KEY_COUNT).map(([key]) => key);
    const verifiedKeys = await page.evaluate(
      ({ contextKey, keys }) => {
        const pageContext = window.lowdefy.contexts[contextKey];
        const result = {};
        keys.forEach((key) => {
          result[key] = pageContext.state?.[key];
        });
        return result;
      },
      { contextKey: instance.instanceKey, keys: verifyKeys }
    );

    const result = { loaded: true, mode, url: opened.url, verifiedKeys };
    if (!opened.ready) {
      return { ...result, ready: false, note: unsettledPageNote({ timeout: READY_TIMEOUT }) };
    }
    return result;
  } catch (error) {
    return { error: `Failed to load checkpoint "${name}": ${error.message}` };
  } finally {
    if (context) {
      await context.close();
    }
  }
}

export default loadState;
