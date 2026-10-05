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
import { matchPagePath } from '@lowdefy/node-utils';

// The page ids behind the request paths a journey's browsers loaded, matched
// through the route table the way the page route matches them, so every
// instance of a patterned page names the one page. A path no page answers
// names none.
function matchExercisedPages({ routes, pagePaths }) {
  const pageIds = new Set();
  pagePaths.forEach((path) => {
    const match = matchPagePath({ routes, path });
    if (!type.isNone(match)) {
      pageIds.add(match.pageId);
    }
  });
  return [...pageIds].sort();
}

export default matchExercisedPages;
