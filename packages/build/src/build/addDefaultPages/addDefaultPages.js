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
import page404 from './404.js';

function addDefaultPages({ components }) {
  // If not copied, the same object is mutated by build every time
  // build runs for dev server. See #647
  const defaultPages = [JSON.parse(JSON.stringify(page404))];

  if (type.isNone(components.pages)) {
    components.pages = [];
  }
  if (!type.isArray(components.pages)) {
    throw new Error('lowdefy.pages is not an array.');
  }

  const pageIds = components.pages.map((page, index) => {
    if (!type.isObject(page)) {
      throw new Error(`pages[${index}] is not an object. Received ${JSON.stringify(page)}`);
    }
    return page.id;
  });
  // deep copy to avoid mutating defaultConfig
  const filteredDefaultPages = defaultPages.filter(
    (defaultPage) => !pageIds.includes(defaultPage.id)
  );
  components.pages = [...components.pages, ...filteredDefaultPages];
  return components;
}

export default addDefaultPages;
