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

function quoteAll(values) {
  return values.map((value) => `"${value}"`).join(' or ');
}

// Names what a selection that matched nothing asked for: the paths, tags and
// filters, with the flag prefix `lowdefy test` prints ("--") or none for the
// MCP tool. Undefined when the run selected nothing out, so the caller says
// that the app has no tests instead.
function formatNoTestsMatched({ paths, filters, tags, flagPrefix }) {
  const criteria = [];
  if (tags.length > 0) {
    criteria.push(`${flagPrefix}tag ${quoteAll(tags)}`);
  }
  if (filters.length > 0) {
    criteria.push(`${flagPrefix}filter ${quoteAll(filters)}`);
  }
  if (criteria.length === 0) {
    if (paths.length === 0) {
      return undefined;
    }
    return `No journeys found in ${paths.join(', ')}.`;
  }
  const where = paths.length > 0 ? ` in ${paths.join(', ')}` : '';
  return `No tests matched ${criteria.join(' and ')}${where}.`;
}

export default formatNoTestsMatched;
