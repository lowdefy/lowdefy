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

// Evaluates an operator expression against the live client state of a
// headless Chromium tab navigated to the page instance's own route (`pathParams`
// fill a patterned page's placeholders), read under the instance key, using the page's
// own WebParser instance so results match runtime exactly. Mirrors
// Inspector.jsx's evalExpression (the live-tab equivalent).
async function evalOperatorHeadless({
  origin,
  pageId,
  pathParams,
  expression,
  user,
  data,
  timeout = 15000,
}) {
  if (type.isNone(origin) || !type.isString(origin)) {
    return {
      error: `evalOperatorHeadless requires an "origin" string. Received ${JSON.stringify(
        origin
      )}.`,
    };
  }
  if (type.isNone(pageId) || !type.isString(pageId)) {
    return {
      error: `evalOperatorHeadless requires a "pageId" string. Received ${JSON.stringify(pageId)}.`,
    };
  }
  if (type.isNone(expression)) {
    return { error: 'evalOperatorHeadless requires an "expression".' };
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
          evalOperatorInBrowser({
            origin,
            pageId,
            pathParams,
            instance,
            expression,
            user: caller.user,
            dataCookie,
            timeout,
          }),
      }),
  });
}

// The part of evalOperatorHeadless that runs in the browser, inside a browser slot.
async function evalOperatorInBrowser({
  origin,
  pageId,
  pathParams,
  instance,
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
    // Passed through as JSON so the page-side parser always receives a plain
    // value, matching how it arrives at Inspector.jsx's eval-request handler.
    const expressionJson = JSON.stringify(expression);
    const result = await opened.page.evaluate(
      ({ id, instanceKey, path, exprJson }) => {
        const lowdefy = window.lowdefy;
        const pageContext = lowdefy?.contexts?.[instanceKey];
        if (!pageContext) {
          return { error: `No live context for page "${id}" at "/${path}".` };
        }
        const input = JSON.parse(exprJson);
        const { output, errors } = pageContext._internal.parser.parse({
          input,
          location: 'agent_eval',
        });
        return {
          value: output === undefined ? undefined : JSON.parse(JSON.stringify(output)),
          errors: errors.map((error) => error.message),
        };
      },
      {
        id: pageId,
        instanceKey: instance.instanceKey,
        path: instance.path,
        exprJson: expressionJson,
      }
    );
    if (!opened.ready) {
      return { ...result, ready: false, note: unsettledPageNote({ timeout }) };
    }
    return result;
  } catch (error) {
    return { error: `Failed to evaluate operator at "${url}": ${error.message}` };
  } finally {
    if (context) {
      await context.close();
    }
  }
}

export default evalOperatorHeadless;
