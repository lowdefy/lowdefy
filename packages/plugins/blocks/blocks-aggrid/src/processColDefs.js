/*
  Copyright 2021 Lowdefy, Inc

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
import { type } from '@lowdefy/helpers';

function recProcessColDefs(columnDefs) {
  return columnDefs.map((col) => {
    const newColDef = {};
    if (type.isArray(col.children)) {
      newColDef.children = recProcessColDefs(col.children);
    }
    if (type.isFunction(col.cellRenderer)) {
      newColDef.cellRenderer = (params) => {
        return renderHtml({
          html: col.cellRenderer(params),
          methods: this.props.methods,
        });
      };
    }
    return {
      ...col,
      ...newColDef,
    };
  });
}

function processColDefs(columnDefs = []) {
  return recProcessColDefs(columnDefs);
}

export default processColDefs;