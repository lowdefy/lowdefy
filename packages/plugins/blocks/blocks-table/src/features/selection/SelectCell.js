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

import React from 'react';

function ignoreChange() {}

// A native input styled with antd tokens: an antd Checkbox per row would mount a CSS-in-JS hook
// per visible row (tier-0 rule, D4/D10.4). The delegated click handler does the toggling.
function SelectCell({ api, selected }) {
  const inputType = api.config.rowSelection.type === 'radio' ? 'radio' : 'checkbox';
  return (
    <input
      aria-label="Select row"
      checked={selected}
      className="lf-table-checkbox"
      onChange={ignoreChange}
      tabIndex={-1}
      type={inputType}
    />
  );
}

export default SelectCell;
