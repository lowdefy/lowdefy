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

// The page config without build markers (~k, ~r, ~l), which differ between two
// _refs to the same file.
function pageConfigSignature(page) {
  return JSON.stringify(page, (key, value) => (key.startsWith('~') ? undefined : value));
}

// Pages share one pageId namespace across targets: requests, auth and
// /api/page/* are keyed by pageId. Every mobile page joins components.pages
// with a target, so routes, auth, requests and page writes treat it as any
// other page. A mobile page with the id of a web page is that page shared: it
// is built once, with target "both", and must be the same config.
function mergeMobilePages({ components }) {
  const webPages = new Map();
  components.pages.forEach((page) => {
    if (type.isString(page.id) && !webPages.has(page.id)) {
      webPages.set(page.id, page);
    }
  });
  (components.mobile.pages ?? []).forEach((page) => {
    const webPage = type.isString(page.id) ? webPages.get(page.id) : undefined;
    if (type.isUndefined(webPage)) {
      page.target = 'mobile';
      components.pages.push(page);
      return;
    }
    if (pageConfigSignature(webPage) !== pageConfigSignature(page)) {
      throw new ConfigError(
        `Page "${page.id}" is in both "pages" and "mobile.pages" with different config. A page shared by web and mobile must be the same config, for example the same _ref.`,
        { configKey: page['~k'] }
      );
    }
    webPage.target = 'both';
  });
  delete components.mobile.pages;
  return components;
}

export default mergeMobilePages;
