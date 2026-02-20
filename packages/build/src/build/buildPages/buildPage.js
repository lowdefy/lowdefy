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
import { ConfigError } from '@lowdefy/errors';

import buildBlock from './buildBlock/buildBlock.js';
import collectExceptions from '../../utils/collectExceptions.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import createCounter from '../../utils/createCounter.js';
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
  checkDuplicatePageId({ id: page.id, configKey });
  page.pageId = page.id;
  const requests = [];
  const requestActionRefs = [];
  buildBlock(page, {
    auth: page.auth,
    blockIdCounter: createCounter(),
    checkDuplicateRequestId: createCheckDuplicateId({
      message: 'Duplicate requestId "{{ id }}" on page "{{ pageId }}".',
    }),
    context,
    pageId: page.pageId,
    requests,
    requestActionRefs,
    linkActionRefs: context.linkActionRefs,
    typeCounters: context.typeCounters,
  });
  // set page.id since buildBlock sets id as well.
  page.id = `page:${page.pageId}`;

  // Validate that all Request actions reference defined requests
  validateRequestReferences({
    requestActionRefs,
    requests,
    pageId: page.pageId,
    context,
  });

  page.requests = requests;
}

export default buildPage;
