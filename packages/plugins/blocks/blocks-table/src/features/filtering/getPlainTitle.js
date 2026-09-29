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
import htmlToText from '@lowdefy/blocks-antd/table/htmlToText.js';
import humanizeKey from '@lowdefy/blocks-antd/table/humanizeKey.js';

// Column titles may hold HTML; menus, selects and labels show them as text. A column whose title
// is empty (an actions column with `title: ''`) is named by its key there ("Actions"), so every
// column the table lists has a label.
function getPlainTitle(column) {
  const title =
    type.isString(column.title) && column.title.includes('<')
      ? htmlToText(column.title)
      : String(column.title ?? '');
  if (title.trim() !== '') return title;
  return humanizeKey(column.key) || String(column.key);
}

export default getPlainTitle;
