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

// The trailing column's body cell: a row's run button (onRowRun), static and shown on row hover
// or focus. Its row comes from the DOM (the module's click handler), so every row shares it.
function RunRowCell({ api }) {
  if (!api.events.onRowRun || api.config.enrichment.runColumns.length === 0) return null;
  return (
    <button
      aria-label="Run row"
      className="lf-enrich-run-row"
      data-lf-enrich-run-row=""
      tabIndex={-1}
      title="Run row"
      type="button"
    >
      <RunIcon name="run" />
    </button>
  );
}

export default RunRowCell;
