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

// An href for a `url` cell, or null when the value must not become a link.
// http(s), protocol-relative and root-relative URLs pass; a bare domain gets
// https://; any other scheme (javascript:, data:, ...) is shown as text only.
function getSafeUrl(value) {
  if (!type.isString(value)) return null;
  const text = value.trim();
  if (text === '') return null;
  if (/^(https?:)?\/\//i.test(text) || text.startsWith('/')) return text;
  if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return null;
  return `https://${text}`;
}

export default getSafeUrl;
