/* eslint-disable no-param-reassign */

/*
  Copyright 2020-2021 Lowdefy, Inc

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
import buildBlock from './buildBlock';
import checkPageIsContext from './checkPageIsContext';
import fillContextOperators from './fillContextOperators';

/* Page and block build steps

Pages:
  - set pageId = id
  - set id = `page:${page.id}`

Blocks:
  - set blockId = id
  - set id = `block:${pageId}:${block.id}` if not a page
  - set request ids
  - set block meta
  - set blocks to areas.content
  - set operators list on context blocks
*/

async function buildPages({ components, context }) {
  const pages = type.isArray(components.pages) ? components.pages : [];
  const pageBuildPromises = pages.map(async (page, i) => {
    if (type.isUndefined(page.id)) {
      throw new Error(`Page id missing at page ${i}`);
    }
    page.pageId = page.id;
    await checkPageIsContext(page, context.metaLoader);
    await buildBlock(page, {
      auth: page.auth,
      pageId: page.pageId,
      requests: [],
      metaLoader: context.metaLoader,
    });
    // set page.id since buildBlock sets id as well.
    page.id = `page:${page.pageId}`;
    fillContextOperators(page);
  });
  await Promise.all(pageBuildPromises);
  return components;
}

export default buildPages;
