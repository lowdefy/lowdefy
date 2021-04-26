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

async function checkPageIsContext(page, metaLoader) {
  if (type.isNone(page.type)) {
    throw new Error(`Page type is not defined at ${page.pageId}.`);
  }
  if (!type.isString(page.type)) {
    throw new Error(
      `Page type is not a string at ${page.pageId}. Received ${JSON.stringify(page.type)}`
    );
  }
  const meta = await metaLoader.load(page.type);
  if (!meta) {
    throw new Error(
      `Invalid block type at page ${page.pageId}. Received ${JSON.stringify(page.type)}`
    );
  }
  if (meta.category !== 'context') {
    throw new Error(
      `Page ${page.pageId} is not of category "context". Received ${JSON.stringify(page.type)}`
    );
  }
}

export default checkPageIsContext;
