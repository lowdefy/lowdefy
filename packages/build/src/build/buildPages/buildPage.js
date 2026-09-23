/* eslint-disable no-param-reassign */

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
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

import buildBlock from './buildBlock/buildBlock.js';
import buildSubscriptions from './buildSubscriptions.js';
import collectExceptions from '../../utils/collectExceptions.js';
import createPageContext from './createPageContext.js';
import isReportsPluginDeclared from '../writePluginImports/isReportsPluginDeclared.js';
import validateId from '../../utils/validateId.js';
import validateRequestReferences from './validateRequestReferences.js';

function buildPage({ page, index, context, checkDuplicatePageId }) {
  const configKey = page['~k'];
  if (type.isUndefined(page.id)) {
    collectExceptions(
      context,
      new ConfigError(`Page id missing at page ${index}.`, { configKey })
    );
    return { failed: true };
  }
  if (!type.isString(page.id)) {
    collectExceptions(
      context,
      new ConfigError(`Page id is not a string at page ${index}.`, { received: page.id, configKey })
    );
    return { failed: true };
  }
  validateId({ id: page.id, field: 'Page id', configKey });
  if (checkDuplicatePageId) {
    checkDuplicatePageId({ id: page.id, configKey });
  }
  page.pageId = page.id;
  // Extract subscriptions before block building — validateBlock rejects the
  // subscriptions key on nested blocks, so the page root must not carry it.
  const subscriptions = page.subscriptions;
  delete page.subscriptions;
  const pageContext = createPageContext({
    auth: page.auth,
    callApiActionRefs: context.callApiActionRefs ?? [],
    context,
    dynamicBlockRefs: context.dynamicBlockRefs ?? [],
    linkActionRefs: context.linkActionRefs,
    pageBlock: page,
    pageId: page.pageId,
    typeCounters: context.typeCounters,
    websocketActionRefs: context.websocketActionRefs ?? [],
  });
  const { reportRefs, requests, requestActionRefs, sheetNameRefs, shortcutRefs } = pageContext;
  buildBlock(page, pageContext);
  // set page.id since buildBlock sets id as well.
  page.id = `page:${page.pageId}`;

  // Flag pages with Dynamic blocks so the server can skip resolution
  // (and the deep copy it requires) for static pages with one property read.
  if (pageContext.hasDynamicBlocks === true) {
    page.dynamic = true;
  }

  page.subscriptions = subscriptions;
  buildSubscriptions(page, {
    callApiActionRefs: context.callApiActionRefs ?? [],
    context,
    linkActionRefs: context.linkActionRefs,
    pageId: page.pageId,
    requestActionRefs,
    shortcutRefs,
    typeCounters: context.typeCounters,
    websocketActionRefs: context.websocketActionRefs ?? [],
  });

  // Validate that all Request actions reference defined requests
  validateRequestReferences({
    requestActionRefs,
    requests,
    pageId: page.pageId,
    context,
  });

  // Warn on duplicate shortcuts within the page
  const seenShortcuts = Object.create(null);
  shortcutRefs.forEach(({ shortcut, blockId, eventId, configKey }) => {
    if (seenShortcuts[shortcut]) {
      context.handleWarning(
        new ConfigWarning(
          `Duplicate shortcut "${shortcut}" on event "${eventId}" on block "${blockId}" on page "${page.pageId}" — already defined on block "${seenShortcuts[shortcut].blockId}".`,
          { configKey }
        )
      );
    } else {
      seenShortcuts[shortcut] = { blockId, eventId };
    }
  });

  // Report options do nothing without the plugin that reads them, so a page that
  // carries them in an app that never declared it is almost certainly a mistake.
  // One warning per page, on the first block that carries the key.
  if (reportRefs.length > 0 && !isReportsPluginDeclared({ context })) {
    context.handleWarning(
      new ConfigWarning(
        `Page "${page.pageId}" uses "report" config but "@lowdefy/plugin-reports" is not declared in plugins.`,
        { configKey: reportRefs[0].configKey }
      )
    );
  }

  // Warn on duplicate report sheet names within the page — the plugin
  // de-duplicates at render, but a collision usually signals a config mistake.
  // Keyed case-insensitively (Excel treats sheet names that way) on a null-proto
  // object so a sheetName like "constructor" is data, not a prototype key.
  const seenSheetNames = Object.create(null);
  sheetNameRefs.forEach(({ sheetName, blockId, configKey }) => {
    const key = String(sheetName).toLowerCase();
    if (seenSheetNames[key]) {
      context.handleWarning(
        new ConfigWarning(
          `Duplicate report sheetName "${sheetName}" on block "${blockId}" on page "${page.pageId}" — already defined on block "${seenSheetNames[key].blockId}".`,
          { configKey }
        )
      );
    } else {
      seenSheetNames[key] = { blockId };
    }
  });

  page.requests = requests;
}

export default buildPage;
