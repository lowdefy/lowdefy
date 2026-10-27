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

// A link's query string as an object of decoded values. Read by hand: the link arrives before any
// URL polyfill can be relied on, and it holds only a url and a pairing token.
function parseQuery(query) {
  const values = {};
  (query ?? '')
    .split('&')
    .filter((part) => part.length > 0)
    .forEach((part) => {
      const index = part.indexOf('=');
      const name = index === -1 ? part : part.slice(0, index);
      const value = index === -1 ? '' : part.slice(index + 1);
      values[decodeURIComponent(name)] = decodeURIComponent(value.replace(/\+/g, ' '));
    });
  return values;
}

export default parseQuery;
