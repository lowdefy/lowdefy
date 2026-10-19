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

import { useMemo } from 'react';

// Server mode replaces the row model with the store's display list (rows, group headers and
// holes for rows still loading), rebuilt when a block lands or a group opens or closes.
function useServerItems({ api, config, table }) {
  const store = api.serverStore;
  const { rowsById } = table.getCoreRowModel();
  const built = useMemo(
    () => (store ? store.buildItems({ rowsById, getId: config.getId }) : null),
    [store, store?.version, rowsById, config.getId]
  );
  if (!built) return null;
  return { rows: built.items };
}

export default useServerItems;
