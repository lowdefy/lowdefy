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

// The query of a URL as { name: value }. React Native's URL has no working searchParams, and the
// sheet's redirect URL is a custom scheme.
function parseQuery(url) {
  const start = url.indexOf('?');
  if (start === -1) {
    return {};
  }
  const end = url.indexOf('#', start);
  const query = url.slice(start + 1, end === -1 ? undefined : end);
  const params = {};
  query
    .split('&')
    .filter((part) => part.length > 0)
    .forEach((part) => {
      const separator = part.indexOf('=');
      const name = separator === -1 ? part : part.slice(0, separator);
      const value = separator === -1 ? '' : part.slice(separator + 1);
      params[decodeURIComponent(name)] = decodeURIComponent(value.replace(/\+/g, ' '));
    });
  return params;
}

export default parseQuery;
