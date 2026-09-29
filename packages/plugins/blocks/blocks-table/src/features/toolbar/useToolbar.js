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

import React, { useRef } from 'react';

import normalizeToolbar from './normalizeToolbar.js';
import Toolbar from './Toolbar.js';

// Blocks in the `toolbarStart` / `toolbarEnd` slots show the bar even without `toolbar`.
const SLOTS_ONLY = { ...normalizeToolbar({ toolbar: {}, columnsByKey: new Map() }), count: false };

function useToolbar({ api, config }) {
  const searchRef = useRef(null);
  api.toolbarSearchRef = searchRef;
  const { content } = api;
  if (config.toolbar === null && !content.toolbarStart && !content.toolbarEnd) return null;
  return {
    regions: {
      top: <Toolbar api={api} searchRef={searchRef} toolbar={config.toolbar ?? SLOTS_ONLY} />,
    },
  };
}

export default useToolbar;
