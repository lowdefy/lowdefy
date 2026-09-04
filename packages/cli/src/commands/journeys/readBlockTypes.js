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

import fs from 'fs';
import path from 'path';
import { collectBlockTypes } from '@lowdefy/node-utils';
import { serializer, type } from '@lowdefy/helpers';

// Only the pages the trace names are read: a large app has hundreds of page
// artifacts and a trace names the handful that were used.
function readBlockTypes({ buildDirectory, pageIds }) {
  const blockTypes = {};
  if (type.isUndefined(buildDirectory)) return blockTypes;
  pageIds.forEach((pageId) => {
    const filePath = path.join(buildDirectory, 'pages', `${pageId}.json`);
    if (!fs.existsSync(filePath)) return;
    const page = serializer.deserializeFromString(fs.readFileSync(filePath, 'utf8'));
    collectBlockTypes({ blockTypes, page, pageId });
  });
  return blockTypes;
}

export default readBlockTypes;
