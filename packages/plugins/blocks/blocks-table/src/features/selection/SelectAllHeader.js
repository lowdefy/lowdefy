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

import React, { useEffect, useRef } from 'react';

import countSelectedRows from './countSelectedRows.js';

function ignoreChange() {}

function SelectAllHeader({ api }) {
  const ref = useRef(null);
  const { selectedCount, total } = countSelectedRows({ api });
  const checked = total > 0 && selectedCount === total;
  const indeterminate = selectedCount > 0 && !checked;
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  if (api.config.rowSelection.type === 'radio') return null;
  return (
    <input
      aria-label="Select all rows"
      checked={checked}
      className="lf-table-checkbox"
      data-lf-select-all=""
      onChange={ignoreChange}
      ref={ref}
      tabIndex={-1}
      type="checkbox"
    />
  );
}

export default SelectAllHeader;
