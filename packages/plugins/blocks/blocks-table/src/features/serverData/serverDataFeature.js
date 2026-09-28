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

import createRefresh from './createRefresh.js';
import createToggleGroup from './createToggleGroup.js';
import GroupRow from './GroupRow.js';
import handleGroupClick from './handleGroupClick.js';
import handleGroupKeyDown from './handleGroupKeyDown.js';
import useServerData from './useServerData.js';
import useServerItems from './useServerItems.js';
import useServerView from './useServerView.js';

import './serverData.css';

// Server mode (`data: { mode: server, request, blockSize }`, D9): sorting, filtering and grouping
// only change the view; rows come from the request, in cached blocks. See createServerStore.
const serverDataFeature = {
  name: 'serverData',
  tableOptions: ({ config }) =>
    config.server ? { manualSorting: true, manualFiltering: true, manualGrouping: true } : {},
  useData: useServerData,
  useFeature: useServerView,
  useItems: useServerItems,
  rowRenderers: { group: GroupRow },
  actions: { toggleGroup: createToggleGroup },
  methods: { refresh: createRefresh },
  gridHandlers: { click: handleGroupClick, keydown: handleGroupKeyDown },
};

export default serverDataFeature;
