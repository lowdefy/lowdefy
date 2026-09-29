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

import setUi from './setUi.js';

// A one-line message under the grid for an enrichment event that failed outside an overlay (a
// run, a duplicate, "Add as column", a rename).
function EnrichmentNotice({ api, notice }) {
  return (
    <div className="lf-enrich-notice" data-lf-enrich-notice={notice.type} role="alert">
      <span className="lf-enrich-notice-text">{notice.message}</span>
      <button
        aria-label="Dismiss"
        className="lf-enrich-notice-close"
        onClick={() => setUi({ api, patch: { notice: null } })}
        type="button"
      >
        ×
      </button>
    </div>
  );
}

export default EnrichmentNotice;
