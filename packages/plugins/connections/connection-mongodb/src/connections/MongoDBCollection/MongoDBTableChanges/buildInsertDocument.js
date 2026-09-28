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
import { set } from '@lowdefy/helpers';

import cloneValue from './cloneValue.js';

// A new row: `insertDefaults` first (a fresh copy for each row, since row values are set into
// it), then the row's own values at their paths, so a column the user filled in wins over a
// default. Keep tenant and ownership fields out of `fields`, and the user can not set them.
function buildInsertDocument({ patch, insertDefaults }) {
  const document = {};
  Object.entries(insertDefaults).forEach(([path, value]) => {
    set(document, path, cloneValue(value));
  });
  patch.forEach((value, path) => {
    set(document, path, value);
  });
  return document;
}

export default buildInsertDocument;
