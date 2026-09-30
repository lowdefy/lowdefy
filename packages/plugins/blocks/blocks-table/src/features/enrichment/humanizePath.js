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

import humanizeKey from '@lowdefy/blocks-antd/table/humanizeKey.js';

// A column title for a path into a raw result: its segments in sentence case, array indices
// counted from one (`company.linkedin_url` is "Company linkedin url", `people.0.name` is
// "People 1 name"). An empty path (the whole result) is "Result".
function humanizePath(path) {
  if (path === '') return 'Result';
  const words = path
    .split('.')
    .map((segment) => (/^\d+$/.test(segment) ? String(Number(segment) + 1) : segment))
    .join(' ');
  return humanizeKey(words);
}

export default humanizePath;
