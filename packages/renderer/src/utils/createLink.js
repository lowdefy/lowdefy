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
import { makeContextId } from '@lowdefy/engine';

function createLink({ routeHistory, windowContext, allInputs }) {
  function link({ urlQuery, pageId, url, newTab, home, input }) {
    const lowdefyUrlQuery = type.isNone(urlQuery) ? '' : `?${urlQueryFn.stringify(urlQuery)}`;

    if (pageId) {
      // set input for page before changing
      if (!type.isNone(input)) {
        const nextContextId = makeContextId({
          pageId,
          urlQuery: urlQuery,
          blockId: pageId,
        });
        allInputs[nextContextId] = input;
      }
      if (newTab) {
        windowContext
          .open(`${windowContext.location.origin}/${pageId}${lowdefyUrlQuery}`, '_blank')
          .focus();
      } else {
        routeHistory.push(`/${pageId}${lowdefyUrlQuery}`);
      }
    } else if (url) {
      if (newTab) {
        windowContext.open(`${url}${lowdefyUrlQuery}`, '_blank').focus();
      } else {
        windowContext.location.href = `${url}${lowdefyUrlQuery}`;
      }
    } else if (home) {
      if (newTab) {
        windowContext.open(`${windowContext.location.origin}/${lowdefyUrlQuery}`, '_blank').focus();
      } else {
        routeHistory.push(`/${lowdefyUrlQuery}`);
      }
    } else {
      throw new Error(`Invalid Link.`);
    }
  }
  return link;
}

export default createLink;
