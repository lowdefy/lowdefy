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

import RunIcon from './RunIcon.js';

// The trailing column's header: "+" opens the add-column picker (`addColumn`), handled by the
// module's click and key handlers.
function AddColumnHeader({ api }) {
  if (!api.config.enrichment.addColumn) return null;
  return (
    <button
      aria-label="Add column"
      className="lf-enrich-add-column"
      data-lf-enrich-add-column=""
      tabIndex={-1}
      title="Add column"
      type="button"
    >
      <RunIcon name="add" />
    </button>
  );
}

export default AddColumnHeader;
