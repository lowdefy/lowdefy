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
import { Button } from 'antd';

import SaveViewAs from './SaveViewAs.js';

// The strip shown while the current view differs from the active saved view (Attio, Notion):
// changes never silently edit a saved view. A locked view hides Save.
function ViewActions({ api }) {
  const { active } = api.views;
  return (
    <div className="lf-table-view-actions" data-lf-view-actions="">
      <span className="lf-table-view-actions-label">Unsaved changes</span>
      {active.locked ? null : (
        <Button
          data-lf-view-action="save"
          onClick={() => api.views.save()}
          size="small"
          type="primary"
        >
          Save
        </Button>
      )}
      <SaveViewAs api={api} />
      <Button
        data-lf-view-action="discard"
        onClick={() => api.views.discard()}
        size="small"
        type="text"
      >
        Discard
      </Button>
    </div>
  );
}

export default ViewActions;
