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

import enrichPath from './enrichPath.js';

// Where each input of an enrichment column is read from. A { column } input reads another
// enrichment or ai column's result (`_enrich.<key>.value`, once that cell is ok), or a field
// of the `fields` allowlist at its path: a column outside both is refused, so a column
// config (which users write) can never send a field the table does not list to a provider.
function resolveInputSources({ columnDef, columnDefsByKey, fieldsByKey, requestType }) {
  return columnDef.inputs.map((input) => {
    if (Object.hasOwn(input, 'value')) {
      return { param: input.param, source: 'value', value: input.value };
    }
    const upstream = columnDefsByKey.get(input.column);
    if (upstream?.runnable === true) {
      return {
        param: input.param,
        source: 'enrichment',
        column: input.column,
        required: input.required,
        statusPath: enrichPath({ columnKey: input.column, property: 'status' }),
        valuePath: enrichPath({ columnKey: input.column, property: 'value' }),
      };
    }
    const field = fieldsByKey.get(input.column);
    if (field === undefined) {
      throw new Error(
        `${requestType} column "${columnDef.key}" input "${input.param}" reads column "${input.column}", which is neither an enrichment column of "columnDefs" nor in "fields".`
      );
    }
    return {
      param: input.param,
      source: 'field',
      column: input.column,
      required: input.required,
      path: field.path,
    };
  });
}

export default resolveInputSources;
