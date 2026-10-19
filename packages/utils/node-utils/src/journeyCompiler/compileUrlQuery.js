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

// The journey's urlQuery from the URL its segment entered on. Production
// records keep query keys and drop values, so each key comes back with a null
// value for someone to fill in.
function compileUrlQuery({ url, production }) {
  if (!type.isString(url)) return undefined;
  const query = new URL(url, 'http://lowdefy.invalid').searchParams;
  const keys = [...new Set(query.keys())];
  if (keys.length === 0) return undefined;
  const urlQuery = {};
  keys.forEach((key) => {
    urlQuery[key] = production ? null : query.get(key);
  });
  return urlQuery;
}

export default compileUrlQuery;
