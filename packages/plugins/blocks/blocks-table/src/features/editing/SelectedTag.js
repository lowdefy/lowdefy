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

function keepFocus(event) {
  event.preventDefault();
  event.stopPropagation();
}

// A picked value in the tags editor (antd Select `tagRender`): the value's chip as the cell shows
// it, with a remove button, instead of antd's own tag around the chip.
function SelectedTag({ closable, label, onClose }) {
  return (
    <span className="lf-table-editor-tag" onMouseDown={keepFocus}>
      {label}
      {closable ? (
        <button
          aria-label="Remove"
          className="lf-table-editor-tag-remove"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

export default SelectedTag;
