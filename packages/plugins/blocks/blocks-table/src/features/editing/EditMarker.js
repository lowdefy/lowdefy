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
import { Tooltip } from 'antd';

const LABELS = {
  error: 'Not saved',
  invalid: 'Invalid',
  saving: 'Saving',
};

// A cell's edit status, drawn into the cell by the editing layer: a spinner while onCellEdit runs,
// a corner flag with the message in a tooltip when the save failed or the value is invalid.
function EditMarker({ message, status }) {
  const label = message ? `${LABELS[status]}: ${message}` : LABELS[status];
  const marker = (
    <span
      aria-label={label}
      className="lf-table-edit-marker"
      data-lf-edit-message={message ?? undefined}
      data-lf-edit-status={status}
      role="img"
    />
  );
  if (!message) return marker;
  return <Tooltip title={message}>{marker}</Tooltip>;
}

export default EditMarker;
