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

import { get, type } from '@lowdefy/helpers';

// `rowLink.urlQuery` values are row paths (as ag-grid's link cells); everything else passes to
// the Link action as written.
function resolveRowLink({ rowLink, row }) {
  const link = { ...rowLink };
  if (type.isObject(rowLink.urlQuery)) {
    link.urlQuery = {};
    Object.entries(rowLink.urlQuery).forEach(([key, path]) => {
      link.urlQuery[key] = type.isString(path) ? get(row, path) : path;
    });
  }
  return link;
}

export default resolveRowLink;
