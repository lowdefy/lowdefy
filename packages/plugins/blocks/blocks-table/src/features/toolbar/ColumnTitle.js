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

import { renderHtml } from '@lowdefy/block-utils';
import htmlToText from '@lowdefy/blocks-antd/table/htmlToText.js';

import getPlainTitle from '../filtering/getPlainTitle.js';

// Column titles may be HTML; the toolbar shows them the way the header does. An empty title shows
// the column's key-based label (getPlainTitle).
function ColumnTitle({ api, column }) {
  const html = String(column.title ?? '');
  if (htmlToText(html).trim() === '') return getPlainTitle(column);
  return renderHtml({ html, methods: api.methods });
}

export default ColumnTitle;
