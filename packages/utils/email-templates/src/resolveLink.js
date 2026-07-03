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

function resolveLink(link) {
  if (type.isString(link) && /^https?:\/\//.test(link)) {
    return link;
  }
  if (type.isObject(link)) {
    const query = type.isNone(link.urlQuery) ? '' : `?${new URLSearchParams(link.urlQuery)}`;
    return `/${link.pageId}${query}`;
  }
  return link;
}

export default resolveLink;
