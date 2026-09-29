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

import cellProperties from './cellProperties.js';
import isColumnKey from './isColumnKey.js';

// The document path of one enrichment cell property: `_enrich.<columnKey>.<property>`.
function enrichPath({ columnKey, property }) {
  if (!isColumnKey(columnKey)) {
    throw new Error(`Enrichment column key ${JSON.stringify(columnKey)} is not a safe key.`);
  }
  if (!cellProperties.includes(property)) {
    throw new Error(`Enrichment cell property ${JSON.stringify(property)} can not be written.`);
  }
  return `_enrich.${columnKey}.${property}`;
}

export default enrichPath;
