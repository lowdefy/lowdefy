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

import React, { Suspense, useState } from 'react';

import LazyColumnManagerPopover from './LazyColumnManagerPopover.js';
import PopoverLoading from '../../core/PopoverLoading.js';

// Block-level open state; the popover (loaded on first open) renders in the table's top region
// while open.
function useColumnManager({ api }) {
  const [open, setOpen] = useState(false);
  api.columnManager = { open, setOpen };
  if (!open) return null;
  return {
    regions: {
      top: (
        <Suspense
          fallback={
            <PopoverLoading
              anchor="corner"
              onClose={() => api.actions.closeColumnManager()}
              placement="bottomRight"
            />
          }
        >
          <LazyColumnManagerPopover api={api} />
        </Suspense>
      ),
    },
  };
}

export default useColumnManager;
