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

import { type, urlQuery } from '@lowdefy/helpers';
import makeContextId from '../makeContextId';

async function Link({ context, params }) {
  const lowdefyUrlQuery = type.isNone(params.urlQuery)
    ? ''
    : `?${urlQuery.stringify(params.urlQuery)}`;

  let pageId;
  if (type.isString(params)) pageId = params;
  if (params.pageId) pageId = params.pageId;

  if (pageId) {
    // set input for page before changing
    if (!type.isNone(params.input)) {
      const nextContextId = makeContextId({
        pageId,
        search: params.urlQuery,
        blockId: pageId,
      });
      context.allInputs[nextContextId] = params.input;
    }
    if (params.newTab) {
      context.window
        .open(`${context.window.location.origin}/${pageId}${lowdefyUrlQuery}`, '_blank')
        .focus();
    } else {
      context.routeHistory.push(`/${pageId}${lowdefyUrlQuery}`);
    }
  } else if (params.url) {
    if (params.newTab) {
      context.window.open(`${params.url}${lowdefyUrlQuery}`, '_blank').focus();
    } else {
      context.window.location.href = `${params.url}${lowdefyUrlQuery}`;
    }
  } else if (params.home) {
    if (params.newTab) {
      context.window.open(`${context.window.location.origin}/${lowdefyUrlQuery}`, '_blank').focus();
    } else {
      context.routeHistory.push(`/${lowdefyUrlQuery}`);
    }
  }
  throw new Error('Invalid Link action.');
}

export default Link;
