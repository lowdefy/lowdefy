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
// read under the instance key, or with evaluate the value of an operator
// expression against that state. Mirrors Inspector.jsx's buildSnapshot and
// evalExpression (the live-tab equivalents), but window.lowdefy does not expose
// the app's serializer, so results are round-tripped through
// JSON.parse(JSON.stringify(...)) inside the page instead. That strips
// functions/undefined and turns Dates into plain ISO strings — good enough for
// agent inspection, just not a byte-for-byte match of the app's own
// `~d`-tagged serialization.
async function inspectStateHeadless({
  origin,
  pageId,
  pathParams,
  evaluate = false,
  expression,
  user,
  data,
  timeout = 15000,
}) {
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
            evaluate,
            expression,
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
  evaluate,
  expression,
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
    const pageArgs = { id: pageId, instanceKey: instance.instanceKey, path: instance.path };
    // The expression is passed through as JSON so the page-side parser always
    // receives a plain value, matching how it arrives at Inspector.jsx's
    // eval-request handler.
    const result = evaluate
      ? await opened.page.evaluate(evaluateInPage, {
          ...pageArgs,
          expressionJson: JSON.stringify(expression),
        })
      : await opened.page.evaluate(snapshotInPage, pageArgs);
    if (!opened.ready) {
      return { ...result, ready: false, note: unsettledPageNote({ timeout }) };
    }
    return result;
  } catch (error) {
    const action = evaluate ? 'evaluate operator' : 'inspect state';
    return { error: `Failed to ${action} at "${url}": ${error.message}` };
  } finally {
    if (context) {
      await context.close();
    }
  }
}

// Runs in the page: serialized by Playwright, so it may use nothing from this module.
function snapshotInPage({ id, instanceKey, path }) {
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
}

// Runs in the page, like snapshotInPage. A read recorder set on the context
// while the expression is parsed collects the keys its operators read (the
// engine's block dependency tracking), e.g. "state:customer.name".
function evaluateInPage({ id, instanceKey, path, expressionJson }) {
  const lowdefy = window.lowdefy;
  const pageContext = lowdefy?.contexts?.[instanceKey];
  if (!pageContext) {
    return { error: `No live context for page "${id}" at "/${path}".` };
  }
  const reads = new Set();
  const recordRead = (key) => {
    if (typeof key === 'string') reads.add(key);
  };
  const ignore = () => {};
  const previousRecorder = pageContext._internal.readRecorder;
  pageContext._internal.readRecorder = {
    read: recordRead,
    engineRead: recordRead,
    pure: ignore,
    volatile: ignore,
    untracked: ignore,
  };
  let parsed;
  try {
    parsed = pageContext._internal.parser.parse({
      input: JSON.parse(expressionJson),
      location: 'agent_eval',
    });
  } finally {
    pageContext._internal.readRecorder = previousRecorder;
  }
  const { output, errors } = parsed;
  return {
    value: output === undefined ? undefined : JSON.parse(JSON.stringify(output)),
    errors: errors.map((error) => error.message),
    reads: [...reads],
  };
}

export default inspectStateHeadless;
