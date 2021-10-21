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

import { type, urlQuery as urlQueryFn } from '@lowdefy/helpers';

function createLink({ backLink, lowdefy, newOriginLink, sameOriginLink }) {
  function link({ back, home, input, newTab, pageId, url, urlQuery }) {
    if (back) {
      return backLink();
    }
    const lowdefyUrlQuery = type.isNone(urlQuery) ? '' : `?${urlQueryFn.stringify(urlQuery)}`;
    if (home) pageId = lowdefy.homePageId;
    if (pageId) {
      if (!type.isNone(input)) {
        lowdefy.inputs[pageId] = input;
      }
      return sameOriginLink(`/${pageId}${lowdefyUrlQuery}`, newTab);
    } else if (url) {
      return newOriginLink(`${url}${lowdefyUrlQuery}`, newTab);
    } else {
      throw new Error(`Invalid Link.`);
    }
  }
  return link;
}

export default createLink;
