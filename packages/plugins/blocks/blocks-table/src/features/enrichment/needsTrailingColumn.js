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

import someColumnConfig from '../../core/someColumnConfig.js';

// Whether a table shows the enrichment trailing column, from its raw config (the lazy block's
// fallback lays it out before the table's code loads): the "+" header with `addColumn`, or the
// rows' run buttons with onRowRun and an enrichment or ai column. useEnrichment decides the same
// from the normalised config.
function needsTrailingColumn({ events, properties }) {
  if (properties.addColumn === true || type.isObject(properties.addColumn)) return true;
  if (type.isNone(events?.onRowRun)) return false;
  return someColumnConfig({
    properties,
    test: (column) => column.kind === 'enrichment' || column.kind === 'ai',
  });
}

export default needsTrailingColumn;
