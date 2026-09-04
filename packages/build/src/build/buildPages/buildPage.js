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
import createCheckDuplicateBlockId from './createCheckDuplicateBlockId.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import createPageTypeCounters from './createPageTypeCounters.js';
import validateId from '../../utils/validateId.js';
import createCounter from '../../utils/createCounter.js';
import validateRequestReferences from './validateRequestReferences.js';

function buildPage({ page, index, context, checkDuplicatePageId }) {
  const configKey = page['~k'];
  if (type.isUndefined(page.id)) {
    collectExceptions(context, new ConfigError(`Page id missing at page ${index}.`, { configKey }));
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
  const requests = [];
  const requestActionRefs = [];
  const shortcutRefs = [];
  // Extract subscriptions before block building — validateBlock rejects the
  // subscriptions key on nested blocks, so the page root must not carry it.
  const subscriptions = page.subscriptions;
  delete page.subscriptions;
  // The state contract is likewise page-only: validateBlock rejects `state` on
  // nested blocks, so it moves to page.stateSchema before the root block builds.
  if (!type.isNone(page.state)) {
    page.stateSchema = page.state;
  }
  delete page.state;
  // The page's own type set, recorded as the page builds and read by
  // writePageImports to emit the page's type-import module. Initialised here
  // because buildPage is the only producer, and the full, JIT and dynamic
  // build paths each construct their own context.
  if (type.isNone(context.pageTypes)) {
    context.pageTypes = {};
  }
  const pageTypeCounters = createPageTypeCounters({ typeCounters: context.typeCounters });
  const pageContext = {
    auth: page.auth,
    blockIdCounter: createCounter(),
    callApiActionRefs: context.callApiActionRefs ?? [],
    websocketActionRefs: context.websocketActionRefs ?? [],
    dynamicBlockRefs: context.dynamicBlockRefs ?? [],
    checkDuplicateBlockId: createCheckDuplicateBlockId({ context, pageId: page.pageId }),
    checkDuplicateRequestId: createCheckDuplicateId({
      message: 'Duplicate requestId "{{ id }}" on page "{{ pageId }}".',
    }),
    context,
    pageId: page.pageId,
    requests,
    requestActionRefs,
    orgClientActionRefs: context.orgClientActionRefs ?? [],
    shortcutRefs,
    linkActionRefs: context.linkActionRefs,
    typeCounters: pageTypeCounters.counters,
  };
  // The page's own block is the only block that receives onInit/onInitAsync.
  pageContext.rootBlockId = page.pageId;
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
    orgClientActionRefs: context.orgClientActionRefs ?? [],
    shortcutRefs,
    typeCounters: pageTypeCounters.counters,
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
  const seenShortcuts = {};
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

  page.requests = requests;
  context.pageTypes[page.pageId] = pageTypeCounters.types;
}

export default buildPage;
