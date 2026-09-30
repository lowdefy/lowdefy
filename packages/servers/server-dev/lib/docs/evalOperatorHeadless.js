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
import unsettledPageNote from './unsettledPageNote.js';

// Evaluates an operator expression against the live client state of a
// headless Chromium tab navigated to the page's own route, using the page's
// own WebParser instance so results match runtime exactly. Mirrors
// Inspector.jsx's evalExpression (the live-tab equivalent).
async function evalOperatorHeadless({ origin, pageId, expression, user, timeout = 15000 }) {
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

  let browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    return {
      error: `No Chromium available. Run: npx playwright install chromium (${error.message})`,
    };
  }

  const url = buildPageUrl({ origin, pageId });

  let context;
  try {
    const opened = await openPage({ browser, origin, pageId, user, timeout });
    context = opened.context;
    // Passed through as JSON so the page-side parser always receives a plain
    // value, matching how it arrives at Inspector.jsx's eval-request handler.
    const expressionJson = JSON.stringify(expression);
    const result = await opened.page.evaluate(
      ({ id, exprJson }) => {
        const lowdefy = window.lowdefy;
        const pageContext = lowdefy?.contexts?.[`page:${id}`];
        if (!pageContext) {
          return { error: `No live context for page "${id}".` };
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
      { id: pageId, exprJson: expressionJson }
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
