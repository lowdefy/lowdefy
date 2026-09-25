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

// data-page-id attribute values inside HTML strings or JS sources: any case,
// optional whitespace around =, quoted or unquoted. In JSON text a double quote
// inside a string is escaped (data-page-id=\"home\"). The value must end at a
// quote, whitespace or >, so a templated value ("tasks-{{ id }}") is skipped.
const dataPageIdRegex = /data-page-id\s*=\s*(?:\\?["'])?([A-Za-z0-9\-_/:]+)(?=\\?["']|[\s>]|$)/gi;

function collectHtmlPageIds({ json }) {
  const pageIds = new Set();
  for (const match of json.matchAll(dataPageIdRegex)) {
    pageIds.add(match[1]);
  }
  return pageIds;
}

export default collectHtmlPageIds;
