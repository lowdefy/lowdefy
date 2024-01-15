/* eslint-disable no-param-reassign */

/*
  Copyright 2020-2024 Lowdefy, Inc

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
import buildBlock from './buildBlock/buildBlock.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import createCounter from '../../utils/createCounter.js';

function buildPage({ page, index, context, checkDuplicatePageId }) {
  if (type.isUndefined(page.id)) {
    throw new Error(`Page id missing at page ${index}.`);
  }
  if (!type.isString(page.id)) {
    throw new Error(
      `Page id is not a string at page ${index}. Received ${JSON.stringify(page.id)}.`
    );
  }
  checkDuplicatePageId({ id: page.id });
  page.pageId = page.id;
  const requests = [];
  buildBlock(page, {
    auth: page.auth,
    blockIdCounter: createCounter(),
    checkDuplicateRequestId: createCheckDuplicateId({
      message: 'Duplicate requestId "{{ id }}" on page "{{ pageId }}".',
    }),
    pageId: page.pageId,
    requests,
    typeCounters: context.typeCounters,
  });
  // set page.id since buildBlock sets id as well.
  page.id = `page:${page.pageId}`;

  page.requests = requests;
}

export default buildPage;
