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

import { getBrowser, openPage, buildPageUrl } from './getBrowser.js';
import noBrowserError from './noBrowserError.js';
import resolvePageInstance from './resolvePageInstance.js';
import resolveToolCaller from './resolveToolCaller.js';
import unsettledPageNote from './unsettledPageNote.js';
import withBrowserSlot from './withBrowserSlot.js';
import withDataSession from './withDataSession.js';

// Collects a state snapshot from a headless Chromium tab navigated to the
// page instance's own route (`pathParams` fill a patterned page's placeholders),
// read under the instance key. Mirrors Inspector.jsx's buildSnapshot (the live-tab
// equivalent), but window.lowdefy does not expose the app's serializer, so
// the snapshot is round-tripped through JSON.parse(JSON.stringify(...))
// inside the page instead. That strips functions/undefined and turns Dates
// into plain ISO strings — good enough for agent inspection, just not a
// byte-for-byte match of the app's own `~d`-tagged serialization.
async function inspectStateHeadless({ origin, pageId, pathParams, user, data, timeout = 15000 }) {
  if (type.isNone(origin) || !type.isString(origin)) {
    return {
      error: `inspectStateHeadless requires an "origin" string. Received ${JSON.stringify(
        origin
      )}.`,
    };
  }
  if (type.isNone(pageId) || !type.isString(pageId)) {
    return {
      error: `inspectStateHeadless requires a "pageId" string. Received ${JSON.stringify(pageId)}.`,
    };
  }

  const instance = resolvePageInstance({ pageId, pathParams });
  if (!type.isUndefined(instance.error)) {
    return { error: instance.error, invalidInput: true };
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
          inspectStateInBrowser({
            origin,
            pageId,
            pathParams,
            instance,
            user: caller.user,
            dataCookie,
            timeout,
          }),
      }),
  });
}

// The part of inspectStateHeadless that runs in the browser, inside a browser slot.
async function inspectStateInBrowser({
  origin,
  pageId,
  pathParams,
  instance,
  user,
  dataCookie,
  timeout,
}) {
  let browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    return { error: noBrowserError(error) };
  }

  const url = buildPageUrl({ origin, pageId, path: instance.path, pathParams });

  let context;
  try {
    const opened = await openPage({
      browser,
      origin,
      pageId,
      path: instance.path,
      pathParams,
      user,
      dataCookie,
      timeout,
    });
    context = opened.context;
    const snapshot = await opened.page.evaluate(
      ({ id, instanceKey, path }) => {
        const lowdefy = window.lowdefy;
        const pageContext = lowdefy?.contexts?.[instanceKey];
        if (!pageContext) {
          return { error: `No live context for page "${id}" at "/${path}".` };
        }
        return JSON.parse(
          JSON.stringify({
            pageId: id,
            pathParams: pageContext.pathParams,
            instanceKey,
            state: pageContext.state,
            requests: pageContext.requests,
            eventLog: (pageContext.eventLog ?? []).slice(-50),
            global: lowdefy.lowdefyGlobal,
            user: lowdefy.user,
            input: lowdefy.inputs?.[instanceKey],
            urlQuery: window.location.search,
          })
        );
      },
      { id: pageId, instanceKey: instance.instanceKey, path: instance.path }
    );
    if (!opened.ready) {
      return { ...snapshot, ready: false, note: unsettledPageNote({ timeout }) };
    }
    return snapshot;
  } catch (error) {
    return { error: `Failed to inspect state at "${url}": ${error.message}` };
  } finally {
    if (context) {
      await context.close();
    }
  }
}

export default inspectStateHeadless;
