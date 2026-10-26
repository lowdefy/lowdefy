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
import groupResults from './groupResults.js';

// With no group limit `maxResults` caps the whole list, as it always has. With a group limit the
// list is not cut first, so each group's count stays true; `maxResults` then caps each group that
// sets no limit, and "Other".
function buildSections({ results, groups, maxResults }) {
  if (groups.length === 0) {
    return [{ label: null, items: results.slice(0, maxResults), total: results.length }];
  }
  const hasGroupLimit = groups.some((group) => group.limit > 0);
  if (hasGroupLimit) {
    return groupResults({ results, groups, defaultLimit: maxResults });
  }
  return groupResults({ results: results.slice(0, maxResults), groups, defaultLimit: maxResults });
}

export default buildSections;
